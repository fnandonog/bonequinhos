// CENÁRIOS do "Como Ficou Rico: Silvio Santos". Cada set é uma etapa diferente da trajetória (a fortuna sendo "construída").
// Escala real (1 unidade = 1 m). O diretor escolhe no roteiro: {"set": "bau", "cam": "dono", "p": [0.65, 1]}.
import React from 'react';
import {V3} from '../v4/planta';
import {Rotulo} from '../v4/kit';
import {orb, Cam, Ctx} from '../v4/sets';
import {Corrente} from '../historia/pecas';
import {
  AMIGO, Barca, Bau, Bonde, Boneco, Cadeado, Caixa, Cama, CameraTV, Carne, Cil, Corneta, EXECUTIVO, Grafico, Holofote, Maco, Microfone, Morros,
  Notas, PASSANTES, Passante, PilhaDinheiro, Pilula, Plateia, Predio, PredioBanco, PredioTV, Tabuleiro, Torre, ZE_JOVEM, ZE_RICO, clamp01, lerp, suave, texCalcada,
} from './pecas';

export type LuzRico = 'dia' | 'tarde' | 'interior' | 'nublado';
export type SetRico = {
  ceu?: [string, string];
  luz?: LuzRico;
  nevoa?: [number, number];
  render: (c: Ctx) => React.ReactNode;
  cams: Record<string, Cam>;
};

const CEU_DIA: [string, string] = ['#6fbcf2', '#fdf0d8'];
const CEU_TARDE: [string, string] = ['#f08a4b', '#ffd9a0'];
const CEU_CINZA: [string, string] = ['#5a6070', '#b9b4aa'];
const CEU_SALA: [string, string] = ['#2b2233', '#3a3040'];

// ================= rua do Rio, 1945 (Avenida Rio Branco) =================
const CORES_PREDIO = ['#e9dcc0', '#d9c6a0', '#efe4cc', '#cdbd98', '#e2c9a0', '#f2ecdf', '#d8cbb5'];
const Rua: React.FC<{t: number; capinhas: number; moedas?: number; nome?: number}> = ({t, capinhas, moedas = 0, nome = 0}) => (
  <group>
    {/* pista e trilho do bonde */}
    <Caixa pos={[0, -0.05, -2]} tam={[140, 0.1, 12]} cor="#4a4a50" />
    {[-2.7, -1.3].map((z) => (<Caixa key={z} pos={[0, 0.005, z]} tam={[140, 0.02, 0.08]} cor="#9aa0aa" sombra={false} />))}
    {/* calçadas de pedra portuguesa */}
    {[[8.5, 9], [-11, 6]].map(([z, d]) => (
      <mesh key={z} position={[0, 0.06, z]} receiveShadow>
        <boxGeometry args={[140, 0.12, d]} />
        <meshStandardMaterial color="#ffffff" map={texCalcada()} flatShading />
      </mesh>
    ))}
    {/* prédios dos dois lados */}
    {Array.from({length: 9}).map((_, i) => (<Predio key={'f' + i} pos={[-60 + i * 15, 0, -20]} tam={[13.5, 18 + ((i * 7) % 5) * 4, 12]} cor={CORES_PREDIO[i % CORES_PREDIO.length]} />))}
    {Array.from({length: 9}).map((_, i) => (<Predio key={'n' + i} pos={[-60 + i * 15, 0, 19]} rotY={Math.PI} tam={[13.5, 16 + ((i * 5) % 4) * 5, 12]} cor={CORES_PREDIO[(i + 3) % CORES_PREDIO.length]} />))}
    {/* postes */}
    {Array.from({length: 7}).map((_, i) => (<group key={'p' + i}><Cil pos={[-45 + i * 15, 2.5, 4.6]} r={0.08} h={5} cor="#2b2b30" seg={6} /><Cil pos={[-45 + i * 15, 5.1, 4.6]} r={0.25} r2={0.1} h={0.3} cor="#2b2b30" seg={8} /></group>))}
    <Bonde pos={[((t * 5 + 30) % 120) - 60, 0, -2]} />
    {/* o outro camelô (de quem ele copiou a ideia) */}
    <Boneco pos={[-4.5, 0.12, 9.3]} rotY={-1.2} acao="acena" t={t} v={{...PASSANTES[3], gravata: undefined}} />
    <Tabuleiro pos={[-5.1, 0.12, 9.1]} rotY={-1.2} n={12} />
    {/* o menino e a banca dele */}
    <Boneco pos={[0, 0.12, 8.6]} rotY={0} acao={capinhas >= 12 ? 'aponta' : 'parado'} t={t} v={ZE_JOVEM} esc={0.84} />
    <Tabuleiro pos={[0, 0.12, 9.2]} n={capinhas} moedas={moedas} />
    {nome > 0 && <Rotulo texto="SILVIO SANTOS" ancora={[0, 1.75, 8.6]} sobe={0.5} vis={nome} fundo="#ffd23f" />}
    {/* passantes (atrás das bancas, para não tapar) */}
    {[0, 1, 2, 3].map((i) => (<Passante key={i} t={t} de={[-30, 0.12, 6.2 - (i % 2) * 0.9]} ate={[30, 0.12, 6.2 - (i % 2) * 0.9]} v={PASSANTES[i]} fase={i * 0.23} />))}
    {[4, 5].map((i) => (<Passante key={i} t={t} de={[30, 0.12, -10]} ate={[-30, 0.12, -10]} v={PASSANTES[i]} fase={i * 0.31} />))}
  </group>
);

