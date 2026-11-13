#!/usr/bin/env node
// Instala/remove o agendador da agência no launchd do Mac (roda plataforma/escritorio/tools/tick.mjs a cada 5 minutos enquanto você está logado).
//
//   node plataforma/escritorio/tools/launchd.mjs install --dry-run    # mostra o .plist e os comandos, sem gravar nem carregar nada
//   node plataforma/escritorio/tools/launchd.mjs install [--no-load]  # grava ~/Library/LaunchAgents/br.com.bonequinhos.agencia.plist e carrega
//   node plataforma/escritorio/tools/launchd.mjs uninstall [--dry-run]
//   node plataforma/escritorio/tools/launchd.mjs status
//
// Só instale depois de aprovar a agência (ver LEIA-ME). Mesmo instalado, nada roda enquanto "enabled" for false no agencia.json
// ou o botão de emergência estiver ligado no escritório.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync, spawnSync } from 'child_process';
import { HERE, ROOT, LOG_DIR } from './schedule.mjs';

const LABEL = 'br.com.bonequinhos.agencia';
const argv = process.argv.slice(2);
const cmd = argv[0];
const DRY = argv.includes('--dry-run');
const HOME = process.env.HOME || os.homedir();
const PLIST = path.join(HOME, 'Library', 'LaunchAgents', `${LABEL}.plist`);
const uid = process.getuid ? process.getuid() : 501;
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Node do Homebrew: grava o caminho estável (/opt/homebrew/opt/node@24/bin/node), não o da versão
// (/opt/homebrew/Cellar/node@24/24.19.0/bin/node), que some na próxima atualização e para o agendador.
function stableNode(exe = process.execPath) {
  const m = String(exe).match(/^(.*)\/Cellar\/(node(?:@\d+)?)\/[^/]+\/bin\/node$/);
  return m ? `${m[1]}/opt/${m[2]}/bin/node` : exe;
}
const NODE = stableNode();

function plist() {
  const pathEnv = [path.join(HOME, '.local', 'bin'), path.dirname(NODE), '/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin']
    .filter((v, i, a) => a.indexOf(v) === i).join(':');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${xml(NODE)}</string>
    <string>${xml(path.join(HERE, 'tick.mjs'))}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${xml(ROOT)}</string>
  <key>StartInterval</key>
  <integer>300</integer>
  <key>RunAtLoad</key>
  <false/>
  <key>ProcessType</key>
  <string>Background</string>
  <key>LowPriorityIO</key>
  <true/>
  <key>Nice</key>
  <integer>10</integer>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${xml(pathEnv)}</string>
    <key>HOME</key>
    <string>${xml(HOME)}</string>
  </dict>
  <key>StandardOutPath</key>
  <string>${xml(path.join(LOG_DIR, 'launchd.out.log'))}</string>
  <key>StandardErrorPath</key>
  <string>${xml(path.join(LOG_DIR, 'launchd.err.log'))}</string>
</dict>
</plist>
`;
}

const load = ['launchctl', 'bootstrap', `gui/${uid}`, PLIST];
const unload = ['launchctl', 'bootout', `gui/${uid}/${LABEL}`];

switch (cmd) {
  case 'install': {
    const body = plist();
    if (DRY) {
      console.log(`# dry-run: nada foi gravado nem carregado (não carregado no launchd).\n# Arquivo: ${PLIST}\n`);
      console.log(body);
      console.log(`# Para instalar de verdade (depois de aprovar):\n#   mkdir -p ${path.dirname(PLIST)} ${LOG_DIR}\n#   node plataforma/escritorio/tools/launchd.mjs install\n# que grava o arquivo acima e roda:\n#   ${load.join(' ')}`);
      break;
    }
    fs.mkdirSync(path.dirname(PLIST), { recursive: true });
    fs.mkdirSync(LOG_DIR, { recursive: true });
    if (fs.existsSync(PLIST)) spawnSync(unload[0], unload.slice(1), { stdio: 'ignore' });
    fs.writeFileSync(PLIST, body);
    console.log(`✔ gravado ${PLIST}`);
    if (argv.includes('--no-load')) { console.log(`Não carregado. Para carregar: ${load.join(' ')}`); break; }
    execFileSync(load[0], load.slice(1), { stdio: 'inherit' });
    console.log('✔ carregado: o agendador passa a cada 5 minutos. Para tirar: node plataforma/escritorio/tools/launchd.mjs uninstall');
    break;
  }
  case 'uninstall': {
    if (DRY) { console.log(`# dry-run: rodaria\n#   ${unload.join(' ')}\n#   rm ${PLIST}`); break; }
    const r = spawnSync(unload[0], unload.slice(1), { encoding: 'utf8' });
    if (r.status !== 0 && !/No such process|Could not find/i.test(r.stderr || '')) console.log(`(launchctl: ${String(r.stderr || '').trim() || 'não estava carregado'})`);
    fs.rmSync(PLIST, { force: true });
    console.log('✔ agendador removido. Rodadas em andamento terminam sozinhas.');
    break;
  }
  case 'status': {
    console.log(fs.existsSync(PLIST) ? `Arquivo: ${PLIST}` : 'Não instalado.');
    const r = spawnSync('launchctl', ['print', `gui/${uid}/${LABEL}`], { encoding: 'utf8' });
    console.log(r.status === 0 ? r.stdout.split('\n').filter((l) => /state|last exit|runs/.test(l)).join('\n') : 'Não carregado no launchd.');
    break;
  }
  default:
    console.log('Use: install [--dry-run|--no-load] | uninstall [--dry-run] | status');
    process.exitCode = cmd ? 2 : 0;
}
