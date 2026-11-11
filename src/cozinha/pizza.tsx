// PIZZA DE FRIGIDEIRA (Zé na Cozinha): peças em escala real + cenários (prefixo pz).
// Frigideira antiaderente de 24 cm (r = 0,12 m) na boca da frente-esquerda do fogão; disco de massa de ~20 cm.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Barra, Boneco, CHEF, Cil, Instancias, AcaoBoneco, texPilula} from '../v4/kit';
import {orb, Cam, Ctx} from '../v4/sets';
import {
  Chuvisco, Colher, Cozinha, Espatula, Ilha, Lata, Pacote, Prato, TOPO, Tabua, Tigela, Vapor, Xicara, clamp01, lerp, suave, texCanvas,
} from './pecas';

type SetPz = {fundo?: [string, string]; luz?: 'cozinha' | 'forno' | 'frio'; render: (c: Ctx) => React.ReactNode; cams: Record<string, Cam>};

const T = TOPO;
const BOCA: V3 = [0.5, 0.96, -1.86];
export const PZ = {
  crua: '#f3e2bf', dourada: '#d9963f', borda: '#c98235', molho: '#c8321e', queijo: '#fff0b5', derretido: '#ffd769',
  tostado: '#e09a3a', oregano: '#4d7a2a', calabresa: '#b4423a', farinha: '#fbf7ee', vidro: '#e8f4ff', ferro: '#2c2c34',
};
const mix = (a: string, b: string, k: number) => new THREE.Color(a).lerp(new THREE.Color(b), clamp01(k)).getStyle();
const rnd = (seed: number) => {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};

// ---------- peças ----------
const Ze: React.FC<{t: number; acao?: AcaoBoneco; pos?: V3; rotY?: number}> = ({t, acao = 'parado', pos = [0, 0, -0.85], rotY = 0}) => (
  <Boneco pos={pos} rotY={rotY} acao={acao} t={t} v={CHEF} esc={0.95} />
);
// chama: força da boca da frente-esquerda (0 apagada, 0,45 baixo, 1 médio)
const Base: React.FC<{t: number; ze?: AcaoBoneco | null; chama?: number}> = ({t, ze = 'parado', chama = 0}) => (
  <>
    <Cozinha t={t} chama={[0, 0, chama, 0]} />
    <Ilha />
    {ze && <Ze t={t} acao={ze} />}
  </>
);

const Pilula: React.FC<{texto: string; pos: V3; fundo: string; vis: number}> = ({texto, pos, fundo, vis}) =>
  vis > 0.01 ? (
    <sprite position={pos} scale={[0.2 * suave(vis), 0.047 * suave(vis), 1]} renderOrder={10}>
      <spriteMaterial map={texPilula(texto, fundo, '#ffffff')} depthTest={false} sizeAttenuation={false} />
    </sprite>
  ) : null;

const XVermelho: React.FC<{pos: V3; esc?: number; vis: number}> = ({pos, esc = 0.12, vis}) =>
  vis > 0.01 ? (
    <group position={pos} scale={esc * suave(vis)}>
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[0, 0, (s * Math.PI) / 4]} renderOrder={5}>
          <boxGeometry args={[1, 0.16, 0.05]} />
          <meshStandardMaterial color="#ff3b30" emissive="#c41d14" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  ) : null;

// frigideira antiaderente 24 cm, 3,5 cm de borda, cabo de 20 cm (para +x)
export const Frigideira: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => {
  const r = 0.12, rb = 0.1, h = 0.035;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[r, rb, h, 28, 1, true]} />
        <meshStandardMaterial color={PZ.ferro} side={THREE.DoubleSide} roughness={0.45} metalness={0.3} />
      </mesh>
      <Cil pos={[0, 0.002, 0]} r={rb} h={0.004} cor="#24242b" seg={28} />
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.003, 6, 32]} />
        <meshStandardMaterial color="#9aa0aa" metalness={0.5} roughness={0.3} />
      </mesh>
      <Barra a={[r - 0.005, h * 0.8, 0]} b={[r + 0.05, h * 1.05, 0]} r={0.008} cor="#9aa0aa" />
      <Barra a={[r + 0.05, h * 1.05, 0]} b={[r + 0.2, h * 1.35, 0]} r={0.012} cor="#1d1b26" />
    </group>
  );
};

// tampa de vidro 24 cm (cúpula baixa) com aro de inox e pegador
export const TampaVidro: React.FC<{pos: V3; rot?: V3; embaçada?: number}> = ({pos, rot = [0, 0, 0], embaçada = 0}) => (
  <group position={pos} rotation={rot}>
    <mesh scale={[1, 0.32, 1]}>
      <sphereGeometry args={[0.124, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={PZ.vidro} transparent opacity={0.22 + embaçada * 0.25} roughness={0.05} metalness={0.1} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.124, 0.004, 6, 32]} />
      <meshStandardMaterial color="#c3c8cf" metalness={0.6} roughness={0.3} />
    </mesh>
    <Cil pos={[0, 0.045, 0]} r={0.008} h={0.012} cor="#1d1b26" />
    <Cil pos={[0, 0.056, 0]} r={0.018} r2={0.014} h={0.012} cor="#1d1b26" seg={12} />
  </group>
);