// ================= estúdio de rádio, 1948 =================
const Radio: React.FC<{t: number; p: number; sai: boolean}> = ({t, p, sai}) => {
  const k = sai ? suave(p) : 0;
  const ze: V3 = [lerp(0, 2.55, k), 0, lerp(0.3, 0.9, k)];
  return (
    <group>
      <Caixa pos={[0, -0.05, 0]} tam={[6.4, 0.1, 5]} cor="#7a5034" />
      <Caixa pos={[0, 1.5, -2.4]} tam={[6.4, 3, 0.2]} cor="#a8743f" />
      <Caixa pos={[-3.1, 1.5, 0]} tam={[0.2, 3, 5]} cor="#9a6a3a" />
      <Caixa pos={[3.1, 2.55, 0]} tam={[0.2, 0.9, 5]} cor="#9a6a3a" />
      <Caixa pos={[3.1, 1.05, -1.4]} tam={[0.2, 2.1, 2.2]} cor="#9a6a3a" />
      <Caixa pos={[3.1, 1.05, 1.95]} tam={[0.2, 2.1, 1.1]} cor="#9a6a3a" />
      {/* porta aberta para a rua (luz de fora) */}
      <mesh position={[3.25, 1.05, 0.95]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[0.9, 2.1]} /><meshBasicMaterial color="#fff3d6" /></mesh>
      {/* painéis acústicos */}
      {[-2.2, -1.1, 1.1, 2.2].map((x) => (<Caixa key={x} pos={[x, 1.7, -2.28]} tam={[0.9, 1.6, 0.06]} cor="#c9a27a" sombra={false} />))}
      {/* vidro da técnica, com o técnico */}
      <Caixa pos={[0, 1.6, -2.28]} tam={[1.2, 0.8, 0.04]} cor="#9fd0e8" sombra={false} />
      <Boneco pos={[0, 0.55, -3.0]} rotY={0} acao="aponta" t={t} v={PASSANTES[3]} esc={0.85} />
      <Pilula texto="NO AR" pos={[-1.2, 2.05, -2.2]} fundo="#d6282b" tam={0.7} />
      <Microfone pos={[0.45, 0, 0.75]} rotY={0} />
      <Boneco pos={ze} rotY={sai ? lerp(0, 1.4, clamp01(k * 3)) : 0} acao={sai && k < 0.98 ? 'anda' : 'acena'} t={t} v={ZE_JOVEM} esc={0.86} />
    </group>
  );
};

