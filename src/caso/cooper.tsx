// CENÁRIOS do "Caso Explicado: o sequestro do avião D.B. Cooper" (24/11/1971). Escala real (1 unidade = 1 m),
// menos o mapa (1 unidade ≈ 1 km). Cada set é um LUGAR do caso, com fundo, profundidade e 3+ elementos reconhecíveis.
// Nomes com prefixo db_ para não colidir com os sets do MH370 (src/caso/sets.tsx).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Barra, Boneco, Caixa, Chuva, Cil, Mat, Nuvem, CRIANCA} from '../v4/kit';
import {orb, Cam} from '../v4/sets';
import type {SetCaso} from './sets';
import {Palmeira, Pilula, ZeDetetive} from './pecas';
import {
  AGENTE, ATENDENTE, Arbusto, B727, CHAO727, COMISSARIA, COMISSARIA2, Carro, Chao, CaixaTx, Comissaria, Cooper, ESCADA_L, ESCADA_X,
  Floresta, Letreiro, Maco, Mala, PASSAGEIROS, PATIO, Paraquedas, Pasta, Pinheiro, Poltrona, Poste, R727, Sacola, TRIPULANTES, TX, angEscada,
  clamp01, lerp, rnd, suave, tela,
} from './cooper-pecas';

const trilho = (de: V3, para: V3, alvo: V3, alvoPara: V3, fov = 42): Cam => ({de, para, alvo, alvoPara, fov});
const CEU_NOITE: [string, string] = ['#070d22', '#2a3a66'];
const CEU_CHUVA: [string, string] = ['#0d1426', '#3a4660'];
const CEU_CREP: [string, string] = ['#1b2442', '#7a6a86'];

const Estrelas: React.FC<{n?: number; raio?: number}> = ({n = 400, raio = 900}) => {
  const pos = useMemo(() => {
    const r = rnd(77);
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = r() * Math.PI * 2, u = r() * 0.9 + 0.1, c = Math.sqrt(1 - u * u);
      a[i * 3] = Math.cos(th) * c * raio;
      a[i * 3 + 1] = u * raio;
      a[i * 3 + 2] = Math.sin(th) * c * raio;
    }
    return a;
  }, [n, raio]);
  return (
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial color="#dfe6ff" size={2} sizeAttenuation={false} />
    </points>
  );
};

// água com ondinhas (malha low-poly)
const Agua: React.FC<{t: number; tam: [number, number]; pos: V3; cor?: string; amp?: number}> = ({t, tam, pos, cor = '#3a6a8f', amp = 0.12}) => {
  const geo = useMemo(() => new THREE.PlaneGeometry(tam[0], tam[1], 48, 24).rotateX(-Math.PI / 2), [tam[0], tam[1]]);
  useMemo(() => {
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, Math.sin(x * 0.35 + t * 1.6) * amp + Math.cos(z * 0.5 + x * 0.1 + t * 1.1) * amp * 0.7);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  }, [geo, Math.round(t * 30), amp]);
  return <mesh geometry={geo} position={pos} receiveShadow><meshStandardMaterial color={cor} roughness={0.3} metalness={0.1} /></mesh>;
};

// chuva em qualquer altura (a Chuva do kit cai de y≈11,5 a −0,5)
const ChuvaEm: React.FC<{t: number; pos: V3; raio: number; n?: number}> = ({t, pos, raio, n = 600}) => (
  <group position={[0, pos[1], 0]}><Chuva t={t} centro={[pos[0], 0, pos[2]]} raio={raio} n={n} /></group>
);

// ============ 1. Balcão de passagens do aeroporto de Portland (1971) ============
const HB = 0.76; // altura do tampo do balcão (o Zé tem tronco curto: assim as mãos ficam acima do tampo)
const Balcao: React.FC<{t: number; p: number}> = ({t, p}) => {
  const nota = suave(clamp01(p * 1.6));
  return (
    <group>
      <Chao pos={[0, 0, 0]} tam={[18, 14]} map={TX.ladrilho([9, 7])} rough={0.35} />
      <CaixaTx pos={[0, 2.0, -5]} tam={[18, 4, 0.2]} map={TX.lambri([9, 2])} />
      <CaixaTx pos={[-8, 2.0, 1]} rot={[0, Math.PI / 2, 0]} tam={[12, 4, 0.2]} map={TX.lambri([6, 2])} />
      <Caixa pos={[0, 4.05, 0.5]} tam={[18, 0.1, 11]} cor="#e9e3d4" />
      {[-5, -1, 3].map((x) => (<mesh key={x} position={[x, 3.99, -0.5]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[2.4, 0.5]} /><meshBasicMaterial color="#fff6dc" toneMapped={false} side={2} /></mesh>))}
      {/* letreiro e quadro de partidas */}
      <Letreiro texto="PASSAGENS · VOOS" pos={[-0.5, 3.25, -4.88]} larg={5.2} alt={0.7} fundo="#c96a2a" cor="#ffffff" brilho />
      <group position={[4.6, 2.35, -4.86]}>
        <Caixa pos={[0, 0, -0.04]} tam={[3.4, 1.9, 0.08]} cor="#141418" />
        <Letreiro texto="PARTIDAS" pos={[0, 0.72, 0.01]} larg={2.0} alt={0.3} fundo="#141418" cor="#ffd23f" brilho />
        {['305  SEATTLE   14:50', '112  BOISE     15:10', '47   S. FRANCISCO 15:25', '220  SPOKANE   15:40', '18   CHICAGO   16:05'].map((s, i) => (
          <Letreiro key={i} texto={s} pos={[0, 0.38 - i * 0.28, 0.01]} larg={3.1} alt={0.22} fundo={i === 0 ? '#3a2a10' : '#1d1d24'} cor={i === 0 ? '#ffd23f' : '#e9e9e9'} brilho />
        ))}
      </group>
      {/* relógio */}
      <group position={[-4.6, 3.0, -4.88]}>
        <mesh><circleGeometry args={[0.45, 40]} /><meshStandardMaterial color="#f4efe2" /></mesh>
        <mesh position={[0, 0, -0.01]}><circleGeometry args={[0.5, 40]} /><meshStandardMaterial color="#2b2f3a" /></mesh>
        <Barra a={[0, 0, 0.01]} b={[0.18, 0.18, 0.01]} r={0.02} cor="#1d1b26" sombra={false} />
        <Barra a={[0, 0, 0.01]} b={[0.0, -0.36, 0.01]} r={0.012} cor="#1d1b26" sombra={false} />
      </group>
      {/* balcão (frente laranja com frisos, tampo creme), 0,9 m de altura: o Cooper aparece do peito para cima */}
      <group position={[0, 0, -2.5]} scale={[1, HB / 1.1, 1]}>
        <Caixa pos={[0, 0.52, 0]} tam={[7.4, 1.04, 0.7]} cor="#c96a2a" />
        {Array.from({length: 8}).map((_, i) => (<Caixa key={i} pos={[-3.25 + i * 0.93, 0.52, 0.36]} tam={[0.08, 1.0, 0.02]} cor="#e9b27a" sombra={false} />))}
        <Caixa pos={[0, 0.25, 0.36]} tam={[7.4, 0.06, 0.02]} cor="#5a2f14" sombra={false} />
        <CaixaTx pos={[0, 1.07, 0]} tam={[7.6, 0.06, 0.9]} map={TX.concreto([10, 1])} cor="#fff2d6" />
        <Caixa pos={[0, 1.101, 0.42]} tam={[7.6, 0.004, 0.05]} cor="#8a5a2b" sombra={false} />
        {/* caneta, sininho, envelopes de passagem e folheto de horários */}
        <Barra a={[0.95, 1.11, -0.15]} b={[1.12, 1.11, -0.05]} r={0.006} cor="#1d2233" />
        <Cil pos={[0.25, 1.13, 0.05]} r={0.05} r2={0.07} h={0.06} cor="#c9a046" seg={12} />
        {[0, 1, 2].map((i) => (<Caixa key={i} pos={[0.3 + i * 0.02, 1.105 + i * 0.006, -0.25]} rot={[0, 0.1 * i, 0]} tam={[0.24, 0.005, 0.11]} cor={['#c9302c', '#f4efe2', '#2f6fd6'][i]} sombra={false} />))}
        <mesh position={[1.2, 1.104, 0.2]} rotation={[-Math.PI / 2, 0, 0.4]}><planeGeometry args={[0.15, 0.21]} /><meshStandardMaterial map={TX.placa('HORÁRIOS', '#2f6fd6', '#ffffff', 256, 358)} /></mesh>
        {/* lado de dentro (atendente): gavetas, prateleira com blocos de passagem, caixa registradora */}
        {[-3, -1.5, 0, 1.5, 3].map((x) => (<group key={'g' + x}><Caixa pos={[x, 0.55, -0.36]} tam={[1.3, 0.3, 0.02]} cor="#8a4a22" sombra={false} /><Caixa pos={[x, 0.55, -0.375]} tam={[0.25, 0.04, 0.02]} cor="#c9a046" sombra={false} /><Caixa pos={[x, 0.22, -0.36]} tam={[1.3, 0.3, 0.02]} cor="#7a3f1d" sombra={false} /></group>))}
        <Caixa pos={[0, 0.82, -0.5]} tam={[7.4, 0.03, 0.3]} cor="#d9c9a8" />
        {[-2.6, -1.9, -0.6, 0.4, 1.1, 2.4].map((x, i) => (<Caixa key={'b' + x} pos={[x, 0.86 + (i % 2) * 0.01, -0.5]} tam={[0.22, 0.05 + (i % 3) * 0.02, 0.12]} cor={['#f4efe2', '#2f6fd6', '#c9302c'][i % 3]} sombra={false} />))}
        <Caixa pos={[1.6, 0.9, -0.5]} tam={[0.4, 0.14, 0.26]} cor="#2b2f3a" />
        {/* balança de bagagem */}
        <Caixa pos={[4.3, 0.12, 0.1]} tam={[0.9, 0.24, 0.7]} cor="#9aa0aa" />
        <Cil pos={[4.3, 1.25, -0.3]} rot={[Math.PI / 2, 0, 0]} r={0.2} h={0.08} cor="#f4efe2" seg={16} />
        <Mala pos={[4.3, 0.24, 0.1]} cor="#2f5f8f" />
        {/* máquina de bilhetes, telefone e carimbo */}
        <Caixa pos={[-1.6, 1.2, -0.15]} tam={[0.5, 0.2, 0.4]} cor="#3a3f4c" />
        <Caixa pos={[-1.6, 1.32, -0.25]} tam={[0.42, 0.04, 0.12]} cor="#f4efe2" />
        <Caixa pos={[-2.5, 1.15, -0.1]} tam={[0.25, 0.1, 0.2]} cor="#1d1b26" />
      </group>
      {/* a nota de 20 desliza do Cooper para a atendente; a passagem em cima do balcão */}
      <mesh visible={nota >= 0.5} position={[lerp(1.0, 0.7, nota), HB + 0.006, lerp(-2.15, -2.6, nota)]} rotation={[-Math.PI / 2, 0, 0.3]}><planeGeometry args={[0.16, 0.07]} /><meshStandardMaterial map={TX.nota()} /></mesh>
      <mesh visible={nota < 0.5} position={[0.85, HB + 0.006, -2.35]} rotation={[-Math.PI / 2, 0, -0.2]}><planeGeometry args={[0.2, 0.09]} /><meshStandardMaterial map={TX.placa('VOO 305 · SEATTLE', '#f4efe2', '#c9302c', 256, 115)} /></mesh>
      <Boneco pos={[-0.3, 0, -3.25]} rotY={0.3} acao="aponta" t={t} v={ATENDENTE} />
      <Comissaria pos={[-2.2, 0, -3.25]} rotY={0.2} t={t + 1} v={{...ATENDENTE, camisa: '#c96a2a', cabelo: '#2b2233', pele: '#d9a37a'}} />
      {/* Cooper no balcão, de terno, pasta na mão */}
      {/* Cooper no balcão: entrega a nota de 20 com as duas mãos sobre o tampo; a pasta no chão, encostada na perna */}
      <Cooper pos={[1.1, 0, -1.72]} rotY={Math.PI} t={t} acao="aponta"
        maoD={nota < 0.5 ? (
          <mesh position={[0, -0.02, 0.05]} rotation={[0, 0, 0]}><planeGeometry args={[0.07, 0.16]} /><meshStandardMaterial map={TX.nota()} side={2} /></mesh>
        ) : undefined} />
      <Pasta pos={[1.42, 0.23, -1.62]} rot={[Math.PI / 2, -0.25, 0]} />
      {/* fila de passageiros com malas */}
      {[[1.6, 0.3, 0], [1.1, 1.6, 1], [1.9, 2.8, 2]].map(([x, z, i]) => (
        <group key={i}>
          <Boneco pos={[x, 0, z]} rotY={Math.PI + (i % 2 ? 0.2 : -0.15)} t={t + i} v={PASSAGEIROS[i]} />
          <Mala pos={[x + 0.45, 0, z + 0.1]} rotY={1.4} cor={['#8a5a2b', '#5a2a4a', '#2f5f3f', '#7a6a3a'][i]} />
        </group>
      ))}
      {/* sala de espera: cadeiras de plástico laranja, vasos */}
      {[-6.5, -5.8, -5.1, -4.4].map((x, i) => [1.2, 2.8].map((z) => (
        <group key={x + ':' + z} position={[x, 0, z]}>
          <Caixa pos={[0, 0.45, 0]} tam={[0.5, 0.06, 0.5]} cor={i % 2 ? '#e07a2a' : '#d9a03a'} />
          <Caixa pos={[0, 0.75, -0.24]} tam={[0.5, 0.55, 0.05]} cor={i % 2 ? '#e07a2a' : '#d9a03a'} />
          <Cil pos={[0, 0.22, 0]} r={0.03} h={0.45} cor="#c9ced6" />
        </group>
      )))}
      <Boneco pos={[-5.8, 0.2, 2.8]} rotY={0} acao="senta" t={t} v={PASSAGEIROS[4]} esc={0.85} />
      {[[-7.3, -4.3], [5.9, -3.6], [-7.3, 4.5]].map(([x, z], i) => (
        <group key={i}><Cil pos={[x, 0.25, z]} r={0.3} r2={0.24} h={0.5} cor="#8a4a2a" seg={10} /><Arbusto pos={[x, 0.5, z]} esc={1.2} /></group>
      ))}
      {[-3.6, 6.4].map((x) => (<Caixa key={x} pos={[x, 2, 2.5]} tam={[0.5, 4, 0.5]} cor="#d9c9a8" />))}
      <pointLight position={[0, 3.5, 0]} color="#fff0d0" intensity={20} distance={14} decay={1.3} />
      <pointLight position={[1, 2.5, -1]} color="#ffe6c0" intensity={8} distance={6} decay={1.4} />
    </group>
  );
};