// disco de massa: face de cima e de baixo com cores próprias (para virar), bolhas de cozimento
export const DiscoMassa: React.FC<{pos: V3; r?: number; cima?: string; baixo?: string; rot?: V3; bolhas?: number; manchas?: number}> = ({pos, r = 0.1, cima = PZ.crua, baixo = PZ.crua, rot = [0, 0, 0], bolhas = 0, manchas = 0}) => {
  const pts = useMemo(() => {
    const r0 = rnd(17);
    return Array.from({length: 14}).map(() => {
      const a = r0() * Math.PI * 2, d = Math.sqrt(r0()) * 0.82;
      return [Math.cos(a) * d, Math.sin(a) * d, 0.6 + r0() * 0.8] as [number, number, number];
    });
  }, []);
  return (
    <group position={pos} rotation={rot}>
      <Cil pos={[0, -0.002, 0]} r={r} h={0.004} cor={baixo} seg={32} />
      <Cil pos={[0, 0.002, 0]} r={r} h={0.004} cor={cima} seg={32} />
      {bolhas > 0.01 && pts.map(([x, z, s], i) => (
        <mesh key={i} position={[x * r, 0.004, z * r]} scale={[0.008 * s * bolhas, 0.004 * s * bolhas, 0.008 * s * bolhas]}>
          <sphereGeometry args={[1, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={mix(cima, '#fff6e0', 0.4)} flatShading />
        </mesh>
      ))}
      {manchas > 0.01 && pts.map(([x, z, s], i) => (
        <mesh key={'m' + i} position={[x * r * 0.9, 0.0042, z * r * 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.009 * s * manchas, 7]} />
          <meshStandardMaterial color="#b46a22" />
        </mesh>
      ))}
    </group>
  );
};

// pizza montada (massa já dourada): molho, queijo ralado → derretido, orégano, calabresa, cortes e fatia faltando
export const PizzaDisco: React.FC<{pos: V3; r?: number; massa?: string; molho?: number; queijo?: number; derrete?: number; oregano?: number; calabresa?: number; falta?: number; cortes?: boolean}> = ({
  pos, r = 0.1, massa = PZ.dourada, molho = 0, queijo = 0, derrete = 0, oregano = 0, calabresa = 0, falta = 0, cortes = false,
}) => {
  const ang = Math.PI * 2 * (1 - falta / 8);
  const ini = (Math.PI * 5) / 8; // a fatia que falta fica centrada em +x
  const geoQ = useMemo(() => new THREE.BoxGeometry(0.014, 0.003, 0.003), []);
  const geoO = useMemo(() => new THREE.BoxGeometry(0.003, 0.001, 0.003), []);
  const dentro = (a: number) => {
    const rel = (((a - ini) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return rel <= ang;
  };
  const mq = useMemo(() => {
    const r0 = rnd(5);
    const out: THREE.Matrix4[] = [];
    while (out.length < 140) {
      const a = r0() * Math.PI * 2, d = Math.sqrt(r0()) * r * 0.82;
      const ry = r0() * 3;
      if (!dentro(Math.atan2(Math.cos(a), Math.sin(a)))) continue;
      out.push(new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * d, 0.009 + r0() * 0.004, Math.sin(a) * d), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1)));
    }
    return out;
  }, [r, falta]);
  const mo = useMemo(() => {
    const r0 = rnd(9);
    const out: THREE.Matrix4[] = [];
    while (out.length < 70) {
      const a = r0() * Math.PI * 2, d = Math.sqrt(r0()) * r * 0.8;
      if (!dentro(Math.atan2(Math.cos(a), Math.sin(a)))) continue;
      out.push(new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * d, 0.0125, Math.sin(a) * d), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r0() * 3, 0)), new THREE.Vector3(1, 1, 1)));
    }
    return out;
  }, [r, falta]);
  const kq = clamp01(1 - derrete * 1.3);
  const mqv = useMemo(() => mq.map((m) => {
    const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    m.decompose(p, q, s);
    return new THREE.Matrix4().compose(p, q, new THREE.Vector3(kq, Math.max(0.2, kq), kq));
  }), [mq, kq]);
  const cal = useMemo(() => {
    const pos: [number, number][] = [];
    [[0.035, 0], [0.068, 0.5], [0.068, 1.55], [0.068, 2.6], [0.068, 3.65], [0.068, 4.7], [0.068, 5.7], [0.035, 2.1], [0.035, 4.2]].forEach(([d, a]) => {
      if (dentro(Math.atan2(Math.cos(a), Math.sin(a)))) pos.push([Math.cos(a) * d * (r / 0.1), Math.sin(a) * d * (r / 0.1)]);
    });
    return pos;
  }, [r, falta]);
  return (
    <group position={pos}>
      <mesh position={[0, 0.003, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, 0.006, 40, 1, false, ini, ang]} />
        <meshStandardMaterial color={massa} flatShading roughness={0.85} />
      </mesh>
      {/* borda (cornicione) */}
      <mesh position={[0, 0.0065, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2 - ini - ang]}>
        <torusGeometry args={[r - 0.004, 0.0045, 6, 40, ang]} />
        <meshStandardMaterial color={PZ.borda} flatShading roughness={0.8} />
      </mesh>
      {molho > 0.01 && (
        <mesh position={[0, 0.0068, 0]}>
          <cylinderGeometry args={[r * 0.86 * Math.max(0.25, suave(molho)), r * 0.86 * Math.max(0.25, suave(molho)), 0.0016, 40, 1, false, ini, ang]} />
          <meshStandardMaterial color={PZ.molho} roughness={0.35} />
        </mesh>
      )}
      {queijo > 0.01 && kq > 0.02 && <Instancias matrizes={mqv} n={Math.floor(mqv.length * clamp01(queijo))} geo={geoQ} cor={PZ.queijo} sombra={false} />}
      {derrete > 0.01 && (
        <mesh position={[0, 0.0082, 0]}>
          <cylinderGeometry args={[r * 0.84 * lerp(0.55, 1, suave(derrete)), r * 0.84 * lerp(0.55, 1, suave(derrete)), 0.0022, 40, 1, false, ini, ang]} />
          <meshStandardMaterial color={mix(PZ.queijo, PZ.derretido, derrete)} roughness={lerp(0.8, 0.25, derrete)} />
        </mesh>
      )}
      {derrete > 0.7 && mo.slice(0, 18).map((m, i) => {
        const p = new THREE.Vector3().setFromMatrixPosition(m);
        return (
          <mesh key={'t' + i} position={[p.x * 0.95, 0.0095, p.z * 0.95]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.005 + (i % 3) * 0.002, 7]} />
            <meshStandardMaterial color={PZ.tostado} />
          </mesh>
        );
      })}
      {cal.slice(0, Math.round(cal.length * clamp01(calabresa))).map(([x, z], i) => (
        <group key={'c' + i} position={[x, 0.0105, z]}>
          <Cil r={0.014} h={0.003} cor={PZ.calabresa} seg={12} />
          <mesh position={[0, 0.0016, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.011, 10]} /><meshStandardMaterial color="#d8695c" /></mesh>
        </group>
      ))}
      {oregano > 0.01 && <Instancias matrizes={mo} n={Math.floor(mo.length * clamp01(oregano))} geo={geoO} cor={PZ.oregano} sombra={false} />}
      {cortes &&
        [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = ini + (i / 8) * Math.PI * 2;
          if (i / 8 > 1 - falta / 8 + 1e-6) return null;
          return <Barra key={'k' + i} a={[0, 0.0105, 0]} b={[Math.sin(a) * r * 0.97, 0.0105, Math.cos(a) * r * 0.97]} r={0.0012} cor="#7a3a12" sombra={false} />;
        })}
    </group>
  );
};

