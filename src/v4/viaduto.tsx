// CENÁRIOS do vídeo "Quanto custa construir um viaduto" (prefixo "vd"). Entram em SETS por VD_SETS (src/v4/sets.tsx).
// Mundo em escala real: viaduto de 21 m de largura no eixo X, cruzando uma avenida de 6 faixas que corre em Z.
// Peças em src/v4/viaduto-pecas.tsx. Cenas em corte são maquetes: o bloco de solo termina na face z = 0.
import React from 'react';
import * as THREE from 'three';
import type {Cam, SetDef} from './sets';
import {Arvore, Barra, Boneco, Caixa, Cil, CRIANCA, ENGENHEIRA, MORADOR, MonteTerra, Rotulo, SERVENTE, clamp01, lerp, suave, texBloco} from './kit';
import type {V3} from './planta';
import {Retro} from './piscina';
import {
  Ambiente, Basculante, Betoneira, Bomba, BoxT, Bx, BLOCO, Carreta, Carro, CaminhaoSeta, Cavalete, Cidade, Cone, ESTACAS_BLOCO, Guindaste, NewJersey,
  OPERARIO_NOITE, Perfuratriz, Placa, PlanoChao, Poste, Predios, Raiz, Rolo, SegX, SoloCorte, Tapume, TorreLuz, TransitoAvenida, TransitoViaduto, TripeSPT,
  VD, VigaI, Viaduto, Vibroacabadora, corConcreto, texConcreto, texJanelas, texLetreiro, texPista, texPlanta, yFundoViga, yTop, yTopoTrav,
} from './viaduto-pecas';

// câmera por órbita (cópia local da orb de sets.tsx, para não criar import circular)
const orb = (alvo: V3, az: number, el: number, d0: number, d1: number, fov = 44, giro = 6, corte?: boolean): Cam => {
  const pt = (a: number, d: number): V3 => {
    const r = (Math.PI / 180) * a, e = (Math.PI / 180) * el;
    return [alvo[0] + Math.sin(r) * Math.cos(e) * d, alvo[1] + Math.sin(e) * d, alvo[2] + Math.cos(r) * Math.cos(e) * d];
  };
  return {de: pt(az, d0), para: pt(az + giro, d1), alvo, fov, corte};
};
// altura do centro do martelo da sondagem (mesma conta do TripeSPT)
const alturaMartelo = (t: number) => {
  const c = (t * 1.1) % 1;
  const h = c < 0.75 ? suave(c / 0.75) * 0.75 : 0.75 * (1 - ((c - 0.75) / 0.25) ** 2);
  return 1.1 + 0.05 + h + 0.17;
};
const OBREIRO_VD = {camisa: '#4f8cff', colete: '#ff8a1f', capacete: '#ffd23f', calca: '#30406b'};
const NEVOA_DIA: [string, number, number] = ['#d9f1ff', 140, 360];
const NEVOA_TARDE: [string, number, number] = ['#ffe7c7', 140, 360];
const NEVOA_NOITE: [string, number, number] = ['#2c3d75', 90, 260];
const CEU_NOITE: [string, string] = ['#14224d', '#3b4f8c']; // noite azul-marinho (nunca preto)
const CEU_TARDE: [string, string] = ['#ffb37a', '#ffe7c7'];

// ---------- içamento: caminho da viga (da carreta até os pilares) ----------
const XC = 4, ZC0 = 20; // carreta parada na avenida, viga em Z
const Y_FINAL = yFundoViga(17.5) + VD.viga / 2;
export function vigaNoAr(p: number) {
  const s1 = suave(p / 0.3), s2 = suave((p - 0.3) / 0.45), s3 = suave((p - 0.75) / 0.25);
  const yAlto = 13.6;
  const C: V3 = p < 0.3 ? [XC, lerp(2.9, yAlto, s1), ZC0] : p < 0.75 ? [lerp(XC, 0, s2), yAlto, lerp(ZC0, 1.25, s2)] : [0, lerp(yAlto, Y_FINAL, s3), 1.25];
  const yaw = p < 0.3 ? -Math.PI / 2 : p < 0.75 ? lerp(-Math.PI / 2, 0, s2) : 0;
  const ponta = (s: number): V3 => [C[0] + Math.cos(yaw) * 16 * s, C[1], C[2] - Math.sin(yaw) * 16 * s];
  return {C, yaw, E1: ponta(1), E2: ponta(-1)};
}

// pilar em obra: concreto até h, fôrma metálica com anéis, ferragem saindo em cima, andaime e operário
const PilarObra: React.FC<{x: number; z: number; k: number; t: number; andaime?: boolean}> = ({x, z, k, t, andaime}) => {
  const H = yTopoTrav(x) - VD.trav;
  const hc = H * k;
  const hf = Math.min(H, hc + 2.0);
  const r = VD.rPilar;
  return (
    <group>
      {hc > 0.05 && <Cil pos={[x, hc / 2 + 0.2, z]} r={r} h={hc} cor={corConcreto} seg={16} />}
      {/* ferragem (16 barras) acima do concreto */}
      {k < 1 && Array.from({length: 16}).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <Barra key={i} a={[x + Math.cos(a) * (r - 0.08), hc, z + Math.sin(a) * (r - 0.08)]} b={[x + Math.cos(a) * (r - 0.08), Math.min(H + 1.2, hc + 3.2), z + Math.sin(a) * (r - 0.08)]} r={0.016} cor="#8a4b2f" />;
      })}
      {k < 1 && [0.6, 1.4, 2.2].map((dy) => (<mesh key={dy} position={[x, hc + dy, z]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r - 0.08, 0.012, 10, 28]} /><meshStandardMaterial color="#8a4b2f" /></mesh>))}
      {/* fôrma metálica (2 m acima da concretagem) */}
      {k < 1 && (
        <group>
          <mesh position={[x, (hc + hf) / 2 + 0.2 - 1.0, z]} castShadow>
            <cylinderGeometry args={[r + 0.05, r + 0.05, 2.0, 24, 1, true]} />
            <meshStandardMaterial color="#2f6fd6" side={2} />
          </mesh>
          {[0.15, 1.0, 1.85].map((dy) => (<Cil key={dy} pos={[x, hc - 0.8 + dy, z]} r={r + 0.09} h={0.08} cor="#ffd23f" seg={18} />))}
          {[0, Math.PI].map((a) => (<Caixa key={a} pos={[x + Math.cos(a) * (r + 0.1), hc + 0.2, z + Math.sin(a) * (r + 0.1)]} tam={[0.08, 2.0, 0.2]} cor="#1d4fa8" />))}
        </group>
      )}
      {andaime && k < 1 && (
        <group>
          {[[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].map(([dx, dz], i) => (<Barra key={i} a={[x + dx, 0.2, z + dz]} b={[x + dx, hc + 1.4, z + dz]} r={0.03} cor="#c9ced6" />))}
          {Array.from({length: Math.floor((hc + 1.4) / 1.5)}).map((_, j) => (
            <group key={j}>
              {[[-1.4, -1.4, 1.4, -1.4], [-1.4, 1.4, 1.4, 1.4], [-1.4, -1.4, -1.4, 1.4], [1.4, -1.4, 1.4, 1.4]].map(([a, b, c, d], i) => (<Barra key={i} a={[x + a, 0.2 + (j + 1) * 1.5, z + b]} b={[x + c, 0.2 + (j + 1) * 1.5, z + d]} r={0.025} cor="#c9ced6" />))}
            </group>
          ))}
          <Caixa pos={[x + 1.15, hc - 0.1, z]} tam={[0.5, 0.06, 2.8]} cor="#b98a5b" />
          <Boneco pos={[x + 1.25, hc - 0.07, z + 0.4]} rotY={-Math.PI / 2} acao="aponta" t={t} v={OBREIRO_VD} esc={0.85} />
        </group>
      )}
    </group>
  );
};

// pilares de todas as linhas em estados diferentes (fundo das cenas de obra)
const PilaresProntos: React.FC<{exceto?: number; k?: number}> = ({exceto, k = 1}) => (
  <group>
    {[-52.5, -17.5, 17.5, 52.5].filter((x) => x !== exceto).map((x) => [-1, 1].map((s) => (<PilarObra key={x + ':' + s} x={x} z={s * VD.zPilar} k={x === -52.5 ? k * 0.6 : k} t={0} />)))}
  </group>
);

// maquete do corte: céu ao fundo, rua por cima e alguns prédios atrás
const FundoCorte: React.FC<{x?: [number, number]; rua?: boolean}> = ({x = [-16, 16], rua = true}) => (
  <group>
    <PlanoChao x={[x[0] - 60, x[1] + 60]} z={[-140, -14]} y={0.0} cor="#bdb6a8" map={texConcreto()} mu={6} mv={6} />
    {rua && <PlanoChao x={[x[0] - 60, x[1] + 60]} z={[-22, -14]} y={0.02} cor="#ffffff" map={texPista('rua')} mu={10} mv={16} />}
    {[-40, -24, -8, 8, 24, 40].map((xx, i) => (
      <group key={i}>
        <BoxT pos={[xx, (9 + (i % 3) * 7) / 2, -34 - (i % 2) * 6]} tam={[12, 9 + (i % 3) * 7, 10]} cor={['#f1e3c6', '#d9e2ea', '#f3c9a8', '#cfd8c4'][i % 4]} map={null} />
        <BoxT pos={[xx, (9 + (i % 3) * 7) / 2, -28.9 - (i % 2) * 6]} tam={[12.02, 9 + (i % 3) * 7, 0.2]} cor="#ffffff" map={texJan()} mu={10} mv={12} />
      </group>
    ))}
    {[-30, -12, 14, 32].map((xx) => (<Arvore key={xx} pos={[xx, 0, -16]} esc={1.5} />))}
  </group>
);
const texJan = () => texJanelas(false);

