// CENÁRIOS do "Você na História: Pompeia, 24 de agosto de 79 d.C." (sets com prefixo "pom_", não colidem com outros episódios).
// Escala real (1 unidade = 1 m); a maquete do golfo (pom_baia / pom_pluma) usa 1 unidade = 100 m.
// Norte = -Z: o Vesúvio fica ao norte da cidade, atrás do Templo de Júpiter (a vista clássica do fórum).
// Peças em ./pompeia-pecas.tsx.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Barra, Caixa, Carrinho, Cil, Rotulo} from '../v4/kit';
import {Cam, orb} from '../v4/sets';
import {SombraContato} from '../estilo/visual';
import type {SetHistoria} from './sets';
import {Anfora, Saco} from './pecas';
import {
  ARQUEOLOGA, BRONZE, Barco, Barraca, Burro, Carroca, Chafariz, Chao, CinzaCaindo, ColunaCanelada, Domus, Fluxo, Liburna, Lucerna, Molde,
  PLINIO_JOVEM, PLINIO_VELHO, PaoRomano, Pessoa, Pluma, PomesChuva, PomesMonte, Regiao, Rua, T, TBox, Vapor, Vesuvio, ZE,
  clamp01, lerp, povo, rnd, suave, turista,
} from './pompeia-pecas';

const mv = (de: V3, para: V3, alvo: V3, alvoPara?: V3, fov = 44): Cam => ({de, para, alvo, alvoPara, fov});

// céus (topo, horizonte)
const CEU_DIA: [string, string] = ['#74bdf0', '#fbefd6'];
const CEU_62: [string, string] = ['#9a7a52', '#efd9a8'];
const CEU_ERUPCAO: [string, string] = ['#4a3830', '#d09a62'];
const CEU_CINZA: [string, string] = ['#2e2622', '#7a6856'];
const CEU_TARDE_CINZA: [string, string] = ['#3a2c26', '#a8845e'];
const CEU_MADRUGADA: [string, string] = ['#0e0a0a', '#3e2a22'];
const CEU_CREPUSCULO: [string, string] = ['#2a2240', '#c0703a'];

// Vesúvio visto da cidade (9 km ao norte; altura exagerada para ler no quadro vertical)
const VES: V3 = [0, 0, -700];
const VES_R = 420, VES_H = 200;
const CRATERA: V3 = [VES[0], VES_H - 4, VES[2]];

const Luzinha: React.FC<{i?: number; cor?: string}> = ({i = 0.5, cor = '#ffb080'}) => <ambientLight intensity={i} color={cor} />;

// ---------- vegetação ----------
const Pinheiro: React.FC<{pos: V3; esc?: number}> = ({pos, esc = 1}) => (
  <group position={pos} scale={esc}>
    <Barra a={[0, 0, 0]} b={[0.4, 7, 0.2]} r={0.25} cor="#6b4a32" />
    {([[0.4, 7.4, 0.2, 2.6], [-0.8, 7.0, 0.6, 1.8], [1.5, 7.0, -0.4, 1.9]] as [number, number, number, number][]).map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]} scale={[r, r * 0.42, r]} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={i ? '#3f5f2e' : '#355228'} />
      </mesh>
    ))}
  </group>
);
const Cipreste: React.FC<{pos: V3; esc?: number}> = ({pos, esc = 1}) => (
  <group position={pos} scale={esc}>
    <Cil pos={[0, 0.5, 0]} r={0.18} h={1} cor="#5a4030" />
    <mesh position={[0, 4, 0]} castShadow>
      <coneGeometry args={[0.9, 7, 24]} />
      <meshStandardMaterial color="#2f4a26" />
    </mesh>
  </group>
);

// ---------- templo de Júpiter (pódio alto, colunas coríntias, frontão) ----------
const Templo: React.FC<{pos: V3; larg?: number; comp?: number; hCol?: number; n?: number; cai?: number; quebrado?: boolean}> = ({pos, larg = 13, comp = 24, hCol = 8, n = 6, cai = 0, quebrado = false}) => {
  const trav = T.travertino();
  const telhado = useMemo(() => {
    const L = larg + 0.6;
    const s = new THREE.Shape();
    s.moveTo(-L / 2, 0);
    s.lineTo(L / 2, 0);
    s.lineTo(0, 2.6);
    s.lineTo(-L / 2, 0);
    const g = new THREE.ExtrudeGeometry(s, {depth: comp, bevelEnabled: false});
    g.translate(0, 0, -comp / 2);
    return g;
  }, [larg, comp]);
  const P = 3;
  const cols: {x: number; z: number}[] = [];
  for (let i = 0; i < n; i++) cols.push({x: -larg / 2 + 0.8 + ((larg - 1.6) / (n - 1)) * i, z: comp / 2 - 0.9});
  for (let k = 1; k <= 3; k++) for (const s of [-1, 1]) cols.push({x: s * (larg / 2 - 0.8), z: comp / 2 - 0.9 - k * 3.2});
  return (
    <group position={pos}>
      <TBox pos={[0, P / 2, 0]} tam={[larg, P, comp]} map={trav} mod={[4, 4]} />
      {Array.from({length: 8}).map((_, i) => (
        <Caixa key={i} pos={[0, (P - i * 0.375) / 2, comp / 2 + 0.19 + i * 0.375]} tam={[larg * 0.66, P - i * 0.375, 0.38]} cor={i % 2 ? '#e3d7bd' : '#ece2c8'} />
      ))}
      {cols.map((c, i) => {
        // a coluna da quina direita da fachada tomba PARA A FRENTE e deita no piso do templo (fora da escada, longe das casas)
        const caindo = cai > 0 && i === n - 1;
        const q = quebrado ? [1, 0.45, 0.7, 0.3, 1, 0.55][i % 6] : 0;
        if (quebrado && q === 1 && i % 3 === 1) return null;
        const s = clamp01(cai / 1.8);
        const pos: V3 = caindo ? [c.x, lerp(P, 0.66, s * s), lerp(c.z, comp / 2 + 0.75, clamp01(s * 3))] : [c.x, P, c.z];
        return (
          <group key={i} position={pos} rotation={[caindo ? s * Math.PI / 2 : 0, 0, caindo ? -0.06 * s : 0]}>
            <ColunaCanelada pos={[0, 0, 0]} h={hCol} r={0.48} quebrada={quebrado && q < 1 ? q : 0} />
          </group>
        );
      })}
      {!quebrado && (
        <>
          <TBox pos={[0, P + hCol / 2, -2.5]} tam={[larg - 3.4, hCol, comp - 8]} map={T.muro()} mod={[3, 3]} cor="#efe2c4" />
          <Caixa pos={[0, P + 2.2, comp / 2 - 6.5 + 0.02]} tam={[2.2, 4.4, 0.05]} cor="#2a1d14" sombra={false} />
          <Caixa pos={[0, P + hCol + 0.5, 0]} tam={[larg + 0.4, 1.0, comp]} cor="#efe6d2" />
          <Caixa pos={[0, P + hCol + 0.45, comp / 2 + 0.01]} tam={[larg + 0.4, 0.3, 0.02]} cor="#b8932f" sombra={false} />
          <mesh geometry={telhado} position={[0, P + hCol + 1.0, 0]} castShadow receiveShadow>
            <meshStandardMaterial attach="material-0" color="#ece2c8" />
            <meshStandardMaterial attach="material-1" map={T.telha()} color="#ffffff" />
          </mesh>
        </>
      )}
      {quebrado && <TBox pos={[0, P + 1.2, -2.5]} tam={[larg - 3.4, 2.4, comp - 8]} map={T.muro()} mod={[3, 3]} cor="#d9c9a6" />}
    </group>
  );
};

// pórtico com colunas na frente e lojas no fundo
const Colunata: React.FC<{x: number; z0: number; z1: number; lado: number; h?: number; passo?: number; quebrada?: boolean}> = ({x, z0, z1, lado, h = 5.5, passo = 3.2, quebrada = false}) => {
  const len = z1 - z0, zc = (z0 + z1) / 2;
  const n = Math.floor(len / passo) + 1;
  const r = rnd(Math.round(x * 3 + 7));
  return (
    <group>
      <TBox pos={[x + lado * 2.7, 0.15, zc]} tam={[5.6, 0.3, len + 1]} map={T.travertino()} mod={[4, 4]} />
      {Array.from({length: n}).map((_, i) => {
        const q = quebrada ? (r() > 0.55 ? 0 : 0.25 + r() * 0.55) : 0;
        return <ColunaCanelada key={i} pos={[x, 0.3, z0 + i * passo]} h={h} r={0.34} quebrada={q} />;
      })}
      {!quebrada && (
        <>
          <Caixa pos={[x, h + 0.55, zc]} tam={[0.9, 0.5, len + 0.8]} cor="#efe6d2" />
          <TBox pos={[x + lado * 2.7, h + 1.25, zc]} rot={[0, 0, lado * 0.22]} tam={[6.4, 0.16, len + 1]} map={T.telha()} mod={[1, 1]} />
        </>
      )}
      <TBox pos={[x + lado * 5.4, quebrada ? 1.6 : (h + 1.6) / 2, zc]} tam={[0.45, quebrada ? 3.2 : h + 1.6, len + 1]} map={T.muro()} mod={[3, 3]} cor="#e6d2ae" />
      {Array.from({length: Math.floor(len / 6.4)}).map((_, i) => (
        <Caixa key={'p' + i} pos={[x + lado * 5.15, 1.5, z0 + 3.2 + i * 6.4]} tam={[0.05, 2.6, 1.6]} cor="#2a1d14" sombra={false} />
      ))}
    </group>
  );
};