// setor (pedaço de anel) extrudado, na horizontal; o eixo da fatia é +x, ponta na origem
const geoSetor = (r0: number, r1: number, a: number, h: number) => {
  const s = new THREE.Shape();
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const t = -a / 2 + (a * i) / n;
    const v = [Math.cos(t) * r1, Math.sin(t) * r1];
    if (i === 0) s.moveTo(v[0], v[1]);
    else s.lineTo(v[0], v[1]);
  }
  for (let i = n; i >= 0; i--) {
    const t = -a / 2 + (a * i) / n;
    s.lineTo(Math.cos(t) * Math.max(r0, 0.0001), Math.sin(t) * Math.max(r0, 0.0001));
  }
  return new THREE.ExtrudeGeometry(s, {depth: h, bevelEnabled: false});
};

// fatia de pizza (1/8) que pode "dobrar" (mole) e mostrar o fundo; fios de queijo opcionais até "puxa"
export const FatiaPizza: React.FC<{pos: V3; rot?: V3; r?: number; mole?: number; fundo?: string; topo?: string; calabresa?: boolean}> = ({pos, rot = [0, 0, 0], r = 0.1, mole = 0, fundo = PZ.dourada, topo = PZ.derretido, calabresa = false}) => {
  const a = Math.PI / 4;
  const bandas = 4;
  const geos = useMemo(() => Array.from({length: bandas}).map((_, i) => {
    const r0 = (r * i) / bandas, r1 = (r * (i + 1)) / bandas;
    return {massa: geoSetor(r0, r1, a, 0.006), queijo: geoSetor(r0 + 0.002, Math.min(r1, r * 0.9), a * 0.9, 0.003)};
  }), [r]);
  // monta da borda (sem dobrar) para a ponta (dobra cada vez mais)
  const banda = (i: number): React.ReactNode => {
    if (i < 0) return null;
    const piv = (r * (i + 1)) / bandas;
    const g = geos[i];
    return (
      <group position={[piv, 0, 0]} rotation={[0, 0, i < bandas - 1 ? mole * 0.42 : 0]}>
        <group position={[-piv, 0, 0]}>
          <mesh geometry={g.massa} rotation={[-Math.PI / 2, 0, 0]} castShadow>
            <meshStandardMaterial color={fundo} flatShading roughness={0.8} />
          </mesh>
          {i * r / bandas < r * 0.9 && (
            <mesh geometry={g.queijo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
              <meshStandardMaterial color={topo} roughness={0.35} />
            </mesh>
          )}
          {calabresa && i === 2 && <Cil pos={[r * 0.62, 0.0105, 0]} r={0.012} h={0.003} cor={PZ.calabresa} seg={12} />}
          {banda(i - 1)}
        </group>
      </group>
    );
  };
  return (
    <group position={pos} rotation={rot}>
      <group>
        {banda(bandas - 1)}
        {/* borda alta */}
        <mesh position={[r - 0.004, 0.0065, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.0045, 0.0045, 6, 8]} />
          <meshStandardMaterial color={PZ.borda} />
        </mesh>
        <Barra a={[r - 0.004, 0.0065, -Math.sin(a / 2) * r]} b={[r - 0.004, 0.0065, Math.sin(a / 2) * r]} r={0.0048} cor={PZ.borda} />
      </group>
    </group>
  );
};

// fios de queijo esticados entre dois pontos
const FiosQueijo: React.FC<{a: V3; b: V3; vis?: number}> = ({a, b, vis = 1}) =>
  vis > 0.02 ? (
    <group>
      {[-0.012, 0, 0.012].map((dz, i) => {
        const meio: V3 = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) + (Math.abs(a[1] - b[1]) * 0.35), (a[2] + b[2]) / 2 + dz];
        return (
          <group key={i}>
            <Barra a={[a[0], a[1], a[2] + dz]} b={meio} r={0.0022 * vis} cor={PZ.derretido} sombra={false} />
            <Barra a={meio} b={[b[0], b[1], b[2] + dz]} r={0.0022 * vis} cor={PZ.derretido} sombra={false} />
          </group>
        );
      })}
    </group>
  ) : null;