// ============ 2. Pátio do aeroporto de Portland ao anoitecer, chuva, embarque pela escada traseira ============
const PatioPortland: React.FC<{t: number; p: number}> = ({t, p}) => (
  <group>
    <Chao pos={[0, 0, 0]} tam={[400, 400]} map={TX.asfalto([40, 40])} rough={0.25} />
    {[0, 1, 2].map((i) => (<Caixa key={i} pos={[-20 + i * 30, 0.02, 7.5]} tam={[26, 0.02, 0.25]} cor="#e9b13b" sombra={false} />))}
    <Caixa pos={[0, 0.02, -7]} tam={[90, 0.02, 0.25]} cor="#e9b13b" sombra={false} />
    {/* terminal com fachada de vidro acesa e letreiro no telhado */}
    <group position={[58, 0, -18]} rotation={[0, -1.2, 0]}>
      <CaixaTx pos={[0, 6, 0]} tam={[90, 12, 22]} map={TX.vidro([20, 2])} />
      <Caixa pos={[0, 12.4, 0]} tam={[92, 0.8, 23]} cor="#c9c3b4" />
      <Letreiro texto="PORTLAND" pos={[0, 15, 0]} rot={[0, -Math.PI / 2, 0]} larg={22} alt={4} fundo="#1d1b26" cor="#ffd98a" brilho />
      <Caixa pos={[0, 14.6, 0.4]} tam={[0.4, 3.6, 22]} cor="#1d1b26" />
    </group>
    <group position={[40, 0, -62]}>
      <Cil pos={[0, 14, 0]} r={2.2} r2={2.8} h={28} cor="#c9c3b4" seg={10} />
      <Cil pos={[0, 30, 0]} r={5} r2={4} h={4} cor="#9ad0ff" seg={10} />
      <Cil pos={[0, 32.4, 0]} r={5.4} h={0.8} cor="#4a4e58" seg={10} />
    </group>
    <B727 pos={[0, CHAO727, 0]} t={t} escada={1} noChao janelasAcesas />
    {/* passageiros subindo pela escada traseira */}
    {[0, 1, 2, 3, 4].map((i) => {
      const k = ((i * 0.2 + t * 0.12 + p * 0.2) % 1);
      const x = lerp(-6, -15.6, k);
      return <Boneco key={i} pos={[x, 0, 0.3 + (i % 2) * 0.4]} rotY={-Math.PI / 2} acao="anda" t={t + i} v={PASSAGEIROS[i + 1]} />;
    })}
    <Cooper pos={[lerp(-3, -5, p), 0, 1.2]} rotY={-Math.PI / 2} acao="anda" t={t} pasta capa />
    {/* carrinho de bagagem com malas e trator */}
    <group position={[6, 0, 9]}>
      <Caixa pos={[0, 0.9, 0]} tam={[2.2, 1.2, 1.4]} cor="#e9b13b" />
      <Caixa pos={[0.2, 1.8, 0]} tam={[1.2, 0.6, 1.3]} cor="#2a3550" />
      {[0, 1].map((c) => (
        <group key={c} position={[-3.4 - c * 3.2, 0, 0]}>
          <Caixa pos={[0, 0.55, 0]} tam={[2.8, 0.1, 1.5]} cor="#6b707c" />
          {[[-0.8, 0], [0, 0.3], [0.8, -0.2], [-0.4, -0.3]].map(([x, z], j) => (<Mala key={j} pos={[x, 0.6, z]} rotY={j} cor={['#8a5a2b', '#2f5f8f', '#5a2a4a', '#3f5f3f'][(j + c) % 4]} tam={[0.7, 0.4 + (j % 2) * 0.15, 0.45]} />))}
          {[-1, 1].map((s) => [-1, 1].map((q) => (<Cil key={s + ':' + q} pos={[s * 1.1, 0.25, q * 0.75]} rot={[Math.PI / 2, 0, 0]} r={0.25} h={0.15} cor="#151518" />)))}
        </group>
      ))}
    </group>
    {/* caminhão-tanque e funcionário de pátio */}
    <group position={[10, 0, -10]} rotation={[0, 0.3, 0]}>
      <Caixa pos={[3.2, 1.3, 0]} tam={[2.2, 2.2, 2.4]} cor="#d9d4c4" />
      <Caixa pos={[3.5, 1.9, 0]} tam={[1.5, 0.8, 2.45]} cor="#2a3550" />
      <mesh position={[-1.2, 1.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[1.2, 1.2, 6.4, 24]} /><Mat cor="#c9302c" rugoso={0.5} /></mesh>
      <Letreiro texto="COMBUSTÍVEL" pos={[-1.2, 1.6, 1.22]} larg={3.6} alt={0.6} fundo="#c9302c" cor="#ffffff" />
      {[-3, -1, 3].map((x) => [-1, 1].map((s) => (<Cil key={x + ':' + s} pos={[x, 0.5, s * 1.15]} rot={[Math.PI / 2, 0, 0]} r={0.5} h={0.3} cor="#151518" />)))}
    </group>
    <Boneco pos={[-9, 0, 5]} rotY={-0.6} acao="acena" t={t} v={PATIO} ferramenta="tocha" />
    {[[-25, 14], [20, 14], [-8, -20]].map(([x, z], i) => (<Poste key={i} pos={[x, 0, z]} h={14} luz={i < 2 ? 120 : 0} />))}
    <ChuvaEm t={t} pos={[-10, 0, 3]} raio={18} n={900} />
    <Floresta x={[-260, 260]} z={[-260, -140]} n={500} h={[16, 26]} y={0} seed={3} />
  </group>
);

// ============ 3. Interior do 727 (corredor, 3 + 3 poltronas por fileira) ============
type ModoCabine = 'cheio' | 'vazio' | 'salto';
const FILEIRAS = Array.from({length: 18}).map((_, i) => -11.0 + i * 0.86);
const ASSENTOS = [-1.38, -0.93, -0.48, 0.48, 0.93, 1.38];
const XC = FILEIRAS[0]; // fileira do Cooper (a última)
const Cabine: React.FC<{t: number; p: number; modo: ModoCabine}> = ({t, p, modo}) => {
  const casco = useMemo(() => new THREE.CylinderGeometry(1.95, 1.95, 17.4, 28, 1, true, -0.57, Math.PI + 1.14), []);
  const pax = useMemo(() => {
    const r = rnd(19);
    const out: {x: number; z: number; v: number}[] = [];
    FILEIRAS.forEach((x, i) => {
      if (i < 2) return;
      ASSENTOS.forEach((z) => {
        if (i < 4 && z > 0) return; // o lado do Cooper fica livre perto dele (a câmera do bilhete passa ali)
        if (x > -8.2) return;
        if (r() < 0.45) out.push({x, z, v: Math.floor(r() * PASSAGEIROS.length)});
      });
    });
    return out;
  }, []);
  // o bilhete fica na mão do Cooper até p = 0,8; depois a comissária está com ele na mão (lendo)
  const comEla = modo === 'cheio' && p >= 0.8;
  const salto = modo === 'salto';
  // poltronas tiradas para a câmera ver os personagens (fileira da frente do Cooper e a de trás do corredor)
  const tirar = (i: number, z: number) => (i >= 1 && i <= (modo === 'cheio' ? 2 : 3) && z > 0) || (modo !== 'cheio' && i <= 1 && z < 0) || (salto && i === 0 && z > -0.6);
  return (
    <group>
      {/* casco por dentro (painéis creme com frisos) */}
      <mesh geometry={casco} position={[-3.9, 1.05, 0]} rotation={[0, 0, Math.PI / 2]} receiveShadow>
        <meshStandardMaterial map={TX.painel([24, 6])} side={THREE.BackSide} roughness={0.8} />
      </mesh>
      <Chao pos={[-3.9, 0.002, 0]} tam={[17.4, 3.3]} map={TX.carpete([30, 6])} />
      {modo !== 'cheio' && (
        // vista em corte: o piso cortado (faixa vermelha), as cavernas da estrutura e o porão de bagagem embaixo
        <group>
          <Caixa pos={[-3.9, -0.03, 1.6]} tam={[17.4, 0.06, 0.08]} cor="#c9302c" sombra={false} />
          <Caixa pos={[-3.9, -0.5, 0]} tam={[17.4, 0.9, 3.1]} cor="#2b2f3a" />
          {Array.from({length: 24}).map((_, i) => (<Caixa key={i} pos={[-12.4 + i * 0.74, -0.5, 1.56]} tam={[0.08, 0.9, 0.02]} cor="#6b707c" sombra={false} />))}
          <Caixa pos={[-3.9, -0.12, 1.56]} tam={[17.4, 0.06, 0.02]} cor="#8a909c" sombra={false} />
          <Caixa pos={[-3.9, -0.9, 1.56]} tam={[17.4, 0.06, 0.02]} cor="#8a909c" sombra={false} />
          {[-12.0, -11.3, -10.7, -9.9, -9.2, -8.4, -7.7].map((x, i) => (
            <Caixa key={'m' + i} pos={[x, -0.68 + (i % 2) * 0.05, 1.5]} tam={[0.55, 0.35 + (i % 3) * 0.06, 0.12]} cor={['#8a5a2b', '#2f5f8f', '#5a2a4a', '#7a6a3a', '#2f5f3f'][i % 5]} sombra={false} />
          ))}
          <pointLight position={[-11, -0.4, 1.2]} color="#9fb6e6" intensity={2} distance={4} decay={1.5} />
        </group>
      )}
      {modo === 'vazio' && <Chao pos={[-3.9, -2.25, 0]} tam={[120, 80]} map={TX.asfalto([24, 16])} cor="#8a93a6" />}
      {/* bagageiros abertos com casacos e bolsas */}
      {[-1, 1].map((s) => (
        <group key={s}>
          {/* (o bagageiro do lado +z some nas vistas em corte lateral, para não riscar o quadro) */}
          {(s < 0 || modo === 'cheio') && (
            <>
              <Caixa pos={[-3.9, 1.88, s * 1.32]} tam={[17.4, 0.05, 0.62]} cor="#cfc6b2" />
              <Caixa pos={[-3.9, 1.8, s * 1.0]} tam={[17.4, 0.14, 0.04]} cor="#9a8f78" />
              {FILEIRAS.filter((_, i) => i % 3 === 1).map((x, i) => (<Caixa key={x} pos={[x, 2.0, s * 1.35]} tam={[0.5, 0.2, 0.35]} cor={['#8a5a2b', '#5a2a4a', '#2f5f8f', '#c9a03a'][(i + (s > 0 ? 1 : 0)) % 4]} />))}
            </>
          )}
          {/* janelas com chuva lá fora */}
          {FILEIRAS.map((x) => (
            <group key={'j' + x} position={[x + 0.1, 1.2, s * 1.84]} rotation={[0, s > 0 ? Math.PI : 0, 0]}>
              <mesh><planeGeometry args={[0.26, 0.34]} /><meshBasicMaterial color={salto ? '#0a1020' : '#0d1a33'} /></mesh>
              <mesh position={[0, 0, -0.01]}><planeGeometry args={[0.36, 0.44]} /><meshStandardMaterial color="#b9b09c" /></mesh>
              <Caixa pos={[0.05, 0.03, 0.005]} rot={[0, 0, 0.3]} tam={[0.006, 0.12, 0.002]} cor="#9fb7d9" sombra={false} />
            </group>
          ))}
        </group>
      ))}
      {/* teto com faixas de luz */}
      <Caixa pos={[-3.9, 2.32, 0]} tam={[17.4, 0.06, 1.6]} cor="#efe9da" />
      {[-0.55, 0.55].map((z) => (<mesh key={z} position={[-3.9, 2.285, z]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[17.2, 0.12]} /><meshBasicMaterial color={salto ? '#ff9a8a' : '#fff6dc'} toneMapped={false} side={2} /></mesh>))}
      {/* poltronas (cores alternadas por fileira) */}
      {FILEIRAS.map((x, i) => ASSENTOS.map((z) => (tirar(i, z) ? null : <Poltrona key={x + ':' + z} pos={[x, 0, z]} cor={i % 2 ? '#b5542c' : '#c9862a'} cor2={i % 2 ? '#9a4524' : '#a86e22'} />)))}
      {/* passageiros */}
      {modo === 'cheio' && pax.map((q, i) => (<Boneco key={i} pos={[q.x - 0.02, 0.22, q.z]} rotY={Math.PI / 2} acao="senta" t={t + i} v={PASSAGEIROS[q.v]} esc={0.8} />))}
      {/* antepara traseira: porta para a escada, banheiros, placa SAÍDA */}
      <group position={[-12.62, 0, 0]}>
        <CaixaTx pos={[0, 1.15, -1.05]} tam={[0.1, 2.3, 1.3]} map={TX.painel([2, 3])} />
        <CaixaTx pos={[0, 1.15, 1.05]} tam={[0.1, 2.3, 1.3]} map={TX.painel([2, 3])} />
        <Caixa pos={[0, 2.15, 0]} tam={[0.1, 0.3, 0.8]} cor="#d9d1bd" />
        {[-1, 1].map((s) => (<group key={s}><Caixa pos={[0.06, 1.0, s * 1.05]} tam={[0.02, 1.7, 0.6]} cor="#b9b09c" /><Letreiro texto="WC" pos={[0.08, 1.6, s * 1.05]} rot={[0, Math.PI / 2, 0]} larg={0.3} alt={0.12} fundo="#2b2f3a" cor="#ffffff" /></group>))}
        <Letreiro texto="SAÍDA" pos={[0.07, 2.15, 0]} rot={[0, Math.PI / 2, 0]} larg={0.55} alt={0.18} fundo="#c9302c" cor="#ffffff" brilho />
        {!salto && <Caixa pos={[0.02, 1.0, 0]} tam={[0.06, 2.0, 0.8]} cor="#8d8676" />}
        {/* banco de serviço da comissária */}
        <Caixa pos={[0.2, 0.55, -0.75]} tam={[0.3, 0.08, 0.45]} cor="#3a3f4c" />
      </group>
      {salto && (
        <group position={[-12.7, 0, 0]}>
          {/* vão aberto: a escada desce para o escuro com chuva entrando */}
          <mesh position={[-1.4, 0.4, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[2.4, 3.2]} /><meshBasicMaterial color="#05080f" /></mesh>
          <group rotation={[0, 0, 0.55]}>
            {Array.from({length: 6}).map((_, i) => (<Caixa key={i} pos={[-0.3 - i * 0.32, -0.02, 0]} tam={[0.1, 0.05, 0.8]} cor="#6b707c" />))}
            {[-0.42, 0.42].map((z) => (<Caixa key={z} pos={[-1.1, 0, z]} tam={[2.2, 0.15, 0.04]} cor="#9aa0aa" />))}
          </group>
          {Array.from({length: 40}).map((_, i) => {
            const r = rnd(i + 4);
            const y = 2.2 - ((r() * 3 + t * 6) % 3);
            return <Caixa key={i} pos={[-0.3 - r() * 1.2, y, r() * 0.8 - 0.4]} rot={[0, 0, -0.5]} tam={[0.01, 0.25, 0.01]} cor="#9fc0e6" sombra={false} />;
          })}
          <pointLight position={[0.4, 1.4, 0]} color="#ff5a4a" intensity={6} distance={5} decay={1.4} />
        </group>
      )}
      {/* Cooper e a comissária */}
      {modo !== 'salto' && (
        <>
          <Cooper pos={[XC - 0.02, 0.22, 0.48]} rotY={Math.PI / 2} acao="senta" t={t} esc={0.8}
            maoE={modo === 'cheio' && !comEla ? (
              // o bilhete fica NA MÃO do Cooper, de pé na ponta dos dedos (dá para ler de frente e de lado)
              <group position={[0, -0.03, 0.06]} rotation={[0, 0, -0.7]}>
                <mesh position={[0, 0, 0.16]} rotation={[Math.PI / 2, 0, 0]} castShadow><planeGeometry args={[0.3, 0.2]} /><meshStandardMaterial map={TX.placa('TENHO UMA BOMBA', '#f4efe2', '#1d1b26', 256, 171)} side={2} /></mesh>
              </group>
            ) : undefined} />
          {modo === 'cheio'
            ? <Pasta pos={[XC + 0.3, 0.6, 0.48]} rot={[0, 0, 0]} aberta={clamp01((p - 0.5) / 0.3)} t={t} />
            : <Pasta pos={[XC + 0.02, 0.48, 0.93]} rot={[0, Math.PI / 2, 0]} aberta={0} t={t} />}
        </>
      )}
      {modo === 'cheio' && (
        <Comissaria pos={[XC + 0.8, 0, -0.02]} rotY={-Math.PI / 2 + 0.6} t={t} bilhete={comEla} expressao={comEla ? 'medo' : 'serio'} />
      )}
      {modo === 'vazio' && (
        <>
          {/* em Seattle: os passageiros saíram; ficam o Cooper, a comissária e os 3 do cockpit */}
          <Comissaria pos={[XC + 0.98, 0, 0.05]} rotY={-Math.PI / 2 + 1.0} t={t} expressao="medo" />
          {[[XC + 1.55, -0.05, 0.3], [XC + 0.45, -0.95, 0.6], [XC + 2.1, -0.12, -0.15]].map(([x, z, r], i) => (
            <Boneco key={i} pos={[x, 0, z]} rotY={r} acao={i === 0 ? 'fala' : 'parado'} t={t + i * 0.8} v={TRIPULANTES[i]} esc={0.9} expressao="serio" />
          ))}
          <Sacola pos={[XC + 0.02, 0.48, 1.38]} rotY={-0.4} esc={0.9} />
          <Paraquedas pos={[XC - 0.75, 0, 0.75]} rotY={0.3} />
          <Paraquedas pos={[XC - 0.8, 0, -0.35]} rotY={-0.2} reserva />
          <Paraquedas pos={[XC - 0.8, 0.24, -0.35]} rotY={0.1} reserva />
        </>
      )}
      {salto && (
        <>
          <Cooper pos={[XC - 0.95, 0, 0.0]} rotY={Math.PI / 2} acao="carrega" t={t} sacola={p > 0.2} paraquedas />
          <Pasta pos={[XC + 0.1, 0, 0.75]} rot={[0, Math.PI / 2 + 0.3, 0]} aberta={0} />
          <Paraquedas pos={[XC + 0.6, 0, -0.95]} rotY={0.3} reserva />
          {/* a sacola subindo para o peito */}
          {p <= 0.2 && <Sacola pos={[XC - 0.5, 0, 0.3]} esc={0.9} />}
        </>
      )}
      <pointLight position={[-9, 2.0, 0]} color={salto ? '#ffb0a0' : '#fff0d8'} intensity={salto ? 8 : 14} distance={9} decay={1.4} />
      <pointLight position={[-4, 2.0, 0]} color="#fff0d8" intensity={10} distance={8} decay={1.4} />
    </group>
  );
};

// ============ 4. Dinheiro do resgate: 10 mil notas de US$ 20 no banco (microfilmadas pelo FBI) ============
const Dinheiro: React.FC<{t: number; p: number; faltando?: boolean}> = ({t, p, faltando = false}) => {
  const macos = useMemo(() => {
    const out: {pos: V3; k: number}[] = [];
    // 100 maços = 10 pilhas de 10 em 5 × 2 lugares... (aqui: 20 pilhas de 5 para caber na mesa)
    let k = 0;
    for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) for (let h = 0; h < 5; h++) out.push({pos: [-0.85 + i * 0.19, 0.93 + h * 0.0115, -0.12 + j * 0.09], k: k++});
    return out;
  }, []);
  const n = faltando ? 100 : Math.round(lerp(40, 100, clamp01(p * 1.3)));
  const sumir = faltando ? suave(clamp01(p * 2)) : 0;
  return (
    <group>
      <Chao pos={[0, 0, 0]} tam={[10, 8]} map={TX.ladrilho([5, 4])} rough={0.4} />
      <CaixaTx pos={[0, 1.8, -2.2]} tam={[10, 3.6, 0.2]} map={TX.lambri([5, 2])} />
      {/* porta do cofre (redonda, de aço) */}
      <group position={[-2.6, 1.5, -2.08]}>
        <Cil pos={[0, 0, 0]} rot={[Math.PI / 2, 0, 0]} r={1.1} h={0.3} cor="#9aa0aa" seg={28} />
        <Cil pos={[0, 0, 0.16]} rot={[Math.PI / 2, 0, 0]} r={0.95} h={0.06} cor="#b9bec7" seg={28} />
        {[0, 1, 2, 3, 4, 5].map((i) => (<Barra key={i} a={[0, 0, 0.25]} b={[Math.cos(i * 1.05 + t * 0.3) * 0.45, Math.sin(i * 1.05 + t * 0.3) * 0.45, 0.25]} r={0.03} cor="#d9dde3" />))}
        <Cil pos={[0, 0, 0.25]} rot={[Math.PI / 2, 0, 0]} r={0.1} h={0.08} cor="#c9a046" />
      </group>
      <Letreiro texto="BANCO · TESOURARIA" pos={[1.4, 2.9, -2.08]} larg={3.0} alt={0.45} fundo="#2b3f2f" cor="#e9d9a0" />
      {/* mesa e maços */}
      <Caixa pos={[0, 0.88, 0]} tam={[2.4, 0.08, 1.1]} cor="#5a3a22" />
      <Caixa pos={[0, 0.925, 0]} tam={[2.3, 0.01, 1.0]} cor="#2f5a3a" sombra={false} />
      {[[-1.1, -0.45], [1.1, -0.45], [-1.1, 0.45], [1.1, 0.45]].map(([x, z], i) => (<Caixa key={i} pos={[x, 0.42, z]} tam={[0.08, 0.84, 0.08]} cor="#4a3426" />))}
      {macos.map((m) => {
        if (m.k >= n) return null;
        const fica = m.k >= 50 && m.k < 53;
        if (faltando && !fica && sumir > 0.98) {
          return <mesh key={m.k} position={m.pos}><boxGeometry args={[0.156, 0.011, 0.066]} /><meshBasicMaterial color="#d8f0e0" transparent opacity={0.28} depthWrite={false} /></mesh>;
        }
        return <Maco key={m.k} pos={m.pos} velho={faltando && fica} esc={faltando && fica ? 1 + 0.15 * sumir : 1} />;
      })}
      {faltando && sumir > 0.5 && <Letreiro texto="?" pos={[0.4, 1.25, 0]} larg={0.35} alt={0.35} fundo="#c9302c" cor="#ffffff" brilho />}
      <Sacola pos={[0.85, 0.93, 0.32]} esc={0.9} />
      {/* câmera de microfilme no tripé fotografando os números de série */}
      {!faltando && <group position={[-0.5, 0.93, 0.35]}>
        {[0, 2.1, 4.2].map((a) => (<Barra key={a} a={[Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2]} b={[0, 0.55, 0]} r={0.012} cor="#2b2f3a" />))}
        <Caixa pos={[0, 0.62, 0]} tam={[0.22, 0.16, 0.16]} cor="#1d1b26" />
        <Cil pos={[0, 0.52, 0]} r={0.05} h={0.08} cor="#3a3f4c" />
        {Math.sin(t * 5) > 0.7 && <pointLight position={[0, 0.45, 0]} color="#ffffff" intensity={6} distance={2} />}
      </group>}
      {/* máquina de somar */}
      <Caixa pos={[0.95, 0.98, -0.32]} tam={[0.3, 0.1, 0.3]} cor="#d9d4c4" />
      <Cil pos={[0.95, 1.06, -0.43]} rot={[0, 0, Math.PI / 2]} r={0.04} h={0.2} cor="#f4efe2" />
      <Boneco pos={[faltando ? 1.6 : 0.2, 0, faltando ? -1.3 : -0.95]} rotY={faltando ? -0.6 : 0} acao="aponta" t={t} v={AGENTE} />
      <Boneco pos={[-1.5, 0, -0.6]} rotY={0.7} acao="carrega" t={t + 1} v={{...ATENDENTE, camisa: '#e9e1cf', gravata: '#2b3f2f'}} />
      <Cil pos={[1.9, 0.9, -1.6]} r={0.3} h={1.8} cor="#6b707c" seg={8} />
      <pointLight position={[0, 2.4, 0.6]} color="#fff0d0" intensity={8} distance={6} decay={1.3} />
    </group>
  );
};

// ============ 5. Pista de Seattle à noite: avião parado, escada baixada, passageiros saindo, paraquedas e sacola ============
// O roteiro usa db_pista/geral duas vezes seguidas (p 0→0,5 e p 0,5→1) e a câmera do plano é fixa por nome.
// Para a 2ª metade virar OUTRO plano, o cenário inteiro é reposicionado (transformação rígida) de modo que a
// câmera 'geral' enxergue exatamente o que veria a câmera BAIXA_PISTA (perto do pé da escada, olhando para cima).
const PISTA_GERAL = orb([-20.5, 0.9, 4.2], -48, 13, 30, 25, 44, 8);
const PISTA_BAIXA = orb([-15.0, 1.25, 0.0], -50, 3, 8.4, 7.2, 44, -10);
const ease3 = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2); // = Easing.inOut(cubic) do motor
const matCam = (c: Cam, k: number) => {
  const mix = (a: V3, b: V3) => new THREE.Vector3(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
  const eye = mix(c.de, c.para), alvo = c.alvoPara ? mix(c.alvo, c.alvoPara) : mix(c.alvo, c.alvo);
  return new THREE.Matrix4().lookAt(eye, alvo, new THREE.Vector3(0, 1, 0)).setPosition(eye);
};
const Reenquadra: React.FC<{real: Cam; quero: Cam; k: number; children: React.ReactNode}> = ({real, quero, k, children}) => {
  const m = matCam(real, k).multiply(matCam(quero, k).invert());
  return <group matrixAutoUpdate={false} matrix={m}>{children}</group>;
};
const PistaSeattle: React.FC<{t: number; p: number}> = ({t, p}) =>
  p >= 0.5 ? (
    <Reenquadra real={PISTA_GERAL} quero={PISTA_BAIXA} k={ease3(clamp01((p - 0.5) / 0.5))}><PistaCena t={t} p={p} /></Reenquadra>
  ) : <PistaCena t={t} p={p} />;
// pé e topo da escada traseira apoiada no chão
const PE_ESCADA: V3 = [ESCADA_X - ESCADA_L * Math.cos(angEscada(1, true)), 0.06, 0];
const TOPO_ESCADA: V3 = [ESCADA_X - 0.3, CHAO727 - R727 + 0.1, 0];
const PistaCena: React.FC<{t: number; p: number}> = ({t, p}) => (
  <group>
    <Chao pos={[0, 0, 0]} tam={[500, 500]} map={TX.asfalto([50, 50])} rough={0.25} />
    <Caixa pos={[0, 0.02, 9]} tam={[120, 0.02, 0.25]} cor="#e9b13b" sombra={false} />
    <B727 pos={[0, CHAO727, 0]} rot={[0, 0, 0]} t={t} escada={1} noChao />
    {/* 36 passageiros descendo e indo para o ônibus (aqui, a fila) */}
    {p < 0.5 ? Array.from({length: 9}).map((_, i) => {
      const k = clamp01(p * 1.2 - i * 0.08);
      const x = lerp(-15.8, -30, k), z = lerp(0.2, 12, k);
      return <Boneco key={i} pos={[x - i * 0.9, 0, z + (i % 2) * 0.6]} rotY={-2.3} acao="anda" t={t + i} v={PASSAGEIROS[i % PASSAGEIROS.length]} />;
    }) : Array.from({length: 9}).map((_, i) => {
      // 2ª metade: a fila descendo a escada na chuva (topo → pé) e seguindo para o ônibus
      const s = (p - 0.5) * 3.2 - i * 0.22 + 0.55;
      if (s < 0.14) return null; // ainda dentro da cabine (a cabeça entraria na fuselagem)
      const naEscada = s < 0.5;
      const e = clamp01(s / 0.5), a = clamp01((s - 0.5) / 0.5);
      const pos: V3 = naEscada
        ? [lerp(TOPO_ESCADA[0], PE_ESCADA[0], e), lerp(TOPO_ESCADA[1], PE_ESCADA[1], e), (i % 2 ? 0.12 : -0.12)]
        : [lerp(PE_ESCADA[0], PE_ESCADA[0] - 6, a), 0, lerp(0, -4, a) - (i % 2) * 0.5];
      return <Boneco key={i} pos={pos} rotY={naEscada ? -Math.PI / 2 : -0.98} acao="anda" t={t + i} v={PASSAGEIROS[i % PASSAGEIROS.length]} />;
    })}
    {/* ônibus do aeroporto */}
    <group position={[-36, 0, 16]} rotation={[0, 0.8, 0]}>
      <Caixa pos={[0, 1.7, 0]} tam={[11, 2.8, 2.5]} cor="#e9e1cf" />
      <Caixa pos={[0, 2.3, 1.26]} tam={[10, 0.8, 0.02]} cor="#ffe2a0" sombra={false} />
      <Caixa pos={[0, 1.0, 1.26]} tam={[11, 0.25, 0.02]} cor="#2f6fd6" sombra={false} />
      {[-3.5, 3.5].map((x) => [-1, 1].map((s) => (<Cil key={x + ':' + s} pos={[x, 0.5, s * 1.2]} rot={[Math.PI / 2, 0, 0]} r={0.5} h={0.3} cor="#151518" />)))}
    </group>
    {/* carrinho com os 4 paraquedas e a sacola do resgate, perto do pé da escada */}
    <group position={[-17.6, 0, -2.4]}>
      <Caixa pos={[0, 0.45, 0]} tam={[1.6, 0.08, 1.0]} cor="#6b707c" />
      {[-1, 1].map((s) => [-1, 1].map((q) => (<Cil key={s + ':' + q} pos={[s * 0.65, 0.2, q * 0.45]} rot={[Math.PI / 2, 0, 0]} r={0.18} h={0.1} cor="#151518" />)))}
      <Barra a={[0.8, 0.5, 0]} b={[1.4, 0.95, 0]} r={0.025} cor="#3a3f4c" />
      <Paraquedas pos={[-0.4, 0.49, -0.24]} rotY={0.1} />
      <Paraquedas pos={[0.25, 0.49, -0.24]} rotY={-0.1} />
      <Paraquedas pos={[-0.45, 0.49, 0.28]} reserva />
      <Paraquedas pos={[0.15, 0.49, 0.28]} reserva rotY={0.2} />
      <Sacola pos={[0.6, 0.49, 0.25]} esc={0.85} />
    </group>
    <Carro pos={[-24, 0, -7]} rotY={0.5} cor="#2a3a5a" />
    <Boneco pos={[-22, 0, -3.5]} rotY={1.4} acao="aponta" t={t} v={AGENTE} />
    {/* caminhão-tanque abastecendo na asa */}
    <group position={[3, 0, -11]} rotation={[0, 0.15, 0]}>
      <Caixa pos={[3.2, 1.3, 0]} tam={[2.2, 2.2, 2.4]} cor="#d9d4c4" />
      <mesh position={[-1.2, 1.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[1.2, 1.2, 6.4, 24]} /><Mat cor="#c9302c" rugoso={0.5} /></mesh>
      {[-3, -1, 3].map((x) => [-1, 1].map((s) => (<Cil key={x + ':' + s} pos={[x, 0.5, s * 1.15]} rot={[Math.PI / 2, 0, 0]} r={0.5} h={0.3} cor="#151518" />)))}
    </group>
    <Barra a={[1, 1.8, -9.5]} b={[0, 2.1, -6.5]} r={0.05} cor="#1d1b26" />
    {[[-30, -12], [12, 12], [-4, -26]].map(([x, z], i) => (<Poste key={i} pos={[x, 0, z]} h={16} luz={i < 2 ? 150 : 0} cor="#e9f0ff" />))}
    {/* terminal ao longe e luzes da pista */}
    <CaixaTx pos={[-60, 7, -110]} tam={[160, 14, 20]} map={TX.vidro([30, 2])} />
    {Array.from({length: 30}).map((_, i) => (<mesh key={i} position={[-120 + i * 9, 0.3, 40]}><sphereGeometry args={[0.35, 20, 14]} /><meshBasicMaterial color={i % 2 ? '#7ab8ff' : '#ffd27a'} toneMapped={false} /></mesh>))}
    <ChuvaEm t={t} pos={[-15, 0, 0]} raio={20} n={900} />
    <Estrelas n={200} />
  </group>
);

// ============ 6. Decolagem à noite (Seattle) ============
const Decolagem: React.FC<{t: number; p: number}> = ({t, p}) => {
  const x = lerp(-55, 45, p);
  const sobe = p > 0.5 ? Math.pow((p - 0.5) / 0.5, 1.6) * 18 : 0;
  const pitch = p > 0.45 ? Math.min(0.16, (p - 0.45) * 0.6) : 0;
  return (
    <group>
      <Chao pos={[0, 0, 0]} tam={[900, 900]} map={TX.mato([60, 60])} />
      <CaixaTx pos={[0, 0.02, 0]} tam={[900, 0.04, 46]} map={TX.asfalto([90, 5])} />
      {Array.from({length: 30}).map((_, i) => (<Caixa key={i} pos={[-300 + i * 22, 0.05, 0]} tam={[12, 0.02, 0.8]} cor="#e9e9e9" sombra={false} />))}
      {Array.from({length: 46}).map((_, i) => [-24, 24].map((z) => (<mesh key={i + ':' + z} position={[-250 + i * 12, 0.4, z]}><sphereGeometry args={[0.4, 20, 14]} /><meshBasicMaterial color={i > 38 ? '#ff4040' : '#fff3c9'} toneMapped={false} /></mesh>)))}
      <B727 pos={[x, CHAO727 + sobe, 0]} rot={[0, 0, pitch]} t={t} escada={0} />
      {/* luzes da cidade de Seattle e o monte Rainier ao fundo */}
      {useMemo(() => {
        const r = rnd(8);
        return Array.from({length: 60}).map((_, i) => {
          const h = 6 + r() * 40;
          return <CaixaTx key={i} pos={[-320 - r() * 160, h / 2, -260 + r() * 380]} tam={[10 + r() * 14, h, 10 + r() * 10]} map={TX.vidro([2, Math.max(1, Math.round(h / 12))])} />;
        });
      }, [])}
      <mesh position={[-900, 0, -380]}><coneGeometry args={[420, 330, 24]} /><meshStandardMaterial color="#3a4660" /></mesh>
      <mesh position={[-900, 230, -380]}><coneGeometry args={[150, 105, 24]} /><meshStandardMaterial color="#c9d3e6" /></mesh>
      <Floresta x={[-400, 400]} z={[40, 200]} n={700} h={[14, 26]} seed={12} />
      <ChuvaEm t={t} pos={[x + 10, 0, 0]} raio={28} n={700} />
      <Estrelas n={200} />
    </group>
  );
};

// ============ 7. O 727 voando à noite sobre a floresta, na chuva (escada traseira aberta ou fechada) ============
const ALT = 0; // o avião fica na origem; o chão está 260 m abaixo
const Voo: React.FC<{t: number; p: number; escada: number; cooperNaEscada?: boolean}> = ({t, p, escada, cooperNaEscada = false}) => {
  const nuv = useMemo(() => {
    const r = rnd(31);
    return Array.from({length: 22}).map(() => [r() * 700 - 350, -40 - r() * 30, r() * 400 - 200, 10 + r() * 10] as [number, number, number, number]);
  }, []);
  const ang = angEscada(escada);
  // Cooper descendo a escada e saltando
  // desce a escada devagar (p 0 → 0,8) e só então pula: os planos 'tras' e 'baixo' pegam ele NA escada
  const s = lerp(0.6, 3.9, clamp01(p / 0.8));
  const cai = clamp01((p - 0.82) / 0.18);
  const cx = ESCADA_X - s * Math.cos(ang) - cai * 22;
  const cy = -R727 + 0.15 - s * Math.sin(ang) - cai * cai * 26;
  return (
    <group>
      <B727 pos={[0, ALT, 0]} rot={[0.02, 0, 0.03]} t={t} escada={escada} />
      {cooperNaEscada && <Cooper pos={[cx, cy, 0]} rotY={-Math.PI / 2} acao={cai > 0 ? 'comemora' : 'anda'} t={t} sacola paraquedas />}
      {nuv.map(([x0, y, z, e], i) => {
        const x = ((((x0 - t * 90) % 700) + 700) % 700) - 350;
        return <Nuvem key={i} pos={[x, y, z]} esc={e} cor="#4a5570" />;
      })}
      <Chao pos={[0, -260, 0]} tam={[3000, 3000]} map={TX.mato([200, 200])} cor="#7a8a7a" />
      <Floresta x={[-900, 900]} z={[-900, 600]} n={2500} h={[30, 50]} y={-260} seed={4} />
      <Caixa pos={[0, -259.5, 120]} rot={[0, 0.3, 0]} tam={[2400, 0.5, 40]} cor="#1f3550" sombra={false} />
      {useMemo(() => {
        const r = rnd(5);
        return Array.from({length: 40}).map((_, i) => (<mesh key={i} position={[r() * 1600 - 800, -258, r() * 1200 - 700]}><sphereGeometry args={[1.6, 20, 14]} /><meshBasicMaterial color="#ffd27a" toneMapped={false} /></mesh>));
      }, [])}
      <ChuvaEm t={t} pos={[-6, -6, 0]} raio={28} n={900} />
      <mesh position={[-260, 200, -520]}><sphereGeometry args={[16, 20, 14]} /><meshBasicMaterial color="#c9cfe0" /></mesh>
      <Estrelas n={250} />
    </group>
  );
};

// ============ 8. Cooper descendo de paraquedas na chuva, sobre a floresta ============
// a mesma curva da câmera (Caso.tsx usa easing cúbico in-out), para o Cooper ficar sempre no quadro
const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const yQueda = (p: number) => lerp(95, 34, p);
const Queda: React.FC<{t: number; p: number}> = ({t, p}) => {
  const y = yQueda(easeIO(clamp01(p)));
  const bal = Math.sin(t * 1.6) * 0.12;
  const gomos = 12;
  return (
    <group>
      <Chao pos={[0, 0, 0]} tam={[1200, 1200]} map={TX.mato([80, 80])} />
      <Floresta x={[-300, 300]} z={[-300, 200]} n={2200} h={[20, 34]} seed={9} />
      <Caixa pos={[40, 0.3, -60]} rot={[0, 0.5, 0]} tam={[500, 0.4, 22]} cor="#22405e" sombra={false} />
      <group position={[0, y, 0]} rotation={[bal * 0.4, 0, bal]}>
        {/* velame redondo (militar, ~8,5 m) em gomos verde-oliva e creme */}
        {Array.from({length: gomos}).map((_, i) => (
          <mesh key={i} position={[0, 7.2, 0]} castShadow>
            <sphereGeometry args={[4.2, 20, 14, (i / gomos) * Math.PI * 2, (Math.PI * 2) / gomos, 0, Math.PI / 2.4]} />
            <meshStandardMaterial color={i % 2 ? '#6b7a4a' : '#d9d0b0'} side={2} />
          </mesh>
        ))}
        {Array.from({length: gomos}).map((_, i) => {
          const a = (i / gomos) * Math.PI * 2;
          return <Barra key={'l' + i} a={[Math.sin(a) * 3.9, 8.6, Math.cos(a) * 3.9]} b={[0, 1.4, 0]} r={0.015} cor="#e9e1cf" sombra={false} />;
        })}
        <Cooper pos={[0, 0, 0]} rotY={0.4} acao="comemora" t={0.6} sacola paraquedas esc={0.92} />
      </group>
      {/* o avião indo embora lá no alto */}
      <B727 pos={[-180, 190, -360]} rot={[0, 0.5, 0]} t={t} escada={1} />
      <ChuvaEm t={t} pos={[0, y - 6, 0]} raio={14} n={700} />
      <Estrelas n={200} />
    </group>
  );
};

// ============ 9. Mapa da região (1 unidade ≈ 1 km): Seattle → Portland, rio Columbia, zona do salto, Tena Bar ============
type LL = [number, number]; // [lon, lat]
const M = (ll: LL, h = 0): V3 => [(ll[0] + 122.5) * 41.4, h, -(ll[1] - 46.5) * 60];
const MW = 110, MH = 170; // tamanho do mapa em unidades
const L = {
  SEA: [-122.31, 47.45] as LL, SEATTLE: [-122.33, 47.6] as LL, TACOMA: [-122.44, 47.25] as LL, PDX: [-122.6, 45.59] as LL, PORTLAND: [-122.68, 45.52] as LL,
  ARIEL: [-122.56, 45.96] as LL, TENA: [-122.78, 45.72] as LL, RAINIER: [-121.76, 46.85] as LL, HELENS: [-122.19, 46.19] as LL, HOOD: [-121.7, 45.37] as LL, ADAMS: [-121.49, 46.2] as LL,
};
const COLUMBIA: LL[] = [[-121.2, 45.7], [-121.9, 45.65], [-122.3, 45.56], [-122.6, 45.6], [-122.76, 45.66], [-122.79, 45.8], [-122.88, 46.0], [-122.95, 46.12], [-123.2, 46.18], [-123.9, 46.22]];
const LEWIS: LL[] = [[-121.9, 46.08], [-122.2, 46.02], [-122.4, 45.96], [-122.6, 45.94], [-122.78, 45.86]];
const COWLITZ: LL[] = [[-122.2, 46.55], [-122.7, 46.4], [-122.88, 46.15]];
const WILLAMETTE: LL[] = [[-122.7, 45.0], [-122.68, 45.45], [-122.77, 45.65]];
const SOUND: LL[] = [[-122.55, 47.95], [-122.38, 47.65], [-122.42, 47.4], [-122.5, 47.3], [-122.62, 47.18], [-122.9, 47.08], [-122.98, 47.22], [-122.72, 47.4], [-122.62, 47.62], [-122.7, 47.95]];
const ROTA: LL[] = [L.SEA, [-122.48, 47.05], [-122.58, 46.5], L.ARIEL, [-122.62, 45.4], [-122.66, 44.95]];
const PCT_SALTO = 0.72; // fração da rota onde fica Ariel
const mapaTex = () => tela('mapaDB', 512, 792, (g) => {
  const px = (ll: LL): [number, number] => {
    const [x, , z] = M(ll);
    return [((x + MW / 2) / MW) * 512, ((z + MH / 2) / MH) * 792];
  };
  g.fillStyle = '#3d6a3a';
  g.fillRect(0, 0, 512, 792);
  const r = rnd(2);
  for (let i = 0; i < 2600; i++) { g.fillStyle = ['#355f33', '#47773f', '#2f5530', '#527f45'][Math.floor(r() * 4)]; g.fillRect(r() * 512, r() * 792, 3 + r() * 5, 3 + r() * 5); }
  // vale agrícola (I-5) mais claro
  g.fillStyle = 'rgba(190,190,120,0.35)';
  g.beginPath(); const v = [[-122.75, 47.2], [-122.45, 47.2], [-122.5, 46.4], [-122.6, 45.0], [-123.0, 45.0], [-122.95, 46.4]] as LL[];
  v.forEach((q, i) => { const [a, b] = px(q); if (i) g.lineTo(a, b); else g.moveTo(a, b); }); g.fill();
  const linha = (l: LL[], w: number, cor: string) => { g.strokeStyle = cor; g.lineWidth = w; g.lineJoin = 'round'; g.beginPath(); l.forEach((q, i) => { const [a, b] = px(q); if (i) g.lineTo(a, b); else g.moveTo(a, b); }); g.stroke(); };
  g.fillStyle = '#2f6f9f';
  g.beginPath(); SOUND.forEach((q, i) => { const [a, b] = px(q); if (i) g.lineTo(a, b); else g.moveTo(a, b); }); g.fill();
  linha(COLUMBIA, 13, '#2f6f9f');
  linha(LEWIS, 5, '#3a7aaa');
  linha(COWLITZ, 5, '#3a7aaa');
  linha(WILLAMETTE, 6, '#3a7aaa');
  const [lx, ly] = px([-122.42, 45.97]);
  g.fillStyle = '#3a7aaa'; g.beginPath(); g.ellipse(lx, ly, 12, 5, -0.2, 0, 7); g.fill();
  // estrada (I-5)
  linha([[-122.32, 47.8], [-122.3, 47.3], [-122.6, 47.0], [-122.88, 46.6], [-122.9, 46.1], [-122.68, 45.6], [-122.75, 45.0]], 2, '#e9d9a0');
  for (const c of [L.SEATTLE, L.TACOMA, L.PORTLAND]) { const [a, b] = px(c); g.fillStyle = '#8a8a8a'; g.beginPath(); g.arc(a, b, 14, 0, 7); g.fill(); }
});
const Montanha: React.FC<{ll: LL; h: number; r: number}> = ({ll, h, r}) => {
  const [x, , z] = M(ll);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow><coneGeometry args={[r, h, 24]} /><Mat cor="#6a6a5a" /></mesh>
      <mesh position={[0, h * 0.82, 0]}><coneGeometry args={[r * 0.36, h * 0.36, 24]} /><Mat cor="#f4f6fa" /></mesh>
    </group>
  );
};
const Cidade: React.FC<{ll: LL; n: number; seed: number}> = ({ll, n, seed}) => {
  const [x, , z] = M(ll);
  const r = rnd(seed);
  return (
    <group position={[x, 0, z]}>
      {Array.from({length: n}).map((_, i) => {
        const h = 0.4 + r() * (i < 4 ? 2.4 : 0.9);
        return <Caixa key={i} pos={[(r() - 0.5) * 4.5, h / 2, (r() - 0.5) * 4.5]} tam={[0.5 + r() * 0.5, h, 0.5 + r() * 0.5]} cor={['#d9d4c4', '#b9bec7', '#9aa0aa'][i % 3]} />;
      })}
    </group>
  );
};
const naRota = (k: number) => {
  const pts = ROTA.map((q) => M(q));
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]));
  const alvo = clamp01(k) * c[c.length - 1];
  let i = 1;
  while (i < pts.length - 1 && c[i] < alvo) i++;
  const u = (alvo - c[i - 1]) / Math.max(1e-6, c[i] - c[i - 1]);
  const a = pts[i - 1], b = pts[i];
  return {pos: [lerp(a[0], b[0], u), 0, lerp(a[2], b[2], u)] as V3, ang: Math.atan2(-(b[2] - a[2]), b[0] - a[0]), i, pts};
};
const Mapa: React.FC<{t: number; p: number}> = ({t, p}) => {
  const k = Math.min(1, p);
  const av = naRota(k);
  const segs: [V3, V3][] = [];
  for (let i = 1; i < av.i; i++) segs.push([av.pts[i - 1], av.pts[i]]);
  segs.push([av.pts[av.i - 1], av.pos]);
  const zona = clamp01((k - PCT_SALTO + 0.05) / 0.08);
  const tena = clamp01((p - 1) / 0.4);
  const ari = M(L.ARIEL), te = M(L.TENA);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[MW, MH]} /><meshStandardMaterial map={mapaTex()} roughness={0.9} /></mesh>
      <Caixa pos={[0, -1.6, 0]} tam={[MW + 1, 3, MH + 1]} cor="#4a3a2a" />
      <Montanha ll={L.RAINIER} h={11} r={10} />
      <Montanha ll={L.HELENS} h={8} r={8} />
      <Montanha ll={L.HOOD} h={9} r={7.5} />
      <Montanha ll={L.ADAMS} h={9} r={8.5} />
      <Cidade ll={L.SEATTLE} n={22} seed={1} />
      <Cidade ll={L.TACOMA} n={10} seed={2} />
      <Cidade ll={L.PORTLAND} n={20} seed={3} />
      <Floresta x={[-45, 50]} z={[-80, 80]} n={1400} h={[1.2, 2.2]} seed={6} fora={(x, z) => Math.abs(x + 4) < 9 || (z > 45 && z < 56) || (x < -2 && z < -40)} />
      {/* rota do voo (vermelha) e o avião */}
      {segs.map(([a, b], i) => (<Barra key={i} a={[a[0], 0.6, a[2]]} b={[b[0], 0.6, b[2]]} r={0.35} cor="#ff4d4d" sombra={false} />))}
      {k < 0.999 && <B727 pos={[av.pos[0], 4, av.pos[2]]} rot={[0, av.ang, 0]} esc={0.14} t={t} luzes={false} janelasAcesas={false} trem={false} />}
      {/* zona provável do salto */}
      {zona > 0 && (
        <group position={[ari[0], 0.7, ari[2]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1 + 0.06 * Math.sin(t * 4), 1.4 + 0.06 * Math.sin(t * 4), 1]}><circleGeometry args={[5.5 * suave(zona), 32]} /><meshBasicMaterial color="#ff8a1f" transparent opacity={0.45} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.4, 1]}><ringGeometry args={[5.3 * suave(zona), 5.9 * suave(zona), 32]} /><meshBasicMaterial color="#ffd23f" /></mesh>
        </group>
      )}
      {zona > 0.6 && <Pilula texto="ZONA DO SALTO" pos={[ari[0] + 2, 9, ari[2]]} fundo="#ff8a1f" tam={0.8} />}
      {/* Tena Bar: onde as notas apareceram (longe da zona) */}
      {tena > 0 && (
        <group>
          {Array.from({length: 8}).map((_, i) => {
            const u0 = i / 8, u1 = u0 + 0.06;
            return <Barra key={i} a={[lerp(ari[0], te[0], u0), 0.9, lerp(ari[2], te[2], u0)]} b={[lerp(ari[0], te[0], Math.min(u1, tena)), 0.9, lerp(ari[2], te[2], Math.min(u1, tena))]} r={0.3} cor="#ffffff" sombra={false} />;
          }).slice(0, Math.ceil(tena * 8))}
          <group position={[te[0], 0, te[2]]} scale={suave(tena)}>
            <Cil pos={[0, 2, 0]} r={0.2} h={4} cor="#1d1b26" seg={6} />
            <mesh position={[0, 4.4, 0]}><sphereGeometry args={[1.0, 20, 14]} /><Mat cor="#ffd23f" rugoso={0.4} /></mesh>
          </group>
          {tena > 0.5 && <Pilula texto="TENA BAR · $5.800" pos={[te[0] + 4, 10, te[2]]} fundo="#ffd23f" tam={0.8} />}
        </group>
      )}
      <Pilula texto="SEATTLE" pos={M(L.SEATTLE, 7)} fundo="#1d1b26" tam={0.7} />
      <Pilula texto="PORTLAND" pos={M(L.PORTLAND, 7)} fundo="#1d1b26" tam={0.7} />
      <Pilula texto="RIO COLUMBIA" pos={M([-122.95, 46.13], 4)} fundo="#2f6f9f" tam={0.65} />
      <Pilula texto="WASHINGTON" pos={M([-122.1, 46.6], 3)} fundo="#ffffff" cor="#1d1b26" tam={0.6} />
      <Pilula texto="OREGON" pos={M([-122.25, 45.2], 3)} fundo="#ffffff" cor="#1d1b26" tam={0.6} />
    </group>
  );
};