// ================= barca Rio–Niterói, anos 50 =================
const BarcaSet: React.FC<{t: number}> = ({t}) => {
  const x = -4 + t * 0.5;
  return (
    <group>
      <mesh position={[0, 0, -200]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[3000, 3000]} /><meshStandardMaterial color="#3f8fb0" flatShading /></mesh>
      {/* espuma na proa */}
      {[0, 1, 2].map((i) => (<Caixa key={i} pos={[x + 17.5 + i * 1.6, 0.03, (i - 1) * 3.5]} tam={[1.4, 0.06, 2.2]} cor="#e9f2f8" sombra={false} />))}
      <Morros pos={[-500, 0, -900]} esc={0.9} />
      <group position={[x, 0, 0]}>
        <Barca pos={[0, 0, 0]} />
        <Cil pos={[7, 5.5, 2.6]} r={0.07} h={2.2} cor="#5c5f66" />
        <Corneta pos={[7, 6.6, 2.6]} rot={[0, 0.5, 0]} />
        <Corneta pos={[7, 6.6, 2.6]} rot={[0, -0.5, 0]} />
        <Notas orig={[7.3, 6.7, 3.0]} dir={[0.3, 0.3, 0.6]} t={t} />
        <Notas orig={[6.7, 6.7, 3.0]} dir={[-0.4, 0.25, 0.6]} t={t + 0.5} />
        <Boneco pos={[5.8, 4.4, 2.8]} rotY={0.3} acao="acena" t={t} v={ZE_JOVEM} esc={0.88} />
        {[-9, -6.5, -4, -1.5, 1.5, 3.8].map((px, i) => (<Boneco key={i} pos={[px, 4.4, 2.6 + (i % 2) * 0.6]} rotY={i % 2 ? 0.4 : -0.3} acao={i % 3 ? 'parado' : 'acena'} t={t + i} v={PASSANTES[i % PASSANTES.length]} />))}
        {[-7, -2, 3].map((px, i) => (<Boneco key={'d' + i} pos={[px, 1.6, 4.4]} rotY={0} acao="parado" t={t + i} v={PASSANTES[(i + 2) % PASSANTES.length]} />))}
      </group>
    </group>
  );
};