const BolaMassa: React.FC<{pos: V3; esc?: number}> = ({pos, esc = 1}) => (
  <mesh position={[pos[0], pos[1] + 0.022 * esc, pos[2]]} scale={[0.042 * esc, 0.026 * esc, 0.042 * esc]} castShadow>
    <sphereGeometry args={[1, 16, 10]} />
    <meshStandardMaterial color={PZ.crua} flatShading roughness={0.9} />
  </mesh>
);

// rolo de massa: 30 cm de madeira, 5 cm de diâmetro, cabos (eixo em z)
const RoloMassa: React.FC<{pos: V3; rotY?: number; giro?: number}> = ({pos, rotY = 0, giro = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <group rotation={[Math.PI / 2, giro, 0]}>
      <Cil r={0.025} h={0.26} cor="#d9a866" seg={14} />
      <Cil pos={[0, 0.16, 0]} r={0.011} h={0.07} cor="#b8834a" seg={10} />
      <Cil pos={[0, -0.16, 0]} r={0.011} h={0.07} cor="#b8834a" seg={10} />
    </group>
  </group>
);

// garrafa de azeite (500 ml): vidro verde-escuro, rótulo
const texAzeite = () =>
  texCanvas('rot:azeite', 128, 160, (g) => {
    g.fillStyle = '#f4ecd2';
    g.fillRect(0, 0, 128, 160);
    g.fillStyle = '#3e6b23';
    g.textAlign = 'center';
    g.font = "800 30px 'Baloo 2', sans-serif";
    g.fillText('AZEITE', 64, 70);
    g.font = "800 20px 'Baloo 2', sans-serif";
    g.fillText('500 ml', 64, 110);
  });
const GarrafaAzeite: React.FC<{pos: V3; rot?: V3}> = ({pos, rot = [0, 0, 0]}) => (
  <group position={pos} rotation={rot}>
    <Cil pos={[0, 0.085, 0]} r={0.032} h={0.17} cor="#2f4a1c" seg={14} />
    <Cil pos={[0, 0.2, 0]} r={0.012} r2={0.03} h={0.06} cor="#2f4a1c" seg={12} />
    <Cil pos={[0, 0.24, 0]} r={0.013} h={0.025} cor="#c9a227" seg={10} />
    <mesh position={[0, 0.09, 0.0325]}>
      <planeGeometry args={[0.05, 0.065]} />
      <meshStandardMaterial map={texAzeite()} roughness={0.8} />
    </mesh>
  </group>
);

// bloco de muçarela e montinho ralado num prato
const QueijoRalado: React.FC<{pos: V3; frac?: number}> = ({pos, frac = 1}) => {
  const geo = useMemo(() => new THREE.BoxGeometry(0.014, 0.003, 0.003), []);
  const mats = useMemo(() => {
    const r0 = rnd(21);
    return Array.from({length: 60}).map((_, i) => {
      const a = r0() * Math.PI * 2, d = Math.sqrt(r0()) * 0.045 * (1 - i / 90);
      return new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * d, 0.015 + (i / 60) * 0.03, Math.sin(a) * d), new THREE.Quaternion().setFromEuler(new THREE.Euler(r0(), r0() * 3, r0())), new THREE.Vector3(1, 1, 1));
    });
  }, []);
  return (
    <group position={pos}>
      <Prato pos={[0, 0, 0]} r={0.08} />
      <group position={[0, 0, 0]}>
        <Instancias matrizes={mats} n={Math.floor(60 * clamp01(frac))} geo={geo} cor={PZ.queijo} sombra={false} />
      </group>
    </group>
  );
};

// ---------- cenários ----------
const FR: V3 = [BOCA[0], BOCA[1], BOCA[2]];
const DY = 0.006; // disco apoiado no fundo da frigideira
const NaFrigideira: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <>
    <Frigideira pos={FR} />
    {children}
  </>
);
const Sache: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = -0.3}) => (
  <Pacote pos={pos} texto={'MOLHO DE\nTOMATE'} fundo="#d8302b" linha2="300 g" rotY={rotY} tam={[0.09, 0.13, 0.03]} />
);