// ============ 10. Margem do Rio Columbia (Tena Bar), fevereiro de 1980: o menino acha as notas ============
const Rio: React.FC<{t: number; p: number}> = ({t, p}) => {
  const tronco = useMemo(() => {
    const r = rnd(14);
    return Array.from({length: 7}).map(() => ({x: r() * 24 - 12, z: r() * 6 - 1, r: r() * 3, l: 2 + r() * 4}));
  }, []);
  const cava = suave(clamp01(p * 1.5));
  return (
    <group>
      <Chao pos={[0, 0, 4]} tam={[80, 22]} map={TX.areia([16, 5])} />
      <Agua t={t} tam={[400, 150]} pos={[0, -0.12, -82]} cor="#4a6e86" amp={0.1} />
      {/* margem do Oregon: floresta, morros e o monte Hood */}
      <Chao pos={[0, 0.2, -230]} tam={[1200, 160]} map={TX.mato([60, 8])} />
      <Floresta x={[-400, 400]} z={[-300, -165]} n={900} h={[18, 30]} y={0.2} seed={21} />
      {[[-200, -420, 140], [60, -460, 180], [300, -400, 120]].map(([x, z, r], i) => (<mesh key={i} position={[x, -10, z]}><coneGeometry args={[r, r * 0.55, 24]} /><Mat cor={i % 2 ? '#4f6a55' : '#5a7560'} /></mesh>))}
      <mesh position={[220, 0, -900]}><coneGeometry args={[260, 300, 24]} /><Mat cor="#7a8a9a" /></mesh>
      <mesh position={[220, 210, -900]}><coneGeometry args={[95, 90, 24]} /><Mat cor="#f4f6fa" /></mesh>
      {/* rebocador empurrando uma balsa de toras */}
      <group position={[((t * 2.5) % 200) - 60, 0, -45]}>
        <Caixa pos={[0, 0.4, 0]} tam={[34, 1.2, 9]} cor="#5a5048" />
        {Array.from({length: 12}).map((_, i) => (<Cil key={i} pos={[-14 + (i % 6) * 5.4, 1.4 + Math.floor(i / 6) * 0.9, -2 + (i % 2) * 2.4]} rot={[Math.PI / 2, 0, 0]} r={0.45} h={8} cor={i % 2 ? '#8b6a45' : '#9a7a52'} />))}
        <group position={[-20, 0, 0]}>
          <Caixa pos={[0, 0.8, 0]} tam={[6, 1.6, 4.5]} cor="#c9302c" />
          <Caixa pos={[0.6, 2.4, 0]} tam={[3, 1.8, 3]} cor="#f4efe2" />
          <Cil pos={[-0.8, 3.8, 0]} r={0.25} h={1.4} cor="#1d1b26" />
        </group>
      </group>
      {/* placa da praia */}
      <group position={[-4.5, 0, -0.5]}>
        <Caixa pos={[0, 0.8, 0]} tam={[0.12, 1.6, 0.12]} cor="#6b4429" />
        <Letreiro texto="TENA BAR" pos={[0, 1.55, 0.07]} larg={1.4} alt={0.4} fundo="#6b4429" cor="#f4efe2" />
      </group>
      {tronco.filter((q) => !(Math.abs(q.x - 0.3) < 3 && q.z > -0.6)).map((q, i) => (<Cil key={i} pos={[q.x, 0.18, q.z]} rot={[0, q.r, Math.PI / 2]} r={0.2} h={q.l} cor={i % 2 ? '#a89a86' : '#8f8070'} />))}
      {/* fogueira da família */}
      <group position={[3.2, 0, 1.6]}>
        {[0, 1.2, 2.4].map((a) => (<Cil key={a} pos={[0, 0.08, 0]} rot={[0, a, Math.PI / 2]} r={0.06} h={0.8} cor="#5a3a22" />))}
        {[0, 1, 2].map((i) => (<mesh key={i} position={[(i - 1) * 0.1, 0.3, 0]} scale={[1, 1 + Math.sin(t * 12 + i) * 0.2, 1]}><coneGeometry args={[0.12, 0.45, 24]} /><meshStandardMaterial color="#ffb347" emissive="#ff6a00" emissiveIntensity={1.4} /></mesh>))}
        {Array.from({length: 8}).map((_, i) => (<mesh key={i} position={[Math.cos(i) * 0.45, 0.06, Math.sin(i) * 0.45]}><dodecahedronGeometry args={[0.09, 0]} /><Mat cor="#6b6560" /></mesh>))}
        <pointLight position={[0, 0.6, 0]} color="#ffa040" intensity={4} distance={5} decay={1.4} />
      </group>
      <Caixa pos={[4.4, 0.2, 0.6]} tam={[0.6, 0.4, 0.4]} cor="#2f6fd6" />
      {/* o menino cavando e as 3 pilhas de notas apodrecidas */}
      {/* o menino atrás do buraco, de frente para a câmera, cavando com as mãos junto das notas */}
      <Boneco pos={[0.3, 0, -0.16]} rotY={0.15} acao="cava" t={t} v={{...CRIANCA, camisa: '#d9483a', calca: '#3a4a66'}} esc={0.55} />
      {/* areia de perto: grão fino, faixa molhada, pedrinhas, conchas, gravetos, pegadas e a pazinha de plástico */}
      <Chao pos={[0.2, 0.003, -2.5]} tam={[26, 14]} map={TX.areia([52, 28])} cor="#e8dcc4" />
      <mesh position={[0.2, 0.004, -1.6]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[9, 1.6]} /><meshStandardMaterial color="#8a7458" transparent opacity={0.55} roughness={0.3} /></mesh>
      {useMemo(() => {
        const r = rnd(41);
        return Array.from({length: 46}).map((_, i) => {
          const x = r() * 4 - 1.8, z = r() * 3 - 1.2;
          if (Math.hypot(x - 0.27, z - 0.22) < 0.45) return null;
          return i % 5 === 0
            ? <Cil key={i} pos={[x, 0.012, z]} rot={[0, r() * 3, Math.PI / 2]} r={0.008} h={0.12 + r() * 0.15} cor="#7a6248" />
            : <mesh key={i} position={[x, 0.01, z]} scale={[1, 0.55, 0.8]} castShadow><dodecahedronGeometry args={[0.012 + r() * 0.025, 0]} /><Mat cor={['#8a8478', '#a59a88', '#6e675e', '#f2ece0'][i % 4]} /></mesh>;
        });
      }, [])}
      {Array.from({length: 8}).map((_, i) => (<mesh key={'pg' + i} position={[1.3 + (i % 2) * 0.14, 0.006, 1.6 - i * 0.28]} rotation={[-Math.PI / 2, 0, 0.15]}><circleGeometry args={[0.05, 16]} /><meshStandardMaterial color="#a08660" /></mesh>))}
      <group position={[0.85, 0.02, 0.45]} rotation={[0, 0.8, 0]}>
        <Caixa pos={[0, 0, 0]} tam={[0.1, 0.02, 0.12]} cor="#ffd23f" />
        <Cil pos={[0, 0.0, 0.14]} rot={[Math.PI / 2, 0, 0]} r={0.012} h={0.18} cor="#2f6fd6" />
      </group>
      {/* o buraco raso (borda escura de areia molhada) */}
      <mesh position={[0.25, 0.006, 0.25]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.38, 40]} /><meshStandardMaterial color="#6e5a40" /></mesh>
      <mesh position={[0.25, 0.007, 0.25]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.36, 0.44, 40]} /><meshStandardMaterial color="#a28a64" /></mesh>
      {[[0.1, 0.15, 0.4], [0.32, 0.3, -0.5], [0.42, 0.12, 1.1]].map(([x, z, r], i) => (
        <group key={i} position={[x, 0.004 + cava * 0.005 - (1 - cava) * 0.008, z]} rotation={[0.08 * i, r, 0.1]}>
          <Maco pos={[0, 0, 0]} velho />
          <Maco pos={[0.01, 0.011, 0.004]} velho />
        </group>
      ))}
      {[[0.6, 0.0, 0.3], [-0.2, 0.4, 2.2]].map(([x, z, r], i) => (<mesh key={i} position={[x, 0.006, z]} rotation={[-Math.PI / 2, 0, r]}><planeGeometry args={[0.156, 0.066]} /><meshStandardMaterial map={TX.notaVelha()} /></mesh>))}
      <Boneco pos={[-2.6, 0, -0.5]} rotY={1.2} acao="cava" t={t + 0.7} v={{...PASSAGEIROS[3], camisa: '#3f5f8f'}} ferramenta="pa" />
      <Boneco pos={[-3.3, 0, 0.9]} rotY={2.2} acao="aponta" t={t} v={PASSAGEIROS[1]} />
      <ZeDetetive pos={[-1.5, 0, 1.0]} rotY={1.9} t={t} />
      <pointLight position={[0.3, 0.8, 0.6]} color="#fff4e0" intensity={2.5} distance={3} decay={1.5} />
      <ChuvaEm t={t} pos={[0, 0, 0]} raio={12} n={200} />
    </group>
  );
};