// casa simples de 50 m² (7 × 7,2 m) para comparar com 1 metro de viaduto
const CasaSimples: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Caixa pos={[0, 0.08, 0]} tam={[7.4, 0.16, 7.6]} cor="#b9b4ab" />
    <BoxT pos={[0, 1.55, 0]} tam={[7, 2.8, 7.2]} cor="#f5d491" map={texConcreto()} mu={3} mv={3} />
    <Caixa pos={[1.6, 1.2, 3.62]} tam={[0.9, 2.1, 0.06]} cor="#8b5a3c" />
    <Caixa pos={[-1.6, 1.75, 3.62]} tam={[1.5, 1.2, 0.06]} cor="#9fd0f0" />
    <Caixa pos={[-1.6, 1.75, 3.64]} tam={[0.06, 1.2, 0.06]} cor="#ffffff" />
    <Caixa pos={[3.52, 1.75, 0]} tam={[0.06, 1.2, 1.5]} cor="#9fd0f0" />
    {[-1, 1].map((s) => (<Caixa key={s} pos={[s * 2.0, 3.85, 0]} rot={[0, 0, s * -0.52]} tam={[4.7, 0.18, 8.0]} cor="#c8553d" />))}
    {/* telhas (fiadas) por cima das águas */}
    {[-1, 1].map((s) => [0, 1, 2, 3, 4, 5].map((i) => (<Caixa key={s + ':' + i} pos={[s * (0.3 + i * 0.66), 4.98 - (0.3 + i * 0.66) * 0.573 + 0.06, 0]} rot={[0, 0, s * -0.52]} tam={[0.08, 0.06, 8.0]} cor="#a8432f" sombra={false} />)))}
    {/* empenas (triângulos de parede que fecham o telhado na frente e atrás) */}
    {[-1, 1].map((s) => (<Empena key={'em' + s} z={s * 3.52} />))}
    <Caixa pos={[0, 5.0, 0]} tam={[0.3, 0.25, 8.0]} cor="#a8432f" />
  </group>
);


const Empena: React.FC<{z: number}> = ({z}) => {
  const geo = React.useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-3.5, 0);
    sh.lineTo(3.5, 0);
    sh.lineTo(0, 2.0);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, {depth: 0.16, bevelEnabled: false});
    g.translate(0, 0, -0.08);
    return g;
  }, []);
  return (
    <mesh geometry={geo} position={[0, 2.95, z]} castShadow receiveShadow>
      <meshStandardMaterial color="#f0cc86" roughness={0.9} />
    </mesh>
  );
};

// 1 metro do viaduto de verdade destacado em amarelo; na versão "casa", uma casa de 50 m² no chão ao lado
const XM = 30; // dentro do vão de 17,5 a 52,5 m
function metro(casa: boolean): SetDef {
  const yM = yTop(XM);
  return {
    luz: 'tarde',
    ceu: CEU_TARDE,
    render: ({t, p}) => (
      <Raiz>
        <Ambiente luz="tarde" c={[XM, 4, 10]} r={45} nevoa={NEVOA_TARDE} />
        <Cidade fase="pronto" excluir={{x: [20, 46], z: [16, 36]}} t={t} />
        <Viaduto />
        <TransitoAvenida t={t} />
        <TransitoViaduto t={t} />
        {/* faixa de 1 metro: caixa amarela translúcida em volta do tabuleiro e das vigas */}
        <mesh position={[XM, yM - 1.1, 0]} scale={[1, 1, 1]}>
          <boxGeometry args={[1.0, 2.6, 21.8]} />
          <meshStandardMaterial color="#ffd23f" transparent opacity={0.45 + 0.15 * Math.sin(t * 5)} emissive="#ffb000" emissiveIntensity={0.4} />
        </mesh>
        {[-0.5, 0.5].map((dx) => (<Caixa key={dx} pos={[XM + dx, yM + 0.12, 0]} tam={[0.06, 0.06, 21.8]} cor="#ffd23f" sombra={false} />))}
        <Rotulo texto="1 METRO" ancora={[XM, yM + 0.2, 10.9]} sobe={1.8} fundo="#ffd23f" vis={clamp01(p * 6)} />
        {casa && <CasaSimples pos={[XM + 1, 0.05, 16.5]} />}
        {casa && <Rotulo texto="CASA 50 m²" ancora={[XM + 3, 3.0, 20.1]} sobe={0.6} lado={2.5} />}
        <Boneco pos={[XM - 4.5, 0.05, 20.5]} rotY={0.6} acao={casa ? 'aponta' : 'comemora'} t={t} v={OBREIRO_VD} />
        {casa && <Boneco pos={[XM + 3.4, 0.05, 21.5]} rotY={-0.4} acao="acena" t={t} v={MORADOR} />}
      </Raiz>
    ),
    cams: casa ? {geral: orb([XM + 0.5, 1.5, 16.5], 10, 6, 26, 22, 46, -6)} : {geral: orb([XM, 8.5, 8], 25, 14, 22, 18, 46, 10)},
  };
}

const Y_TOPO = VD.yPlano;