const Termas: React.FC<{pos: V3; t: number}> = ({pos, t}) => (
  <group position={pos}>
    <TBox pos={[0, 4, 0]} tam={[18, 8, 16]} map={T.muro()} mod={[3, 3]} cor="#ead3a8" />
    <Caixa pos={[0, 1, 8.02]} tam={[18, 2, 0.04]} cor="#8a3b2b" sombra={false} />
    <mesh position={[0, 8, 0]} castShadow>
      <sphereGeometry args={[6, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial map={T.muro()} color="#d9c5a0" />
    </mesh>
    <Cil pos={[0, 14, 0]} r={1.2} h={0.4} cor="#3a2f28" />
    {[-6, -2, 2, 6].map((x) => (
      <group key={x} position={[x, 5, 8.03]}>
        <Caixa tam={[1.4, 2.2, 0.04]} cor="#1f1712" sombra={false} />
        <mesh position={[0, 1.1, 0]}>
          <circleGeometry args={[0.7, 40, 0, Math.PI]} />
          <meshStandardMaterial color="#1f1712" side={2} />
        </mesh>
      </group>
    ))}
    <TBox pos={[-12, 2.5, 0]} tam={[6, 5, 14]} map={T.muro()} mod={[3, 3]} cor="#e0c69a" />
    <TBox pos={[-12, 5.3, 0]} rot={[0, 0, 0.2]} tam={[6.6, 0.15, 14.6]} map={T.telha()} mod={[1, 1]} />
    <Cil pos={[8, 10, -5]} r={0.6} h={4} cor="#8f7f6a" />
    <Vapor pos={[8, 12, -5]} t={t} n={6} esc={6} cor="#c8c0b8" alt={1.4} />
  </group>
);

const Estatua: React.FC<{pos: V3; t: number; rotY?: number}> = ({pos, t, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <TBox pos={[0, 1.1, 0]} tam={[1.4, 2.2, 2.2]} map={T.travertino()} mod={[4, 4]} />
    <Caixa pos={[0, 2.25, 0]} tam={[1.6, 0.1, 2.4]} cor="#efe6d2" />
    <Pessoa pos={[0, 2.3, 0]} acao="aponta" t={0} v={BRONZE} esc={1.25} tunica={false} />
  </group>
);

// fórum de Pompeia: praça de travertino, Templo de Júpiter ao norte, pórticos, termas a oeste, feira e estátuas
const Forum: React.FC<{t: number; povo?: 'normal' | 'olha' | 'foge'; colunatas?: boolean}> = ({t, povo: modo = 'normal', colunatas = true}) => {
  const gente: React.ReactNode[] = [];
  const r = rnd(5);
  for (let i = 0; i < 26; i++) {
    const x = (r() - 0.5) * 24, z = -26 + r() * 60;
    const acao = modo === 'foge' ? 'anda' : modo === 'olha' ? (i % 3 ? 'aponta' : 'parado') : (i % 4 === 0 ? 'anda' : i % 4 === 1 ? 'carrega' : 'parado');
    const rotY = modo === 'olha' ? Math.PI + (r() - 0.5) * 0.6 : modo === 'foge' ? (r() - 0.5) * 0.8 : r() * 6;
    const zz = modo === 'foge' ? z + ((t * 2.2) % 6) : z + (acao === 'anda' ? Math.sin(t + i) * 0.6 : 0);
    gente.push(<Pessoa key={i} pos={[x, 0, zz]} rotY={rotY} acao={acao} t={t + i} v={povo(i)} />);
  }
  return (
    <group>
      <Chao tam={[3000, 3000]} pos={[0, -0.02, 0]} map={T.campo()} mod={60} />
      <Chao tam={[90, 140]} pos={[0, -0.01, -10]} map={T.basalto()} mod={2} />
      <Chao tam={[32, 90]} pos={[0, 0.0, -2]} map={T.travertino()} mod={4} />
      <Templo pos={[0, 0, -56]} />
      {/* arcos de honra ao lado do templo */}
      {[-11, 11].map((x) => (
        <group key={x} position={[x, 0, -41]}>
          <TBox pos={[-1.6, 4, 0]} tam={[1.2, 8, 2]} map={T.muro()} mod={[3, 3]} cor="#e6d2ae" />
          <TBox pos={[1.6, 4, 0]} tam={[1.2, 8, 2]} map={T.muro()} mod={[3, 3]} cor="#e6d2ae" />
          <TBox pos={[0, 8.6, 0]} tam={[4.4, 1.4, 2]} map={T.muro()} mod={[3, 3]} cor="#e6d2ae" />
        </group>
      ))}
      {colunatas && (
        <>
          <Colunata x={-16} z0={-38} z1={40} lado={-1} />
          <Colunata x={16} z0={-38} z1={40} lado={1} />
        </>
      )}
      {[-8, 8].map((x, i) => (<Estatua key={x} pos={[x, 0, -18]} t={t} rotY={i ? -0.3 : 0.3} />))}
      <Estatua pos={[0, 0, 4]} t={t} />
      <Barraca pos={[-9, 0, 14]} rotY={0.2} a="#b4392a" seed={1} />
      <Barraca pos={[-5, 0, 20]} rotY={-0.1} a="#2f6f8f" seed={2} />
      <Barraca pos={[9, 0, 12]} rotY={-0.3} a="#c9a64a" seed={3} />
      <Barraca pos={[4, 0, -6]} rotY={0.4} a="#6f8a45" seed={4} />
      <Barraca pos={[-6, 0, -10]} rotY={-0.2} a="#b4392a" seed={5} />
      <Barraca pos={[10, 0, -2]} rotY={0.1} a="#2f6f8f" seed={6} />
      <Carroca pos={[-3, 0, 2]} rotY={0.7} />
      {[[2, 8], [-8, 0], [6, 24], [-12, 26]].map(([x, z], i) => (<Saco key={'s' + i} pos={[x, 0, z]} esc={1.2} />))}
      {[[-11, 10], [10, 18], [-3, 26]].map(([x, z], i) => (<Anfora key={i} pos={[x, 0, z]} esc={1.2} />))}
      <Termas pos={[-40, 0, -4]} t={t} />
      {/* casario em volta */}
      {[[-30, 28], [32, -10], [34, 22], [-32, -34], [30, -36]].map(([x, z], i) => (
        <Domus key={i} pos={[x, 0, z]} tam={[12, 6 + (i % 2) * 2, 12]} rotY={x < 0 ? Math.PI / 2 : -Math.PI / 2} cor={['#e2cfa6', '#d9b98a', '#efe1c0', '#c99a6a', '#e6d2b0'][i]} seed={i + 40} simples />
      ))}
      <Pinheiro pos={[40, 0, -60]} esc={1.3} />
      <Cipreste pos={[-24, 0, -60]} esc={1.4} />
      <Cipreste pos={[26, 0, -64]} esc={1.2} />
      {gente}
    </group>
  );
};

// cidade inteira vista do alto: quarteirões (insulae), ruas de basalto, fórum, anfiteatro, muralha
const Cidade: React.FC<{t: number}> = ({t}) => {
  const casas = useMemo(() => {
    const out: {pos: V3; tam: V3; cor: string; seed: number}[] = [];
    const r = rnd(17);
    for (let bx = -3; bx <= 3; bx++) for (let bz = -3; bz <= 3; bz++) {
      const cx = bx * 34, cz = bz * 30;
      if (Math.abs(cx) < 30 && cz > -70 && cz < 40) continue; // fórum
      if (bx === 3 && bz === 3) continue; // anfiteatro
      for (const s of [-1, 1]) {
        out.push({pos: [cx + s * 7, 0, cz], tam: [13.4, 4.5 + r() * 3, 23], cor: ['#e2cfa6', '#d9b98a', '#efe1c0', '#c99a6a', '#e6d2b0', '#d4b08a'][Math.floor(r() * 6)], seed: Math.floor(r() * 1000)});
      }
    }
    return out;
  }, []);
  return (
    <group>
      <Chao tam={[4000, 4000]} pos={[0, -0.3, 0]} map={T.mar()} mod={30} />
      <Chao tam={[3000, 3000]} pos={[1240, -0.02, 0]} map={T.campo()} mod={60} />
      <Chao tam={[240, 230]} pos={[0, 0, -5]} map={T.basalto()} mod={3} />
      {casas.map((c, i) => (<Domus key={i} pos={c.pos} tam={c.tam} cor={c.cor} seed={c.seed} simples rotY={i % 2 ? 0 : Math.PI} />))}
      {/* fórum */}
      <Chao tam={[32, 90]} pos={[0, 0.02, -15]} map={T.travertino()} mod={4} />
      <Templo pos={[0, 0, -66]} />
      <Colunata x={-16} z0={-50} z1={28} lado={-1} passo={4} />
      <Colunata x={16} z0={-50} z1={28} lado={1} passo={4} />
      <Termas pos={[-48, 0, 30]} t={t} />
      {/* anfiteatro */}
      <group position={[102, 0, 90]} scale={[1.35, 1, 1]}>
        <mesh position={[0, 4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[22, 24, 8, 32, 1, true]} />
          <meshStandardMaterial map={T.muro()} color="#d9c09a" side={2} />
        </mesh>
        <mesh position={[0, 4.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[13, 22, 32]} />
          <meshStandardMaterial map={T.travertino()} color="#e6d6b4" />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[13, 40]} />
          <meshStandardMaterial map={T.areia()} />
        </mesh>
      </group>
      {/* muralha com torres */}
      {[[0, -122, 240, 0], [0, 112, 240, 0], [-122, -5, 230, 1], [122, -5, 230, 1]].map(([x, z, L, rot], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, rot ? Math.PI / 2 : 0, 0]}>
          <TBox pos={[0, 4, 0]} tam={[L, 8, 3.5]} map={T.muro()} mod={[3, 3]} cor="#bfb39a" />
          {Array.from({length: 7}).map((_, k) => (<TBox key={k} pos={[-L / 2 + 10 + k * ((L - 20) / 6), 6, 0]} tam={[7, 12, 7]} map={T.muro()} mod={[3, 3]} cor="#b5a88e" />))}
        </group>
      ))}
      {Array.from({length: 18}).map((_, i) => {
        const r = rnd(i + 70);
        return r() > 0.5 ? <Pinheiro key={i} pos={[140 + r() * 120, 0, -150 + r() * 300]} esc={2} /> : <Cipreste key={i} pos={[-150 + r() * 300, 0, -140 - r() * 100]} esc={2} />;
      })}
      <Vesuvio pos={VES} R={VES_R} H={VES_H} />
      <Pluma pos={CRATERA} H={60} R={9} g={0.4} t={t} vento={[0.5, 0.2]} brilho={0} />
    </group>
  );
};

// cena de rua (usada em vários planos)
const RuaCena: React.FC<{t: number; tremor?: number; pomes?: number; ze?: 'atravessa' | 'olha' | 'foge' | 'travesseiro' | null; fumaca?: number; povo?: 'normal' | 'foge' | 'travesseiro'}> = ({t, tremor = 0, pomes = 0, ze = 'atravessa', fumaca = 0.4, povo: modo = 'normal'}) => {
  const tr = Math.sin(t * 31) * 0.012 * tremor;
  const y0 = pomes * 0.6;
  const k = (t * 0.45) % 1;
  return (
    <group rotation={[tr * 0.5, 0, tr]}>
      <Chao tam={[3000, 3000]} pos={[0, -0.05, 0]} map={T.campo()} mod={60} />
      <Rua comp={80} t={t} pedras={[6, -16, -36]} pomes={pomes} seed={3} />
      <Chafariz pos={[-2.95, 0.4, -6]} rotY={Math.PI / 2} t={t} />
      <Carroca pos={[0.4, 0, -24]} rotY={0.05} giro={t * 0.5} />
      {[[3.0, 0.4, 3], [-3.1, 0.4, 10], [3.1, 0.4, -10]].map((p, i) => (<Anfora key={i} pos={p as V3} esc={1.1} rot={tremor > 0.3 && i === 0 ? suave(tremor) * 0.6 : 0} />))}
      {/* xícaras no balcão tremendo */}
      {tremor > 0 && [0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[1.4 + i * 0.25 + Math.sin(t * 40 + i) * 0.01 * tremor, 0.06 + Math.abs(Math.sin(t * 23 + i * 2)) * 0.05 * tremor, 7.4]}>
          <dodecahedronGeometry args={[0.06, 0]} />
          <meshStandardMaterial color="#7a736b" />
        </mesh>
      ))}
      {ze === 'atravessa' && <Pessoa pos={[lerp(-1.6, 1.6, k), 0.4, 6]} rotY={Math.PI / 2} acao="anda" t={t} v={ZE} />}
      {ze === 'olha' && <Pessoa pos={[0.6, 0, 16]} rotY={Math.PI + 0.2} acao="parado" t={t} v={ZE} />}
      {ze === 'foge' && <Pessoa pos={[0.4, y0, lerp(-1, 3, (t * 0.35) % 1)]} rotY={0} acao="anda" t={t} v={ZE} />}
      {ze === 'travesseiro' && <Pessoa pos={[0.2, y0, lerp(1.0, 3.2, clamp01(t / 2.2))]} rotY={0.05} acao="anda" t={t} v={ZE} travesseiro />}
      {modo === 'normal' && (
        <>
          <Pessoa pos={[-2.9, 0.4, 4 + Math.sin(t * 0.5) * 0.5]} rotY={Math.PI} acao="anda" t={t + 1} v={povo(1)} />
          <Pessoa pos={[2.9, 0.4, 1]} rotY={-0.5} acao="carrega" t={t + 2} v={povo(2)} />
          <Pessoa pos={[-2.8, 0.4, -4]} rotY={1.2} acao="parado" t={t + 3} v={povo(3)} />
          <Pessoa pos={[0.5, 0, -10 + ((t * 1.2) % 4)]} rotY={0} acao="anda" t={t + 4} v={povo(4)} />
          <Burro pos={[-0.6, 0, -18 + ((t * 0.8) % 3)]} t={t} />
          <Pessoa pos={[2.8, 0.4, -14]} rotY={-1.2} acao="aponta" t={t + 5} v={povo(5)} />
        </>
      )}
      {modo !== 'normal' && [0, 1, 2, 3, 4].map((i) => (
        <Pessoa key={i} pos={[(i % 2 ? 1 : -1) * (0.6 + (i % 3) * 0.5), y0, lerp(-6 - i * 3, -2 - i * 3, (t * 0.4 + i * 0.2) % 1)]} rotY={(i - 2) * 0.1} acao="anda" t={t + i} v={povo(i + 2)} travesseiro={modo === 'travesseiro' && i % 2 === 0} />
      ))}
      <Vesuvio pos={VES} R={VES_R} H={VES_H} />
      {fumaca > 0 && <Pluma pos={CRATERA} H={60} R={9} g={fumaca} t={t} vento={[0.5, 0.2]} brilho={0} />}
    </group>
  );
};