// ============ 11. Teoria 2: sobreviveu e largou o dinheiro na margem (à noite) ============
const Teoria2: React.FC<{t: number}> = ({t}) => (
  <group>
    <Chao pos={[0, 0, 5]} tam={[120, 30]} map={TX.mato([24, 6])} />
    <Chao pos={[0, 0.01, -1.5]} tam={[120, 4]} map={TX.areia([24, 1])} cor="#8a8070" />
    <Agua t={t} tam={[300, 100]} pos={[0, -0.12, -53]} cor="#24405a" amp={0.12} />
    <Floresta x={[-60, 60]} z={[6, 60]} n={500} h={[16, 28]} seed={33} fora={(x, z) => Math.abs(x - 3) < 3 && z < 14} />
    {[[-6, 4.5], [5.5, 5], [9, 7]].map(([x, z], i) => (<Pinheiro key={i} pos={[x, 0, z]} h={13 + i * 2} />))}
    {/* a sacola largada, notas espalhadas, o paraquedas embolado */}
    <Sacola pos={[-0.3, 0, -0.4]} rotY={0.6} />
    {[[0.3, 0.1, 0.5], [0.0, 0.4, 1.4], [0.6, -0.3, 2.2], [-0.8, 0.2, 0.9]].map(([x, z, r], i) => (<Maco key={i} pos={[x, 0.01, z]} rotY={r} />))}
    {[0, 1, 2, 3].map((i) => (<mesh key={i} position={[-1.8 + i * 0.25, 0.25, 0.6 + (i % 2) * 0.3]} castShadow><icosahedronGeometry args={[0.45 - i * 0.05, 0]} /><Mat cor={i % 2 ? '#6b7a4a' : '#d9d0b0'} /></mesh>))}
    {/* pegadas indo para a mata */}
    {Array.from({length: 10}).map((_, i) => (<mesh key={i} position={[0.6 + i * 0.25 + (i % 2) * 0.15, 0.012, 0.6 + i * 0.65]} rotation={[-Math.PI / 2, 0, 0.2]}><planeGeometry args={[0.12, 0.28]} /><meshStandardMaterial color="#2a2018" /></mesh>))}
    <Cooper pos={[lerp(2.4, 3.4, (t % 6) / 6), 0, lerp(5.2, 7.6, (t % 6) / 6)]} rotY={0.4} acao="anda" t={t} />
    <mesh position={[-120, 90, -300]}><sphereGeometry args={[9, 20, 14]} /><meshBasicMaterial color="#dfe6f4" /></mesh>
    <pointLight position={[-3, 6, -4]} color="#9fb6e6" intensity={45} distance={26} decay={1.1} />
    <ChuvaEm t={t} pos={[0, 0, 2]} raio={10} n={500} />
    <Estrelas n={150} />
  </group>
);