export const PIZZA: Record<string, SetPz> = {
  // gancho e final: pizza pronta na frigideira em cima da tábua, fatia saindo com o queijo puxando
  pzPronta: {
    render: ({t, p}) => {
      const sobe = 0.05 + 0.05 * suave(p);
      const c: V3 = [0, T + 0.02, 0.05];
      return (
        <>
          <Base t={t} ze="comemora" />
          <Tabua pos={[0, T, 0.05]} />
          <Frigideira pos={c} rotY={-0.5} />
          <PizzaDisco pos={[c[0], c[1] + DY, c[2]]} derrete={1} molho={1} oregano={1} falta={1} cortes />
          <FatiaPizza pos={[c[0] + 0.025, c[1] + DY + sobe, c[2]]} rot={[0, 0, 0.12]} />
          <FiosQueijo a={[c[0] + 0.01, c[1] + DY + 0.009, c[2]]} b={[c[0] + 0.03, c[1] + DY + sobe + 0.008, c[2]]} />
          <Vapor t={t} pos={[c[0], c[1] + 0.06, c[2]]} forca={0.5} raio={0.05} />
          <Espatula pos={[c[0] + 0.14, c[1] + DY + sobe + 0.0, c[2]]} rot={[0, 0, -1.45]} />
        </>
      );
    },
    cams: {giro: orb([0.03, T + 0.06, 0.05], -25, 28, 0.72, 0.52, 40, 30), final: orb([0.03, T + 0.07, 0.07], 30, 32, 0.8, 0.6, 40, -20)},
  },
  // erro: recheio em cima da massa crua, ainda clara, vapor preso
  pzCrua: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} chama={1} />
        <NaFrigideira>
          <PizzaDisco pos={[FR[0], FR[1] + DY, FR[2]]} massa={PZ.crua} molho={1} queijo={1} derrete={0.15} />
        </NaFrigideira>
        <XVermelho pos={[FR[0], FR[1] + 0.09, FR[2]]} vis={clamp01(p * 3 - 0.6)} />
        <Pilula texto="MASSA CRUA" pos={[FR[0], FR[1] + 0.045, FR[2] + 0.06]} fundo="#ff5d5d" vis={clamp01(p * 3 - 0.2)} />
      </>
    ),
    cams: {alto: orb([FR[0], FR[1] + 0.02, FR[2]], 12, 50, 0.6, 0.46, 40, 14), lado: orb([FR[0], FR[1] + 0.02, FR[2]], -30, 26, 0.55, 0.42, 40, 12)},
  },
  // segredo: virar o disco com a espátula (embaixo já dourado)
  pzVira: {
    render: ({t, p}) => {
      const k = suave(clamp01(p * 1.25));
      const alto = Math.sin(k * Math.PI) * 0.09;
      return (
        <>
          <Base t={t} ze={null} chama={1} />
          <NaFrigideira>
            <DiscoMassa pos={[FR[0] - 0.02 * Math.sin(k * Math.PI), FR[1] + DY + alto, FR[2]]} rot={[0, 0, Math.PI * k]} cima={PZ.crua} baixo={PZ.dourada} bolhas={0.8} />
          </NaFrigideira>
          <Espatula pos={[FR[0] + 0.07, FR[1] + DY + alto - 0.005, FR[2]]} rot={[0, 0, -1.4 + k * 0.6]} />
          <Pilula texto="DOURADO" pos={[FR[0], FR[1] + 0.05, FR[2] + 0.07]} fundo="#2fbf71" vis={clamp01(p * 3 - 2)} />
        </>
      );
    },
    cams: {frente: orb([FR[0], FR[1] + 0.05, FR[2]], 6, 18, 0.62, 0.48, 40, 10), lado: orb([FR[0], FR[1] + 0.05, FR[2]], -40, 22, 0.58, 0.45, 40, -12)},
  },
  // contexto: a cozinha toda, Zé no fogão, forno apagado
  pzCozinha: {
    render: ({t}) => (
      <>
        <Cozinha t={t} chama={[0, 0, 1, 0]} aceso={0} />
        <Ilha />
        <Ze t={t} acao="aponta" pos={[0.1, 0, -0.95]} rotY={0.3} />
        <Frigideira pos={FR} />
        <Tigela pos={[-0.3, T, 0.05]} nivel={0.5} cor={PZ.crua} />
        <Pacote pos={[0.3, T, -0.05]} texto={'FARINHA\nDE TRIGO'} fundo="#2f6fd6" linha2="1 kg" rotY={-0.3} />
        <Lata pos={[0.48, T, 0.12]} texto={'IOGURTE\nNATURAL'} fundo="#f4f6fb" cor="#2f6fd6" r={0.035} h={0.07} />
      </>
    ),
    cams: {geral: orb([0.25, 1.0, -0.8], 25, 20, 3.6, 3.0, 44, 10)},
  },
  // massa: farinha da xícara na tigela
  pzFarinha: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Tigela pos={[0, T, 0.05]} monte={0.15 + p * 0.45} corMonte={PZ.farinha} />
        <Xicara pos={[-0.075, T + 0.24, 0.05]} rot={[0, 0, -2.1]} cheia={p < 0.8 ? PZ.farinha : null} />
        <Chuvisco t={t} de={[-0.01, T + 0.2, 0.05]} y1={T + 0.05} raio={0.02} n={110} cor={PZ.farinha} tam={0.005} vel={1.1} on={p < 0.85 ? 1 : 0} />
        <Pacote pos={[0.28, T, -0.03]} texto={'FARINHA\nDE TRIGO'} fundo="#2f6fd6" linha2="1 kg" rotY={-0.4} />
      </>
    ),
    cams: {close: orb([0, T + 0.12, 0.05], -24, 18, 0.62, 0.48, 40, 10)},
  },
  pzFermento: {
    render: ({t, p}) => {
      const inc = lerp(0, -1.6, suave(p * 1.6));
      return (
        <>
          <Base t={t} ze={null} />
          <Tigela pos={[0, T, 0.05]} monte={0.6} corMonte={PZ.farinha} />
          <Colher pos={[0.01, T + 0.19, 0.05]} rot={[0, -Math.PI / 2, inc]} cheia={p < 0.55 ? '#ffffff' : null} esc={0.9} />
          <Chuvisco t={t} de={[0, T + 0.18, 0.05]} y1={T + 0.08} raio={0.008} n={40} cor="#ffffff" tam={0.004} vel={0.9} on={p > 0.35 && p < 0.9 ? 1 : 0} />
          <Lata pos={[0.24, T, 0.05]} texto={'FERMENTO\nEM PÓ'} fundo="#e8322b" linha2="químico" r={0.035} h={0.09} />
        </>
      );
    },
    cams: {colher: orb([0.03, T + 0.14, 0.05], 22, 18, 0.52, 0.4, 40, 10)},
  },
  pzSal: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Tigela pos={[0, T, 0.05]} monte={0.62} corMonte={PZ.farinha} />
        <Lata pos={[0.03, T + 0.24, 0.05]} rot={[0, 0, Math.PI * 0.8]} texto={'SAL'} fundo="#2f6fd6" r={0.022} h={0.07} />
        <Chuvisco t={t} de={[0, T + 0.18, 0.05]} y1={T + 0.08} raio={0.008} n={25} cor="#ffffff" tam={0.003} vel={0.8} on={p > 0.2 && p < 0.7 ? 1 : 0} />
      </>
    ),
    cams: {close: orb([0.0, T + 0.15, 0.05], 40, 12, 0.5, 0.4, 40, 8)},
  },
  // iogurte natural do pote para a tigela
  pzIogurte: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Tigela pos={[0, T, 0.05]} nivel={0.25 + p * 0.25} cor={mix(PZ.farinha, '#fffdf6', p)} monte={0.5 * (1 - p)} corMonte={PZ.farinha} />
        <Lata pos={[-0.07, T + 0.22, 0.05]} rot={[0, 0, -2.0]} texto={'IOGURTE\nNATURAL'} fundo="#f4f6fb" cor="#2f6fd6" r={0.035} h={0.07} />
        {p < 0.85 && <Barra a={[-0.03, T + 0.19, 0.05]} b={[-0.01, T + 0.06, 0.05]} r={0.009} cor="#fffdf6" sombra={false} />}
      </>
    ),
    cams: {close: orb([0, T + 0.12, 0.05], 20, 18, 0.62, 0.48, 40, 10)},
  },
  pzAzeite: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Tigela pos={[0, T, 0.05]} nivel={0.5} cor="#fbf4e2" />
        <GarrafaAzeite pos={[-0.05, T + 0.17, 0.05]} rot={[0, 0, -2.0]} />
        {p < 0.8 && <Barra a={[-0.012, T + 0.16, 0.05]} b={[-0.004, T + 0.08, 0.05]} r={0.0025} cor="#d9b62a" sombra={false} />}
        <mesh position={[0, T + 0.087, 0.05]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.012 + 0.02 * p, 16]} /><meshStandardMaterial color="#e3c23a" roughness={0.1} /></mesh>
      </>
    ),
    cams: {close: orb([0, T + 0.13, 0.05], -28, 16, 0.62, 0.48, 40, 8)},
  },
  // mistura vira bola lisa que desgruda
  pzMassa: {
    render: ({t, p}) => {
      const a = t * 3;
      return (
        <>
          <Base t={t} ze={null} />
          <Tigela pos={[0, T, 0.05]} nivel={0.4 * (1 - p)} cor="#f6ecd2" />
          <BolaMassa pos={[0, T + 0.02, 0.05]} esc={lerp(0.6, 1.3, suave(p))} />
          <Espatula pos={[Math.cos(a) * 0.06, T + 0.06, 0.05 + Math.sin(a) * 0.06]} rot={[Math.sin(a) * 0.35, -a, -Math.cos(a) * 0.35]} />
        </>
      );
    },
    cams: {cima: orb([0, T + 0.07, 0.05], 25, 56, 0.55, 0.42, 40, 20)},
  },
  // duas bolinhas na tábua enfarinhada
  pzBolinhas: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Tabua pos={[0, T, 0.05]} />
        <mesh position={[0, T + 0.0205, 0.05]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.1, 16]} /><meshStandardMaterial color={PZ.farinha} transparent opacity={0.7} /></mesh>
        <BolaMassa pos={[-0.06 - 0.02 * suave(p), T + 0.02, 0.05]} esc={0.95} />
        <BolaMassa pos={[0.06 + 0.02 * suave(p), T + 0.02, 0.05]} esc={0.95} />
        <RoloMassa pos={[0.26, T + 0.025, 0.04]} />
      </>
    ),
    cams: {cima: orb([0, T + 0.03, 0.06], 8, 55, 0.6, 0.46, 40, 12), lado: orb([0, T + 0.04, 0.05], -35, 22, 0.55, 0.42, 40, 10)},
  },
  // abrir com o rolo: disco cresce de 8 para 20 cm
  pzAbre: {
    render: ({t, p}) => {
      const r = lerp(0.045, 0.1, suave(p));
      const vai = Math.sin(t * 6) * 0.05;
      return (
        <>
          <Base t={t} ze={null} />
          <Tabua pos={[0, T, 0.05]} />
          <DiscoMassa pos={[0, T + 0.024, 0.05]} r={r} />
          <BolaMassa pos={[0.15, T + 0.02, -0.04]} esc={0.9} />
          <RoloMassa pos={[vai, T + 0.054, 0.05]} giro={t * 6} />
        </>
      );
    },
    cams: {lado: orb([0, T + 0.04, 0.05], 30, 20, 0.6, 0.46, 40, 10), cima: orb([0, T + 0.02, 0.06], -10, 62, 0.62, 0.5, 40, 14)},
  },
  // fogo médio aceso, disco entra na frigideira
  pzFogo: {
    render: ({t, p}) => {
      const k = suave(clamp01(p * 1.4));
      return (
        <>
          <Base t={t} ze={null} chama={clamp01(p * 4)} />
          <NaFrigideira>
            <DiscoMassa pos={[FR[0], FR[1] + DY + (1 - k) * 0.1, FR[2] + (1 - k) * 0.08]} rot={[(1 - k) * 0.5, 0, 0]} />
          </NaFrigideira>
          <Pilula texto="FOGO MÉDIO" pos={[FR[0], FR[1] - 0.02, FR[2] + 0.14]} fundo="#4f8cff" vis={clamp01(p * 3 - 0.4)} />
        </>
      );
    },
    cams: {alto: orb([FR[0], FR[1] + 0.0, FR[2]], 15, 42, 0.8, 0.6, 40, 12), lado: orb([FR[0], FR[1] + 0.0, FR[2]], -35, 24, 0.72, 0.56, 40, 10)},
  },
  // primeiro lado: bolhas sobem na massa
  pzDisco: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} chama={1} />
        <NaFrigideira>
          <DiscoMassa pos={[FR[0], FR[1] + DY, FR[2]]} cima={mix(PZ.crua, '#f6e7c8', p)} bolhas={suave(p)} />
        </NaFrigideira>
      </>
    ),
    cams: {close: orb([FR[0], FR[1] + 0.01, FR[2]], 20, 30, 0.42, 0.32, 40, 10)},
  },
  // lado de cima dourado, com pintinhas
  pzDourado: {
    render: ({t}) => (
      <>
        <Base t={t} ze={null} chama={0.6} />
        <NaFrigideira>
          <DiscoMassa pos={[FR[0], FR[1] + DY, FR[2]]} cima={PZ.dourada} baixo={PZ.dourada} manchas={1} />
        </NaFrigideira>
        <Sache pos={[FR[0] + 0.38, 0.92, FR[2] - 0.05]} />
      </>
    ),
    cams: {cima: orb([FR[0], FR[1] + 0.0, FR[2]], -8, 56, 0.55, 0.42, 40, 14)},
  },
  // erro (Zé apontando para a frigideira com massa crua recheada)
  pzErra: {
    render: ({t}) => (
      <>
        <Base t={t} ze="aponta" />
        <Tabua pos={[0.15, T, 0.1]} />
        <Frigideira pos={[0.15, T + 0.02, 0.1]} rotY={-0.6} />
        <PizzaDisco pos={[0.15, T + 0.02 + DY, 0.1]} massa={PZ.crua} molho={1} queijo={1} />
        <XVermelho pos={[0.15, T + 0.2, 0.1]} vis={1} esc={0.14} />
      </>
    ),
    cams: {frente: orb([0.05, 1.18, -0.4], 8, 6, 2.4, 2.1, 42, 10)},
  },
  // vapor preso embaixo do recheio
  pzVapor: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} chama={1} />
        <NaFrigideira>
          <PizzaDisco pos={[FR[0], FR[1] + DY, FR[2]]} massa={PZ.crua} molho={1} queijo={1} />
        </NaFrigideira>
        <Vapor t={t} pos={[FR[0] - 0.03, FR[1] + 0.03, FR[2]]} forca={0.6 + 0.4 * p} raio={0.06} />
        <Pilula texto="VAPOR PRESO" pos={[FR[0], FR[1] + 0.1, FR[2]]} fundo="#ff5d5d" vis={clamp01(p * 3 - 0.3)} />
      </>
    ),
    cams: {close: orb([FR[0], FR[1] + 0.03, FR[2]], 25, 14, 0.46, 0.36, 40, 8)},
  },
  // fatia mole: a ponta cai, massa clara por baixo
  pzMole: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Prato pos={[0, T, 0.05]} r={0.13} />
        <FatiaPizza pos={[-0.06, T + 0.12, 0.05]} mole={0.2 + 0.8 * suave(p)} fundo={PZ.crua} topo={mix(PZ.queijo, PZ.derretido, 0.4)} />
        <Espatula pos={[0.1, T + 0.115, 0.05]} rot={[0, 0, -1.5]} />
        <XVermelho pos={[-0.06, T + 0.2, 0.05]} vis={clamp01(p * 3 - 1.2)} esc={0.07} />
      </>
    ),
    cams: {close: orb([0.0, T + 0.1, 0.05], 10, 8, 0.5, 0.4, 40, 10)},
  },
  // recheio no lado dourado
  pzMolho: {
    render: ({t, p}) => {
      const a = t * 5;
      return (
        <>
          <Base t={t} ze={null} chama={0.6} />
          <NaFrigideira>
            <PizzaDisco pos={[FR[0], FR[1] + DY, FR[2]]} molho={lerp(0.15, 1, p)} />
          </NaFrigideira>
          <Colher pos={[FR[0] + Math.cos(a) * 0.04 * p, FR[1] + 0.03, FR[2] + Math.sin(a) * 0.04 * p]} rot={[0.4, -a * 0.2, 0]} cheia={p < 0.5 ? PZ.molho : null} esc={1.1} />
          <Sache pos={[FR[0] + 0.33, 0.92, FR[2] - 0.08]} />
        </>
      );
    },
    cams: {close: orb([FR[0], FR[1] + 0.01, FR[2]], 18, 36, 0.48, 0.38, 40, 10)},
  },
  pzQueijo: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} chama={0.6} />
        <NaFrigideira>
          <PizzaDisco pos={[FR[0], FR[1] + DY, FR[2]]} molho={1} queijo={lerp(0.1, 1, p)} />
        </NaFrigideira>
        <Chuvisco t={t} de={[FR[0], FR[1] + 0.16, FR[2]]} y1={FR[1] + 0.015} raio={0.06} n={60} cor={PZ.queijo} tam={0.006} vel={0.7} on={p < 0.85 ? 1 : 0} />
        <QueijoRalado pos={[FR[0] - 0.12, 0.92, FR[2] + 0.2]} frac={1 - p * 0.7} />
      </>
    ),
    cams: {close: orb([FR[0], FR[1] + 0.02, FR[2]], -22, 30, 0.5, 0.4, 40, 10)},
  },
  pzOregano: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} chama={0.6} />
        <NaFrigideira>
          <PizzaDisco pos={[FR[0], FR[1] + DY, FR[2]]} molho={1} queijo={1} oregano={p} />
        </NaFrigideira>
        <Chuvisco t={t} de={[FR[0], FR[1] + 0.12, FR[2]]} y1={FR[1] + 0.015} raio={0.04} n={40} cor={PZ.oregano} tam={0.004} vel={0.6} on={p < 0.8 ? 1 : 0} />
      </>
    ),
    cams: {close: orb([FR[0], FR[1] + 0.015, FR[2]], 35, 22, 0.4, 0.32, 40, 8)},
  },
  // segredo 2: tampa desce, fogo vai para baixo
  pzTampa: {
    render: ({t, p}) => {
      const k = suave(clamp01(p * 1.3));
      return (
        <>
          <Base t={t} ze={null} chama={lerp(1, 0.45, clamp01(p * 2 - 0.6))} />
          <NaFrigideira>
            <PizzaDisco pos={[FR[0], FR[1] + DY, FR[2]]} molho={1} queijo={1} oregano={1} derrete={0.1 * p} />
          </NaFrigideira>
          <TampaVidro pos={[FR[0] - 0.06 * (1 - k), FR[1] + 0.035 + (1 - k) * 0.16, FR[2]]} rot={[0, 0, 0.5 * (1 - k)]} embaçada={k * 0.3} />
          <Pilula texto="FOGO BAIXO" pos={[FR[0], FR[1] - 0.02, FR[2] + 0.15]} fundo="#4f8cff" vis={clamp01(p * 3 - 1.5)} />
        </>
      );
    },
    cams: {frente: orb([FR[0], FR[1] + 0.05, FR[2]], 4, 20, 0.66, 0.5, 40, 10), cima: orb([FR[0], FR[1] + 0.03, FR[2]], -20, 52, 0.62, 0.48, 40, 12)},
  },
  // queijo derretendo debaixo da tampa (vista rente)
  pzDerrete: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} chama={0.45} />
        <NaFrigideira>
          <PizzaDisco pos={[FR[0], FR[1] + DY, FR[2]]} molho={1} queijo={1} oregano={1} derrete={lerp(0.15, 1, suave(p))} />
        </NaFrigideira>
        <TampaVidro pos={[FR[0], FR[1] + 0.035, FR[2]]} embaçada={0.15} />
        <Vapor t={t} pos={[FR[0], FR[1] + 0.03, FR[2]]} forca={0.35} raio={0.05} />
      </>
    ),
    cams: {vidro: orb([FR[0], FR[1] + 0.03, FR[2]], 30, 16, 0.4, 0.31, 40, 8)},
  },
  // fundo crocante: fatia firme levantada mostrando a parte de baixo dourada
  pzFundo: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Prato pos={[0, T, 0.05]} r={0.13} />
        <group position={[-0.05, T + 0.1 + 0.02 * suave(p), 0.05]}>
          <FatiaPizza pos={[0, 0, 0]} rot={[lerp(-0.4, -1.1, suave(p)), 0, 0]} fundo="#c97a2c" />
        </group>
        <Pilula texto="CROCANTE" pos={[0.0, T + 0.2, 0.05]} fundo="#2fbf71" vis={clamp01(p * 3 - 0.8)} />
      </>
    ),
    cams: {baixo: orb([0, T + 0.09, 0.05], 0, -2, 0.45, 0.36, 40, 10)},
  },
  // final: mesa com as duas pizzas, Zé comemorando
  pzMesa: {
    render: ({t}) => (
      <>
        <Base t={t} ze="comemora" />
        <Tabua pos={[-0.2, T, 0.12]} />
        <PizzaDisco pos={[-0.2, T + 0.02, 0.12]} molho={1} derrete={1} oregano={1} falta={2} cortes />
        <Prato pos={[0.22, T, 0.15]} r={0.12} />
        <PizzaDisco pos={[0.22, T + 0.012, 0.15]} molho={1} derrete={1} oregano={0.6} calabresa={1} cortes />
        <Frigideira pos={[0.62, T, -0.05]} rotY={2.6} />
      </>
    ),
    cams: {geral: orb([0, T + 0.15, -0.2], 10, 18, 2.2, 1.85, 42, 10)},
  },
  // fatia saindo com o queijo puxando (close)
  pzFatia: {
    render: ({t, p}) => {
      const sobe = 0.03 + 0.09 * suave(p);
      const c: V3 = [0, T + 0.012, 0.05];
      return (
        <>
          <Base t={t} ze={null} />
          <Prato pos={[0, T, 0.05]} r={0.12} />
          <PizzaDisco pos={c} molho={1} derrete={1} oregano={1} falta={1} cortes />
          <FatiaPizza pos={[c[0] + 0.03, c[1] + sobe, c[2]]} rot={[0, 0, 0.15]} />
          <FiosQueijo a={[c[0] + 0.01, c[1] + 0.009, c[2]]} b={[c[0] + 0.035, c[1] + sobe + 0.008, c[2]]} />
        </>
      );
    },
    cams: {close: orb([0.05, T + 0.06, 0.05], 0, 14, 0.42, 0.34, 40, 12)},
  },
  // muçarela × calabresa lado a lado
  pzDuas: {
    render: ({t, p}) => (
      <>
        <Base t={t} ze={null} />
        <Tabua pos={[-0.13, T, 0.05]} />
        <PizzaDisco pos={[-0.13, T + 0.02, 0.05]} molho={1} derrete={1} oregano={1} cortes />
        <Tabua pos={[0.13, T + 0.0, 0.32]} />
        <PizzaDisco pos={[0.13, T + 0.02, 0.32]} molho={1} derrete={1} oregano={0.5} calabresa={1} cortes />
        <Pilula texto="MUÇARELA" pos={[-0.13, T + 0.07, 0.05]} fundo="#ff9f1c" vis={clamp01(p * 3)} />
        <Pilula texto="CALABRESA" pos={[0.13, T + 0.07, 0.32]} fundo="#ff5d5d" vis={clamp01(p * 3 - 0.8)} />
      </>
    ),
    cams: {cima: orb([0, T + 0.02, 0.18], 0, 58, 0.95, 0.75, 40, 10)},
  },
};