// termopólio: balcão em L revestido de mármore picado, potes (dolia) embutidos, lararium no fundo
const Termopolio: React.FC<{t: number}> = ({t}) => {
  const Y = 0.4;
  const topo = Y + 0.95;
  return (
    <group>
      <Chao tam={[400, 400]} pos={[0, -0.05, 0]} map={T.campo()} mod={60} />
      <group position={[0, 0, 3.7]} rotation={[0, Math.PI / 2, 0]}>
        <Rua comp={50} t={t} pedras={[-6, 12]} ladoA ladoB={false} seed={8} />
      </group>
      {/* a loja */}
      <TBox pos={[0, Y + 1.7, -4.6]} tam={[6.4, 3.4, 0.3]} map={T.fresco()} mod={[4, 3.4]} />
      <TBox pos={[-3.1, Y + 1.7, -2.3]} tam={[0.3, 3.4, 4.6]} map={T.muro()} mod={[3, 3]} cor="#e8d4a8" />
      <TBox pos={[3.1, Y + 1.7, -2.3]} tam={[0.3, 3.4, 4.6]} map={T.muro()} mod={[3, 3]} cor="#e8d4a8" />
      <TBox pos={[0, Y + 4.9, -0.2]} tam={[6.6, 3.0, 0.4]} map={T.muro()} mod={[3, 3]} cor="#efe1c0" />
      <TBox pos={[0, Y + 3.45, -2.3]} tam={[6.4, 0.12, 4.8]} map={T.madeira()} mod={[1, 1]} />
      <mesh position={[0, Y + 4.4, 0.02]}>
        <planeGeometry args={[3.0, 0.7]} />
        <meshBasicMaterial map={T.letreiro('VETVTIVS·PLACIDVS')} transparent depthWrite={false} />
      </mesh>
      <Caixa pos={[0, Y + 3.38, 0.0]} tam={[6.4, 0.2, 0.3]} cor="#6b4a2e" />
      <TBox pos={[0, Y + 6.5, -2.3]} rot={[0.25, 0, 0]} tam={[7, 0.14, 5.4]} map={T.telha()} mod={[1, 1]} />
      {/* balcão em L */}
      <TBox pos={[-0.8, Y + 0.475, -0.45]} tam={[3.6, 0.95, 0.62]} map={T.mosaico()} mod={[0.8, 0.8]} />
      <TBox pos={[1.3, Y + 0.475, -1.45]} tam={[0.62, 0.95, 2.0]} map={T.mosaico()} mod={[0.8, 0.8]} />
      <Caixa pos={[-0.8, topo + 0.03, -0.45]} tam={[3.7, 0.06, 0.7]} cor="#ebe5d8" />
      <Caixa pos={[1.3, topo + 0.03, -1.45]} tam={[0.7, 0.06, 2.1]} cor="#ebe5d8" />
      {/* degraus de prateleira no balcão */}
      <Caixa pos={[1.42, topo + 0.15, -1.6]} tam={[0.36, 0.2, 1.6]} cor="#e0d6c2" />
      {[0, 1, 2, 3].map((i) => (<Cil key={i} pos={[1.42, topo + 0.33, -2.2 + i * 0.38]} r={0.07} r2={0.09} h={0.18} cor={['#b0703a', '#3f6f8f', '#c9a64a', '#8f2a24'][i]} seg={8} />))}
      {/* dolia: potes embutidos com comida */}
      {[-2.15, -1.25, -0.35, 0.5].map((x, i) => (
        <group key={i} position={[x, topo + 0.065, -0.45]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.045, 10, 28]} />
            <meshStandardMaterial color="#9a5a34" />
          </mesh>
          <Cil pos={[0, -0.03, 0]} r={0.18} h={0.02} cor={['#7a4a22', '#4f6a2a', '#5a1a24', '#d07a2a'][i]} seg={14} />
          {i === 0 && [0, 1, 2, 3, 4, 5].map((k) => (<mesh key={k} position={[Math.cos(k) * 0.08, -0.005, Math.sin(k * 1.3) * 0.08]}><sphereGeometry args={[0.025, 20, 14]} /><meshStandardMaterial color="#b88a4a" /></mesh>))}
          {i === 1 && [0, 1, 2, 3, 4, 5, 6].map((k) => (<mesh key={k} position={[Math.cos(k * 0.9) * 0.1, 0.0, Math.sin(k * 1.4) * 0.09]}><sphereGeometry args={[0.03, 20, 14]} /><meshStandardMaterial color="#2f4a1a" /></mesh>))}
          {i === 3 && <Cil pos={[0.05, 0.03, 0.02]} rot={[0.2, 0, 0.1]} r={0.2} h={0.03} cor="#7a5534" seg={12} />}
          {(i === 0 || i === 2) && <Vapor pos={[0, 0.02, 0]} t={t + i} n={4} esc={1.0} alt={0.3} />}
        </group>
      ))}
      <PaoRomano pos={[0.95, topo + 0.08, -0.4]} />
      <PaoRomano pos={[1.2, topo + 0.08, -0.6]} />
      {/* ânforas encostadas e o fogareiro */}
      {[-2.6, -2.25, -1.9, -2.6, -2.25].map((x, i) => (<Anfora key={i} pos={[x, Y, -3.9 + (i > 2 ? 0.5 : 0)]} esc={1.15} rot={0.12} />))}
      <TBox pos={[2.4, Y + 0.45, -3.8]} tam={[1.2, 0.9, 1.0]} map={T.muro()} mod={[3, 3]} cor="#b86a4a" />
      <Cil pos={[2.4, Y + 1.0, -3.8]} r={0.22} h={0.2} cor="#3a3a3a" seg={10} />
      <Vapor pos={[2.4, Y + 1.1, -3.8]} t={t} n={5} esc={1.6} />
      {/* lararium (altar dos deuses da casa) */}
      <group position={[0, Y + 1.5, -4.42]}>
        <Caixa pos={[0, 0, 0.1]} tam={[1.2, 0.08, 0.3]} cor="#efe6d2" />
        {[-0.45, 0.45].map((x) => (<Cil key={x} pos={[x, 0.4, 0.1]} r={0.05} h={0.8} cor="#efe6d2" seg={8} />))}
        <mesh position={[0, 0.95, 0.1]} rotation={[Math.PI / 2, 0, 0]} scale={[1.6, 1, 0.5]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 3]} />
          <meshStandardMaterial color="#efe6d2" />
        </mesh>
        <Lucerna pos={[0.2, 0.08, 0.15]} t={t} luz={2} />
      </group>
      {/* linguiças e alho pendurados */}
      {[-1.5, -0.6, 0.3].map((x, i) => (
        <group key={i} position={[x, Y + 3.3, -1.2]}>
          {[0, 1, 2].map((k) => (<mesh key={k} position={[0, -0.18 - k * 0.2, 0]} rotation={[0, 0, Math.sin(t * 2 + i + k) * 0.05]}><capsuleGeometry args={[0.04, 0.14, 5, 16]} /><meshStandardMaterial color={i === 1 ? '#efe8d8' : '#7a2a1a'} /></mesh>))}
        </group>
      ))}
      <Lucerna pos={[-0.5, Y + 2.9, -0.8]} t={t} luz={3} />
      {/* vizinhos */}
      <Domus pos={[-8.2, Y, -5]} tam={[10, 6.5, 10]} cor="#d9b98a" seed={51} lojas={1} letreiro="AED·O·V·F" />
      <Domus pos={[8.2, Y, -5]} tam={[10, 5.5, 10]} cor="#efe1c0" seed={52} lojas={1} sacada faixa="#2f4f3f" />
      {/* gente */}
      <Pessoa pos={[-1.6, Y, -1.8]} rotY={0.2} acao="martela" ferramenta="colher" t={t} v={{...povo(6), camisa: '#efe8d8'}} />
      <Pessoa pos={[-0.3, Y, 0.75]} rotY={Math.PI + 0.35} acao="aponta" t={t + 1} v={ZE} />
      <Pessoa pos={[2.2, Y, 0.9]} rotY={Math.PI + 0.5} acao="parado" t={t + 2} v={povo(2)} />
      <Pessoa pos={[lerp(-6, 6, (t * 0.12) % 1), 0, 3.4]} rotY={Math.PI / 2} acao="anda" t={t + 3} v={povo(4)} />
      <Pessoa pos={[lerp(5, -5, (t * 0.1) % 1), 0, 5.0]} rotY={-Math.PI / 2} acao="carrega" t={t + 4} v={povo(7)} />
    </group>
  );
};