// ============ 12. Teoria 3: escapou com o resgate inteiro (praia, pôr do sol) ============
const Teoria3: React.FC<{t: number}> = ({t}) => (
  <group>
    <Chao pos={[0, 0, 8]} tam={[120, 30]} map={TX.areia([24, 6])} cor="#fff0d8" />
    <Agua t={t} tam={[600, 300]} pos={[0, -0.1, -158]} cor="#3a7aa0" amp={0.18} />
    {[0, 1, 2].map((i) => {
      const k = (t * 0.3 + i / 3) % 1;
      return <Caixa key={i} pos={[0, 0.01, -7 + k * 3.5]} tam={[120, 0.03, 0.4 + (1 - k) * 0.6]} cor="#f4fbff" sombra={false} />;
    })}
    <mesh position={[0, 30, -500]}><sphereGeometry args={[40, 20, 14]} /><meshBasicMaterial color="#ffcf7a" toneMapped={false} /></mesh>
    {[[-6, 2], [5, 3.5], [8, 6], [-9, 6]].map(([x, z], i) => (<Palmeira key={i} pos={[x, 0, z]} esc={1 + (i % 2) * 0.25} inc={i % 2 ? 0.18 : -0.14} />))}
    {/* Cooper sentado numa cadeira de praia ATRÁS da mesinha (nada atravessa); sacola aberta na areia; espreguiçadeira e guarda-sol ao lado */}
    <group position={[0, 0, 0]}>
      {/* cadeira de praia: assento de lona listrada a 0,45 m, encosto inclinado, pés de alumínio */}
      <group position={[0, 0, 0.62]}>
        <Caixa pos={[0, 0.43, 0]} tam={[0.52, 0.04, 0.48]} cor="#2f6fd6" />
        {[-0.18, 0, 0.18].map((x) => (<Caixa key={x} pos={[x, 0.452, 0]} tam={[0.06, 0.005, 0.48]} cor="#f4efe2" sombra={false} />))}
        <Caixa pos={[0, 0.78, 0.3]} rot={[0.3, 0, 0]} tam={[0.52, 0.66, 0.04]} cor="#2f6fd6" />
        {[-0.18, 0, 0.18].map((x) => (<Caixa key={'e' + x} pos={[x, 0.78, 0.278]} rot={[0.3, 0, 0]} tam={[0.06, 0.66, 0.005]} cor="#f4efe2" sombra={false} />))}
        {[-0.27, 0.27].map((x) => (<group key={x}>
          <Barra a={[x, 0, -0.22]} b={[x, 0.43, 0.2]} r={0.012} cor="#c9ced6" />
          <Barra a={[x, 0, 0.24]} b={[x, 0.43, -0.2]} r={0.012} cor="#c9ced6" />
          <Barra a={[x, 0.6, -0.2]} b={[x, 0.6, 0.18]} r={0.014} cor="#c9ced6" />
        </group>))}
      </group>
      <Cooper pos={[0, 0.17, 0.6]} rotY={Math.PI} acao="senta" t={t} esc={0.85} capa />
      {/* mesinha redonda com drinque, óculos e maços contados */}
      <group position={[0.05, 0, -0.3]}>
        <Cil pos={[0, 0.56, 0]} r={0.3} h={0.03} cor="#f4efe2" />
        <Cil pos={[0, 0.28, 0]} r={0.025} h={0.56} cor="#c9ced6" />
        <Cil pos={[0, 0.01, 0]} r={0.16} h={0.02} cor="#c9ced6" />
        <Cil pos={[0.14, 0.64, 0.02]} r={0.035} r2={0.025} h={0.13} cor="#ffb347" />
        <Barra a={[0.15, 0.66, 0.02]} b={[0.19, 0.76, 0.0]} r={0.004} cor="#e8322b" sombra={false} />
        <Caixa pos={[-0.02, 0.58, -0.1]} rot={[0, 0.3, 0]} tam={[0.12, 0.01, 0.04]} cor="#1d1b26" />
        {[[-0.12, 0.06, 0.4], [-0.05, 0.1, -0.3], [-0.15, -0.05, 1.2]].map(([x, z, r], i) => (<Maco key={i} pos={[x, 0.58 + i * 0.012, z]} rotY={r} />))}
      </group>
      {/* sacola aberta na areia, maços escapando */}
      <Sacola pos={[-0.62, 0, 0.5]} rotY={-0.5} esc={1.05} />
      {[[-0.85, 0.15, 0.3], [-0.45, 0.2, 1.2], [-0.95, 0.55, 2.2], [-0.3, -0.1, 0.8]].map(([x, z, r], i) => (<Maco key={i} pos={[x, 0.01 + i * 0.003, z]} rotY={r} />))}
      {/* espreguiçadeira com toalha e guarda-sol listrado */}
      <group position={[1.45, 0, 0.6]}>
        <Caixa pos={[0, 0.35, 0.2]} tam={[0.7, 0.06, 1.3]} cor="#f4efe2" />
        <Caixa pos={[0, 0.7, 0.95]} rot={[-0.9, 0, 0]} tam={[0.7, 0.06, 0.9]} cor="#f4efe2" />
        <Caixa pos={[0, 0.39, 0.1]} tam={[0.6, 0.02, 0.9]} cor="#e8322b" />
        {[-0.3, 0.3].map((x) => [-0.4, 0.8].map((z) => (<Cil key={x + ':' + z} pos={[x, 0.17, z]} r={0.025} h={0.34} cor="#c9ced6" />)))}
      </group>
      <Cil pos={[1.15, 1.2, 1.45]} r={0.03} h={2.4} cor="#f4efe2" />
      {Array.from({length: 8}).map((_, i) => (
        <mesh key={i} position={[1.15, 2.35, 1.45]}><coneGeometry args={[1.5, 0.5, 24, 1, true, (i * Math.PI) / 4, Math.PI / 4]} /><meshStandardMaterial color={i % 2 ? '#e8322b' : '#ffffff'} side={2} /></mesh>
      ))}
      <Mala pos={[-1.4, 0, 1.3]} rotY={0.4} cor="#8a5a2b" />
      {/* pegadas na areia vindo do carro */}
      {Array.from({length: 9}).map((_, i) => (<mesh key={'p' + i} position={[-0.3 + i * 0.5 + (i % 2) * 0.12, 0.006, 1.4 + i * 0.75]} rotation={[-Math.PI / 2, 0, 0.5]}><planeGeometry args={[0.1, 0.24]} /><meshStandardMaterial color="#d9b98a" /></mesh>))}
    </group>
    <Carro pos={[6, 0, 9]} rotY={-0.3} cor="#d9a03a" farol={false} />
  </group>
);