// ================= quarto de pensão do Baú, 1958 =================
const Pensao: React.FC<{t: number; p: number; dono: boolean}> = ({t, p, dono}) => {
  const vira = dono ? clamp01((p - 0.82) * 10) : 0;
  const abre = dono ? 1 : clamp01((p - 0.15) * 3);
  return (
    <group>
      <Caixa pos={[0, -0.05, 0]} tam={[3.4, 0.1, 3.8]} cor="#9a6a43" />
      {Array.from({length: 7}).map((_, i) => (<Caixa key={i} pos={[-1.45 + i * 0.48, 0.002, 0]} tam={[0.02, 0.01, 3.8]} cor="#7a5034" sombra={false} />))}
      <Caixa pos={[0, 1.4, -1.9]} tam={[3.4, 2.8, 0.12]} cor="#d9c9a6" />
      <Caixa pos={[-1.7, 1.4, 0]} tam={[0.12, 2.8, 3.8]} cor="#cbb898" />
      <Caixa pos={[1.7, 1.4, 0]} tam={[0.12, 2.8, 3.8]} cor="#cbb898" />
      {/* janela */}
      <Caixa pos={[-0.4, 1.7, -1.83]} tam={[0.9, 1.0, 0.04]} cor="#9fd0e8" sombra={false} />
      <Caixa pos={[-0.4, 1.7, -1.8]} tam={[0.05, 1.0, 0.05]} cor="#f2ecdf" sombra={false} />
      {/* lâmpada pendurada */}
      <Cil pos={[0.2, 2.5, -0.3]} r={0.006} h={0.6} cor="#1d1b26" seg={4} />
      <mesh position={[0.2, 2.17, -0.3]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#fff6d8" emissive="#ffe0a0" emissiveIntensity={1.5} /></mesh>
      <pointLight position={[0.2, 2.1, -0.3]} color="#ffe0b0" intensity={4} distance={6} />
      <Cama pos={[-1.15, 0, -0.75]} />
      {/* o caixote que servia de mesa, com os carnês */}
      <group position={[0.75, 0, -1.25]}>
        <Caixa pos={[0, 0.22, 0]} tam={[0.6, 0.44, 0.42]} cor="#c9a46a" />
        {[0.08, 0.22, 0.36].map((y) => (<Caixa key={y} pos={[0, y, 0.215]} tam={[0.6, 0.06, 0.01]} cor="#a8843f" sombra={false} />))}
        {Array.from({length: 2 + Math.floor(clamp01(p) * 8)}).map((_, i) => (<Carne key={i} pos={[-0.15 + (i % 2) * 0.17, 0.45 + Math.floor(i / 2) * 0.013, -0.05]} rot={[0, (i % 3) * 0.1, 0]} />))}
        <Carne pos={[0.12, 0.46, 0.08]} rot={[0, -0.3, 0]} aberto />
      </group>
      <Bau pos={[0.7, 0, 0.55]} rotY={-0.5} abre={abre} t={t} />
      {!dono && <Boneco pos={[1.25, 0, 0.0]} rotY={-0.9} acao="aponta" t={t} v={AMIGO} />}
      <Boneco pos={[-0.15, 0, -0.1]} rotY={0.35} acao={vira > 0.5 ? 'comemora' : 'parado'} t={t} v={vira > 0.5 ? ZE_RICO : ZE_JOVEM} esc={0.9} />
    </group>
  );
};

// ================= estúdio de TV, anos 60 =================
const Estudio: React.FC<{t: number; p: number; agito?: number; macos?: number; paga?: boolean}> = ({t, p, agito = 0, macos = 0, paga = false}) => (
  <group>
    <Caixa pos={[0, -0.05, 0]} tam={[20, 0.1, 16]} cor="#3a3a44" />
    <Caixa pos={[0, 3, -5.6]} tam={[20, 6, 0.2]} cor="#2b2233" />
    {/* cenário do programa */}
    {['#d6282b', '#ffd23f', '#2fbf71', '#2f6fd6', '#e98a3a'].map((c, i) => (<Caixa key={c} pos={[-4 + i * 2, 2.6, -5.45]} tam={[1.7, 4.2, 0.1]} cor={c} />))}
    <Pilula texto="PROGRAMA DE DOMINGO" pos={[0, 5.2, -5.3]} fundo="#1d1b26" tam={1.0} />
    <Cil pos={[0, 0.15, -3.4]} r={1.6} h={0.3} cor="#e9e4d8" seg={20} />
    {!paga && <Boneco pos={[0, 0.3, -3.3]} rotY={0} acao={agito > 0.5 ? 'comemora' : 'acena'} t={t} v={ZE_RICO} />}
    <CameraTV pos={[-1.6, 0, 0.6]} rotY={Math.PI + 0.25} t={t} />
    <CameraTV pos={[2.2, 0, 0.9]} rotY={Math.PI - 0.35} t={t + 1} />
    {([[-3, 5.6, -1], [3, 5.6, -1], [0, 5.8, 1]] as V3[]).map((h, i) => (<Holofote key={i} pos={h} alvo={[0, 1, -3.3]} />))}
    <Plateia pos={[0, 0, 5]} rotY={Math.PI} t={t} agito={agito} />
    {/* a mesa do dono do horário: ele PAGA para aparecer */}
    <group position={[6, 0, -1.5]}>
      <Caixa pos={[0, 0.74, 0]} tam={[1.6, 0.06, 0.8]} cor="#7a5034" />
      <Caixa pos={[0, 0.37, -0.35]} tam={[1.6, 0.74, 0.06]} cor="#6b4429" />
      <Boneco pos={[0, 0, -0.75]} rotY={0} acao="parado" t={t} v={EXECUTIVO} />
      {Array.from({length: Math.floor(macos)}).map((_, i) => (<Maco key={i} pos={[-0.3 + (i % 3) * 0.2, 0.78 + Math.floor(i / 3) * 0.012, 0.05]} rot={[0, 0.1 * (i % 2), 0]} />))}
      {paga && <Boneco pos={[0.1, 0, 0.75]} rotY={Math.PI} acao="carrega" t={t} v={ZE_RICO} />}
      <Pilula texto="HORÁRIO NA TV" pos={[0, 2.5, -0.5]} fundo="#2f6fd6" tam={0.7} vis={clamp01(p * 3)} />
    </group>
  </group>
);

// ================= a cidade das empresas (+30) =================
const EMP_CORES = ['#e98a3a', '#2f6fd6', '#2fbf71', '#d6282b', '#8a5aa0', '#3fa0a0', '#e7c25a', '#c94f4f'];
const ROTULOS: Record<number, string> = {7: 'TELE SENA', 14: 'COSMÉTICOS', 21: 'HOTEL', 10: 'TV'};
const Imperio: React.FC<{t: number; p: number}> = ({t, p}) => (
  <group>
    <Caixa pos={[0, -0.05, -15]} tam={[140, 0.1, 110]} cor="#8fae7a" />
    <Caixa pos={[0, 0.0, -15]} tam={[64, 0.04, 54]} cor="#9a9aa4" />
    {Array.from({length: 30}).map((_, i) => {
      const cx = (i % 6) - 2.5, cz = Math.floor(i / 6) - 2;
      const H = 8 + ((i * 7) % 9) * 2.6;
      const k = suave(clamp01(p * 1.7 - (i / 30) * 0.8));
      const h = Math.max(0.2, H * k);
      return (
        <group key={i} position={[cx * 9.5, 0, cz * 9.5 - 8]}>
          <Caixa pos={[0, h / 2, 0]} tam={[6.5, h, 6.5]} cor={EMP_CORES[i % EMP_CORES.length]} />
          {Array.from({length: Math.floor(h / 3.2)}).map((_, j) => (<Caixa key={j} pos={[0, 1.8 + j * 3.2, 3.27]} tam={[5.2, 0.9, 0.04]} cor="#2b3a4a" sombra={false} />))}
          {ROTULOS[i] && k > 0.9 && <Pilula texto={ROTULOS[i]} pos={[0, h + 2.4, 0]} fundo="#1d1b26" tam={0.6} />}
        </group>
      );
    })}
    <PredioBanco pos={[44, 0, -6]} />
    <Boneco pos={[0, 0.02, 24]} rotY={0} acao="comemora" t={t} v={ZE_RICO} esc={1.6} />
  </group>
);

// ================= o rombo (2010) =================
const Rombo: React.FC<{t: number; p: number; modo: 'banco' | 'buraco'}> = ({t, p, modo}) => {
  const r = modo === 'buraco' ? 2 + p * 4.5 : 1.2 + p * 2.5;
  return (
    <group>
      <Caixa pos={[0, -0.05, 0]} tam={[120, 0.1, 100]} cor="#8a8a8f" />
      <Caixa pos={[0, -0.02, 18]} tam={[120, 0.06, 10]} cor="#4a4a50" />
      <PredioBanco pos={[0, 0, 0]} afunda={modo === 'buraco' ? 0.12 + p * 0.25 : p * 0.12} racha={modo === 'banco' ? p : 1} />
      {/* cratera na frente do banco */}
      <mesh position={[0, 0.03, 12]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[r, 14]} /><meshBasicMaterial color="#120f14" /></mesh>
      <mesh position={[0, 0.02, 12]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[r, r + 0.6, 14]} /><meshStandardMaterial color="#5a4030" flatShading /></mesh>
      {/* maços de dinheiro caindo no buraco */}
      {Array.from({length: 14}).map((_, i) => {
        const k = ((t * 0.9 + i / 14) % 1);
        const a = i * 2.4;
        return <Maco key={i} pos={[Math.cos(a) * r * 0.5 * (1 - k), 6 - k * 7, 12 + Math.sin(a) * r * 0.5 * (1 - k)]} rot={[k * 6 + i, i, k * 4]} />;
      })}
      {/* sirene vermelha */}
      <mesh position={[6.5, 13.5, 6.4]}><sphereGeometry args={[0.6, 10, 8]} /><meshStandardMaterial color="#ff3030" emissive="#ff2020" emissiveIntensity={Math.sin(t * 10) > 0 ? 2.5 : 0.3} /></mesh>
      <Boneco pos={[-4.5, 0.02, 15]} rotY={0.4} acao="parado" t={t} v={ZE_RICO} esc={1.0} />
      {modo === 'buraco' && <Pilula texto="FRAUDE" pos={[0, 4.5, 12]} fundo="#d6282b" tam={0.9} vis={clamp01(p * 4)} />}
    </group>
  );
};

// empréstimo: a pilha de maços que ele pega emprestado (credor do outro lado da mesa)
const Emprestimo: React.FC<{t: number; p: number}> = ({t, p}) => {
  const n = Math.floor(6 + p * 40);
  return (
    <group>
      <Caixa pos={[0, -0.05, 0]} tam={[10, 0.1, 8]} cor="#5a4a5a" />
      <Caixa pos={[0, 1.6, -2.6]} tam={[10, 3.2, 0.2]} cor="#3a3040" />
      <Pilula texto="DÍVIDA" pos={[0, 2.4, -2.4]} fundo="#d6282b" tam={0.8} />
      <Caixa pos={[0, 0.74, 0]} tam={[2.2, 0.06, 1.0]} cor="#6b4429" />
      {[-1, 1].map((sx) => (<Caixa key={sx} pos={[sx * 1.0, 0.37, 0]} tam={[0.08, 0.74, 0.9]} cor="#5a3a24" />))}
      {Array.from({length: n}).map((_, i) => {
        const col = i % 4, cam = Math.floor(i / 4);
        return <Maco key={i} pos={[-0.35 + col * 0.18, 0.78 + cam * 0.012 * 2.2, 0.05 + (col % 2) * 0.09 - 0.04]} rot={[0, (cam % 2) * 0.12, 0]} />;
      })}
      <Boneco pos={[0, 0, -0.85]} rotY={0} acao="aponta" t={t} v={EXECUTIVO} />
      <Boneco pos={[0.2, 0, 0.85]} rotY={Math.PI - 0.2} acao="carrega" t={t} v={ZE_RICO} />
    </group>
  );
};

// garantia: a torre da TV acorrentada
const Garantia: React.FC<{t: number; p: number}> = ({t, p}) => {
  const y = 5;
  const l = 2.6;
  const cs: [V3, V3][] = [[[-l, y, l], [l, y, l]], [[l, y, l], [l, y, -l]], [[l, y, -l], [-l, y, -l]], [[-l, y, -l], [-l, y, l]], [[-l, y + 2, l], [l, y + 2, l]]];
  return (
    <group>
      <Caixa pos={[0, -0.05, 0]} tam={[80, 0.1, 80]} cor="#8a8a8f" />
      <Torre pos={[0, 0, 0]} h={60} />
      <PredioTV pos={[-30, 0, -20]} letreiro="SBT" />
      {cs.map(([a, b], i) => (<Corrente key={i} a={a} b={b} elo={0.32} />))}
      <Cadeado pos={[0, y - 0.6 + (1 - suave(clamp01(p * 3))) * 3, l + 0.35]} esc={1.5} />
    </group>
  );
};

// ================= a volta por cima =================
const Vendido: React.FC<{t: number; p: number}> = ({t, p}) => (
  <group>
    <Caixa pos={[0, -0.05, 0]} tam={[120, 0.1, 100]} cor="#8fae7a" />
    <Caixa pos={[0, -0.02, 14]} tam={[120, 0.06, 8]} cor="#9a9aa4" />
    <PredioBanco pos={[0, 0, 0]} />
    <group position={[1.3, 0, 11.0]}>
      <Cil pos={[0, 1.2, 0]} r={0.06} h={2.4} cor="#7a5034" />
      <Caixa pos={[0, 2.5, 0]} tam={[1.6, 0.8, 0.06]} cor="#f2ecdf" />
      <Pilula texto="VENDIDO" pos={[0, 2.5, 0.1]} fundo="#2fbf71" tam={0.7} vis={clamp01(p * 4)} />
    </group>
    <Boneco pos={[-0.5, 0.02, 12.2]} rotY={0.9} acao="aponta" t={t} v={ZE_RICO} />
    <Boneco pos={[0.6, 0.02, 12.0]} rotY={-0.9} acao="aponta" t={t} v={EXECUTIVO} />
  </group>
);

const VALORES_FORBES = [1.0, 1.8, 2.8, 4.0, 5.6, 7.5];
const Forbes: React.FC<{t: number; p: number}> = ({t, p}) => {
  const n = VALORES_FORBES.length;
  const k = suave(clamp01(p * n * 0.8 - (n - 1) * 0.7));
  const topo = Math.max(0.02, VALORES_FORBES[n - 1] * k) + 0.1;
  const x = ((n - 1) - (n - 1) / 2) * 1.4 * 1.4;
  return (
    <group>
      <Caixa pos={[0, -0.05, 0]} tam={[60, 0.1, 60]} cor="#2b2233" />
      <Grafico pos={[0, 0, 0]} valores={VALORES_FORBES} cores={['#2fbf71', '#2fbf71', '#2fbf71', '#2fbf71', '#2fbf71', '#ffd23f']} p={p} />
      <Boneco pos={[x, topo, 0]} rotY={-0.3} acao={k > 0.95 ? 'comemora' : 'parado'} t={t} v={ZE_RICO} />
      <Pilula texto="BILIONÁRIO" pos={[x, topo + 2.6, 0]} fundo="#1d1b26" cor="#ffd23f" tam={0.8} vis={clamp01((k - 0.85) * 8)} />
    </group>
  );
};

// ================= fim: a pilha de R$ 1,6 bi em notas de 100 =================
const Fim: React.FC<{t: number}> = ({t}) => (
  <group>
    <Caixa pos={[0, -0.05, 0]} tam={[200, 0.1, 200]} cor="#9a9aa4" />
    {Array.from({length: 7}).map((_, i) => (<Predio key={i} pos={[-45 + i * 15, 0, -40]} tam={[12, 22 + ((i * 7) % 5) * 6, 12]} cor={CORES_PREDIO[i % CORES_PREDIO.length]} />))}
    <PilhaDinheiro pos={[0, 1.4, 0]} />
    <Boneco pos={[0, 2.62, 0.1]} rotY={0} acao="acena" t={t} v={ZE_RICO} />
    {/* o loop: a banca de 1945 ao pé da pilha */}
    <Tabuleiro pos={[3.4, 0, 2.4]} rotY={-0.4} n={12} />
    <Pilula texto="1945" pos={[3.4, 1.25, 2.4]} fundo="#1d1b26" cor="#ffd23f" tam={0.5} />
  </group>
);

// ================= os sets =================
export const SETS: Record<string, SetRico> = {
  rua: {
    ceu: CEU_DIA,
    nevoa: [60, 260],
    render: ({t, p}) => <Rua t={t} capinhas={2 + Math.round(p * 10)} moedas={p > 0.9 ? 6 : 0} />,
    cams: {
      banca: orb([0, 1.0, 9.1], 24, 12, 4.4, 3.7, 42, 8),
      avenida: orb([-2, 3.5, 3], -80, 22, 30, 25, 44, 8),
      capinha: orb([-2.3, 1.0, 9.3], -105, 10, 7.4, 6.6, 42, 6),
    },
  },
  ruanome: {
    ceu: CEU_DIA,
    nevoa: [60, 260],
    render: ({t, p}) => <Rua t={t} capinhas={2 + Math.round(p * 10)} nome={clamp01((p - 0.78) * 6)} />,
    cams: {
      nome: orb([0, 1.15, 8.9], -12, 8, 3.4, 2.8, 40, 8),
    },
  },
  radio: {
    ceu: CEU_SALA,
    luz: 'interior',
    render: ({t, p}) => <Radio t={t} p={p} sai={p > 0.45} />,
    cams: {
      geral: orb([0.2, 1.25, 0.2], 18, 10, 5.4, 4.6, 42, 8),
      porta: orb([2.3, 1.1, 0.8], -40, 8, 5.0, 4.3, 42, 8),
    },
  },
  barca: {
    ceu: CEU_DIA,
    nevoa: [200, 1600],
    render: ({t}) => <BarcaSet t={t} />,
    cams: {
      aberto: orb([3, 3.5, 0], 62, 12, 50, 44, 44, 6),
      corneta: orb([3.0, 5.7, 2.8], 32, 4, 4.8, 4.1, 42, 8),
    },
  },
  bau: {
    ceu: CEU_SALA,
    luz: 'interior',
    render: ({t, p}) => <Pensao t={t} p={p} dono={p > 0.65} />,
    cams: {
      pensao: orb([0.45, 1.05, -0.2], 14, 14, 5.6, 4.8, 42, 8),
      carne: orb([0.75, 0.5, -1.25], 18, 42, 1.45, 1.15, 40, 10),
      dono: orb([0.1, 1.3, -0.2], -18, 8, 4.8, 4.1, 42, 8),
    },
  },
  tv: {
    ceu: CEU_SALA,
    luz: 'interior',
    render: ({t, p}) => <Estudio t={t} p={p} agito={0} />,
    cams: {
      estudio: orb([0, 1.6, -1.5], 24, 16, 13, 11, 44, 8),
      camera: orb([0, 1.3, -3.3], -32, 6, 6.4, 5.6, 42, 8),
    },
  },
  tvpaga: {
    ceu: CEU_SALA,
    luz: 'interior',
    render: ({t, p}) => <Estudio t={t} p={p} paga macos={2 + p * 14} />,
    cams: {
      dinheiro: orb([6, 1.0, -1.5], -80, 16, 4.2, 3.6, 42, 8),
    },
  },
  tvplateia: {
    ceu: CEU_SALA,
    luz: 'interior',
    render: ({t}) => <Estudio t={t} p={1} agito={1} />,
    cams: {
      plateia: orb([0, 1.3, 4.5], 200, 12, 8.6, 7.8, 44, 8),
    },
  },
  emissora: {
    ceu: CEU_DIA,
    nevoa: [250, 1200],
    render: ({t}) => (
      <>
        <Caixa pos={[0, -0.05, 0]} tam={[400, 0.1, 400]} cor="#8fae7a" />
        <Caixa pos={[0, -0.02, 22]} tam={[400, 0.06, 10]} cor="#4a4a50" />
        <PredioTV pos={[0, 0, 0]} letreiro="SBT" />
        <Torre pos={[24, 0, -12]} h={80} />
        {/* inauguração: fita e convidados */}
        {[-2, 2].map((x) => (<Cil key={x} pos={[x, 0.5, 13]} r={0.05} h={1} cor="#c9a24a" />))}
        <Caixa pos={[0, 0.9, 13]} tam={[4, 0.12, 0.03]} cor="#d6282b" />
        <Boneco pos={[0, 0.02, 13.8]} rotY={Math.PI} acao="comemora" t={t} v={ZE_RICO} esc={1.3} />
        {[-4, -2.6, 2.6, 4].map((x, i) => (<Boneco key={x} pos={[x, 0.02, 15.5]} rotY={Math.PI} acao="comemora" t={t + i} v={PASSANTES[i]} esc={1.2} />))}
      </>
    ),
    cams: {
      drone: orb([5, 20, 0], 12, 14, 135, 118, 44, 8),
    },
  },
  imperio: {
    ceu: CEU_DIA,
    nevoa: [200, 900],
    render: ({t, p}) => <Imperio t={t} p={p} />,
    cams: {
      cidade: orb([0, 8, -12], 22, 30, 92, 78, 44, 8),
      banco: orb([46, 6, -4], -36, 40, 54, 48, 42, 6),
    },
  },
  rombo: {
    ceu: CEU_CINZA,
    luz: 'nublado',
    render: ({t, p}) => <Rombo t={t} p={p} modo="banco" />,
    cams: {
      banco: orb([0, 7, 4], 30, 8, 44, 38, 42, 8),
    },
  },
  cratera: {
    ceu: CEU_CINZA,
    luz: 'nublado',
    render: ({t, p}) => <Rombo t={t} p={p} modo="buraco" />,
    cams: {
      buraco: orb([0, 1, 12], 15, 55, 20, 16, 44, 8),
    },
  },
  divida: {
    ceu: CEU_SALA,
    luz: 'interior',
    render: ({t, p}) => <Emprestimo t={t} p={p} />,
    cams: {
      geral: orb([0, 1.0, 0], 75, 15, 4.4, 3.7, 42, 8),
    },
  },
  garantia: {
    ceu: CEU_CINZA,
    luz: 'nublado',
    render: ({t, p}) => <Garantia t={t} p={p} />,
    cams: {
      cadeado: orb([0, 4.6, 1], 25, 6, 15, 12.5, 44, 8),
    },
  },
  volta: {
    ceu: CEU_DIA,
    render: ({t, p}) => <Vendido t={t} p={p} />,
    cams: {
      vendido: orb([0.4, 1.6, 12], 6, 10, 7.8, 6.8, 44, 8),
    },
  },
  forbes: {
    ceu: CEU_SALA,
    luz: 'interior',
    render: ({t, p}) => <Forbes t={t} p={p} />,
    cams: {
      grafico: orb([1.5, 4.2, 0], 50, 10, 21, 18, 44, 8),
    },
  },
  fim: {
    ceu: CEU_TARDE,
    luz: 'tarde',
    nevoa: [120, 500],
    render: ({t}) => <Fim t={t} />,
    cams: {
      pilha: orb([0, 2.2, 0], 18, 12, 16, 13.5, 44, 8),
      banca: orb([3.0, 0.9, 2.2], 38, 18, 3.9, 3.3, 42, 8),
      pergunta: orb([0, 3.85, 0.1], 4, 4, 4.9, 4.3, 40, 6),
    },
  },
};

export {Rotulo};