// padaria (pistrinum): moinhos de pedra de lava girados por burro, forno de cúpula, balcão
const Moinho: React.FC<{pos: V3; t: number; vel?: number}> = ({pos, t, vel = 0.8}) => (
  <group position={pos}>
    <TBox pos={[0, 0.2, 0]} tam={[1.8, 0.4, 1.8]} map={T.basalto()} mod={[1, 1]} cor="#c9c0b4" />
    <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.7, 0.08, 10, 28]} />
      <meshStandardMaterial color="#8a8078" />
    </mesh>
    <Cil pos={[0, 0.9, 0]} r={0.12} r2={0.62} h={1.0} cor="#5a5450" seg={12} />
    <group position={[0, 0, 0]} rotation={[0, t * vel, 0]}>
      <Cil pos={[0, 1.05, 0]} r={0.3} r2={0.64} h={0.6} cor="#4a4644" seg={12} />
      <Cil pos={[0, 1.65, 0]} r={0.64} r2={0.3} h={0.6} cor="#4f4b48" seg={12} />
      <Caixa pos={[0, 1.35, 0]} tam={[1.9, 0.2, 0.24]} cor="#6b4a2e" />
      <Barra a={[0.95, 1.35, 0]} b={[1.9, 1.05, 0]} r={0.05} cor="#6b4a2e" />
      <Barra a={[-0.95, 1.35, 0]} b={[-1.4, 1.2, 0]} r={0.05} cor="#6b4a2e" />
      <PomesMonte centro={[0, 1.93, 0]} area={[0.5, 0.5]} n={14} alt={0.05} seed={3} tam={0.04} />
    </group>
  </group>
);
const Padaria: React.FC<{t: number}> = ({t}) => {
  const m1: V3 = [-4.5, 0, -1.6];
  const a = t * 0.8;
  return (
    <group>
      <Chao tam={[400, 400]} pos={[0, -0.03, 0]} map={T.calcada()} mod={1} />
      <Chao tam={[15, 13]} pos={[0, 0, -0.5]} map={T.basalto()} mod={2} />
      <TBox pos={[0, 2.6, -6.6]} tam={[15, 5.2, 0.4]} map={T.muro()} mod={[3, 3]} cor="#e0c9a0" />
      <TBox pos={[-7.4, 2.6, -1]} tam={[0.4, 5.2, 11.6]} map={T.muro()} mod={[3, 3]} cor="#d9c09a" />
      <TBox pos={[7.4, 1.6, -3.2]} tam={[0.4, 3.2, 7]} map={T.muro()} mod={[3, 3]} cor="#d9c09a" />
      {[-5, -1.7, 1.6, 4.9].map((x) => (<TBox key={x} pos={[x, 5.3, -1]} tam={[0.3, 0.3, 11.6]} map={T.madeira()} mod={[1, 1]} />))}
      <TBox pos={[0, 5.6, -5]} rot={[0.3, 0, 0]} tam={[15.6, 0.14, 3.6]} map={T.telha()} mod={[1, 1]} />
      {/* moinhos */}
      <Moinho pos={m1} t={t} />
      <Moinho pos={[-1.2, 0, -3.4]} t={t + 2} vel={0.6} />
      <Moinho pos={[-4.8, 0, -5.0]} t={t + 4} vel={0.5} />
      <Burro pos={[m1[0] + Math.cos(a) * 1.95, 0, m1[2] - Math.sin(a) * 1.95]} rotY={a + Math.PI} t={t} />
      <Pessoa pos={[-1.2 + Math.cos(t * 0.6 + 2) * 1.5, 0, -3.4 - Math.sin(t * 0.6 + 2) * 1.5]} rotY={t * 0.6 + 2 + Math.PI} acao="carrega" t={t} v={povo(3)} />
      {[[-6.6, -4.2], [-6.5, -3.4], [-6.2, -2.6]].map(([x, z], i) => (<Saco key={i} pos={[x, 0, z]} esc={1.1} />))}
      {/* forno de cúpula */}
      <group position={[4.6, 0, -4.6]}>
        <TBox pos={[0, 0.7, 0]} tam={[3.6, 1.4, 3.0]} map={T.muro()} mod={[3, 3]} cor="#b86a4a" />
        <mesh position={[0, 1.4, -0.1]} scale={[1, 0.8, 1]} castShadow>
          <sphereGeometry args={[1.45, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial map={T.muro()} color="#b86a4a" />
        </mesh>
        <TBox pos={[0, 1.6, 1.4]} tam={[3.6, 3.2, 0.4]} map={T.muro()} mod={[3, 3]} cor="#c0745a" />
        <Caixa pos={[0, 1.75, 1.62]} tam={[0.95, 0.75, 0.05]} cor="#1a0e08" sombra={false} />
        <mesh position={[0, 2.12, 1.62]}>
          <circleGeometry args={[0.475, 40, 0, Math.PI]} />
          <meshStandardMaterial color="#1a0e08" />
        </mesh>
        <mesh position={[0, 1.6, 1.4]} scale={[1, 1 + Math.sin(t * 12) * 0.12, 1]}>
          <coneGeometry args={[0.28, 0.45, 24]} />
          <meshStandardMaterial color="#ffb040" emissive="#ff6a00" emissiveIntensity={2} />
        </mesh>
        <pointLight position={[0, 1.8, 2.2]} color="#ff8a3a" intensity={6} distance={7} decay={1.3} />
        <Cil pos={[1.2, 3.6, 0.6]} r={0.3} h={1.6} cor="#8f6a52" />
        <Vapor pos={[1.2, 4.4, 0.6]} t={t} n={5} esc={3} cor="#bdb4a8" alt={1.2} />
        <Barra a={[-1.6, 0, 1.9]} b={[-1.2, 2.4, 1.7]} r={0.03} cor="#6b4a2e" />
        <Caixa pos={[-1.62, 0.25, 1.92]} rot={[0, 0, 0.17]} tam={[0.36, 0.5, 0.04]} cor="#7a5534" />
        {[0, 1, 2, 3, 4].map((i) => (<Cil key={i} pos={[-2.4, 0.12 + Math.floor(i / 3) * 0.22, 0.6 + (i % 3) * 0.22]} rot={[0, 0, Math.PI / 2]} r={0.1} h={1.0} cor="#6b4a2e" seg={6} />))}
      </group>
      {/* prateleiras de pão */}
      {[1.2, 2.0].map((y) => (
        <group key={y}>
          <TBox pos={[0.6, y, -6.25]} tam={[4, 0.06, 0.4]} map={T.madeira()} mod={[1, 1]} />
          {Array.from({length: 9}).map((_, i) => (<PaoRomano key={i} pos={[-1.0 + i * 0.4, y + 0.06, -6.2]} />))}
        </group>
      ))}
      {/* mesa de sovar */}
      <TBox pos={[1.4, 0.8, -1.4]} tam={[2.0, 0.08, 0.9]} map={T.madeira()} mod={[1, 1]} />
      {[[-0.9, -0.35], [0.9, -0.35], [-0.9, 0.35], [0.9, 0.35]].map(([x, z], i) => (<Caixa key={i} pos={[1.4 + x, 0.4, -1.4 + z]} tam={[0.08, 0.8, 0.08]} cor="#6b4a2e" />))}
      {[0, 1, 2].map((i) => (<mesh key={i} position={[0.8 + i * 0.55, 0.9, -1.4]} scale={[1, 0.5, 1]}><sphereGeometry args={[0.16, 20, 14]} /><meshStandardMaterial color="#f0e2c4" /></mesh>))}
      {/* balcão de pedra na rua */}
      <TBox pos={[3.6, 0.5, 2.6]} tam={[3.4, 1.0, 0.8]} map={T.travertino()} mod={[4, 4]} />
      <Caixa pos={[3.6, 1.03, 2.6]} tam={[3.5, 0.06, 0.9]} cor="#ebe5d8" />
      {Array.from({length: 7}).map((_, i) => (<PaoRomano key={i} pos={[2.3 + i * 0.42, 1.1, 2.55 + (i % 2) * 0.12]} />))}
      <Pessoa pos={[3.2, 0, 1.7]} rotY={0} acao="aponta" t={t} v={{...povo(0), camisa: '#efe8d8'}} />
      <Pessoa pos={[2.9, 0, 3.6]} rotY={Math.PI + 0.25} acao="parado" t={t + 1} v={ZE} />
      <Pessoa pos={[5.4, 0, 4.0]} rotY={Math.PI - 0.6} acao="parado" t={t + 2} v={povo(5)} />
      <Domus pos={[13, 0, -2]} tam={[11, 6, 11]} rotY={-Math.PI / 2} cor="#efe1c0" seed={61} />
      <Rotulo texto="MOINHO" ancora={[m1[0], 2.0, m1[2]]} sobe={1.2} fundo="#6f6a66" cor="#ffffff" vis={clamp01(t * 3)} />
      <Rotulo texto="FORNO" ancora={[4.6, 2.6, -4.2]} sobe={1.0} fundo="#b86a4a" cor="#ffffff" vis={clamp01(t * 3 - 1.5)} />
    </group>
  );
};

// terremoto de 62 d.C. (lembrança): templo com coluna caindo, parede rachando, poeira
const Terremoto: React.FC<{t: number; p: number}> = ({t, p}) => {
  const k = suave(clamp01((p - 0.15) / 0.6));
  const ang = k * 1.8;
  const forte = p > 0.1 && p < 0.92 ? 1 : 0.3;
  const sh = Math.sin(t * 34) * 0.01 * forte;
  const r = rnd(9);
  return (
    <group rotation={[sh, 0, sh * 0.7]}>
      <Chao tam={[1500, 1500]} pos={[0, -0.02, 0]} map={T.campo()} mod={60} />
      <Chao tam={[60, 50]} pos={[0, 0, 0]} map={T.travertino()} mod={4} />
      <Templo pos={[0, 0, -10]} larg={10} comp={16} hCol={6} n={4} cai={ang} />
      <Domus pos={[-14, 0, -4]} tam={[10, 6, 12]} rotY={Math.PI / 2} cor="#e2cfa6" seed={71} />
      <Domus pos={[14, 0, -6]} tam={[10, 5, 12]} rotY={-Math.PI / 2} cor="#d9b98a" seed={72} />
      {/* rachaduras no chão e na parede */}
      {Array.from({length: 7}).map((_, i) => (
        <Caixa key={i} pos={[-2 + i * 1.1, 0.01, 4 + Math.sin(i * 1.7) * 0.6]} rot={[0, Math.sin(i * 2.3) * 0.7, 0]} tam={[1.2 * k + 0.01, 0.02, 0.08]} cor="#1d1814" sombra={false} />
      ))}
      {Array.from({length: 5}).map((_, i) => (
        <Caixa key={'w' + i} pos={[-8.9, 1 + i * 0.8, -4 + Math.sin(i * 2.1) * 0.5]} rot={[Math.sin(i) * 0.8, 0, 0]} tam={[0.05, 0.9 * k + 0.01, 0.07]} cor="#1d1814" sombra={false} />
      ))}
      {/* entulho e poeira */}
      {Array.from({length: 18}).map((_, i) => (k > 0.5 ? <Caixa key={'d' + i} pos={[2.6 + r() * 3.4, 0.15, -1.6 + r() * 7]} rot={[r(), r() * 3, r()]} tam={[0.3 + r() * 0.3, 0.25, 0.3]} cor="#e3d7bd" /> : null))}
      {k > 0.7 && [0, 1, 2, 3, 4].map((i) => (
        <mesh key={'p' + i} position={[5.4 + Math.sin(i * 2) * 0.8, 0.8 + (k - 0.7) * 3, -1 + i * 1.4]} scale={0.5 + (k - 0.7) * 2.5}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color="#c8b490" transparent opacity={0.3 * clamp01((1 - k) * 5)} depthWrite={false} roughness={1} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (<Pessoa key={i} pos={[-4 + i * 2.5, 0, 6 + ((t * 1.6 + i) % 4)]} rotY={(i - 1) * 0.3} acao="anda" t={t + i} v={povo(i + 1)} />))}
      <Pessoa pos={[-6, 0, 2]} rotY={0.8} acao="aponta" t={t} v={povo(6)} />
      <Vesuvio pos={VES} R={VES_R} H={VES_H} />
    </group>
  );
};

// telhados recebendo pedra-pomes (um desaba)
const Telhados: React.FC<{t: number; p: number}> = ({t, p}) => {
  const casas: {pos: V3; tam: V3; rotY: number; cor: string}[] = [
    {pos: [-9, 0, -8], tam: [11, 5.5, 12], rotY: Math.PI / 2, cor: '#e2cfa6'},
    {pos: [9, 0, -10], tam: [12, 6.5, 12], rotY: -Math.PI / 2, cor: '#d9b98a'},
    {pos: [-9, 0, 6], tam: [12, 5, 12], rotY: Math.PI / 2, cor: '#efe1c0'},
    {pos: [9, 0, 5], tam: [11, 6, 12], rotY: -Math.PI / 2, cor: '#c99a6a'},
    {pos: [-9, 0, 20], tam: [11, 6, 12], rotY: Math.PI / 2, cor: '#e6d2b0'},
    {pos: [9, 0, 19], tam: [12, 5.5, 12], rotY: -Math.PI / 2, cor: '#d4b08a'},
  ];
  const desaba = suave(clamp01((p - 0.55) / 0.35));
  return (
    <group>
      <Chao tam={[1500, 1500]} pos={[0, -0.02, 0]} map={T.cinza()} mod={3} />
      <Chao tam={[4.6, 80]} pos={[0, 0.25, 0]} map={T.cinza()} mod={2} />
      {casas.map((c, i) => (
        <group key={i}>
          <Domus pos={c.pos} tam={c.tam} rotY={c.rotY} cor={c.cor} seed={80 + i} lojas={1} telhado={i !== 3 || desaba < 0.5} teto={i === 3 ? 1 - desaba * 0.5 : 1} />
          {!(i === 3 && desaba >= 0.5) && <PomesMonte centro={[c.pos[0], c.tam[1] + 0.05, c.pos[2]]} area={[c.tam[2] * 0.95, c.tam[0] * 0.95]} n={Math.round(60 + 340 * p)} alt={0.25 + 0.5 * p} seed={i + 3} tam={0.09} />}
        </group>
      ))}
      {desaba >= 0.5 && (
        <>
          {[0, 1, 2].map((i) => (<TBox key={i} pos={[9 + (i - 1) * 3, 1.2 + i * 0.6, 5]} rot={[0.5 - i * 0.3, 0, 0.6 - i * 0.4]} tam={[3.6, 0.14, 4]} map={T.telha()} mod={[1, 1]} />))}
          {[0, 1, 2, 3].map((i) => (
            <mesh key={'pp' + i} position={[9 + Math.sin(i) * 3, 6 + desaba * 2 + i * 0.6, 5 + Math.cos(i) * 3]} scale={2 + desaba * 2}>
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#b0a696" transparent opacity={0.4} depthWrite={false} />
            </mesh>
          ))}
        </>
      )}
      <PomesChuva t={t} centro={[0, 0, 4]} raio={18} raioZ={22} alt={26} n={520} tam={0.08} vel={10} seed={2} />
      {[0, 1, 2].map((i) => (<Pessoa key={i} pos={[(i - 1) * 0.9, 0.25, -6 + ((t * 1.8 + i * 3) % 18)]} rotY={0} acao="anda" t={t + i} v={povo(i + 4)} travesseiro />))}
    </group>
  );
};

// porto de Pompeia: gente fugindo para os barcos
const Porto: React.FC<{t: number}> = ({t}) => (
  <group>
    <Chao tam={[3000, 3000]} pos={[0, -0.25, 0]} map={T.mar()} mod={20} />
    <Chao tam={[3000, 1400]} pos={[0, 0.0, -718]} map={T.campo()} mod={60} cor="#9a9286" />
    <TBox pos={[0, 0.3, -6]} tam={[80, 1.2, 20]} map={T.travertino()} mod={[4, 4]} cor="#c9bea8" />
    <Chao tam={[80, 20]} pos={[0, 0.92, -6]} map={T.cinza()} mod={2} />
    <TBox pos={[6, 0.6, 10]} tam={[3.2, 0.2, 14]} map={T.madeira()} mod={[1, 1]} />
    {Array.from({length: 6}).map((_, i) => [-1, 1].map((s) => (<Cil key={i + ':' + s} pos={[6 + s * 1.5, 0.1, 4.5 + i * 2.3]} r={0.14} h={1.2} cor="#5a3a22" />)))}
    <Barco pos={[-6, 0, 13]} rotY={0.15} t={t} vela="#8f2a24" />
    <Barco pos={[16, 0, 16]} rotY={-0.25} t={t + 1} vela="#2f6f8f" />
    <Barco pos={[30, 0, 30]} rotY={-0.5} t={t + 2} />
    {/* muralha e porta da cidade no fundo */}
    <TBox pos={[0, 5, -30]} tam={[90, 10, 4]} map={T.muro()} mod={[3, 3]} cor="#bfb39a" />
    {[-30, -10, 14, 34].map((x) => (<TBox key={x} pos={[x, 7, -30]} tam={[7, 14, 7]} map={T.muro()} mod={[3, 3]} cor="#b5a88e" />))}
    <Caixa pos={[2, 2.5, -27.9]} tam={[4, 5, 0.1]} cor="#1a120c" sombra={false} />
    {Array.from({length: 30}).map((_, i) => (<Caixa key={'m' + i} pos={[-44 + i * 3, 10.4, -28.4]} tam={[1.4, 0.8, 0.6]} cor="#a89c84" />))}
    {[-22, 24].map((x) => (<Caixa key={'j' + x} pos={[x, 6, -27.95]} tam={[1.2, 1.6, 0.05]} cor="#1a120c" sombra={false} />))}
    <mesh position={[2, 5, -27.9]}><circleGeometry args={[2, 40, 0, Math.PI]} /><meshStandardMaterial color="#1a120c" /></mesh>
    {[[-20, -42], [10, -44], [28, -40]].map(([x, z], i) => (<Domus key={i} pos={[x, 0, z]} tam={[12, 7, 10]} cor={['#e2cfa6', '#d9b98a', '#efe1c0'][i]} seed={90 + i} simples />))}
    {[[-14, -4], [-12, -6], [20, -2], [22, -5]].map(([x, z], i) => (<Anfora key={i} pos={[x, 0.9, z]} esc={1.2} />))}
    <Carroca pos={[-8, 0.9, -8]} rotY={0.6} />
    {Array.from({length: 9}).map((_, i) => {
      const k = (t * 0.35 + i * 0.13) % 1;
      const x = lerp(-16 + i * 3, 4 + (i % 3) * 2, k);
      const z = lerp(-14 + (i % 2) * 2, 2, k);
      return <Pessoa key={i} pos={[x, 0.9, z]} rotY={Math.atan2(20 - i * 3, 16)} acao={i % 3 === 0 ? 'carrega' : 'anda'} t={t + i} v={povo(i)} travesseiro={i % 4 === 1} />;
    })}
    {[0, 1, 2].map((i) => (<Pessoa key={'b' + i} pos={[6 + (i - 1) * 0.6, 0.7, 6 + i * 2.4 + ((t * 1.2) % 2)]} rotY={0} acao="anda" t={t + i} v={povo(i + 9)} />))}
    <Vesuvio pos={[-120, 0, -760]} R={VES_R} H={VES_H} />
    <Pluma pos={[-120, VES_H - 4, -760]} H={900} R={50} g={1} t={t} vento={[0.5, 0.6]} />
    <CinzaCaindo t={t} centro={[4, 0, 4]} raio={18} alt={16} />
  </group>
);

// átrio de uma casa: afrescos, implúvio recebendo pomes pela abertura do telhado, lararium, mosaico "cave canem"
const Atrio: React.FC<{t: number; p: number}> = ({t, p}) => {
  const W = 12, D = 12, H = 5.5;
  const ow = 3.4, od = 2.8, zc = -1;
  const Df = (D / 2 - od / 2), Ds = (W / 2 - ow / 2);
  return (
    <group>
      <Chao tam={[W, D]} pos={[0, 0, zc]} map={T.piso()} mod={2} />
      <Chao tam={[2, 2]} pos={[0, 0.01, 4.0]} map={T.caveCanem()} mod={2} />
      <TBox pos={[0, H / 2, zc - D / 2]} tam={[W, H, 0.3]} map={T.fresco()} mod={[4, H]} />
      <TBox pos={[-W / 2, H / 2, zc]} rot={[0, Math.PI / 2, 0]} tam={[D, H, 0.3]} map={T.fresco()} mod={[4, H]} />
      <TBox pos={[W / 2, H / 2, zc]} rot={[0, -Math.PI / 2, 0]} tam={[D, H, 0.3]} map={T.fresco()} mod={[4, H]} />
      {/* teto: quatro águas caindo para a abertura (compluvium) */}
      <TBox pos={[0, H + 0.3, zc + od / 2 + Df / 2]} rot={[-0.2, 0, 0]} tam={[W, 0.15, Df]} map={T.madeira()} mod={[1, 1]} />
      <TBox pos={[0, H + 0.3, zc - od / 2 - Df / 2]} rot={[0.2, 0, 0]} tam={[W, 0.15, Df]} map={T.madeira()} mod={[1, 1]} />
      <TBox pos={[ow / 2 + Ds / 2, H + 0.3, zc]} rot={[0, 0, 0.2]} tam={[Ds, 0.15, od]} map={T.madeira()} mod={[1, 1]} />
      <TBox pos={[-ow / 2 - Ds / 2, H + 0.3, zc]} rot={[0, 0, -0.2]} tam={[Ds, 0.15, od]} map={T.madeira()} mod={[1, 1]} />
      {/* implúvio */}
      {[[0, od / 2 + 0.1, ow + 0.4, 0.2], [0, -od / 2 - 0.1, ow + 0.4, 0.2]].map(([x, z, w, d], i) => (<Caixa key={i} pos={[x, 0.08, zc + z]} tam={[w, 0.16, d]} cor="#ece6da" />))}
      {[-1, 1].map((s) => (<Caixa key={s} pos={[s * (ow / 2 + 0.1), 0.08, zc]} tam={[0.2, 0.16, od]} cor="#ece6da" />))}
      <Caixa pos={[0, 0.05, zc]} tam={[ow, 0.04, od]} cor="#3f7f9f" sombra={false} />
      <PomesMonte centro={[0, 0.06, zc]} area={[ow * 0.95, od * 0.95]} n={Math.round(80 + 420 * p)} alt={0.05 + 0.45 * p} seed={4} tam={0.07} />
      <PomesChuva t={t} centro={[0, 0.1, zc]} raio={ow / 2 - 0.2} raioZ={od / 2 - 0.2} alt={H + 1} n={140} tam={0.07} vel={7} seed={5} />
      {/* tablinum com cortina e lararium */}
      <Caixa pos={[-2.2, 1.9, zc - D / 2 + 0.17]} tam={[3, 3.8, 0.04]} cor="#1a120c" sombra={false} />
      <TBox pos={[-3.2, 1.9, zc - D / 2 + 0.25]} tam={[1.1, 3.8, 0.06]} map={T.listras('#8f2a24', '#a8382c')} mod={[1, 1]} />
      <group position={[3.4, 1.3, zc - D / 2 + 0.3]}>
        <Caixa pos={[0, 0, 0.15]} tam={[1.4, 0.12, 0.45]} cor="#efe6d2" />
        {[-0.55, 0.55].map((x) => (<Cil key={x} pos={[x, 0.5, 0.2]} r={0.06} h={1.0} cor="#efe6d2" seg={8} />))}
        <Caixa pos={[0, 1.05, 0.18]} tam={[1.5, 0.12, 0.5]} cor="#efe6d2" />
        <mesh position={[0, 1.3, 0.18]} rotation={[Math.PI / 2, 0, 0]} scale={[1.8, 1, 0.5]}>
          <cylinderGeometry args={[0.45, 0.45, 0.4, 3]} />
          <meshStandardMaterial color="#efe6d2" />
        </mesh>
        <Lucerna pos={[0, 0.1, 0.25]} t={t} luz={2} />
      </group>
      {/* mesa de mármore (cartibulum), cofre e candelabros */}
      <Caixa pos={[0, 0.82, zc + od / 2 + 1.3]} tam={[1.6, 0.1, 0.7]} cor="#ece6da" />
      {[-0.6, 0.6].map((x) => (<Caixa key={x} pos={[x, 0.4, zc + od / 2 + 1.3]} tam={[0.12, 0.8, 0.55]} cor="#d8d0bd" />))}
      <Anfora pos={[0.4, 0.87, zc + od / 2 + 1.3]} esc={0.4} />
      <group position={[-4.8, 0, zc - 4.2]}>
        <Caixa pos={[0, 0.45, 0]} tam={[1.2, 0.9, 0.8]} cor="#6b4a2e" />
        {[-0.4, 0, 0.4].map((x) => [0.2, 0.6].map((y) => (<mesh key={x + ':' + y} position={[x, y, 0.41]}><sphereGeometry args={[0.04, 20, 14]} /><meshStandardMaterial color="#c9a24a" metalness={0.6} roughness={0.4} /></mesh>)))}
      </group>
      {([[-4.6, 1.8], [4.6, -3.2]] as [number, number][]).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Cil pos={[0, 0.8, 0]} r={0.04} h={1.6} cor="#8a6a3a" seg={6} />
          <Cil pos={[0, 0.05, 0]} r={0.22} r2={0.25} h={0.1} cor="#8a6a3a" seg={6} />
          <Lucerna pos={[0, 1.65, 0]} t={t + i} luz={5} />
        </group>
      ))}
      {/* quem ficou: a família trancada em casa, encostada no larário, sob o telhado (fora da abertura por onde cai a pomes) */}
      <Pessoa pos={[0.9, 0, -4.6]} rotY={-0.6} acao="parado" t={t} v={ZE} travesseiro />
      <Pessoa pos={[2.1, 0, -5.4]} rotY={-0.45} acao="parado" t={t + 2} v={povo(3)} travesseiro />
      <Pessoa pos={[1.55, 0, -4.85]} rotY={-0.6} acao="parado" t={t + 3} v={povo(8)} esc={0.55} />
      <Pessoa pos={[2.9, 0, -5.0]} rotY={-0.9} acao="parado" t={t + 4} v={povo(5)} esc={0.6} />
      <Pessoa pos={[-2.6, 0, -4.6]} rotY={0.6} acao="aponta" t={t + 1} v={povo(6)} />
      <Luzinha i={0.35} />
    </group>
  );
};

// muralha da cidade à noite, de frente para o Vesúvio
const Muralha: React.FC<{t: number; p: number; gente?: boolean}> = ({t, p, gente = true}) => (
  <group>
    <Chao tam={[3000, 3000]} pos={[0, -0.02, 0]} map={T.campo()} mod={60} cor="#7a7468" />
    <Chao tam={[3000, 1500]} pos={[0, 0.0, -760]} map={T.cinza()} mod={4} cor="#9a948a" />
    <TBox pos={[0, 4.5, 0]} tam={[120, 9, 4]} map={T.muro()} mod={[3, 3]} cor="#b5a88e" />
    {Array.from({length: 24}).map((_, i) => (<Caixa key={i} pos={[-58 + i * 5, 9.4, -1.6]} tam={[2.2, 0.8, 0.6]} cor="#a89c84" />))}
    {[-40, -12, 18, 46].map((x) => (<TBox key={x} pos={[x, 7, 0]} tam={[7, 14, 7]} map={T.muro()} mod={[3, 3]} cor="#a89c84" />))}
    <Caixa pos={[2, 2.6, -2.05]} tam={[4, 5.2, 0.1]} cor="#140c08" sombra={false} />
    {/* Pompeia do lado de dentro da muralha: telhados, ruas e gente fugindo para longe do fluxo (dá a escala) */}
    {([
      [-8, 9, 10, 5, 11, 0, '#e2cfa6'], [5, 10, 12, 6, 12, 0, '#d9b98a'], [19, 9, 10, 5, 11, 0, '#cfa77a'],
      [-6, 25, 11, 6, 12, 0, '#d9b98a'], [8, 26, 10, 5, 12, 0, '#e2cfa6'], [22, 25, 12, 7, 11, 0, '#c99a6a'],
      [-14, 40, 10, 5, 12, 0, '#cfa77a'], [3, 41, 12, 6, 12, 0, '#e8d6b0'], [17, 40, 10, 5, 11, 0, '#d9b98a'],
    ] as [number, number, number, number, number, number, string][]).map(([x, z, w, h, d, r, cor], i) => (
      <Domus key={i} pos={[x, 0, z]} tam={[w, h, d]} rotY={r} cor={cor} seed={300 + i} sacada={i % 3 === 1} />
    ))}
    <Chao tam={[120, 4.5]} pos={[0, 0.03, 17.2]} map={T.cinza()} mod={4} cor="#8a8478" />
    <Chao tam={[120, 4.5]} pos={[0, 0.03, 33.2]} map={T.cinza()} mod={4} cor="#8a8478" />
    {/* túmulos fora da porta (Via dos Sepulcros) */}
    {[[-6, -12], [8, -16], [-7, -26], [9, -32]].map(([x, z], i) => (
      <group key={i} position={[x, 0, z]}>
        <TBox pos={[0, 0.9, 0]} tam={[3, 1.8, 3]} map={T.travertino()} mod={[4, 4]} />
        {i % 2 ? <Cil pos={[0, 2.6, 0]} r={1.1} h={1.6} cor="#e3d7bd" seg={14} /> : <Caixa pos={[0, 2.5, 0]} tam={[1.6, 1.4, 1.6]} cor="#e3d7bd" />}
      </group>
    ))}
    {gente && (
      <>
        <Pessoa pos={[0.4, 9, 1.0]} rotY={Math.PI} acao="parado" t={t} v={ZE} />
        <Pessoa pos={[2.0, 9, 0.6]} rotY={Math.PI + 0.3} acao="aponta" t={t + 1} v={povo(3)} />
        <Pessoa pos={[-1.2, 9, 1.2]} rotY={Math.PI - 0.2} acao="parado" t={t + 2} v={povo(5)} />
      </>
    )}
    <Vesuvio pos={VES} R={VES_R} H={VES_H} brilho={0.6 + p * 0.6} />
    <Pluma pos={CRATERA} H={900} R={50} g={1} t={t} colapso={p} vento={[0.5, 0.4]} />
    <CinzaCaindo t={t} centro={[-4, 9, 6]} raio={12} alt={10} n={180} />
    <Luzinha i={0.85} cor="#ffb090" />
  </group>
);

// fluxo piroclástico descendo a encosta até a muralha
const Descida: React.FC<{t: number; p: number}> = ({t, p}) => (
  <group>
    <Muralha t={t} p={1} gente={false} />
    <Fluxo frente={lerp(-330, -40, suave(p))} larg={220} alt={22} t={t} linhas={7} />
    {[0, 1, 2, 3, 4, 5].map((i) => (<Pessoa key={i} pos={[-10 + i * 4.5, 0, 16 + ((t * 1.6 + i * 0.7) % 3)]} rotY={0.1} acao="anda" t={t + i} v={povo(i)} esc={1.2} />))}
    {[0, 1, 2].map((i) => (<Pessoa key={'b' + i} pos={[-6 + i * 2, 0, -8 + ((t * 1.5 + i) % 3)]} rotY={0} acao="anda" t={t + i} v={povo(i)} />))}
  </group>
);

const RuaFluxo: React.FC<{t: number; p: number}> = ({t, p}) => (
  <group>
    <RuaCena t={t} pomes={0.9} ze={null} fumaca={0} povo="foge" />
    <Pessoa pos={[0.4, 0.54, lerp(1.2, 2.2, p)]} rotY={0} acao="anda" t={t} v={ZE} />
    <Fluxo frente={lerp(-55, -16, suave(p))} larg={30} alt={8} t={t} y0={0.5} linhas={6} />
    <CinzaCaindo t={t} centro={[0, 0.5, 2]} raio={6} alt={6} />
    <Luzinha i={0.55} cor="#ff9a70" />
  </group>
);

// golfo e barco de Plínio
const Golfo: React.FC<{t: number; children?: React.ReactNode}> = ({t, children}) => (
  <group>
    <Chao tam={[4000, 4000]} pos={[0, 0, 0]} map={T.mar()} mod={20} />
    <Chao tam={[4000, 1200]} pos={[0, 0.3, -1100]} map={T.campo()} mod={60} cor="#8a8478" />
    <Vesuvio pos={[120, 0, -720]} R={VES_R} H={VES_H} brilho={0.3} />
    <Pluma pos={[120, VES_H - 4, -720]} H={900} R={50} g={1} t={t} vento={[0.6, 0.5]} />
    {[[-200, -520], [60, -500], [300, -540]].map(([x, z], i) => (<Domus key={i} pos={[x, 0.3, z]} tam={[16, 8, 14]} cor="#e2cfa6" seed={i + 120} simples />))}
    <PomesMonte centro={[0, 0.02, 0]} area={[60, 40]} n={500} alt={0.02} seed={7} tam={0.12} />
    <CinzaCaindo t={t} centro={[0, 0, 0]} raio={16} alt={14} n={200} />
    {children}
  </group>
);

// praia de Estábia (noite): Plínio deitado na vela estendida na areia
const PLINIO_Y = 0.33;
const Praia: React.FC<{t: number}> = ({t}) => {
  // linha d'água em z = 4 (mar para +Z); o Vesúvio fica do outro lado do golfo, atrás do mar (de Estábia se vê o vulcão por cima da água)
  const r = rnd(41);
  const pedras = Array.from({length: 14}).map(() => [-6 + r() * 12, -3 + r() * 6.5, 0.08 + r() * 0.14, r() * 3] as [number, number, number, number]);
  return (
    <group>
      <Chao tam={[4000, 4000]} pos={[0, -0.05, 0]} map={T.mar()} mod={20} cor="#6a7a86" />
      <Chao tam={[400, 200]} pos={[0, 0.02, -96]} map={T.areia()} mod={3} cor="#a8a090" />
      <Chao tam={[400, 1.6]} pos={[0, 0.025, 3.2]} map={T.areia()} mod={3} cor="#6f6658" />
      {[0, 1, 2].map((i) => (<Caixa key={i} pos={[0, 0.03, 4.3 + i * 1.1 + Math.sin(t * 1.5 + i) * 0.3]} tam={[60, 0.02, 0.22]} cor="#dfe8ea" sombra={false} />))}
      <PomesMonte centro={[0, 0.03, -1]} area={[14, 9]} n={260} alt={0.03} seed={12} tam={0.07} />
      {pedras.map(([x, z, e, a], i) => (
        <mesh key={i} position={[x, e * 0.4, z]} rotation={[a, a * 2, 0]} scale={[e * 1.4, e, e * 1.1]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 3 ? '#5e554c' : '#776c60'} roughness={1} flatShading />
        </mesh>
      ))}
      {/* a vela estendida na areia e Plínio deitado ao longo da praia */}
      <TBox pos={[0, 0.06, 0]} rot={[0, -0.1, 0]} tam={[2.6, 0.05, 1.8]} map={T.listras('#efe4c8', '#d9cdb0')} mod={[2, 2]} />
      <SombraContato pos={[0, 0.086, 0]} raio={0.95} esc={[1, 0.38]} forca={0.6} />
      {/* deitado: o boneco gira em torno do quadril; a inclinação de 0,35 rad compensa a cabeça grande, assim cabeça, costas e pernas tocam o pano */}
      <group position={[0, PLINIO_Y, 0]} rotation={[0, Math.PI / 2 - 0.1, 0]}>
        <group rotation={[-Math.PI / 2 + 0.35, 0, 0]}>
          <Pessoa pos={[0, -0.85, 0]} acao="parado" t={0} v={PLINIO_VELHO} tunica={false} />
        </group>
      </group>
      <Barco pos={[6.5, 0, 9]} rotY={1.2} t={0} />
      <Pessoa pos={[0.8, 0, 2.4]} rotY={-2.9} acao="parado" ferramenta="tocha" t={t} v={povo(5)} />
      <Pessoa pos={[-1.3, 0, 1.6]} rotY={2.8} acao="senta" t={t} v={povo(2)} />
      <pointLight position={[0.6, 2.0, 1.8]} color="#ffaa55" intensity={6} distance={10} decay={1.4} />
      <Liburna pos={[14, 0, 48]} rotY={0.9} t={t} remando={false} />
      <Vesuvio pos={[-90, 0, 1000]} R={VES_R} H={VES_H} brilho={1} />
      <Pluma pos={[-90, VES_H - 4, 1000]} H={700} R={50} g={1} t={t} colapso={0.6} />
      <CinzaCaindo t={t} centro={[0, 0, 0]} raio={8} alt={7} n={200} />
      <Luzinha i={0.5} cor="#ffa070" />
    </group>
  );
};

// Miseno: Plínio, o Jovem, escrevendo; a erupção ao longe do outro lado do golfo
const Miseno: React.FC<{t: number}> = ({t}) => (
  <group>
    <Chao tam={[5000, 5000]} pos={[0, -30, 0]} map={T.mar()} mod={30} />
    <TBox pos={[0, -15, -1]} tam={[16, 30, 14]} map={T.muro()} mod={[3, 3]} cor="#b5a88e" />
    <Chao tam={[14, 10]} pos={[0, 0.01, -1]} map={T.piso()} mod={2} />
    <TBox pos={[0, 2.5, -5.8]} tam={[14, 5, 0.3]} map={T.fresco()} mod={[4, 5]} />
    {[[-7, 0], [-7, 3]].map(([x, z], i) => (<TBox key={i} pos={[x, 0.45, z - 1]} tam={[0.3, 0.9, 4]} map={T.travertino()} mod={[4, 4]} />))}
    {[-3, 1].map((z) => (<ColunaCanelada key={z} pos={[-5.8, 0, z]} h={3.6} r={0.22} />))}
    {[-3, 1].map((z) => (<Caixa key={'v' + z} pos={[-2.9, 3.7, z]} tam={[6, 0.16, 0.16]} cor="#6b4a2e" />))}
    {Array.from({length: 18}).map((_, i) => {
      const r = rnd(i + 200);
      return <mesh key={i} position={[-5.5 + r() * 5, 3.85, -3.5 + r() * 5]} scale={[0.5, 0.2, 0.5]}><icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color={r() > 0.5 ? '#4f7a3a' : '#3f6a2e'} /></mesh>;
    })}
    {/* mesa com tabuinhas de cera, rolo de papiro, tinteiro */}
    <TBox pos={[0, 0.75, 0.45]} tam={[1.5, 0.06, 0.85]} map={T.madeira()} mod={[1, 1]} />
    {[[-0.65, 0.1], [0.65, 0.1], [-0.65, 0.8], [0.65, 0.8]].map(([x, z], i) => (<Caixa key={i} pos={[x, 0.37, z]} tam={[0.07, 0.75, 0.07]} cor="#5a3a22" />))}
    {[-0.17, 0.17].map((x, i) => (
      <group key={i} position={[x, 0.795, 0.42]} rotation={[0, 0, i ? -0.04 : 0.04]}>
        <Caixa tam={[0.32, 0.03, 0.42]} cor="#8a5a34" />
        <TBox pos={[0, 0.017, 0]} tam={[0.27, 0.01, 0.36]} map={T.escrita('#3a2e22', '#d9c9a0', 'cera')} mod={[0.27, 0.36]} />
      </group>
    ))}
    <Cil pos={[0.55, 0.83, 0.3]} rot={[0, 0, Math.PI / 2]} r={0.05} h={0.36} cor="#e2cf9a" />
    <TBox pos={[0.55, 0.785, 0.55]} tam={[0.34, 0.01, 0.4]} map={T.escrita('#e8d7a8', '#2a2018', 'papiro')} mod={[0.34, 0.4]} />
    <Cil pos={[-0.55, 0.82, 0.7]} r={0.05} h={0.09} cor="#2a2420" />
    <Barra a={[0.05, 0.84, 0.5]} b={[0.25, 0.9, 0.62]} r={0.008} cor="#c9a24a" />
    <Lucerna pos={[-0.5, 0.8, 0.3]} t={t} luz={3} />
    <Caixa pos={[0, 0.22, -0.4]} tam={[0.6, 0.44, 0.5]} cor="#6b4a2e" />
    <Pessoa pos={[0, 0.0, -0.35]} rotY={0} acao="senta" t={t} v={PLINIO_JOVEM} tunica={false} />
    <Pessoa pos={[-4.4, 0, 1.6]} rotY={-2.2} acao="aponta" t={t + 1} v={povo(4)} />
    <Vesuvio pos={[-1500, -30, -500]} R={600} H={260} brilho={0.8} />
    <Pluma pos={[-1500, 226, -500]} H={1100} R={70} g={1} t={t} vento={[0.4, 0.5]} />
    <Luzinha i={0.3} cor="#ffb080" />
  </group>
);

// escavação de hoje: corte estratigráfico, moldes de gesso, arqueólogos
const Escavacao: React.FC<{t: number}> = ({t}) => {
  const F = -2.4;
  const est = T.estratos();
  return (
    <group>
      <TBox pos={[0, F / 2, -54]} tam={[200, -F, 100]} map={est} mod={[1, -F]} />
      <TBox pos={[0, F / 2, 57]} tam={[200, -F, 100]} map={est} mod={[1, -F]} />
      <TBox pos={[-55, F / 2, 1.5]} tam={[100, -F, 11]} map={est} mod={[1, -F]} />
      <TBox pos={[55, F / 2, 1.5]} tam={[100, -F, 11]} map={est} mod={[1, -F]} />
      {[[0, -54, 200, 100], [0, 57, 200, 100], [-55, 1.5, 100, 11], [55, 1.5, 100, 11]].map(([x, z, w, d], i) => (<Chao key={i} tam={[w, d]} pos={[x, 0.01, z]} map={T.campo()} mod={8} />))}
      <Chao tam={[3000, 3000]} pos={[0, -2.6, 0]} map={T.campo()} mod={60} />
      <Chao tam={[10, 11]} pos={[0, F + 0.01, 1.5]} map={T.cinza()} mod={2} />
      <Molde pos={[-2, F, -1.4]} rotY={0.3} />
      <Molde pos={[0.8, F, 0.5]} rotY={2.1} />
      <Molde pos={[3, F, -2.2]} rotY={-0.6} esc={0.8} />
      {/* grade de barbante */}
      {[-3, 0, 3].map((x) => (<Barra key={x} a={[x, F + 0.85, -4]} b={[x, F + 0.85, 3]} r={0.008} cor="#ffffff" sombra={false} />))}
      {[-2.5, 0.5].map((z) => (<Barra key={z} a={[-5, F + 0.85, z]} b={[5, F + 0.85, z]} r={0.008} cor="#ffffff" sombra={false} />))}
      <Pessoa pos={[-1.9, F, 0.4]} rotY={2.8} acao="cava" ferramenta="colher" t={t} v={ARQUEOLOGA} tunica={false} />
      <Pessoa pos={[3.4, F, -3.6]} rotY={-0.6} acao="senta" t={t + 1} v={{...ARQUEOLOGA, camisa: '#4f8cff', colete: null, capacete: '#ffd23f', pele: '#f2c9a4'}} tunica={false} />
      <Pessoa pos={[4.5, 0, 8.4]} rotY={-2.4} acao="parado" ferramenta="planta" t={t + 2} v={{...ARQUEOLOGA, colete: '#2fbf71'}} tunica={false} />
      {[[-4, F, 2.2, '#2b2b2b'], [3.8, F, -3.4, '#ffffff'], [-1, 0, 8.2, '#ff8a1f']].map(([x, y, z, c], i) => (
        <group key={i} position={[x as number, y as number, z as number]}>
          <Cil pos={[0, 0.17, 0]} r={0.16} r2={0.13} h={0.34} cor={c as string} seg={10} />
          {i === 1 && <Cil pos={[0, 0.33, 0]} r={0.14} h={0.02} cor="#f4f2ec" seg={10} />}
        </group>
      ))}
      <Carrinho pos={[-6, 0, 8.4]} rotY={0.8} carga="#8b857c" />
      <Barra a={[4.6, F, 2.8]} b={[4.9, 0.8, 3.1]} r={0.04} cor="#9aa0aa" />
      <Barra a={[5.2, F, 2.6]} b={[5.5, 0.8, 2.9]} r={0.04} cor="#9aa0aa" />
      {Array.from({length: 6}).map((_, i) => (<Barra key={i} a={[4.6 + i * 0.05, F + 0.4 + i * 0.5, 2.8 + i * 0.05]} b={[5.2 + i * 0.05, F + 0.4 + i * 0.5, 2.6 + i * 0.05]} r={0.025} cor="#9aa0aa" />))}
      {/* tenda e ruínas em volta */}
      {[[-8, -8], [8, -8], [-8, -14], [8, -14]].map(([x, z], i) => (<Cil key={i} pos={[x, 1.4, z]} r={0.05} h={2.8} cor="#d0d0d0" />))}
      <TBox pos={[0, 2.85, -11]} tam={[17, 0.05, 7]} map={T.listras('#ffffff', '#e8eef2')} mod={[2, 2]} />
      <Domus pos={[-16, 0, -18]} tam={[12, 4, 10]} cor="#d9c09a" seed={150} ruina />
      <Domus pos={[15, 0, -16]} tam={[10, 3.5, 12]} cor="#e2cfa6" seed={151} ruina />
      <Pinheiro pos={[-14, 0, 8]} esc={1.2} />
      <Cipreste pos={[13, 0, 6]} />
      <Rotulo texto="GESSO" ancora={[-2, F + 0.45, -1.4]} sobe={1.2} fundo="#ffffff" vis={clamp01(t * 2.5)} />
      <Vesuvio pos={VES} R={VES_R} H={VES_H * 0.8} moderno />
    </group>
  );
};

// Pompeia hoje: ruas sem telhado, turistas, guia de guarda-chuva, o Vesúvio de dois picos
const Ruinas: React.FC<{t: number; ze?: boolean}> = ({t, ze = false}) => (
  <group>
    <Chao tam={[3000, 3000]} pos={[0, -0.05, 0]} map={T.campo()} mod={60} />
    <group position={[0, 0, -30]}>
      <Rua comp={80} t={t} pedras={[26, 4, -18]} ruina seed={6} />
    </group>
    <group position={[-40, 0, -70]}>
      <Colunata x={0} z0={-20} z1={30} lado={-1} quebrada />
      <Templo pos={[18, 0, -30]} quebrado />
    </group>
    {/* corda de isolamento e placa */}
    {Array.from({length: 6}).map((_, i) => (<Cil key={i} pos={[3.05, 0.9, 6 - i * 3]} r={0.04} h={1.0} cor="#4a3426" />))}
    <Barra a={[3.05, 1.3, 6]} b={[3.05, 1.3, -9]} r={0.015} cor="#c9302c" sombra={false} />
    <group position={[-3.0, 0.4, 2]}>
      <Cil pos={[0, 0.7, 0]} r={0.05} h={1.4} cor="#4a3426" />
      <Caixa pos={[0, 1.5, 0]} rot={[0, 0.5, 0]} tam={[0.9, 0.55, 0.06]} cor="#5a3a22" />
    </group>
    {/* turistas */}
    {Array.from({length: 9}).map((_, i) => {
      const z = -9 - i * 2.4 + ((t * 0.4 + i) % 1.2);
      return <Pessoa key={i} pos={[(i % 3 - 1) * 1.1, i % 3 === 1 ? 0 : 0, z]} rotY={i % 2 ? Math.PI : 0.3} acao={i % 3 === 0 ? 'aponta' : 'anda'} t={t + i} v={turista(i)} tunica={false} />;
    })}
    <group position={[0.4, 0, -14]}>
      <Pessoa pos={[0, 0, 0]} rotY={0} acao="aponta" t={t} v={{...turista(3), camisa: '#2fbf71'}} tunica={false} />
      <Cil pos={[0.3, 1.9, 0]} r={0.015} h={1.0} cor="#333" />
      <mesh position={[0.3, 2.45, 0]}>
        <coneGeometry args={[0.55, 0.3, 24]} />
        <meshStandardMaterial color="#ff5d73" />
      </mesh>
    </group>
    {ze && <Pessoa pos={[0.3, 0, -6]} rotY={0.1} acao="acena" t={t} v={ZE} />}
    {[[-14, 10], [14, -6], [-16, -40], [18, -50]].map(([x, z], i) => (i % 2 ? <Cipreste key={i} pos={[x, 0, z]} esc={1.3} /> : <Pinheiro key={i} pos={[x, 0, z]} esc={1.3} />))}
    <Vesuvio pos={VES} R={VES_R} H={VES_H * 0.8} moderno />
  </group>
);

export const SETS_POMPEIA: Record<string, SetHistoria> = {
  // ===== c1: Pompeia inteira vista do alto, com o Vesúvio ao fundo =====
  pom_cidade: {
    ceu: CEU_DIA,
    nevoa: [300, 1700],
    render: ({t}) => (
      <>
        <Cidade t={t} />
        {[0, 1, 2, 3, 4].map((i) => (<Pessoa key={i} pos={[-3 + i * 1.3, 0, 12 + ((t * 1.2 + i * 2) % 8)]} rotY={i % 2 ? Math.PI : 0} acao="anda" t={t + i} v={i === 2 ? ZE : povo(i)} />))}
      </>
    ),
    cams: {
      drone: mv([40, 90, 330], [20, 75, 270], [0, 30, -200], [0, 34, -220], 44),
      telhados: mv([30, 26, 78], [44, 19, 52], [55, 3, 20], [66, 3, 4], 46),
    },
  },
  // ===== c1/c3: a rua de pedras =====
  pom_rua: {
    ceu: CEU_DIA,
    nevoa: [250, 1600],
    render: ({t}) => <RuaCena t={t} ze="atravessa" />,
    cams: {
      ze: mv([2.6, 2.3, 13.5], [1.6, 2.0, 11.2], [0, 1.0, 6], [0, 1.0, 5.6], 42),
    },
  },
  pom_tremor: {
    clima: 'surpreso',
    ceu: CEU_DIA,
    nevoa: [250, 1600],
    render: ({t}) => <><RuaCena t={t} ze="olha" tremor={1} />{[0, 1, 2, 3, 4, 5].map((i) => (<Vapor key={i} pos={[(i % 2 ? 3.6 : -3.6), 5.5 - ((t * 3 + i * 0.4) % 1) * 3, 12 - i * 3]} t={t + i} n={3} esc={3} cor="#d8c8a8" alt={0.4} />))}</>,
    cams: {
      chao: mv([-1.6, 4.0, 16], [-1.2, 3.4, 13.5], [0.6, 1.0, 3], [0.8, 0.9, 2], 46),
    },
  },
  pom_rua_vesuvio: {
    clima: 'surpreso',
    ceu: CEU_DIA,
    nevoa: [250, 1600],
    render: ({t}) => <RuaCena t={t} ze="olha" fumaca={0.6} />,
    cams: {
      fundo: mv([0.6, 2.0, 30], [0.3, 2.6, 23], [0, 30, -300], [0, 36, -300], 44),
    },
  },
  // ===== c1/c2: o fórum com o Templo de Júpiter e o Vesúvio atrás =====
  pom_forum: {
    ceu: CEU_DIA,
    nevoa: [300, 1700],
    render: ({t, p}) => (
      <>
        <Forum t={t} />
        <Pessoa pos={[1.6, 0, 12]} rotY={Math.PI + 0.1} acao="parado" t={t} v={ZE} />
        <Vesuvio pos={VES} R={VES_R} H={VES_H} />
        <Pluma pos={CRATERA} H={60} R={9} g={0.25 + 0.3 * p} t={t} vento={[0.5, 0.2]} brilho={0} />
        <Rotulo texto="VESÚVIO" ancora={[0, VES_H + 10, VES[2]]} sobe={0} fundo="#6f8a45" cor="#ffffff" vis={clamp01(p * 3)} />
      </>
    ),
    cams: {
      vesuvio: mv([6, 2.2, 30], [3, 2.8, 19], [0, 25, -200], [0, 35, -300], 44),
      geral: orb([-10, 3, -4], 52, 26, 50, 40, 46, 10),
    },
  },
  pom_forum_termas: {
    ceu: CEU_DIA,
    nevoa: [300, 1700],
    render: ({t}) => (
      <>
        <Forum t={t} />
        <Vesuvio pos={VES} R={VES_R} H={VES_H} />
        <Pluma pos={CRATERA} H={60} R={9} g={0.4} t={t} vento={[0.5, 0.2]} brilho={0} />
        <Rotulo texto="FÓRUM" ancora={[0, 0.5, 6]} sobe={3} fundo="#d9a040" vis={clamp01(t * 4)} />
        <Rotulo texto="TERMAS" ancora={[-40, 14, -4]} sobe={3} fundo="#3f7f9f" cor="#ffffff" vis={clamp01(t * 4 - 0.8)} />
      </>
    ),
    cams: {
      geral: orb([-12, 3, -4], 52, 26, 50, 40, 46, 10),
    },
  },
  // ===== c2: o golfo de Nápoles (maquete) =====
  pom_baia: {
    ceu: CEU_DIA,
    nevoa: [700, 3200],
    render: ({t, p}) => <Regiao t={t} fumaca={1} rotulos={p} />,
    cams: {
      baia: orb([20, 5, 50], 22, 30, 280, 230, 44, 10),
    },
  },
  // ===== c2: termopólio =====
  pom_thermo: {
    ceu: CEU_DIA,
    nevoa: [120, 900],
    render: ({t, p}) => (
      <>
        <Termopolio t={t} />
        <Rotulo texto="THERMOPOLIUM" ancora={[-0.8, 1.45, -0.2]} sobe={1.6} fundo="#c09040" vis={clamp01((p - 0.1) * 6)} />
      </>
    ),
    cams: {
      rua: mv([4.2, 2.7, 7.2], [2.6, 2.3, 6.2], [-0.6, 1.4, -1.2], [-0.8, 1.3, -1.4], 46),
      potes: mv([-3.4, 2.7, 3.0], [-3.0, 2.55, 2.5], [-1.4, 1.5, -1.2], [-1.35, 1.45, -1.3], 44),
    },
  },
  // ===== c2: padaria =====
  pom_padaria: {
    ceu: CEU_DIA,
    nevoa: [120, 900],
    render: ({t}) => <Padaria t={t} />,
    cams: {
      geral: mv([-6.5, 3.4, 8.5], [7.0, 2.5, 9.8], [-3.2, 1.2, -1.8], [3.0, 1.3, 2.6], 46),
    },
  },
  // ===== c3: lembrança do terremoto de 62 d.C. =====
  pom_terremoto: {
    clima: 'medo',
    ceu: CEU_62,
    luz: 'tarde',
    nevoa: [60, 700],
    render: ({t, p}) => <Terremoto t={t} p={p} />,
    cams: {
      geral: orb([0, 3.5, -5], -28, 18, 30, 24, 46, 10),
      queda: mv([-4.5, 7.5, 13], [-3.6, 6.8, 11.5], [3.8, 2.4, -1], [4.6, 0.7, 1.4], 46),
    },
  },
  // ===== c4: o Vesúvio explode, visto do fórum =====
  pom_erupcao: {
    clima: 'medo',
    ceu: CEU_ERUPCAO,
    luz: 'tarde',
    nevoa: [300, 2400],
    render: ({t, p}) => (
      <>
        <Forum t={t} povo={p < 0.5 ? 'olha' : 'foge'} />
        <Pessoa pos={[3, 0, 20]} rotY={Math.PI + 0.3} acao="aponta" t={t} v={ZE} />
        <Vesuvio pos={VES} R={VES_R} H={VES_H} brilho={suave(p)} />
        <Pluma pos={CRATERA} H={900} R={50} g={0.12 + 0.88 * suave(p)} t={t} vento={[0.5, 0.6]} />
        {p > 0.6 && <PomesChuva t={t} centro={[8, 0, -20]} raio={20} alt={30} n={200} tam={0.1} vel={10} />}
      </>
    ),
    cams: {
      explode: mv([0, 6, 64], [0, 6.5, 48], [0, 60, -300], [0, 80, -350], 46),
      coluna: mv([-5, 1.7, 10], [-6, 1.6, 5], [0, 30, -300], [0, 420, -700], 54),
    },
  },
  // ===== c4: a coluna em "pinheiro" de 30 km (maquete do golfo) =====
  pom_pluma: {
    clima: 'medo',
    ceu: CEU_ERUPCAO,
    luz: 'tarde',
    nevoa: [900, 3600],
    render: ({t, p}) => <Regiao t={t} g={0.6 + 0.4 * suave(p)} regua={suave(clamp01(p * 1.6))} />,
    cams: {
      alto: orb([0, 150, 0], 32, 4, 760, 680, 46, 8),
    },
  },
  // ===== c4: pedra-pomes nos telhados =====
  pom_pomes: {
    clima: 'medo',
    ceu: CEU_CINZA,
    luz: 'tarde',
    nevoa: [40, 260],
    render: ({t, p}) => <Telhados t={t} p={p} />,
    cams: {
      telhados: orb([0, 4, 4], 28, 40, 30, 23, 46, 12),
    },
  },
  pom_pomes_rua: {
    clima: 'medo',
    ceu: CEU_CINZA,
    luz: 'tarde',
    nevoa: [30, 200],
    render: ({t}) => (
      <>
        <RuaCena t={t} pomes={0.45} ze="travesseiro" fumaca={0} povo="travesseiro" />
        <PomesChuva t={t} centro={[0, 0.27, 1]} raio={5} raioZ={6} alt={12} n={200} tam={0.075} vel={9} seed={3} />
      </>
    ),
    cams: {
      ze: mv([1.2, 1.55, 9.6], [0.9, 1.5, 8.6], [0, 0.85, 2.6], [0, 0.85, 3.2], 42),
    },
  },
  // ===== c5: fuga pelo porto =====
  pom_porto: {
    clima: 'medo',
    ceu: CEU_TARDE_CINZA,
    luz: 'tarde',
    nevoa: [150, 2200],
    render: ({t}) => <Porto t={t} />,
    cams: {
      fuga: mv([28, 12, 30], [22, 10, 25], [0, 1.5, 4], [-2, 1.5, 2], 46),
    },
  },
  // ===== c5: quem fica: o átrio de casa recebendo pomes =====
  pom_casa: {
    clima: 'medo',
    ceu: ['#120c0a', '#2a1c14'],
    luz: 'interior',
    render: ({t, p}) => <Atrio t={t} p={p} />,
    cams: {
      atrio: mv([-3.3, 2.1, 3.0], [-2.8, 2.0, 2.2], [1.4, 0.8, -4.8], [1.4, 0.85, -4.8], 48),
    },
  },
  // ===== c5: 3 h da manhã, a coluna desaba =====
  pom_colapso: {
    clima: 'medo',
    ceu: CEU_MADRUGADA,
    luz: 'noite',
    nevoa: [300, 2200],
    render: ({t, p}) => <Muralha t={t} p={p} />,
    cams: {
      geral: mv([1.6, 9.5, 27], [1.4, 9.5, 25.5], [0, 16, -500], [0, 18, -500], 44),
    },
  },
  // ===== c5: o fluxo piroclástico =====
  pom_fluxo: {
    clima: 'medo',
    ceu: CEU_MADRUGADA,
    luz: 'noite',
    nevoa: [200, 2000],
    render: ({t, p}) => <Descida t={t} p={p} />,
    cams: {
      descida: mv([34, 34, 70], [26, 28, 56], [0, 5, -110], [0, 3, -100], 46),
    },
  },
  pom_fluxo_rua: {
    clima: 'medo',
    ceu: CEU_MADRUGADA,
    luz: 'noite',
    nevoa: [60, 400],
    render: ({t, p}) => <RuaFluxo t={t} p={p} />,
    cams: {
      rua: mv([1.1, 1.3, 6.8], [0.9, 1.3, 7.8], [0.3, 0.92, 1.2], [0.3, 0.92, 2.2], 46),
    },
  },
  // ===== c6: Plínio, o Velho, e a frota de Miseno =====
  pom_barca: {
    clima: 'serio',
    ceu: CEU_TARDE_CINZA,
    luz: 'tarde',
    nevoa: [300, 2600],
    render: ({t}) => (
      <Golfo t={t}>
        <Liburna pos={[t * 1.2, 0, 0]} rotY={0.25} t={t} tripulacao={
          <>
            <Pessoa pos={[8.2, 2.0, 0]} rotY={Math.PI - 0.5} acao="aponta" t={t} v={PLINIO_VELHO} tunica={false} />
            {[0, 1, 2].map((i) => (<Pessoa key={i} pos={[3 - i * 2.2, 2.0, (i - 1) * 0.6]} rotY={Math.PI - 0.3} acao="parado" t={t + i} v={{...povo(i + 1), escudo: '#8f2a24'}} />))}
          </>
        } />
      </Golfo>
    ),
    cams: {
      geral: orb([2, 3, 0], 32, 12, 36, 29, 46, 10),
      plinio: mv([10.6, 3.7, 2.4], [10.2, 3.6, 1.8], [5, 5, -25], [4.5, 6, -35], 46),
    },
  },
  pom_praia: {
    clima: 'serio',
    ceu: CEU_MADRUGADA,
    luz: 'noite',
    nevoa: [80, 1600],
    render: ({t}) => <Praia t={t} />,
    cams: {
      plinio: mv([1.1, 1.05, -5.9], [0.9, 1.0, -5.4], [0, 0.15, 0.2], [0, 0.15, 0.2], 48),
    },
  },
  // ===== c6: Plínio, o Jovem, escreve =====
  pom_carta: {
    clima: 'serio',
    ceu: CEU_CREPUSCULO,
    luz: 'tarde',
    nevoa: [500, 4000],
    render: ({t}) => <Miseno t={t} />,
    cams: {
      geral: mv([2.7, 1.85, 3.5], [2.3, 1.75, 3.0], [-0.75, 0.6, -0.45], [-0.9, 0.65, -0.5], 46),
      tabua: mv([0.9, 1.75, 1.35], [0.6, 1.55, 1.05], [0.1, 0.8, 0.45], [0.05, 0.8, 0.45], 38),
    },
  },
  // ===== c7: os moldes de gesso =====
  pom_moldes: {
    clima: 'triste',
    ceu: CEU_DIA,
    nevoa: [250, 1600],
    render: ({t}) => <Escavacao t={t} />,
    cams: {
      geral: orb([-0.2, -2.4, 0.6], 10, 56, 10.5, 9.0, 44, 10),
      close: mv([3.2, 0.3, 3.2], [2.9, 0.2, 2.9], [0.95, -2.4, 0.55], [0.9, -2.4, 0.5], 54),
    },
  },
  // ===== c7: Pompeia hoje =====
  pom_ruinas: {
    clima: 'serio',
    ceu: CEU_DIA,
    nevoa: [250, 1600],
    render: ({t}) => <Ruinas t={t} />,
    cams: {
      aereo: mv([14, 28, 42], [8, 23, 30], [0, 8, -120], [0, 8, -130], 44),
      rua: mv([1.6, 1.8, 6.5], [0.9, 1.7, 3.5], [0, 1.4, -14], [0, 1.4, -16], 44),
    },
  },
  pom_ruinas_ze: {
    ceu: CEU_DIA,
    nevoa: [250, 1600],
    render: ({t}) => <Ruinas t={t} ze />,
    cams: {
      ze: mv([1.5, 1.55, -1.4], [0.9, 1.45, -2.5], [0.3, 1.35, -6], [0.3, 1.4, -6], 42),
    },
  },
};