// ============ 13. Teoria 1: morreu na queda (floresta de manhã, paraquedas preso no pinheiro) ============
const Teoria1: React.FC<{t: number}> = ({t}) => (
  <group>
    <Chao pos={[0, 0, 0]} tam={[300, 300]} map={TX.mato([40, 40])} />
    <Floresta x={[-120, 120]} z={[-120, -10]} n={900} h={[18, 32]} seed={44} />
    <Floresta x={[-120, 120]} z={[34, 120]} n={400} h={[18, 32]} seed={45} />
    {[[3, -2, 19, 0.55], [-7, -6, 19, 0.8], [11, -8, 24, 0.8], [-12, -12, 17, 0.9], [15, -14, 20, 0.9], [-15, 2, 21, 0.8]].map(([x, z, h, l], i) => (<Pinheiro key={i} pos={[x, 0, z]} h={h} larg={l} cor={i % 2 ? '#2f5330' : '#355e33'} />))}
    {/* velame preso no alto do pinheiro, cordas penduradas */}
    <group position={[2.2, 9.6, 1.4]} rotation={[0.7, 0.3, -0.3]}>
      {Array.from({length: 12}).map((_, i) => (
        <mesh key={i} castShadow><sphereGeometry args={[3.6, 20, 14, (i / 12) * Math.PI * 2, Math.PI / 6, 0, Math.PI / 2.6]} /><meshStandardMaterial color={i % 2 ? '#6b7a4a' : '#d9d0b0'} side={2} /></mesh>
      ))}
    </group>
    {[-0.8, -0.3, 0.2, 0.7].map((dz, i) => (<Barra key={i} a={[2.2 + dz, 8.6, 1.4 + dz * 0.5]} b={[1.2 + dz * 0.4, 2.2 - i * 0.3, 0.6 + dz]} r={0.02} cor="#e9e1cf" sombra={false} />))}
    {/* galhos quebrados, riacho, a sacola rasgada com notas */}
    {[[1.6, 0.8, 0.7], [-0.6, 1.4, -0.5], [2.4, 2.2, 1.2]].map(([x, z, r], i) => (<Cil key={i} pos={[x, 0.08, z]} rot={[0, r, Math.PI / 2]} r={0.06} h={1.4} cor="#5a3a22" />))}
    <Caixa pos={[0, 0.01, 5]} rot={[0, 0.25, 0]} tam={[60, 0.04, 2]} cor="#3a6a8f" sombra={false} />
    {Array.from({length: 10}).map((_, i) => (<mesh key={i} position={[-8 + i * 1.8, 0.12, 5 + Math.sin(i) * 0.6]}><dodecahedronGeometry args={[0.25, 0]} /><Mat cor="#7a7a72" /></mesh>))}
    <Sacola pos={[0.6, 0, 1.4]} rotY={1.2} />
    {[[1.1, 1.9, 0.2], [0.2, 2.1, 1.0], [1.5, 1.2, 2.2], [0.8, 2.6, 0.4]].map(([x, z, r], i) => (<Maco key={i} pos={[x, 0.01, z]} rotY={r} />))}
    {Array.from({length: 14}).map((_, i) => {
      const r = rnd(i + 70);
      return <mesh key={i} position={[r() * 10 - 5, 0.15, r() * 8 - 2]}><coneGeometry args={[0.25, 0.35, 24]} /><Mat cor={i % 2 ? '#3f7a42' : '#4f8a4a'} /></mesh>;
    })}
    <ChuvaEm t={t} pos={[1, 0, 1]} raio={12} n={400} />
  </group>
);