export const VD_SETS: Record<string, SetDef> = {
  // ===== viaduto pronto na cidade (gancho e final) =====
  vdCidade: {
    luz: 'tarde',
    ceu: CEU_TARDE,
    render: ({t}) => (
      <Raiz>
        <Ambiente luz="tarde" c={[0, 5, 0]} r={95} nevoa={NEVOA_TARDE} />
        <Cidade fase="pronto" t={t} tremZ={-30 + t * 9} />
        <Viaduto />
        <TransitoAvenida t={t} />
        <TransitoViaduto t={t} />
        <Boneco pos={[13.5, 0.15, 24]} rotY={-2.6} acao="aponta" t={t} v={MORADOR} />
        <Boneco pos={[14.2, 0.15, 25]} rotY={-2.9} acao="parado" t={t} v={CRIANCA} esc={0.6} />
      </Raiz>
    ),
    cams: {
      drone: orb([0, 6, 0], 38, 15, 74, 58, 46, 8),
      lateral: orb([0, 7, 0], 14, 6, 46, 37, 50, -6),
      drone2: {de: [-12.2, 1.6, 44], para: [-11.8, 1.5, 37], alvo: [-10, 6, 0], alvoPara: [-7, 6.6, -2], fov: 52}, // só o p33 usa: nível da rua, sob o viaduto
      drone3: orb([0, 4, 0], 100, 46, 120, 98, 46, 10),
    },
  },
  vdCidadeNoite: {
    luz: 'nublado',
    ceu: CEU_NOITE,
    noite: true,
    render: ({t}) => (
      <Raiz>
        <Ambiente luz="noite" c={[0, 5, 0]} r={90} nevoa={NEVOA_NOITE} />
        <Cidade fase="pronto" noite t={t} tremZ={20 - t * 9} />
        <Viaduto noite aceso />
        <TransitoAvenida t={t} noite />
        <TransitoViaduto t={t} noite />
      </Raiz>
    ),
    cams: {geral: orb([0, 7, 0], 38, 12, 74, 60, 48, 10)},
  },
  // ===== antes: cruzamento com semáforo e fila =====
  vdTerreno: {
    luz: 'dia',
    render: ({t}) => (
      <Raiz>
        <Ambiente luz="dia" c={[0, 0, 0]} r={70} nevoa={NEVOA_DIA} />
        <Cidade fase="antes" t={t} tremZ={-25 + t * 6} />
        <TransitoAvenida t={t} parado />
        {[0, 1, 2, 3, 4].map((i) => (<Carro key={'w' + i} pos={[-36 - i * 7.5, 0, 4]} rotY={Math.PI / 2} cor={['#2f6fd6', '#f2f2f2', '#e8402f', '#1d1b26', '#9aa0aa'][i]} tipo={i === 2 ? 'onibus' : 'carro'} />))}
        {[0, 1].map((i) => (<Carro key={'e' + i} pos={[-19.5 + i * 0, 0, -4 - i * 0]} rotY={-Math.PI / 2} cor={i ? '#ffd23f' : '#2fbf71'} tipo="suv" />))}
        <Boneco pos={[-21, 0.0, 11]} rotY={-2.2} acao="aponta" t={t} v={ENGENHEIRA} ferramenta="planta" />
        <Rotulo texto="LINHA DO TREM" ancora={[-27.5, 4, -6]} sobe={3} fundo="#ffd23f" />
      </Raiz>
    ),
    cams: {geral: orb([-18, 0, 0], -38, 26, 64, 52, 46, 8)},
  },
  // ===== sondagem SPT: tripé, martelo de 65 kg =====
  vdSondagem: {
    luz: 'dia',
    render: ({t, p}) => (
      <Raiz>
        <Ambiente luz="dia" c={[20, 0, 14]} r={40} nevoa={NEVOA_DIA} />
        <Cidade fase="antes" />
        <TransitoAvenida t={t} />
        <TripeSPT pos={[19, 0, 13]} t={t} />
        <Boneco pos={[20.6, 0, 13.6]} rotY={-2.0} acao="carrega" t={t} v={OBREIRO_VD} />
        <Boneco pos={[21.2, 0, 12.2]} rotY={-1.6} acao="carrega" t={t + 0.3} v={SERVENTE} />
        <Boneco pos={[17.2, 0, 14.6]} rotY={1.0} acao="aponta" t={t} v={ENGENHEIRA} ferramenta="planta" />
        {/* hastes e caixas de amostra */}
        {[0, 1, 2, 3, 4].map((i) => (<Cil key={i} pos={[16.5, 0.05 + i * 0.06, 11 + i * 0.07]} rot={[0, 0, Math.PI / 2]} r={0.03} h={3} cor="#7d838c" seg={6} />))}
        {[0, 1, 2].map((i) => (
          <group key={'cx' + i} position={[22.5, 0.12, 15 + i * 0.6]}>
            <Caixa tam={[1.0, 0.2, 0.5]} cor="#b98a5b" />
            {[0, 1, 2, 3].map((j) => (<Cil key={j} pos={[-0.36 + j * 0.24, 0.1, 0]} rot={[Math.PI / 2, 0, 0]} r={0.05} h={0.42} cor={['#b8643a', '#c99a5b', '#d8c27a', '#8d8a80'][(i + j) % 4]} seg={8} />))}
          </group>
        ))}
        <Carro pos={[24, 0, 9.5]} rotY={-0.5} cor="#f2f2f2" tipo="suv" />
        <BoxT pos={[24, 2.0, 9.5]} rot={[0, -0.5, 0]} tam={[1.6, 0.4, 0.05]} cor="#ffffff" map={texLetreiro('SONDAGEM', '#2f6fd6')} mu={1.6} mv={0.4} />
        {[0, 1, 2, 3, 4, 5].map((i) => (<Cone key={i} pos={[19 + Math.cos(i + 0.6) * 3.4, 0, 13 + Math.sin(i + 0.6) * 3.4]} />))}
        {/* furos já feitos (marcados com estaca de madeira e fita) */}
        {[[30, 12], [36, 13], [42, 12.5]].map(([x, z], i) => (<group key={'f' + i}><Cil pos={[x, 0.4, z]} r={0.04} h={0.8} cor="#b98a5b" seg={6} /><Caixa pos={[x, 0.75, z]} tam={[0.3, 0.06, 0.02]} cor="#ff5d5d" /></group>))}
        {/* mesa do projeto no canteiro */}
        <group position={[30, 0, 17]}>
          <BoxT pos={[0, 1.3, -2.5]} tam={[6, 2.6, 2.4]} cor="#e9e6df" map={texConcreto()} />
          <BoxT pos={[-1.75, 2.3, -1.29]} tam={[1.6, 0.36, 0.04]} cor="#ffffff" map={texLetreiro('PROJETO', '#1f4f9a')} mu={1.6} mv={0.36} />
          <Caixa pos={[1.5, 1.2, -1.28]} tam={[0.9, 1.9, 0.04]} cor="#8b5a3c" />
          {[[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]].map(([x, z], i) => (<Cil key={i} pos={[x, 0.45, z]} r={0.03} h={0.9} cor="#5a5f66" seg={6} />))}
          <group position={[0, 0.95, 0]} rotation={[-0.25, 0, 0]}>
            <Caixa tam={[1.7, 0.04, 1.0]} cor="#e9e2d0" />
            <BoxT pos={[0, 0.025, 0]} tam={[1.6, 0.01, 0.95]} cor="#ffffff" map={texPlanta()} mu={1.6} mv={0.95} sombra={false} />
          </group>
          <Boneco pos={[0.95, 0, -0.3]} rotY={-0.75} acao="aponta" t={t} v={ENGENHEIRA} />
          <Boneco pos={[-0.95, 0, -0.3]} rotY={0.75} acao="parado" t={t} v={OBREIRO_VD} ferramenta="planta" />
          {/* chão do canteiro: rolos de planta, prancheta, caixas de amostra da sondagem, capacete e cone */}
          {[[-0.55, 0.9, 0.3, '#e9eef5'], [-0.3, 1.05, -0.2, '#9fd0f0'], [-0.42, 1.25, 0.6, '#e9eef5']].map(([x, z, r, c], i) => (<Cil key={'rl' + i} pos={[x as number, 0.05, z as number]} rot={[0, r as number, Math.PI / 2]} r={0.05} h={0.75} cor={c as string} seg={10} />))}
          <group position={[0.75, 0.02, 1.0]} rotation={[0, -0.4, 0]}>
            <Caixa tam={[0.32, 0.02, 0.45]} cor="#8b5a3c" />
            <BoxT pos={[0, 0.015, 0.02]} tam={[0.28, 0.005, 0.36]} cor="#ffffff" map={texPlanta()} mu={0.28} mv={0.36} sombra={false} />
            <Caixa pos={[0, 0.02, -0.2]} tam={[0.12, 0.02, 0.04]} cor="#9aa0aa" />
          </group>
          {[0, 1].map((i) => (
            <group key={'am' + i} position={[1.55, 0.1 + i * 0.2, 0.55 - i * 0.05]}>
              <Caixa tam={[0.9, 0.18, 0.45]} cor="#b98a5b" />
              {[0, 1, 2, 3].map((j) => (<Cil key={j} pos={[-0.33 + j * 0.22, 0.09, 0]} rot={[Math.PI / 2, 0, 0]} r={0.05} h={0.4} cor={['#b8643a', '#c99a5b', '#d8c27a', '#8d8a80'][(i + j) % 4]} seg={8} />))}
            </group>
          ))}
          <mesh position={[-1.5, 0.12, 0.7]} rotation={[0.2, 0, 0.3]}><sphereGeometry args={[0.16, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#ffd23f" /></mesh>
          <Cone pos={[-1.75, 0, -0.2]} />
        </group>
        <Rotulo texto="65 kg" ancora={[19, alturaMartelo(t), 13]} sobe={0.9} lado={0.6} vis={p < 0.62 ? clamp01(p * 6 - 1.2) : 0} />
      </Raiz>
    ),
    cams: {
      geral: orb([19.5, 1.8, 13], -22, 18, 17, 13.5, 46),
      martelo: orb([19, 1.75, 13], -25, 6, 4.4, 3.4, 44, 10),
      tripe: orb([19.5, 2.4, 13], 95, 14, 10, 8.2, 46),
      projeto: orb([30, 0.7, 17.2], 4, 40, 6.9, 6.1, 46, 6),
    },
  },
  // sondagem em corte: o tubo descendo pelas camadas do solo
  vdSolo: {
    luz: 'dia',
    render: ({t, p}) => {
      const d = lerp(4, 13, p);
      const golpes = 6 + Math.floor((t * 1.1) % 30);
      return (
        <Raiz>
          <Ambiente luz="dia" c={[0, -6, -4]} r={30} nevoa={NEVOA_DIA} />
          <SoloCorte x={[-14, 14]} z0={-14} zc={0} fundo={26} />
          <FundoCorte />
          <TripeSPT pos={[0, 0, 0]} t={t} />
          <Cil pos={[0, -d / 2, 0.0]} r={0.07} h={d} cor="#3a3d44" seg={8} />
          <Cil pos={[0, -d - 0.35, 0.0]} r={0.1} h={0.7} cor="#e8402f" seg={8} />
          {/* furo anterior (concluído), com a régua */}
          <Cil pos={[-7, -9, 0]} r={0.05} h={18} cor="#3a2a1d" seg={6} />
          <Boneco pos={[1.6, 0, -1.2]} rotY={-1.0} acao="carrega" t={t} v={OBREIRO_VD} />
          <Boneco pos={[-2.4, 0, -2.2]} rotY={0.6} acao="aponta" t={t} v={ENGENHEIRA} ferramenta="planta" />
          <Rotulo texto={`GOLPES: ${golpes}`} ancora={[0, 1.4, 0]} sobe={1.6} lado={-3.4} fundo="#ffd23f" />
          <Rotulo texto="ARGILA" ancora={[3.5, -3, 0]} sobe={0.6} lado={0.6} tam={0.8} />
        </Raiz>
      );
    },
    cams: {corte: orb([0, -4, 0], 14, 10, 24, 20, 50, -8)},
  },
  // ===== desvio do trânsito de madrugada =====
  vdDesvio: {
    luz: 'nublado',
    ceu: CEU_NOITE,
    noite: true,
    render: ({t, p}) => {
      const cones: V3[] = [];
      for (let z = -60; z <= 40; z += 3) {
        const k = clamp01((z + 60) / 22);
        const x = lerp(11, 4.4, k);
        if (z <= 40 * suave(p * 2 + 0.3) + 0) cones.push([x, 0, z]);
      }
      return (
        <Raiz>
          <Ambiente luz="noite" c={[4, 0, -10]} r={50} nevoa={NEVOA_NOITE} />
          <Cidade fase="obra" noite />
          <TransitoAvenida t={t} noite desvio fechadas={2} densidade={0.8} />
          {cones.map((c, i) => (<Cone key={i} pos={c} />))}
          <CaminhaoSeta pos={[7.7, 0, -62]} t={t} />
          {[-1, 1].map((s) => (<Tapume key={s} a={[12, s * 14]} b={[120, s * 14]} />))}
          {[-1, 1].map((s) => (<Tapume key={'b' + s} a={[-12, s * 14]} b={[-22.8, s * 14]} />))}
          {[-1, 1].map((s) => (<Tapume key={'c' + s} a={[-32.2, s * 14]} b={[-120, s * 14]} />))}
          <Cavalete pos={[7.7, 0, -8]} noite t={t} />
          <Cavalete pos={[7.7, 0, 18]} noite t={t} />
          <TorreLuz pos={[13.5, 0.15, -6]} rotY={Math.PI} />
          <TorreLuz pos={[-13.5, 0.15, 8]} />
          <Placa pos={[12.5, 0.15, -40]} rotY={-Math.PI / 2} texto="DESVIO ←" fundo="#ff8a1f" />
          <Placa pos={[12.5, 0.15, -25]} rotY={-Math.PI / 2} texto="OBRA À NOITE" fundo="#ffd23f" />
          <Boneco pos={[8.5, 0, -30]} rotY={-0.4} acao="acena" t={t} v={OPERARIO_NOITE} />
          <Boneco pos={[9.6, 0, -2]} rotY={-1.2} acao="aponta" t={t} v={OPERARIO_NOITE} />
          <Boneco pos={[6.0, 0, 6]} rotY={2.6} acao="parado" t={t} v={ENGENHEIRA} />
          <pointLight position={[8, 9, -6]} intensity={2.2} distance={45} decay={0} color="#fff3d6" />
          <pointLight position={[-8, 9, 8]} intensity={1.6} distance={40} decay={0} color="#fff3d6" />
        </Raiz>
      );
    },
    cams: {
      geral: orb([3, 0, -18], 36, 32, 62, 50, 46, 8),
      cones: orb([6, 1.2, -36], 165, 7, 15, 11.5, 46, 8),
    },
  },
  // ===== estacas: perfuratriz hélice contínua =====
  vdEstaca: {
    luz: 'dia',
    render: ({t, p}) => {
      const prof = 22 * suave(p / 0.6);
      const xa = 17.5 + 2.4, za = 5.5 + 1.2;
      const feitas: [number, number][] = [];
      [17.5, 52.5, 87.5].forEach((x) => [-1, 1].forEach((s) => ESTACAS_BLOCO.forEach(([dx, dz], i) => {
        if (x === 17.5 && s > 0 && i >= 2) return;
        feitas.push([x + dx, s * VD.zPilar + dz]);
      })));
      return (
        <Raiz>
          <Ambiente luz="dia" c={[22, 0, 4]} r={45} nevoa={NEVOA_DIA} />
          <Cidade fase="obra" />
          <TransitoAvenida t={t} />
          {[-1, 1].map((s) => (<Tapume key={s} a={[12, s * 14]} b={[120, s * 14]} />))}
          <Perfuratriz pos={[xa, 0, za - 3.6]} t={t} prof={prof} />
          {/* terra que a rosca tira */}
          <MonteTerra pos={[xa + 1.3, 0, za + 0.3]} esc={0.6 + prof / 30} cor="#a9652f" />
          <MonteTerra pos={[xa - 1.2, 0, za + 0.6]} esc={0.4 + prof / 40} cor="#b8743a" />
          {/* cabeças das estacas já concretadas, com ferragem de espera */}
          {feitas.map(([x, z], i) => (
            <group key={i}>
              <Cil pos={[x, 0.25, z]} r={VD.rEst} h={0.5} cor="#b7b1a6" seg={12} />
              {[0, 1, 2, 3, 4, 5].map((j) => (<Barra key={j} a={[x + Math.cos(j) * 0.28, 0.1, z + Math.sin(j) * 0.28]} b={[x + Math.cos(j) * 0.28, 1.6, z + Math.sin(j) * 0.28]} r={0.02} cor="#8a4b2f" sombra={false} />))}
            </group>
          ))}
          <Betoneira pos={[30, 0, 10]} rotY={-Math.PI / 2 - 0.3} t={t} />
          <Barra a={[27, 0.3, 9]} b={[xa + 0.4, 0.3, za - 1]} r={0.08} cor="#1d1b26" />
          <Boneco pos={[xa - 2.3, 0, za + 0.6]} rotY={1.2} acao="aponta" t={t} v={OBREIRO_VD} />
          <Boneco pos={[xa + 2.5, 0, za + 0.9]} rotY={-0.9} acao="cava" t={t} v={SERVENTE} ferramenta="pa" />
          <Boneco pos={[26, 0, 4]} rotY={-1.2} acao="parado" t={t} v={ENGENHEIRA} ferramenta="planta" />
          {/* frente 2 (blocos do pilar de 52,5 m): segunda perfuratriz parada, gaiolas de ferragem e equipe */}
          <Perfuratriz pos={[38, 0, -9]} rotY={0} t={t} prof={0} girando={false} />
          {[0, 1, 2].map((i) => (
            <group key={'gai' + i} position={[67.5 - i * 0.2, 0.42 + (i === 2 ? 0.75 : 0), 4.2 + (i === 2 ? 0.95 : i * 1.9)]} rotation={[0, Math.PI / 2 + 0.15, 0]}>
              {Array.from({length: 10}).map((_, k) => {
                const a = (k / 10) * Math.PI * 2;
                return <Barra key={k} a={[-3, Math.cos(a) * 0.36, Math.sin(a) * 0.36]} b={[3, Math.cos(a) * 0.36, Math.sin(a) * 0.36]} r={0.016} cor="#8a4b2f" />;
              })}
              {[-2.7, -2.1, -1.5, -0.9, -0.3, 0.3, 0.9, 1.5, 2.1, 2.7].map((dx) => (<mesh key={dx} position={[dx, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow><torusGeometry args={[0.37, 0.012, 6, 20]} /><meshStandardMaterial color="#6f3a22" /></mesh>))}
            </group>
          ))}
          <Boneco pos={[50.5, 0, 3.2]} rotY={0.9} acao="aponta" t={t} v={OBREIRO_VD} />
          <Boneco pos={[54.2, 0, 2.6]} rotY={1.2} acao="carrega" t={t + 0.4} v={SERVENTE} />
          <Boneco pos={[51.3, 0, 5.5]} rotY={1.3} acao="parado" t={t} v={ENGENHEIRA} ferramenta="planta" />
          {[0, 1, 2, 3].map((i) => (<Cone key={'cn' + i} pos={[44 + i * 4, 0, 12.6]} />))}
          <Basculante pos={[46, 0, -10]} rotY={-Math.PI / 2} carga="#a9652f" />
          <MonteTerra pos={[64.5, 0, 9.5]} esc={2.2} cor="#a9652f" />
          <Rotulo texto="ROSCA" ancora={[xa, 2.2, za]} sobe={1.4} lado={1.6} vis={p < 0.42 ? clamp01(p * 8 - 0.6) : 0} />
        </Raiz>
      );
    },
    cams: {
      rosca: orb([20.2, 1.9, 7.0], 36, 15, 15.5, 12.5, 46, 10),
      campo: orb([60, 1.0, 4], 74, 14, 15.5, 12.5, 46, 8),
    },
  },
  // estaca em corte: a rosca desce 22 m e sobe enchendo o furo de concreto
  vdEstacaCorte: {
    luz: 'dia',
    render: ({t, p}) => {
      const desce = suave(p / 0.35);
      const sobe = suave((p - 0.4) / 0.6);
      const prof = 22 * desce * (1 - sobe);
      const concreto = 22 * sobe; // coluna de concreto a partir do fundo
      return (
        <Raiz>
          <Ambiente luz="dia" c={[0, -6, -4]} r={34} nevoa={NEVOA_DIA} />
          <SoloCorte x={[-14, 14]} z0={-14} zc={0} fundo={27} />
          <FundoCorte />
          <Perfuratriz pos={[0, 0, -3.6]} t={t} prof={prof} girando={p < 0.38 || p > 0.42} />
          {concreto > 0.05 && <Cil pos={[0, -22 + concreto / 2, 0]} r={VD.rEst} h={concreto} cor="#a8a49c" seg={14} />}
          {/* furo vazio acima do trado enquanto ele desce (paredes escuras) */}
          {prof > 0.1 && <Cil pos={[0, -Math.min(prof, 22) / 2, -0.05]} r={VD.rEst + 0.02} h={Math.min(prof, 22)} cor="#3a2a1d" seg={14} />}
          {/* estacas vizinhas: uma pronta, outra só marcada */}
          <Cil pos={[-2.4, -11, 0]} r={VD.rEst} h={22} cor="#b7b1a6" seg={14} />
          <Cil pos={[-4.8, -11, 0]} r={VD.rEst} h={22} cor="#b7b1a6" seg={14} />
          <Barra a={[6, 0.2, -2]} b={[0.5, 0.3, -2.5]} r={0.08} cor="#1d1b26" />
          <Betoneira pos={[9, 0, -6]} rotY={-Math.PI / 2} t={t} />
          <Boneco pos={[-2.5, 0, -2]} rotY={0.5} acao="aponta" t={t} v={OBREIRO_VD} />
          <Barra a={[2.2, -0.2, 0.3]} b={[2.2, -22, 0.3]} r={0.07} cor="#ffd23f" sombra={false} />
          <Rotulo texto="22 m" ancora={[2.2, -9, 0.3]} sobe={0.3} lado={2.6} fundo="#ffd23f" vis={clamp01(p * 6 - 1.5)} />
          <Rotulo texto="CONCRETO" ancora={[0, -22 + concreto * 0.6, 0]} sobe={0.4} lado={-3.4} vis={clamp01((p - 0.5) * 6)} />
        </Raiz>
      );
    },
    cams: {corte: {de: [10, 6, 34], para: [8, -6, 30], alvo: [0, 2, -2], alvoPara: [0, -11, -2], fov: 52}},
  },
  // ===== bloco de coroamento: fôrma de madeira, ferragem e concreto subindo =====
  vdBloco: {
    luz: 'dia',
    render: ({t, p}) => {
      const x = 17.5, z = -5.5;
      const nivel = BLOCO.h * suave((p - 0.15) / 0.75);
      return (
        <Raiz>
          <Ambiente luz="dia" c={[x, 0, z]} r={35} nevoa={NEVOA_DIA} />
          <Cidade fase="obra" />
          <TransitoAvenida t={t} />
          {/* fôrma de madeira */}
          {[[0, BLOCO.d / 2 + 0.04, BLOCO.w + 0.16, 0.08], [0, -BLOCO.d / 2 - 0.04, BLOCO.w + 0.16, 0.08]].map(([dx, dz, w, d], i) => (<BoxT key={i} pos={[x + dx, BLOCO.h / 2 + 0.1, z + dz]} tam={[w, BLOCO.h + 0.2, d]} cor="#c08a52" map={texConcreto()} mu={1.2} mv={1.2} />))}
          {[-1, 1].map((s) => (<BoxT key={'l' + s} pos={[x + s * (BLOCO.w / 2 + 0.04), BLOCO.h / 2 + 0.1, z]} tam={[0.08, BLOCO.h + 0.2, BLOCO.d]} cor="#c08a52" map={texConcreto()} mu={1.2} mv={1.2} />))}
          {[-3, -1, 1, 3].map((dx) => [-1, 1].map((s) => (<Barra key={dx + ':' + s} a={[x + dx, 0, z + s * (BLOCO.d / 2 + 1.0)]} b={[x + dx, BLOCO.h, z + s * (BLOCO.d / 2 + 0.1)]} r={0.05} quadrada cor="#a77a48" />)))}
          {/* ferragem (malha) */}
          {Array.from({length: 13}).map((_, i) => (<Barra key={'mx' + i} a={[x - BLOCO.w / 2 + 0.2 + i * 0.58, 0.2, z - BLOCO.d / 2 + 0.15]} b={[x - BLOCO.w / 2 + 0.2 + i * 0.58, 0.2, z + BLOCO.d / 2 - 0.15]} r={0.016} cor="#8a4b2f" sombra={false} />))}
          {Array.from({length: 8}).map((_, i) => (<Barra key={'mz' + i} a={[x - BLOCO.w / 2 + 0.15, 0.25, z - BLOCO.d / 2 + 0.2 + i * 0.6]} b={[x + BLOCO.w / 2 - 0.15, 0.25, z - BLOCO.d / 2 + 0.2 + i * 0.6]} r={0.016} cor="#8a4b2f" sombra={false} />))}
          {Array.from({length: 13}).map((_, i) => (<Barra key={'sx' + i} a={[x - BLOCO.w / 2 + 0.2 + i * 0.58, BLOCO.h - 0.15, z - BLOCO.d / 2 + 0.15]} b={[x - BLOCO.w / 2 + 0.2 + i * 0.58, BLOCO.h - 0.15, z + BLOCO.d / 2 - 0.15]} r={0.016} cor="#8a4b2f" sombra={false} />))}
          {/* cabeças das estacas */}
          {ESTACAS_BLOCO.map(([dx, dz], i) => (<Cil key={'e' + i} pos={[x + dx, 0.2, z + dz]} r={VD.rEst} h={0.4} cor="#b7b1a6" seg={12} />))}
          {/* espera do pilar */}
          {Array.from({length: 16}).map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            return <Barra key={'p' + i} a={[x + Math.cos(a) * 0.7, 0.3, z + Math.sin(a) * 0.7]} b={[x + Math.cos(a) * 0.7, BLOCO.h + 2.4, z + Math.sin(a) * 0.7]} r={0.016} cor="#8a4b2f" />;
          })}
          {/* concreto subindo */}
          {nivel > 0.02 && <BoxT pos={[x, nivel / 2, z]} tam={[BLOCO.w, nivel, BLOCO.d]} cor="#a8a49c" map={texConcreto()} />}
          <Betoneira pos={[x + 1, 0, z - 9.2]} rotY={0} t={t} bica />
          <Boneco pos={[x - 2.5, BLOCO.h + 0.2, z + BLOCO.d / 2 + 0.05]} rotY={Math.PI} acao="martela" t={t} v={OBREIRO_VD} />
          <Boneco pos={[x + 2.2, 0, z + BLOCO.d / 2 + 1.0]} rotY={Math.PI + 0.3} acao="aponta" t={t} v={SERVENTE} />
          <Boneco pos={[x - 5.2, 0, z + 0.4]} rotY={1.6} acao="parado" t={t} v={ENGENHEIRA} ferramenta="planta" />
          <PilarObra x={17.5} z={5.5} k={0} t={t} />
          <PilaresProntos exceto={17.5} k={0.25} />
          <Rotulo texto="BLOCO" ancora={[x, BLOCO.h + 0.1, z + BLOCO.d / 2]} sobe={2.0} lado={0.4} vis={clamp01(p * 5 - 0.5)} />
        </Raiz>
      );
    },
    cams: {geral: orb([17.5, 1.2, -5.5], 38, 30, 15, 11.5, 46, 8)},
  },
  // ===== pilares subindo =====
  vdPilar: {
    luz: 'dia',
    render: ({t, p}) => (
      <Raiz>
        <Ambiente luz="dia" c={[17.5, 4, 0]} r={60} nevoa={NEVOA_DIA} />
        <Cidade fase="obra" />
        <TransitoAvenida t={t} />
        <Viaduto bloco={1} pilar={0} trav={0} vigas={0} prelaje={0} laje={0} asfalto={0} barreira={0} postes={0} rampa={0} />
        <PilarObra x={17.5} z={5.5} k={lerp(0.25, 1, p)} t={t} andaime />
        <PilarObra x={17.5} z={-5.5} k={lerp(0.1, 1, p)} t={t} />
        <PilarObra x={52.5} z={5.5} k={1} t={t} />
        <PilarObra x={52.5} z={-5.5} k={1} t={t} />
        <PilarObra x={-17.5} z={5.5} k={lerp(0.5, 1, p)} t={t} />
        <PilarObra x={-17.5} z={-5.5} k={lerp(0.4, 1, p)} t={t} />
        <PilarObra x={-52.5} z={5.5} k={1} t={t} />
        <PilarObra x={-52.5} z={-5.5} k={lerp(0.7, 1, p)} t={t} />
        <Bomba pos={[24, 0, 12]} rotY={Math.PI / 2} alvo={[17.5, (yTopoTrav(17.5) - VD.trav) * lerp(0.25, 1, p) + 2.4, 5.5]} />
        <Betoneira pos={[24, 0, 22.5]} rotY={Math.PI} t={t} />
        <Boneco pos={[20, 0, 8]} rotY={-2.2} acao="aponta" t={t} v={ENGENHEIRA} />
        {p < 0.99 && <Barra a={[19.2, 0.2, 5.5]} b={[19.2, yTopoTrav(17.5) - VD.trav, 5.5]} r={0.05} cor="#ffd23f" sombra={false} />}
        <Rotulo texto="7 m" ancora={[19.2, (yTopoTrav(17.5) - VD.trav) * 0.6, 5.5]} sobe={0.2} lado={1.4} vis={p < 0.99 ? clamp01(p * 3 - 1.2) : 0} fundo="#ffd23f" />
      </Raiz>
    ),
    cams: {
      forma: orb([17.5, 4.6, 5.5], -38, 12, 19, 15.5, 48, 10),
      fileira: orb([0, 3, 0], -80, 9, 88, 76, 40, 6),
    },
  },
  // ===== a surpresa: o que está debaixo da terra (corte com pilar + estaca) =====
  vdRaiz: {
    luz: 'dia',
    render: ({t}) => {
      const x0 = 0;
      const yt = yTopoTrav(17.5);
      return (
        <Raiz>
          <Ambiente luz="dia" c={[0, -5, -6]} r={40} nevoa={NEVOA_DIA} />
          <SoloCorte x={[-32, 32]} z0={-16} zc={0} fundo={30} topo="#bdb6a8" />
          <FundoCorte x={[-18, 18]} />
          {/* estacas e bloco (cortados ao meio na face) */}
          {[-2.4, 0, 2.4].map((dx) => (<Cil key={dx} pos={[x0 + dx, -BLOCO.h - VD.prof / 2 + 0.25, 0]} r={VD.rEst} h={VD.prof} cor="#c7c1b6" seg={14} />))}
          <Bx x={[x0 - BLOCO.w / 2, x0 + BLOCO.w / 2]} y={[-BLOCO.h + 0.25, 0.25]} z={[-BLOCO.d, 0.02]} />
          {/* pilar, travessa, vigas e tabuleiro (trecho de um vão) */}
          <Cil pos={[x0, (yt - VD.trav) / 2 + 0.25, -0.9]} r={VD.rPilar} h={yt - VD.trav - 0.1} cor={corConcreto} seg={16} />
          <Bx x={[x0 - 1, x0 + 1]} y={[yt - VD.trav, yt]} z={[-10, 0.6]} />
          {[-1, 1].map((s) => (
            <group key={s}>
              <group position={[x0 + s * 17.5, yFundoViga(17.5) + VD.viga / 2, -0.6]}><VigaI len={34.2} /></group>
              <SegX x0={x0 + s * 0.05} x1={x0 + s * 35} y0={Y_TOPO - VD.laje / 2} y1={Y_TOPO - VD.laje / 2} z={-6} w={12} h={VD.laje} cor={corConcreto} />
              <SegX x0={x0 + s * 0.05} x1={x0 + s * 35} y0={Y_TOPO + 0.035} y1={Y_TOPO + 0.035} z={-6} w={11} h={0.07} cor="#ffffff" map={texPista('tabuleiro')} mu={10} mv={19} />
              <group position={[x0 + s * 17.5, Y_TOPO, -0.2]}><NewJersey len={35} /></group>
            </group>
          ))}
          <Carro pos={[((t * 12) % 60) - 30, Y_TOPO + 0.05, -2.5]} rotY={Math.PI / 2} cor="#e8402f" />
          <Carro pos={[30 - ((t * 10) % 60), Y_TOPO + 0.05, -6]} rotY={-Math.PI / 2} cor="#2f6fd6" tipo="suv" />
          {/* réguas: 7 m de pilar × 22 m de estaca */}
          <Barra a={[x0 + 3.2, 0.3, 0.3]} b={[x0 + 3.2, yt - VD.trav, 0.3]} r={0.06} cor="#ffd23f" sombra={false} />
          <Barra a={[x0 + 4.2, -BLOCO.h + 0.25, 0.3]} b={[x0 + 4.2, -BLOCO.h + 0.25 - VD.prof, 0.3]} r={0.08} cor="#ff5d5d" sombra={false} />
          <Rotulo texto="PILAR 7 m" ancora={[x0 + 3.2, 4, 0.3]} sobe={0.3} lado={2.6} />
          <Rotulo texto="ESTACA 22 m" ancora={[x0 + 4.2, -5, 0.3]} sobe={0.3} lado={3.6} fundo="#ffd23f" />
          <Boneco pos={[x0 - 6, 0.0, -1.5]} rotY={0.4} acao="aponta" t={t} v={OBREIRO_VD} />
        </Raiz>
      );
    },
    cams: {desce: {de: [16, 2, 44], para: [12, -6, 40], alvo: [0, -3, -2], alvoPara: [0, -7, -2], fov: 56}},
  },
  // ===== carreta trazendo a viga de madrugada =====
  vdCarreta: {
    luz: 'nublado',
    ceu: CEU_NOITE,
    noite: true,
    render: ({t, p}) => {
      const z = lerp(-80, -36, p);
      const pisca = Math.floor(t * 4) % 2 === 0;
      return (
        <Raiz>
          <Ambiente luz="noite" c={[4, 4, -40]} r={55} nevoa={NEVOA_NOITE} />
          <Cidade fase="obra" noite />
          <Viaduto vigas={2} prelaje={0} laje={0} asfalto={0} barreira={0} postes={0} rampa={0} noite />
          <TransitoAvenida t={t} noite fechadas={3} densidade={0.6} />
          <Carreta pos={[5.5, 0, z]} noite t={t} />
          <Rotulo texto="VIGA DE 35 m" ancora={[5.5, 3.9, z]} sobe={1.6} vis={clamp01((p - 0.55) * 8)} fundo="#ffd23f" />
          <pointLight position={[14, 7, z + 2]} intensity={3.2} distance={45} decay={0} color="#fff3d6" />
          <pointLight position={[0, 9, z - 4]} intensity={2.6} distance={30} decay={0} color="#fff3d6" />
          <pointLight position={[9, 5, z + 24]} intensity={2.4} distance={30} decay={0} color="#fff3d6" />
          {/* batedores com giroflex */}
          {[z + 28, z - 25].map((zz, i) => (
            <group key={i}>
              <Carro pos={[5.5, 0, zz]} cor="#f2f2f2" tipo="suv" noite />
              <Caixa pos={[5.5, 1.75, zz]} tam={[1.2, 0.15, 0.3]} cor={pisca === (i === 0) ? '#ffb000' : '#ff6a1a'} sombra={false} />
            </group>
          ))}
          <TorreLuz pos={[13.5, 0.15, -37]} rotY={Math.PI} />
          <TorreLuz pos={[-13.5, 0.15, -10]} />
          {[-1, 1].map((s) => (<Tapume key={s} a={[12, s * 14]} b={[120, s * 14]} />))}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (<Cone key={i} pos={[0.9 + (i % 2) * 0.1, 0, -70 + i * 8]} />))}
          <Boneco pos={[10, 0, -30]} rotY={-1.8} acao="acena" t={t} v={OPERARIO_NOITE} />
          <Boneco pos={[0.5, 0.2, -45]} rotY={1.4} acao="aponta" t={t} v={OPERARIO_NOITE} />
          <pointLight position={[8, 9, -30]} intensity={2.0} distance={45} decay={0} color="#fff3d6" />
          <pointLight position={[-8, 9, -10]} intensity={1.4} distance={40} decay={0} color="#fff3d6" />
        </Raiz>
      );
    },
    cams: {
      geral: orb([5.5, 2.8, -52], -14, 14, 25, 21, 46, 6),
      viga: {de: [21, 19, -96], para: [21, 19, -74], alvo: [5.5, 2, -57], alvoPara: [5.5, 2, -35], fov: 50},
    },
  },
  // ===== içamento com dois guindastes =====
  vdIcamento: {
    luz: 'nublado',
    ceu: CEU_NOITE,
    noite: true,
    render: ({t, p}) => {
      const {C, yaw, E1, E2} = vigaNoAr(p);
      const lingas = (E: V3, s: number): V3[] => [[E[0] - Math.cos(yaw) * 0.9 * s, E[1] + 0.9, E[2] + Math.sin(yaw) * 0.9 * s], [E[0] - Math.cos(yaw) * 2.4 * s, E[1] + 0.9, E[2] + Math.sin(yaw) * 2.4 * s]];
      return (
        <Raiz>
          <Ambiente luz="noite" c={[0, 6, 6]} r={60} nevoa={NEVOA_NOITE} />
          <Cidade fase="obra" noite />
          <Viaduto vigas={4.5} prelaje={0} laje={0} asfalto={0} barreira={0} postes={0} rampa={0} noite />
          <Carreta pos={[XC, 0, ZC0]} viga={false} noite t={t} />
          <group position={C} rotation={[0, yaw, 0]}><VigaI /></group>
          <Guindaste base={[26, 0, 26]} alvo={[E1[0], E1[1] + 6, E1[2]]} cargas={lingas(E1, 1)} />
          <Guindaste base={[-24, 0, -18]} alvo={[E2[0], E2[1] + 6, E2[2]]} cargas={lingas(E2, -1)} cor="#ff8a1f" />
          <TorreLuz pos={[13.5, 0.15, 16]} rotY={Math.PI} />
          <TorreLuz pos={[-13.5, 0.15, 14]} />
          <TorreLuz pos={[13.5, 0.15, -16]} rotY={Math.PI} />
          {[-1, 1].map((s) => (<Boneco key={s} pos={[s * 17.5 + 0.3, yTopoTrav(17.5) + 0.0, 3.0]} rotY={s > 0 ? -Math.PI / 2 : Math.PI / 2} acao="aponta" t={t} v={OPERARIO_NOITE} />))}
          <Boneco pos={[8, 0, 12]} rotY={-0.6} acao="acena" t={t} v={OPERARIO_NOITE} />
          <Boneco pos={[-3, 0, 16]} rotY={0.8} acao="aponta" t={t} v={ENGENHEIRA} />
          <pointLight position={[0, 16, 14]} intensity={2.4} distance={60} decay={0} color="#fff3d6" />
          <pointLight position={[0, 14, -14]} intensity={1.4} distance={50} decay={0} color="#fff3d6" />
          <Rotulo texto="60 t" ancora={[C[0], C[1] + 1, C[2]]} sobe={2.0} vis={p < 0.6 ? clamp01(p * 5) : 0} fundo="#ffd23f" />
        </Raiz>
      );
    },
    cams: {
      geral: orb([4, 11, 14], 62, 16, 54, 45, 48, 8),
      gancho: orb([7, 13, 15], -45, 22, 36, 30, 50, 10),
      encaixe: orb([15, 9.6, 1.25], -55, 30, 19, 15.5, 46, 8),
    },
  },
  // ===== tabuleiro: pré-lajes, ferragem e concreto bombeado =====
  vdTabuleiro: {
    luz: 'dia',
    render: ({t, p}) => {
      const lj = lerp(0.4, 0.55, p);
      const xf = lerp(-88, 88, lj);
      const yf = yTop(xf);
      const fila = p >= 0.35 && p < 0.75; // faixa de p do plano da fila de betoneiras
      return (
        <Raiz>
          <Ambiente luz="dia" c={[xf, 6, 4]} r={50} nevoa={NEVOA_DIA} />
          {/* no plano da fila (p 0,35–0,75) as árvores da calçada saem para não tapar as betoneiras */}
          <Cidade fase="obra" excluir={fila ? {x: [-17, -11], z: [24, 90]} : undefined} />
          <TransitoAvenida t={t} densidade={0.7} />
          <Viaduto vigas={5} prelaje={1} laje={lj} asfalto={0} barreira={0} postes={0} rampa={0.6} />
          {/* malha de aço à frente da concretagem */}
          {Array.from({length: 22}).map((_, i) => (<Barra key={'a' + i} a={[xf + 0.2 + i * 0.55, yf - 0.06, -10.2]} b={[xf + 0.2 + i * 0.55, yf - 0.06, 10.2]} r={0.016} cor="#8a4b2f" sombra={false} />))}
          {Array.from({length: 34}).map((_, i) => (<Barra key={'b' + i} a={[xf + 0.1, yf - 0.04, -10 + i * 0.6]} b={[xf + 12.2, yf - 0.04, -10 + i * 0.6]} r={0.016} cor="#8a4b2f" sombra={false} />))}
          {/* frente de concreto fresco */}
          <Caixa pos={[xf - 0.3, yf + 0.02, 0]} tam={[0.6, 0.06, 20.6]} cor="#8f8a80" />
          <Bomba pos={[-14, 0, 22]} rotY={0} alvo={[xf - 0.4, yf, 4]} />
          <Betoneira pos={[-14, 0, 31]} rotY={Math.PI} t={t} />
          {/* fila de caminhões-betoneira esperando a vez (quase 200 na laje inteira) */}
          {[0, 1, 2, 3].map((i) => (<Betoneira key={'fila' + i} pos={[-18.2 + (i % 2) * 0.4, 0, 39 + i * 9.5]} rotY={Math.PI} t={t + i} />))}
          <Boneco pos={[-16.0, 0, 35.5]} rotY={0.6} acao="acena" t={t} v={OBREIRO_VD} />
          {/* concreto fresco (escuro, molhado) logo atrás da frente e manta de cura sobre o trecho mais antigo */}
          <Caixa pos={[xf - 3.4, yf + 0.02, 0]} tam={[6.2, 0.03, 20.4]} cor="#9a958b" sombra={false} />
          {[0, 1, 2, 3, 4].map((i) => (<Caixa key={'rg' + i} pos={[xf - 1.2 - i * 1.2, yf + 0.04, 0]} tam={[0.05, 0.01, 20.2]} cor="#86817a" sombra={false} />))}
          {[10, 16, 22].map((d, i) => (<Caixa key={'mc' + i} pos={[xf - d, yf + 0.02, 0]} tam={[3.2, 0.025, 20.0]} cor={i % 2 ? '#c9a66b' : '#b8945a'} sombra={false} />))}
          {/* guarda-corpo provisório nas bordas */}
          {[-1, 1].map((sz) => (
            <group key={'gc' + sz}>
              {Array.from({length: 22}).map((_, i) => (<Barra key={i} a={[xf - 30 + i * 2, yf, sz * 10.35]} b={[xf - 30 + i * 2, yf + 1.1, sz * 10.35]} r={0.03} cor="#2b2b30" />))}
              <Barra a={[xf - 30, yf + 1.1, sz * 10.35]} b={[xf + 12, yf + 1.1, sz * 10.35]} r={0.03} cor="#ffd23f" />
              <Barra a={[xf - 30, yf + 0.55, sz * 10.35]} b={[xf + 12, yf + 0.55, sz * 10.35]} r={0.025} cor="#ff8a1f" />
            </group>
          ))}
          {/* mangote do concreto no chão da laje e vibrador */}
          <Barra a={[xf - 0.4, yf + 0.25, 4]} b={[xf - 2.5, yf + 0.08, 6.5]} r={0.1} cor="#1d1b26" />
          <Barra a={[xf - 1.8, yf + 0.9, -1.5]} b={[xf - 1.2, yf + 0.05, -1.2]} r={0.03} cor="#ff8a1f" />
          {/* feixes de vergalhão e caixa de ferramentas sobre a pré-laje à frente */}
          {[0, 1].map((i) => (<group key={'fx' + i}>{[0, 1, 2, 3, 4].map((k) => (<Barra key={k} a={[xf + 5 + i * 3, yf + 0.08 + (k % 2) * 0.05, 7.2 + k * 0.06]} b={[xf + 5 + i * 3, yf + 0.08 + (k % 2) * 0.05, 9.6 + k * 0.06]} r={0.018} cor="#8a4b2f" />))}</group>))}
          <Caixa pos={[xf + 3, yf + 0.15, -8]} tam={[0.6, 0.3, 0.35]} cor="#e8402f" />
          {[[-3, 'martela'], [1, 'pinta'], [p >= 0.75 ? -5.2 : 5, 'aponta'], [-7, 'carrega']].map(([z, a], i) => (<Boneco key={i} pos={[xf - 0.9 - (i % 2) * 0.8 - (p >= 0.75 && i === 2 ? 1.2 : 0), yf, z as number]} rotY={Math.PI / 2} acao={a as 'martela'} t={t + i} v={i === 2 ? ENGENHEIRA : OBREIRO_VD} />))}
          {/* régua vibratória */}
          <Barra a={[xf - 0.5, yf + 0.25, -8]} b={[xf - 0.5, yf + 0.25, 8]} r={0.05} quadrada cor="#ffd23f" />
          {fila ? <Rotulo texto="BETONEIRAS" ancora={[-18.2, 3.6, 39]} sobe={3.0} lado={0.6} /> : <Rotulo texto="TABULEIRO" ancora={p < 0.35 ? [xf + 6, yf + 0.05, 6] : [xf - 4, yf + 0.05, 7.5]} sobe={p < 0.35 ? 1.2 : 1.6} lado={p < 0.35 ? 1.2 : -1} />}
        </Raiz>
      );
    },
    cams: {
      bomba: orb([-8, 7.5, 6], 24, 22, 38, 30, 48, 8),
      // fila de betoneiras alimentando a bomba (pronta para o p22, se o roteiro trocar a câmera)
      fila: orb([-17.6, 2.6, 42], 28, 20, 36, 31, 46, -6),
      cima: orb([1, 10.6, 3], 55, 30, 30, 25, 46, 8),
    },
  },
  // ===== a junta de dilatação: o viaduto estica no calor =====
  vdJunta: {
    luz: 'dia',
    ceu: ['#ffc77a', '#fff1d0'],
    render: ({t, p}) => {
      const x = 17.5, y = yTop(x);
      const fecha = suave(p);
      const gap = lerp(0.14, 0.03, fecha); // no calor o tabuleiro estica e a junta fecha
      const temp = Math.round(lerp(18, 50, fecha));
      return (
        <Raiz>
          <Ambiente luz="quente" c={[x, 8, 0]} r={40} nevoa={['#fff1d0', 140, 360]} />
          <Cidade fase="pronto" />
          <Viaduto />
          <TransitoViaduto t={t * 0.7} />
          {/* junta: abertura escura + cantoneiras de aço + borracha */}
          <Caixa pos={[x, y + 0.075, 0]} tam={[gap, 0.03, 19.2]} cor="#1d1b26" sombra={false} />
          {/* folga atravessando a laje: aparece na borda do tabuleiro (vista em corte) */}
          <Caixa pos={[x, y - 0.1, 0]} tam={[gap, 0.36, 21.28]} cor="#14121a" sombra={false} />
          {[-1, 0, 1].map((s) => (<Caixa key={'nj' + s} pos={[x, y + 0.45, s * 9.85]} tam={[gap, 0.9, 0.42]} cor="#14121a" sombra={false} />))}
          {/* cantoneiras de aço na borda, dos dois lados da folga */}
          {[-1, 1].map((s) => (<Caixa key={'ct' + s} pos={[x + s * (gap / 2 + 0.05), y - 0.02, 10.64]} tam={[0.1, 0.16, 0.03]} cor="#ffd23f" sombra={false} />))}
          {/* operário de inspeção em cima da travessa, entre as cabeças das vigas */}
          <Boneco pos={[x - 0.72, yTopoTrav(x), 9.55]} rotY={0.9} acao="aponta" t={t} v={OBREIRO_VD} esc={0.95} />
          <Caixa pos={[x, yTopoTrav(x) + 0.02, 9.55]} tam={[1.9, 0.04, 0.5]} cor="#9aa0aa" />
          {[-1, 1].map((s) => (<Caixa key={s} pos={[x + s * (gap / 2 + 0.05), y + 0.08, 0]} tam={[0.1, 0.03, 19.2]} cor="#9aa0aa" sombra={false} />))}
          <Caixa pos={[x, y + 0.07, 0]} tam={[gap * 0.6, 0.02, 19.2]} cor="#2b2b30" sombra={false} />
          {/* termômetro de rua */}
          <group position={[x + 3, y + 0.87, 10.0]}>
            <Cil pos={[0, 1.5, 0]} r={0.06} h={3} cor="#7d838c" seg={6} />
            <BoxT pos={[0, 3.3, 0]} tam={[1.8, 0.8, 0.12]} cor="#ffffff" map={texLetreiro(`${temp}°C`, '#1d1b26', temp > 35 ? '#ff7a3a' : '#5fd0ff')} mu={1.8} mv={0.8} emis="#ffffff" emisMap={texLetreiro(`${temp}°C`, '#1d1b26', temp > 35 ? '#ff7a3a' : '#5fd0ff')} emisI={0.6} />
          </group>
          <Rotulo texto="JUNTA" ancora={[x, y + 0.1, 1.0]} sobe={1.6} lado={-1.2} fundo="#ffd23f" vis={p < 0.3 ? 1 : 0} />
          <Rotulo texto="ESTICA 11 cm" ancora={[x, y - 0.1, 10.7]} sobe={1.5} lado={-0.6} vis={p >= 0.3 ? 1 : 0} />
          <Rotulo texto="VIGA" ancora={[x - 1.2, yFundoViga(x) + 0.9, 9.3]} sobe={0.1} lado={-1.0} tam={0.7} vis={p >= 0.3 ? 1 : 0} />
          <Rotulo texto="VIGA" ancora={[x + 1.2, yFundoViga(x) + 0.9, 9.3]} sobe={0.1} lado={1.0} tam={0.7} vis={p >= 0.3 ? 1 : 0} />
        </Raiz>
      );
    },
    cams: {
      geral: orb([17.5, 10.6, -2.4], 90, 30, 25, 21, 46, 8),
      abre: orb([17.5, 9.4, 10.6], 8, 6, 9.0, 7.6, 46, 10),
    },
  },
  // ===== aparelho de apoio de neoprene, explodido =====
  vdApoio: {
    luz: 'dia',
    render: ({t, p}) => {
      const x = 17.5, yt = yTopoTrav(x);
      const ex = p < 0.8 ? suave(p / 0.6) : 1 - suave((p - 0.8) / 0.12);
      const camadas = 9; // 5 borrachas + 4 chapas de aço
      const Y0 = 1.42; // topo do berço
      return (
        <Raiz>
          <Ambiente luz="dia" c={[x, 8, 0]} r={30} nevoa={NEVOA_DIA} />
          <Cidade fase="pronto" predios={false} />
          <Viaduto />
          {/* maquete do apoio em tamanho real ao lado do pilar: topo do pilar, travessa, berço, neoprene e a ponta da viga que desce nele */}
          <group position={[x + 2.2, 0, 12.2]}>
            <Cil pos={[0, 0.45, 0]} r={0.42} h={0.9} cor={corConcreto} seg={16} />
            <Cil pos={[0, 0.3, 0]} r={0.43} h={0.03} cor="#a9a398" seg={16} />
            <BoxT pos={[0, 1.125, 0]} tam={[1.25, 0.45, 1.0]} cor={corConcreto} map={texConcreto()} mu={0.8} mv={0.4} />
            <Caixa pos={[0, 1.36, 0]} tam={[1.27, 0.02, 1.02]} cor="#a9a398" sombra={false} />
            {/* chumbadores e berço de argamassa */}
            {[[-0.4, -0.38], [0.4, -0.38], [-0.4, 0.38], [0.4, 0.38]].map(([dx, dz], i) => (<Cil key={'ch' + i} pos={[dx, 1.4, dz]} r={0.025} h={0.1} cor="#5a5f66" seg={6} />))}
            <Caixa pos={[0, 1.385, 0]} tam={[0.62, 0.05, 0.72]} cor="#8d8a80" />
            {Array.from({length: camadas}).map((_, i) => {
              const aco = i % 2 === 1;
              return (<Caixa key={i} pos={[0, Y0 + i * (0.022 + ex * 0.08), 0]} tam={[aco ? 0.38 : 0.4, aco ? 0.008 : 0.018, aco ? 0.48 : 0.5]} cor={aco ? '#d7dce4' : '#2b2b30'} />);
            })}
            {/* ponta da viga (cortada) que apoia no neoprene; sobe junto quando o apoio abre */}
            <group position={[0.15, Y0 + (camadas - 1) * (0.022 + ex * 0.08) + 0.03 + ex * 0.3, 0]}>
              <BoxT pos={[0, 0.11, 0]} tam={[0.85, 0.22, 0.75]} cor="#d3cec4" map={texConcreto()} mu={0.6} mv={0.25} />
              <BoxT pos={[0, 0.3, 0]} tam={[0.85, 0.16, 0.45]} cor="#d3cec4" map={texConcreto()} mu={0.6} mv={0.25} />
              <BoxT pos={[0, 0.45, 0]} tam={[0.85, 0.14, 0.2]} cor="#d3cec4" map={texConcreto()} mu={0.6} mv={0.25} />
              {/* face cortada (mais escura) e cordoalhas de protensão aparecendo */}
              <Caixa pos={[-0.43, 0.27, 0]} tam={[0.02, 0.5, 0.72]} cor="#a9a398" sombra={false} />
              {[-0.18, 0, 0.18].map((z) => (<Cil key={z} pos={[-0.45, 0.07, z]} rot={[0, 0, Math.PI / 2]} r={0.025} h={0.06} cor="#3a3d44" seg={6} />))}
            </group>
            <Boneco pos={[-0.95, 0, 0.3]} rotY={1.0} acao="aponta" t={t} v={OBREIRO_VD} />
            {/* caixa de ferramentas e chapa de reposição no chão */}
            <Caixa pos={[0.95, 0.15, 0.45]} tam={[0.5, 0.3, 0.28]} cor="#e8402f" />
            <Caixa pos={[0.95, 0.31, 0.45]} tam={[0.3, 0.03, 0.06]} cor="#2b2b30" />
            <Caixa pos={[0.9, 0.02, -0.45]} tam={[0.4, 0.03, 0.5]} cor="#2b2b30" />
          </group>
          <pointLight position={[17.5, yt - 0.6, 11.5]} intensity={1.6} distance={8} decay={0} color="#ffffff" />
          <Rotulo texto="NEOPRENE" ancora={[x + 2.2, 1.5, 12.45]} sobe={0.25} lado={0.9} vis={clamp01((p - 0.78) * 8)} fundo="#ffd23f" tam={0.8} />
        </Raiz>
      );
    },
    cams: {
      explodido: orb([19.45, 1.35, 12.3], 14, 10, 5.6, 4.8, 46, 10),
      close: orb([19.35, 1.15, 12.3], 24, 18, 5.8, 5.1, 44, -8),
    },
  },
  // ===== acabamento: asfalto, mureta New Jersey, postes =====
  vdAcabamento: {
    luz: 'tarde',
    ceu: CEU_TARDE,
    render: ({t, p}) => {
      const a = lerp(0.32, 0.58, clamp01(p / 0.45));
      const xf = lerp(-88, 88, a);
      const b = p < 0.45 ? 0.3 : lerp(0.4, 0.5, clamp01((p - 0.45) / 0.35));
      const xb = lerp(-88, 88, b);
      const postes = p < 0.8 ? 0.35 : lerp(0.35, 1, clamp01((p - 0.8) / 0.12));
      const aceso = p > 0.86;
      return (
        <Raiz>
          <Ambiente luz="tarde" c={[0, 8, 0]} r={60} nevoa={NEVOA_TARDE} />
          <Cidade fase="obra" />
          <TransitoAvenida t={t} />
          <Viaduto vigas={5} asfalto={a} barreira={b} postes={postes} aceso={aceso} rampa={1} />
          {/* vibroacabadoras e rolos na frente do asfalto */}
          {[-5, 4.5].map((z, i) => (
            <group key={z}>
              <Vibroacabadora pos={[xf + 2.5 - i * 2, yTop(xf), z]} t={t} />
              <Rolo pos={[xf - 8 - i * 3 + Math.sin(t * 1.5 + i) * 1.5, yTop(xf - 8), z]} giro={Math.sin(t * 1.5 + i) * 1.5 / 0.62} />
              <Basculante pos={[xf + 9 - i * 2, yTop(xf + 9), z]} rotY={-Math.PI / 2} carga="#2b2b30" />
              {/* rasteleiro atrás da mesa, longe da máquina */}
              <Boneco pos={[xf - 2.6 - i * 2, yTop(xf) + 0.08, z + (i ? -1.2 : 1.2)]} rotY={i ? 0.4 : Math.PI - 0.4} acao="cava" t={t + i} v={OBREIRO_VD} ferramenta="pa" />
            </group>
          ))}
          {/* faixa de asfalto recém-espalhado (quente, mais escuro) logo atrás das mesas */}
          {[-5, 4.5].map((z, i) => (<Caixa key={'aq' + i} pos={[xf - 1.5 - i * 2, yTop(xf) + 0.075, z]} tam={[3.2, 0.012, 3.9]} cor="#1a1a1f" sombra={false} />))}
          {/* frente da mureta: segmento sendo colocado */}
          <group position={[xb + 1.5, yTop(xb) + 2.5 - clamp01((p - 0.45) * 4) * 0, 9.85]}>
            <NewJersey len={3} />
          </group>
          <Barra a={[xb + 1.5, yTop(xb) + 3.4, 9.85]} b={[xb + 6, yTop(xb) + 9, 14]} r={0.03} cor="#2b2b30" sombra={false} />
          <Boneco pos={[xb + 0.2, yTop(xb), 8.6]} rotY={Math.PI / 2} acao="aponta" t={t} v={OBREIRO_VD} />
          <Boneco pos={[xb - 2.5, yTop(xb), 6.6]} rotY={Math.PI / 2} acao="martela" t={t} v={SERVENTE} />
          {/* caminhão munck no chão, ao lado do tabuleiro */}
          <Basculante pos={[xb + 6, 0, 17]} rotY={-Math.PI / 2} cor="#e8402f" carga="#e2ded6" />
          <Barra a={[xb + 6, 3, 17]} b={[xb + 6, yTop(xb) + 9, 14]} r={0.2} quadrada cor="#ffc21f" />
        </Raiz>
      );
    },
    cams: {
      asfalto: {de: [-36, 16, -20], para: [-2, 15, -20], alvo: [-30, 10.6, -2], alvoPara: [6, 10.6, -2], fov: 46},
      mureta: orb([-6, 11.4, 8.6], 262, 9, 15, 12, 46, 8),
      postes: orb([-5, 12, 0], 52, 16, 52, 42, 46, 8),
    },
  },
  // ===== rampas de terra armada e redes de gás e água remanejadas =====
  vdAcessos: {
    luz: 'dia',
    render: ({t, p}) => {
      const k = lerp(0.55, 1, p);
      const furo = {x: [104, 134] as [number, number], z: [11.5, 13.9] as [number, number]};
      const prof = 2.4;
      return (
        <Raiz>
          <Ambiente luz="dia" c={[115, 2, 6]} r={45} nevoa={NEVOA_DIA} />
          <Cidade fase="obra" furo={furo} />
          <Viaduto vigas={5} asfalto={0} barreira={0} postes={0} rampa={k} />
          {/* vala: paredes de terra, fundo, canos */}
          <BoxT pos={[119, -prof / 2, furo.z[0] - 0.1]} tam={[30, prof, 0.2]} cor="#b8743a" map={texConcreto()} mu={3} mv={3} />
          <BoxT pos={[119, -prof / 2, furo.z[1] + 0.1]} tam={[30, prof, 0.2]} cor="#b8743a" map={texConcreto()} mu={3} mv={3} />
          {[-1, 1].map((s) => (<BoxT key={s} pos={[119 + s * 15.1, -prof / 2, 12.7]} tam={[0.2, prof, 2.6]} cor="#b8743a" map={texConcreto()} mu={3} mv={3} />))}
          <Caixa pos={[119, -prof - 0.05, 12.7]} tam={[30.4, 0.1, 2.6]} cor="#8d6a45" />
          <BoxT pos={[119, -prof / 2, 11.39]} tam={[30, prof, 0.02]} cor="#b8743a" map={texConcreto()} mu={3} mv={3} />
          {/* adutora de água (azul), gás (amarelo) e eletrodutos (vermelho) entrando na vala */}
          <Cil pos={[lerp(104, 119, 1) - 15 + 15 * clamp01(p * 1.4), -prof + 0.45, 12.2]} rot={[0, 0, Math.PI / 2]} r={0.3} h={30 * clamp01(p * 1.4 + 0.3)} cor="#2f6fd6" seg={12} />
          <Cil pos={[119, -prof + 0.3, 13.2]} rot={[0, 0, Math.PI / 2]} r={0.15} h={30 * clamp01(p * 1.2 + 0.4)} cor="#ffd23f" seg={10} />
          {[-0.12, 0.12].map((dz) => (<Cil key={dz} pos={[119, -prof + 0.12, 12.8 + dz]} rot={[0, 0, Math.PI / 2]} r={0.06} h={30} cor="#e8402f" seg={8} />))}
          {/* cano sendo descido */}
          <Cil pos={[127, lerp(2.5, -prof + 0.45, clamp01(p * 1.6)), 15.5 - 3.3 * clamp01(p * 1.6)]} rot={[0, 0, Math.PI / 2]} r={0.3} h={6} cor="#2f6fd6" seg={12} />
          <Retro pos={[130, 0, 19]} t={t} rotY={Math.PI} />
          <Boneco pos={[110.5, -prof, 12.9]} rotY={Math.PI / 2 + 0.4} acao="martela" t={t} v={OBREIRO_VD} />
          <Boneco pos={[107.5, -prof, 13.0]} rotY={Math.PI / 2 + 0.3} acao="aponta" t={t} v={SERVENTE} />
          <Boneco pos={[111.6, 0, 14.1]} rotY={1.3} acao="parado" t={t} v={ENGENHEIRA} ferramenta="planta" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (<Cone key={i} pos={[104 + i * 4.2, 0, 14.6]} />))}
          {/* rampa: rolo compactando e caminhões */}
          <Rolo pos={[118 + Math.sin(t) * 4, (yTop(118) - 0.3) * k, -2]} />
          <Basculante pos={[140, (yTop(140) - 0.3) * k, 4]} rotY={-Math.PI / 2} incl={0} />
          <Basculante pos={[175, 0, 22]} rotY={-Math.PI / 2} cor="#e8402f" />
          <Placa pos={[104, 0, 16.5]} texto="GÁS · ÁGUA" fundo="#ffd23f" larg={2.2} />
          <Rotulo texto="GÁS" ancora={[110, -prof + 0.3, 13.2]} sobe={2.6} lado={-0.6} vis={p < 0.6 ? clamp01(p * 6 - 0.3) : 0} fundo="#ffd23f" tam={0.8} />
          <Rotulo texto="ÁGUA" ancora={[115, -prof + 0.45, 12.2]} sobe={3.2} lado={0.4} vis={p < 0.6 ? clamp01(p * 6 - 0.6) : 0} fundo="#9fd0f0" tam={0.8} />
          <TransitoAvenida t={t} />
          {/* camadas da rampa: base de brita compactada (escura) e faixa ainda solta à frente do rolo */}
          <SegX x0={89} x1={150} y0={(yTop(89) - 0.3) * k + 0.04} y1={(yTop(150) - 0.3) * k + 0.04} z={-2} w={9} h={0.06} cor="#6f6a62" map={texConcreto()} mu={8} mv={2} />
          <SegX x0={89} x1={150} y0={(yTop(89) - 0.3) * k + 0.04} y1={(yTop(150) - 0.3) * k + 0.04} z={6} w={6} h={0.08} cor="#b8a58a" map={texConcreto()} mu={8} mv={2} />
          {[95, 110, 125, 140].map((x) => [-9.6, 9.6].map((z) => (<Cil key={x + ':' + z} pos={[x, (yTop(x) - 0.3) * k + 0.5, z]} r={0.04} h={1.0} cor="#ff8a1f" seg={6} />)))}
          <Boneco pos={[112, (yTop(112) - 0.3) * k + 0.05, 3]} rotY={-1.2} acao="aponta" t={t} v={OBREIRO_VD} />
          <Boneco pos={[124, (yTop(124) - 0.3) * k + 0.05, -6.5]} rotY={-2} acao="cava" t={t} v={SERVENTE} ferramenta="pa" />
          <Rotulo texto="RAMPA" ancora={[118, (yTop(118) - 0.3) * k + 0.1, 8]} sobe={2.6} lado={0} vis={clamp01((p - 0.6) * 6)} />
        </Raiz>
      );
    },
    cams: {
      redes: orb([113, -1.6, 12.8], 76, 34, 17, 14, 46, 8),
      aereo: orb([96, 5, 0], 78, 6, 76, 66, 46, 5),
    },
  },
  // ===== 1 metro de viaduto × uma casa de 50 m² =====
  vdMetro: metro(false),
  vdMetroCasa: metro(true),
};
void Poste; void Predios; void texBloco; void Bx;