// ============ 14. Escritório do detetive: quadro de suspeitos com o retrato falado ============
const silhueta = (n: number) => tela('silh' + n, 128, 160, (g) => {
  g.fillStyle = '#e9e3d4';
  g.fillRect(0, 0, 128, 160);
  g.fillStyle = ['#5a5a66', '#6a5a4a', '#4a5a6a', '#5a4a5a'][n % 4];
  g.beginPath(); g.arc(64, 62, 30, 0, 7); g.fill();
  g.beginPath(); g.ellipse(64, 150, 52, 40, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#ffd23f';
  g.font = "800 46px 'Baloo 2', sans-serif";
  g.textAlign = 'center';
  g.fillText('?', 64, 78);
});
const fotoAviao = () => tela('fotoaviao', 160, 128, (g) => {
  g.fillStyle = '#f4f4f0';
  g.fillRect(0, 0, 160, 128);
  g.fillStyle = '#6a8ab8';
  g.fillRect(8, 8, 144, 92);
  g.fillStyle = '#f4f4f4';
  g.fillRect(30, 50, 100, 12);
  g.beginPath(); g.moveTo(70, 56); g.lineTo(55, 82); g.lineTo(70, 82); g.lineTo(90, 56); g.fill();
  g.beginPath(); g.moveTo(32, 50); g.lineTo(26, 30); g.lineTo(36, 30); g.lineTo(44, 50); g.fill();
  g.fillStyle = '#1d1b26';
  g.font = "800 16px 'Baloo 2', sans-serif";
  g.fillText('727 · VOO 305', 22, 120);
});
const Quadro: React.FC<{t: number; p: number}> = ({t, p}) => {
  const Z = 0.02;
  const carimbo = clamp01((p - 0.88) / 0.08);
  const pergunta = p >= 0.999;
  const cartoes: [number, number, number][] = [[-1.28, 2.12, 0.04], [-1.28, 1.42, -0.05], [1.28, 2.12, -0.03], [1.28, 1.42, 0.05]];
  return (
    <group>
      <Chao pos={[0, 0, 1.2]} tam={[8, 5]} map={TX.lambri([4, 3])} cor="#c9a080" />
      <CaixaTx pos={[0, 1.6, -0.15]} tam={[8, 3.2, 0.2]} map={TX.papel([8, 3])} />
      <Caixa pos={[0, 0.06, -0.03]} tam={[8, 0.12, 0.04]} cor="#3a2a1a" />
      {/* janela com persiana e chuva lá fora */}
      <group position={[3.0, 1.7, -0.04]}>
        <mesh><planeGeometry args={[1.2, 1.5]} /><meshBasicMaterial color="#0e1a36" /></mesh>
        {Array.from({length: 12}).map((_, i) => (<Caixa key={i} pos={[0, 0.7 - i * 0.125, 0.03]} rot={[0.6, 0, 0]} tam={[1.2, 0.07, 0.01]} cor="#d9d1bd" sombra={false} />))}
        <Caixa pos={[0, 0, 0]} tam={[1.32, 1.62, 0.04]} cor="#5a3a22" />
      </group>
      {/* quadro de cortiça com moldura */}
      <Caixa pos={[0, 1.65, -0.03]} tam={[3.5, 2.05, 0.06]} cor="#5a3a22" />
      <CaixaTx pos={[0, 1.65, 0]} tam={[3.3, 1.85, 0.03]} map={TX.cortica([3, 2])} />
      {/* retrato falado no centro */}
      <Letreiro texto="PROCURADO" pos={[0, 2.43, Z]} larg={0.8} alt={0.16} fundo="#1d1b26" cor="#ffd23f" />
      <mesh position={[0, 1.95, Z]}><planeGeometry args={[0.56, 0.7]} /><meshStandardMaterial map={TX.retrato()} /></mesh>
      <Letreiro texto="D. B. COOPER" pos={[0, 1.53, Z]} larg={0.7} alt={0.12} fundo="#f4efe2" cor="#1d1b26" />
      {/* suspeitos (silhuetas) */}
      {cartoes.map(([x, y, r], i) => (
        <group key={i} position={[x, y, Z]} rotation={[0, 0, r]}>
          <mesh><planeGeometry args={[0.42, 0.52]} /><meshStandardMaterial map={silhueta(i)} /></mesh>
          <Letreiro texto={`SUSPEITO ${i + 1}`} pos={[0, -0.3, 0.001]} larg={0.42} alt={0.09} fundo="#f4efe2" cor="#c9302c" />
          <mesh position={[0, 0.27, 0.01]}><sphereGeometry args={[0.022, 20, 14]} /><meshStandardMaterial color="#d6282b" /></mesh>
        </group>
      ))}
      {/* mapinha com a zona do salto, foto do avião, cartões das teorias */}
      <mesh position={[-0.62, 1.05, Z]} rotation={[0, 0, 0.04]}><planeGeometry args={[0.55, 0.62]} /><meshStandardMaterial map={mapaTex()} /></mesh>
      <mesh position={[-0.6, 1.0, Z + 0.003]}><ringGeometry args={[0.05, 0.065, 16]} /><meshBasicMaterial color="#d6282b" /></mesh>
      <mesh position={[0.6, 1.06, Z]} rotation={[0, 0, -0.05]}><planeGeometry args={[0.52, 0.42]} /><meshStandardMaterial map={fotoAviao()} /></mesh>
      {cartoes.map(([x, y], i) => (<Barra key={'b' + i} a={[x, y + 0.27, Z + 0.02]} b={[0, 2.3, Z + 0.02]} r={0.005} cor="#d6282b" sombra={false} />))}
      <Barra a={[-0.6, 1.0, Z + 0.02]} b={[0, 2.3, Z + 0.02]} r={0.005} cor="#d6282b" sombra={false} />
      {carimbo > 0 && (
        <group position={[0, 1.95, Z + 0.03]} rotation={[0, 0, -0.25]} scale={1 + (1 - suave(carimbo)) * 1.5}>
          <Letreiro texto="SEM SOLUÇÃO" pos={[0, 0, 0]} larg={0.9} alt={0.2} fundo="#c9302c" cor="#ffffff" brilho />
        </group>
      )}
      {/* mesa: máquina de escrever, telefone, abajur, café, saco de evidência com a gravata */}
      <group position={[-2.3, 0, 0.75]}>
        <Caixa pos={[0, 0.74, 0]} tam={[1.7, 0.06, 0.85]} cor="#6b4429" />
        {[[-0.78, -0.35], [0.78, -0.35], [-0.78, 0.35], [0.78, 0.35]].map(([x, z], i) => (<Caixa key={i} pos={[x, 0.36, z]} tam={[0.06, 0.72, 0.06]} cor="#4a3426" />))}
        <Caixa pos={[0.15, 0.83, 0.05]} rot={[0, 0.15, 0]} tam={[0.42, 0.12, 0.34]} cor="#2b3f2f" />
        <Caixa pos={[0.15, 0.95, -0.08]} rot={[-0.3, 0.15, 0]} tam={[0.3, 0.2, 0.01]} cor="#f4efe2" />
        <Caixa pos={[0.6, 0.8, 0.1]} tam={[0.2, 0.08, 0.22]} cor="#151518" />
        <Cil pos={[0.6, 0.86, 0.1]} rot={[0, 0, Math.PI / 2]} r={0.03} h={0.24} cor="#151518" />
        <Cil pos={[-0.55, 0.78, -0.2]} r={0.1} h={0.04} cor="#2b2f3a" />
        <Barra a={[-0.55, 0.8, -0.2]} b={[-0.45, 1.2, -0.15]} r={0.012} cor="#2b2f3a" sombra={false} />
        <mesh position={[-0.4, 1.2, -0.12]} rotation={[0.4, 0, -0.5]}><coneGeometry args={[0.13, 0.18, 24, 1, true]} /><meshStandardMaterial color="#2f6f4f" side={2} /></mesh>
        <Cil pos={[-0.15, 0.82, 0.25]} r={0.045} h={0.1} cor="#f4efe2" />
        <group position={[-0.45, 0.78, 0.22]} rotation={[0, 0.4, 0]}>
          <mesh><boxGeometry args={[0.3, 0.02, 0.22]} /><meshStandardMaterial color="#dfe9f2" transparent opacity={0.55} /></mesh>
          <Caixa pos={[0, 0.012, 0]} rot={[0, 0.2, 0]} tam={[0.05, 0.01, 0.16]} cor="#0b0b0e" sombra={false} />
          <Letreiro texto="EVIDÊNCIA" pos={[0.1, 0.012, 0.08]} rot={[-Math.PI / 2, 0, 0]} larg={0.12} alt={0.04} fundo="#ffd23f" cor="#1d1b26" />
        </group>
      </group>
      {/* arquivo de aço */}
      <group position={[2.6, 0, 0.3]}>
        <Caixa pos={[0, 0.7, 0]} tam={[0.5, 1.4, 0.6]} cor="#6b707c" />
        {[0.3, 0.65, 1.0, 1.3].map((y) => (<group key={y}><Caixa pos={[0, y, 0.305]} tam={[0.44, 0.3, 0.01]} cor="#7d828e" sombra={false} /><Caixa pos={[0, y, 0.32]} tam={[0.12, 0.03, 0.03]} cor="#c9ced6" sombra={false} /></group>))}
      </group>
      <pointLight position={[-2.7, 1.15, 0.6]} color="#ffd9a0" intensity={4} distance={5} decay={1.5} />
      <pointLight position={[0, 2.8, 1.8]} color="#fff0d8" intensity={9} distance={8} decay={1.3} />
      <ZeDetetive pos={pergunta ? [1.95, 0, 0.9] : [1.95, 0, 0.75]} rotY={pergunta ? -0.35 : -1.75} t={t} aponta={!pergunta} />
    </group>
  );
};

// ============ 15. Arquivo do FBI, julho de 2016: a caixa do caso é fechada ============
const Arquivo: React.FC<{t: number; p: number}> = ({t, p}) => {
  const caixas = useMemo(() => {
    const r = rnd(52);
    return Array.from({length: 5 * 6}).map(() => ({w: 0.35 + r() * 0.12, c: ['#b8946a', '#c9a57a', '#a8865c', '#d4b48a'][Math.floor(r() * 4)], f: r() > 0.85}));
  }, []);
  const tampa = suave(clamp01(p / 0.45));
  const carimbo = clamp01((p - 0.55) / 0.12);
  const Estante: React.FC<{pos: V3}> = ({pos}) => (
    <group position={pos}>
      {[-1.5, 1.5].map((x) => [-0.3, 0.3].map((z) => (<Caixa key={x + ':' + z} pos={[x, 1.15, z]} tam={[0.05, 2.3, 0.05]} cor="#5a5f6b" />)))}
      {[0.1, 0.55, 1.0, 1.45, 1.9, 2.3].map((y, j) => (
        <group key={y}>
          <Caixa pos={[0, y, 0]} tam={[3.05, 0.03, 0.62]} cor="#7d828e" />
          {j < 5 && caixas.slice(j * 6, j * 6 + 6).map((c, i) => (
            <group key={i} position={[-1.25 + i * 0.5, y + 0.17, 0]}>
              <Caixa pos={[0, 0, 0]} tam={[c.w, 0.3, 0.5]} cor={c.c} />
              <Caixa pos={[0, 0.02, 0.252]} tam={[0.16, 0.08, 0.005]} cor={c.f ? '#ffd23f' : '#f4efe2'} sombra={false} />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
  return (
    <group>
      <Chao pos={[0, 0, -3]} tam={[16, 16]} map={TX.concreto([8, 8])} rough={0.5} />
      <Caixa pos={[0, 3.2, -3]} tam={[16, 0.1, 16]} cor="#c9ced6" />
      {[-4, -1.2, 1.6].map((z) => [-4, 4].map((x) => (<mesh key={x + ':' + z} position={[x * 0.5, 3.12, z]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[2.4, 0.15]} /><meshBasicMaterial color="#f4fbff" toneMapped={false} side={2} /></mesh>)))}
      {[-2.4, -4.4, -6.4].map((z) => [-2.0, 1.8].map((x) => (<Estante key={x + ':' + z} pos={[x, 0, z]} />)))}
      <CaixaTx pos={[0, 1.6, -8]} tam={[16, 3.2, 0.2]} map={TX.concreto([6, 2])} cor="#b9bec7" />
      <Letreiro texto="ARQUIVO · CASOS 1970–1979" pos={[-0.1, 2.75, -7.88]} larg={2.6} alt={0.3} fundo="#1d2233" cor="#ffffff" />
      {/* mesa com a caixa do caso */}
      <Caixa pos={[0, 0.8, 0]} tam={[1.8, 0.06, 0.9]} cor="#9aa0aa" />
      {[[-0.85, -0.4], [0.85, -0.4], [-0.85, 0.4], [0.85, 0.4]].map(([x, z], i) => (<Caixa key={i} pos={[x, 0.4, z]} tam={[0.05, 0.8, 0.05]} cor="#6b707c" />))}
      <group position={[0, 0.83, 0]}>
        <Caixa pos={[0, 0.17, 0]} tam={[0.55, 0.34, 0.42]} cor="#c9a57a" />
        {Array.from({length: 6}).map((_, i) => (<Caixa key={i} pos={[-0.2 + i * 0.08, 0.3, 0]} tam={[0.02, 0.18, 0.36]} cor={i % 2 ? '#e9d9a0' : '#d9c48a'} sombra={false} />))}
        <Letreiro texto="NORJAK · VOO 305" pos={[0, 0.2, 0.212]} larg={0.42} alt={0.1} fundo="#f4efe2" cor="#1d1b26" />
        <group position={[0, 0.34, -0.21]} rotation={[-(1 - tampa) * 1.9, 0, 0]}>
          <Caixa pos={[0, 0.02, 0.215]} tam={[0.58, 0.04, 0.45]} cor="#b8946a" />
          {carimbo > 0 && (
            <group position={[0, 0.045, 0.215]} rotation={[-Math.PI / 2, 0, 0.2]} scale={1 + (1 - suave(carimbo)) * 1.2}>
              <Letreiro texto="SUSPENSO" pos={[0, 0, 0]} larg={0.42} alt={0.1} fundo="#c9302c" cor="#ffffff" brilho />
            </group>
          )}
        </group>
      </group>
      {[0, 1, 2].map((i) => (<Caixa key={i} pos={[0.6, 0.85 + i * 0.012, 0.15]} rot={[0, 0.1 * i, 0]} tam={[0.3, 0.01, 0.38]} cor={['#e9d9a0', '#f4efe2', '#d9c48a'][i]} />))}
      <Caixa pos={[-0.6, 0.86, 0.1]} tam={[0.08, 0.1, 0.08]} cor="#5a3a22" />
      <Boneco pos={[0.45, 0, -1.1]} rotY={-0.3} acao="aponta" t={t} v={AGENTE} />
      <Boneco pos={[-1.6, 0, -1.2]} rotY={0.5} acao="carrega" t={t + 1} v={{...AGENTE, camisa: '#5a6a7a', gravata: '#1d2233'}} />
      <pointLight position={[0, 2.8, 0.5]} color="#f4fbff" intensity={10} distance={8} decay={1.3} />
      <pointLight position={[0, 2.8, -4]} color="#f4fbff" intensity={8} distance={8} decay={1.3} />
    </group>
  );
};

// ================= tabela de sets =================
const DB_ESCADA_PAREDE: V3 = [ESCADA_X - 1.8, -R727 - 1.2, 0];
export const SETS_COOPER: Record<string, SetCaso> = {
  db_balcao: {
    ceu: ['#2a2018', '#4a3a2a'],
    luz: 'interior',
    render: ({t, p}) => <Balcao t={t} p={p} />,
    cams: {
      dinheiro: orb([1.05, 0.8, -2.05], 148, 17, 3.6, 3.2, 42, 8),
      geral: orb([0.3, 1.15, -2.4], 24, 14, 8.0, 6.8, 44, 8),
    },
  },
  db_aeroporto: {
    ceu: CEU_CREP,
    luz: 'noite',
    nevoa: [60, 420],
    render: ({t, p}) => <PatioPortland t={t} p={p} />,
    cams: {
      geral: orb([-9, 3.2, 1.5], -62, 9, 30, 25, 44, 8),
    },
  },
  db_cabine: {
    ceu: CEU_NOITE,
    luz: 'interior',
    render: ({t, p}) => <Cabine t={t} p={p} modo="cheio" />,
    cams: {
      geral: orb([XC + 0.35, 0.75, 0.3], 0, 7, 3.6, 3.2, 46, 8),
      bilhete: orb([XC + 0.15, 0.88, 0.4], 60, 12, 2.4, 2.2, 46, -6),
      pasta: orb([XC + 0.22, 0.98, 0.45], 72, 20, 2.0, 1.75, 44, -8),
    },
  },
  db_cabine_vazia: {
    ceu: CEU_NOITE,
    luz: 'interior',
    render: ({t, p}) => <Cabine t={t} p={p} modo="vazio" />,
    cams: {
      comissarios: orb([XC + 0.95, 0.95, -0.1], 4, 4, 7.8, 7.0, 46, 6),
    },
  },
  db_cabine_salto: {
    ceu: CEU_NOITE,
    luz: 'interior',
    render: ({t, p}) => <Cabine t={t} p={p} modo="salto" />,
    cams: {
      amarra: orb([XC - 0.9, 0.78, 0], 38, 6, 4.0, 3.6, 46, -10),
    },
  },
  db_dinheiro: {
    ceu: ['#2a2018', '#4a3a2a'],
    luz: 'interior',
    render: ({t, p}) => <Dinheiro t={t} p={p} />,
    cams: {
      geral: orb([0, 1.05, 0], 22, 32, 3.7, 3.0, 44, 10),
    },
  },
  db_dinheiro_falta: {
    ceu: ['#2a2018', '#4a3a2a'],
    luz: 'interior',
    render: ({t, p}) => <Dinheiro t={t} p={p} faltando />,
    cams: {
      falta: orb([0.1, 0.95, -0.08], -28, 50, 2.2, 1.8, 42, 10),
    },
  },
  db_pista: {
    ceu: CEU_CHUVA,
    luz: 'noite',
    nevoa: [70, 480],
    render: ({t, p}) => <PistaSeattle t={t} p={p} />,
    cams: {
      geral: PISTA_GERAL,
      paraquedas: orb([-17.6, 0.7, -2.4], 28, 30, 3.3, 2.6, 42, 12),
    },
  },
  db_decola: {
    ceu: CEU_CHUVA,
    luz: 'noite',
    nevoa: [120, 900],
    render: ({t, p}) => <Decolagem t={t} p={p} />,
    cams: {
      decola: trilho([70, 3, 26], [62, 4, 24], [-35, 5, 0], [40, 9, 0], 44),
    },
  },
  db_voo: {
    ceu: CEU_CHUVA,
    luz: 'noite',
    nevoa: [90, 700],
    render: ({t, p}) => <Voo t={t} p={p} escada={0} />,
    cams: {
      lado: orb([-1, 0, 0], 52, 9, 62, 52, 44, 8),
      some: orb([-4, -8, 0], -130, 16, 70, 112, 42, 6),
    },
  },
  db_voo_escada: {
    ceu: CEU_CHUVA,
    luz: 'noite',
    nevoa: [90, 700],
    render: ({t, p}) => <Voo t={t} p={p} escada={1} cooperNaEscada />,
    cams: {
      lado: orb([-4, -1, 0], 58, 6, 60, 52, 44, 8),
      tras: orb([-15.6, -2.9, 0], -62, 8, 10, 8.5, 48, 12),
      // acompanha o Cooper descendo (p 0,1 → 0,6), de frente e um pouco abaixo, ele ocupando ~40% da altura
      baixo: trilho([-13.0 - 3.9, -1.35 - 0.42, 2.75], [-14.7 - 3.6, -2.55 - 0.42, 2.45], [-13.0, -1.35, 0], [-14.7, -2.55, 0], 46),
    },
  },
  db_queda: {
    ceu: CEU_CHUVA,
    luz: 'noite',
    nevoa: [40, 420],
    render: ({t, p}) => <Queda t={t} p={p} />,
    cams: {
      desce: trilho([12, yQueda(0) - 1.5, 17], [9.5, yQueda(1) - 1.5, 14.5], [0, yQueda(0) + 2.6, 0], [0, yQueda(1) + 2.6, 0], 46),
    },
  },
  db_mapa: {
    ceu: ['#0d2a44', '#1e4a6e'],
    luz: 'mapa',
    render: ({t, p}) => <Mapa t={t} p={p} />,
    cams: {
      rota: orb(M([-122.5, 46.55]), 0, 58, 175, 150, 42, 6),
      tena: orb(M([-122.7, 45.76]), -18, 56, 62, 50, 42, 8),
    },
  },
  db_rio: {
    ceu: ['#8a9aaa', '#dfe5ea'],
    luz: 'nublado',
    nevoa: [80, 1100],
    render: ({t, p}) => <Rio t={t} p={p} />,
    cams: {
      geral: orb([0.4, 0.8, 0.8], 28, 14, 8.6, 7.2, 44, 10),
      notas: orb([0.27, 0.2, 0.4], -4, 30, 3.8, 3.4, 44, 8),
    },
  },
  db_t1: {
    ceu: ['#6a7a80', '#c9d3d6'],
    luz: 'nublado',
    nevoa: [18, 140],
    render: ({t}) => <Teoria1 t={t} />,
    cams: {
      arvore: orb([1.8, 6.4, 0.6], 28, 8, 24, 20, 44, 10),
    },
  },
  db_t2: {
    ceu: CEU_NOITE,
    luz: 'noite',
    nevoa: [30, 260],
    render: ({t}) => <Teoria2 t={t} />,
    cams: {
      margem: orb([1.2, 1.0, 3.0], -155, 14, 6.4, 5.2, 44, 10),
    },
  },
  db_t3: {
    ceu: ['#e8743f', '#ffd9a0'],
    luz: 'tarde',
    render: ({t}) => <Teoria3 t={t} />,
    cams: {
      praia: orb([0.05, 0.62, 0.2], 192, 10, 4.4, 3.8, 44, 10),
    },
  },
  db_quadro: {
    ceu: ['#141826', '#232a3d'],
    luz: 'interior',
    render: ({t, p}) => <Quadro t={t} p={p} />,
    cams: {
      geral: orb([0.2, 1.5, 0], 12, 6, 5.6, 4.6, 44, 8),
      retrato: orb([0, 2.0, 0], -6, 2, 3.4, 2.9, 40, 10),
      ze: orb([0.15, 2.0, 0], 12, 4, 3.2, 2.8, 40, 8),
      pergunta: orb([1.2, 1.4, 0.6], 18, 6, 4.8, 4.2, 44, 6),
    },
  },
  db_arquivo: {
    ceu: ['#1a1d24', '#2a2f3a'],
    luz: 'interior',
    render: ({t, p}) => <Arquivo t={t} p={p} />,
    cams: {
      geral: orb([0, 1.3, -1.2], 30, 12, 6.4, 5.4, 44, 8),
      carimbo: orb([0, 1.2, 0], -20, 52, 1.45, 1.1, 42, 12),
    },
  },
};
