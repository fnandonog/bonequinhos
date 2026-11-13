// CENÁRIOS do "Caso Explicado: identidades" — prefixo id_
// Sala de investigação, escritório de luxo, concessionária, apartamento em Los Angeles e tribunal.
// Escala real (1 unidade = 1 m). Mood progressivo: mistério → poder → ostentação → tensão → julgamento.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Barra, Boneco, Caixa, Cil, Rotulo, Visual} from '../v4/kit';
import {orb} from '../v4/sets';
import type {SetCaso} from './sets';
import {Placa, ZeDetetive, clamp01, lerp, rnd, suave} from './pecas';

// ---------- figurinos dos coadjuvantes ----------
const POLICIAL: Visual = {camisa: '#1a2550', calca: '#1a2550', colete: null, capacete: null, cabelo: '#1d1b26', pele: '#d9a37a'};
const POLICIAL2: Visual = {camisa: '#1a2550', calca: '#1a2550', colete: null, capacete: null, cabelo: '#c8b87a', pele: '#c98e62'};
const POLICIAL3: Visual = {camisa: '#1a2550', calca: '#1a2550', colete: null, capacete: null, cabelo: '#1d1b26', pele: '#b98a66'};
const ADVOGADO: Visual = {camisa: '#f4f0e8', calca: '#1d2233', colete: '#1d2233', capacete: null, cabelo: '#2b2a30', pele: '#e7b48c', gravata: '#8a2020'};
const JUIZ: Visual = {camisa: '#1d1b26', calca: '#1d1b26', colete: '#1d1b26', capacete: null, cabelo: '#d9d4c0', pele: '#e0b898'};
const EXECUTIVO: Visual = {camisa: '#f4f0e8', calca: '#2b2b3a', colete: '#2b2b3a', capacete: null, cabelo: '#2b2a30', pele: '#c9a080', gravata: '#c9302c'};
const EXECUTIVA: Visual = {camisa: '#c9302c', calca: '#1d2233', colete: null, capacete: null, cabelo: '#1d1b26', pele: '#d9b490', cabeloTipo: 'longo'} as Visual;
const VENDEDOR: Visual = {camisa: '#f4f0e8', calca: '#1d2233', colete: '#2b2b3a', capacete: null, cabelo: '#2b2a30', pele: '#e7b48c', gravata: '#2f6fd6'};

// ---------- helpers geométricos ----------
// prédio minimalista com janelas acesas (fundo de skyline noturno)
const Predio: React.FC<{pos: V3; larg: number; alt: number; prof?: number; cor?: string; seed?: number}> = ({pos, larg, alt, prof = larg * 0.9, cor = '#2b3040', seed = 1}) => {
  const r = useMemo(() => rnd(seed), [seed]);
  const janelas = useMemo(() => {
    const out: {x: number; y: number; acesa: boolean}[] = [];
    const cols = Math.floor(larg / 1.4), rows = Math.floor(alt / 1.8);
    for (let c = 0; c < cols; c++)
      for (let rr = 0; rr < rows; rr++)
        out.push({x: (c - (cols - 1) / 2) * 1.4, y: 1.1 + rr * 1.8, acesa: r() > 0.4});
    return out;
  }, [larg, alt, seed]);
  return (
    <group position={pos}>
      <Caixa pos={[0, alt / 2, 0]} tam={[larg, alt, prof]} cor={cor} />
      {janelas.map(({x, y, acesa}, i) => (
        <mesh key={i} position={[x, y, prof / 2 + 0.01]}>
          <planeGeometry args={[0.75, 1.1]} />
          <meshBasicMaterial color={acesa ? (i % 3 ? '#ffd98a' : '#c9e4ff') : '#1a1f30'} />
        </mesh>
      ))}
    </group>
  );
};

// skyline noturna ao fundo (z fixo, vários prédios)
const Skyline: React.FC<{z: number; seed?: number; n?: number; xRange?: number}> = ({z, seed = 7, n = 14, xRange = 90}) => {
  const predios = useMemo(() => {
    const r = rnd(seed);
    return Array.from({length: n}).map((_, i) => ({
      x: lerp(-xRange / 2, xRange / 2, i / (n - 1)) + (r() - 0.5) * 6,
      larg: 4 + r() * 8,
      alt: 12 + r() * 36,
      seed: seed * 100 + i,
    }));
  }, [seed, n, xRange]);
  return (
    <group position={[0, 0, z]}>
      {predios.map((p, i) => (
        <Predio key={i} pos={[p.x, 0, 0]} larg={p.larg} alt={p.alt} seed={p.seed}
          cor={i % 3 === 0 ? '#252a3a' : i % 3 === 1 ? '#1e2435' : '#2a2f42'} />
      ))}
      {/* faixa de luz da avenida */}
      <Caixa pos={[0, 0.1, 2]} tam={[xRange * 1.4, 0.04, 2]} cor="#3a3010" sombra={false} />
      {Array.from({length: 24}).map((_, i) => (
        <mesh key={i} position={[-xRange / 2 + i * (xRange / 23), 0.15, 2.4]}>
          <sphereGeometry args={[0.18, 8, 6]} />
          <meshBasicMaterial color="#ffd98a" />
        </mesh>
      ))}
    </group>
  );
};

// carro esportivo de luxo em escala real
// tipo 'porsche': 4,5 m, perfil arredondado, motor traseiro
// tipo 'ferrari': 4,7 m, capô longo, motor dianteiro
// tipo 'lambo': 4,6 m, super flat (1,0 m), ângulos retos
const CarroEsporte: React.FC<{pos: V3; rotY?: number; cor?: string; tipo?: 'porsche' | 'ferrari' | 'lambo'}> =
  ({pos, rotY = 0, cor = '#c9302c', tipo = 'ferrari'}) => {
  const corpo = {
    porsche: {cx: 4.5, cy: 0.44, cz: 1.86, cabH: 0.52, cabX: -0.15, cabLarg: 2.4},
    ferrari: {cx: 4.7, cy: 0.42, cz: 1.86, cabH: 0.5, cabX: 0.3, cabLarg: 2.0},
    lambo:   {cx: 4.6, cy: 0.38, cz: 2.05, cabH: 0.4, cabX: 0.0, cabLarg: 1.9},
  }[tipo];
  // detalhes por tipo
  const noseX = tipo === 'ferrari' ? 0.4 : tipo === 'lambo' ? 0.2 : 0.15;
  const spoilerH = tipo === 'ferrari' ? 0.28 : tipo === 'lambo' ? 0.35 : 0.14;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {/* carroceria principal */}
      <Caixa pos={[0, corpo.cy / 2 + 0.36, 0]} tam={[corpo.cx, corpo.cy, corpo.cz]} cor={cor} />
      {/* teto/cabine */}
      <Caixa pos={[corpo.cabX, corpo.cy + corpo.cabH / 2 + 0.36, 0]} tam={[corpo.cabLarg, corpo.cabH, corpo.cz - 0.14]} cor={cor} />
      {/* para-brisa (plano inclinado) */}
      <Caixa pos={[corpo.cabX + corpo.cabLarg * 0.52, corpo.cy + 0.36 + corpo.cabH * 0.4, 0]}
        rot={[0, 0, -0.6]} tam={[0.06, corpo.cabH * 0.85, corpo.cz - 0.3]} cor="#1d2233" sombra={false} />
      {/* vidro traseiro */}
      <Caixa pos={[corpo.cabX - corpo.cabLarg * 0.52, corpo.cy + 0.36 + corpo.cabH * 0.4, 0]}
        rot={[0, 0, 0.55]} tam={[0.06, corpo.cabH * 0.8, corpo.cz - 0.4]} cor="#2a3550" sombra={false} />
      {/* janelas laterais */}
      {[-1, 1].map((s) => (
        <Caixa key={s} pos={[corpo.cabX, corpo.cy + 0.36 + corpo.cabH * 0.4, s * (corpo.cz - 0.14) / 2]}
          tam={[corpo.cabLarg - 0.4, corpo.cabH * 0.7, 0.04]} cor="#1d2233" sombra={false} />
      ))}
      {/* nariz/frente */}
      <Caixa pos={[corpo.cx / 2 - noseX / 2, 0.5 + 0.36, 0]} tam={[noseX, 0.14, corpo.cz - 0.3]} cor={cor} />
      {/* faróis */}
      {[-0.5, 0.5].map((z) => (
        <group key={z} position={[corpo.cx / 2 + 0.01, 0.52 + 0.36, z]}>
          {tipo === 'porsche'
            ? <mesh rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.15, 20]} /><meshBasicMaterial color="#fff8e0" /></mesh>
            : <Caixa pos={[0, 0, 0]} tam={[0.04, 0.1, 0.32]} cor="#ffe8c0" sombra={false} />}
          <pointLight position={[0.3, 0, 0]} color="#ffe8c0" intensity={12} distance={8} decay={1.5} />
        </group>
      ))}
      {/* lanternas traseiras */}
      {[-0.5, 0.5].map((z) => (
        <Caixa key={z} pos={[-corpo.cx / 2 - 0.01, 0.52 + 0.36, z]} tam={[0.04, 0.1, 0.36]} cor="#c9302c" sombra={false} />
      ))}
      {/* aerofólio/spoiler traseiro */}
      {spoilerH > 0.1 && (
        <group position={[-corpo.cx / 2 + 0.1, corpo.cy + 0.36 + spoilerH, 0]}>
          <Caixa pos={[0, 0, 0]} tam={[0.6, 0.06, corpo.cz - 0.1]} cor={cor} />
          {[-1, 1].map((s) => (
            <Caixa key={s} pos={[0, -spoilerH / 2, s * (corpo.cz - 0.1) / 2.1]} tam={[0.06, spoilerH, 0.06]} cor={cor} />
          ))}
        </group>
      )}
      {/* rodas: 4 cilindros horizontais */}
      {[[1.6, 1], [1.6, -1], [-1.5, 1], [-1.5, -1]].map(([x, s], i) => (
        <group key={i} position={[x, 0.36, s * (corpo.cz / 2 + 0.04)]}>
          <Cil pos={[0, 0, 0]} rot={[Math.PI / 2, 0, 0]} r={0.36} h={0.26} cor="#151518" seg={16} />
          <Cil pos={[0, 0, s * 0.14]} rot={[Math.PI / 2, 0, 0]} r={0.22} h={0.03} cor="#c9ced6" seg={12} />
          {/* parafusos da roda */}
          {Array.from({length: 5}).map((_, j) => {
            const a = (j / 5) * Math.PI * 2;
            return <Cil key={j} pos={[Math.cos(a) * 0.12, Math.sin(a) * 0.12, s * 0.17]} rot={[Math.PI / 2, 0, 0]} r={0.018} h={0.04} cor="#9aa0aa" seg={5} />;
          })}
        </group>
      ))}
      {/* plataforma/assoalho */}
      <Caixa pos={[0, 0.1, 0]} tam={[corpo.cx - 0.2, 0.14, corpo.cz - 0.1]} cor="#2b2b3a" />
    </group>
  );
};

// corda de veludo em volta do carro (expo)
const CordaVeludo: React.FC<{cx: number; cz: number; larg: number; prof: number; y?: number}> = ({cx, cz, larg, prof, y = 0.72}) => {
  const seg = (a: V3, b: V3) => <Barra key={`${a}${b}`} a={a} b={b} r={0.012} cor="#c9a046" sombra={false} />;
  const postes: V3[] = [
    [cx - larg / 2, y, cz - prof / 2],
    [cx + larg / 2, y, cz - prof / 2],
    [cx + larg / 2, y, cz + prof / 2],
    [cx - larg / 2, y, cz + prof / 2],
  ];
  return (
    <group>
      {postes.map((p, i) => (
        <group key={i}>
          <Cil pos={p} r={0.025} h={y} cor="#c9a046" seg={6} />
          <Cil pos={[p[0], y + 0.06, p[2]]} r={0.055} h={0.12} cor="#c9a046" seg={12} />
        </group>
      ))}
      {postes.map((p, i) => seg(p, postes[(i + 1) % 4]))}
    </group>
  );
};

// marca d'água / plaquinha de preço flutuante sobre carro
const PlaquinhaCarro: React.FC<{pos: V3; preco: string; modelo: string}> = ({pos, preco, modelo}) => (
  <group position={pos}>
    <Barra a={[0, -0.4, 0]} b={[0, 0, 0]} r={0.008} cor="#1d1b26" sombra={false} />
    <Placa texto={modelo} pos={[0, 0.1, 0]} larg={0.72} fundo="#1d1b26" cor="#ffffff" />
    <Placa texto={preco} pos={[0, -0.06, 0]} larg={0.72} fundo="#c9a046" cor="#1d1b26" />
  </group>
);

// ============================================================
// 1. id_quadro — sala de investigação com quadro de identidades
// ============================================================
// Nomes falsos no quadro: 7 identidades ligadas com barbante vermelho ao cartão central "?"
const IDENTIDADES = [
  {nome: 'ROBERT SMITH', pais: '🇺🇸', x: -1.1, y: 2.4},
  {nome: 'JEAN DUPONT',  pais: '🇫🇷', x: -0.35, y: 2.52},
  {nome: 'MARCO BIANCHI', pais: '🇮🇹', x: 0.42, y: 2.44},
  {nome: 'CARLOS VILLA', pais: '🇲🇽', x: 1.1, y: 2.42},
  {nome: 'FRANZ WEBER',  pais: '🇩🇪', x: -1.0, y: 1.72},
  {nome: 'AHMED MALIK',  pais: '🇦🇪', x: 0.0, y: 1.68},
  {nome: 'YI CHEN',      pais: '🇨🇳', x: 1.05, y: 1.74},
];
const CENTRO_QUADRO: V3 = [0.0, 2.08, -0.01];

const SalaInvestigacao: React.FC<{t: number; p: number}> = ({t, p}) => {
  const fioK = clamp01(p / 0.4); // barbantes aparecem gradualmente
  return (
    <group>
      {/* chão madeira escura */}
      <mesh position={[0, 0, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 7]} />
        <meshStandardMaterial color="#2b1f14" roughness={0.75} />
      </mesh>
      {/* friso de rodapé */}
      {[-4.4, 4.4].map((x) => <Caixa key={x} pos={[x, 0.06, 0]} tam={[0.08, 0.12, 7]} cor="#1a1210" />)}
      <Caixa pos={[0, 0.06, -3.4]} tam={[9, 0.12, 0.08]} cor="#1a1210" />

      {/* parede de fundo (quadro de cortiça) */}
      <Caixa pos={[0, 2.0, -3.5]} tam={[9, 4.0, 0.2]} cor="#3a3040" />
      {/* moldura do quadro de cortiça */}
      <Caixa pos={[0, 1.9, -3.33]} tam={[3.6, 2.2, 0.08]} cor="#6b4429" />
      {/* superfície de cortiça */}
      <mesh position={[0, 1.9, -3.28]}>
        <planeGeometry args={[3.4, 2.0]} />
        <meshStandardMaterial color="#c49563" roughness={0.95} />
      </mesh>

      {/* cartões de identidade no quadro (7 retângulos brancos inclinados) */}
      {IDENTIDADES.map((id, i) => (
        <group key={i} position={[id.x, id.y, -3.26]} rotation={[0, 0, (i % 2 ? 1 : -1) * 0.03]}>
          {/* foto (quadrado cinza) */}
          <mesh position={[-0.21, 0, 0]}>
            <planeGeometry args={[0.16, 0.2]} />
            <meshBasicMaterial color={['#e0c9b4', '#d9a890', '#c9b490', '#b9a080'][i % 4]} />
          </mesh>
          {/* cartão branco */}
          <mesh position={[0, 0, -0.002]}>
            <planeGeometry args={[0.6, 0.22]} />
            <meshBasicMaterial color="#f4efe2" />
          </mesh>
          {/* pino vermelho */}
          <mesh position={[0, 0.1, 0.004]}>
            <sphereGeometry args={[0.018, 8, 6]} />
            <meshBasicMaterial color="#c9302c" />
          </mesh>
          <Placa texto={id.nome} pos={[0.06, 0, 0.004]} larg={0.4} fundo="#f4efe2" cor="#1d1b26" />
        </group>
      ))}

      {/* cartão central "?" */}
      <group position={CENTRO_QUADRO} rotation={[0, 0, 0]}>
        <mesh position={[0, 0, -0.003]}>
          <planeGeometry args={[0.52, 0.32]} />
          <meshBasicMaterial color="#c9302c" />
        </mesh>
        <Placa texto="?" pos={[0, 0, 0.004]} larg={0.46} fundo="#1d1b26" cor="#ffffff" />
      </group>

      {/* barbantes vermelhos ligando cada identidade ao centro */}
      {IDENTIDADES.map((id, i) => {
        if (fioK < (i + 1) / 7) return null;
        const a: V3 = [id.x, id.y + 0.07, -3.24];
        const b: V3 = [CENTRO_QUADRO[0], CENTRO_QUADRO[1], -3.24];
        // ponto intermediário animado
        const mx = lerp(a[0], b[0], fioK), my = lerp(a[1], b[1], fioK);
        return <Barra key={i} a={a} b={[mx, my, -3.24]} r={0.004} cor="#c9302c" sombra={false} />;
      })}

      {/* mesa de investigação (esquerda) */}
      <Caixa pos={[-2.6, 0.75, 0.6]} tam={[1.8, 0.07, 0.9]} cor="#6b4429" />
      {[[-3.4, 0.2], [-1.8, 0.2], [-3.4, 1.0], [-1.8, 1.0]].map(([x, z], i) => (
        <Caixa key={i} pos={[x, 0.36, z]} tam={[0.07, 0.72, 0.07]} cor="#4a3426" />
      ))}
      {/* itens sobre a mesa: pasta, xícara, fotos espalhadas */}
      <Caixa pos={[-2.7, 0.8, 0.55]} rot={[0, 0.15, 0]} tam={[0.42, 0.025, 0.3]} cor="#d9a85a" />
      <Caixa pos={[-2.3, 0.78, 0.7]} rot={[0, -0.2, 0]} tam={[0.36, 0.025, 0.24]} cor="#f4efe2" />
      {/* xícara de café */}
      <Cil pos={[-2.6, 0.82, 0.3]} r={0.055} h={0.08} cor="#f4efe2" seg={12} />
      <Cil pos={[-2.6, 0.84, 0.3]} r={0.044} h={0.03} cor="#3a1f10" seg={12} />
      {/* caneta e bloco */}
      <Barra a={[-2.4, 0.78, 0.45]} b={[-2.25, 0.78, 0.38]} r={0.007} cor="#1d2233" sombra={false} />
      <Caixa pos={[-2.42, 0.78, 0.44]} rot={[0, 0.2, 0]} tam={[0.22, 0.016, 0.16]} cor="#f4f0d8" />

      {/* abajur de mesa */}
      <Cil pos={[-2.9, 0.79, 0.35]} r={0.04} h={0.04} cor="#2b2f3a" seg={8} />
      <Barra a={[-2.9, 0.80, 0.35]} b={[-2.75, 1.22, 0.42]} r={0.012} cor="#2b2f3a" />
      <mesh position={[-2.72, 1.22, 0.44]} rotation={[0.4, 0, -0.4]}>
        <coneGeometry args={[0.14, 0.2, 20, 1, true]} />
        <meshStandardMaterial color="#2f6f4f" side={2} />
      </mesh>
      <pointLight position={[-2.6, 1.15, 0.45]} color="#ffd9a0" intensity={4} distance={4} decay={1.5} />

      {/* arquivo de pastas verticais (direita) */}
      <Caixa pos={[2.8, 0.9, -1.0]} tam={[0.6, 1.8, 0.5]} cor="#4a4e58" />
      {[0, 1, 2, 3, 4].map((i) => (
        <Caixa key={i} pos={[2.78, 0.5 + i * 0.3, -0.76]} tam={[0.55, 0.26, 0.04]}
          cor={['#c9302c', '#2f6fd6', '#2f8f4a', '#ffd23f', '#9a46c9'][i]} sombra={false} />
      ))}

      {/* janela lateral mostrando noite */}
      <Caixa pos={[4.4, 1.5, -1.2]} tam={[0.15, 1.6, 1.4]} cor="#4a3c50" />
      <mesh position={[4.33, 1.5, -1.2]}>
        <planeGeometry args={[1.2, 1.4]} />
        <meshBasicMaterial color="#0a0f20" />
      </mesh>
      {/* lua pela janela */}
      <mesh position={[4.32, 1.9, -0.8]}>
        <circleGeometry args={[0.16, 20]} />
        <meshBasicMaterial color="#f0efdc" />
      </mesh>

      {/* teto */}
      <Caixa pos={[0, 2.85, 0]} tam={[9, 0.14, 7]} cor="#2a2535" />

      {/* iluminação ambiente */}
      <pointLight position={[0, 2.7, 1.5]} color="#fff0d8" intensity={9} distance={8} decay={1.3} />
      <pointLight position={[0, 2.7, -2.0]} color="#8fa0d0" intensity={5} distance={7} decay={1.3} />
      {/* contraluz fria atrás do Zé */}
      <pointLight position={[1.4, 2.0, 1.2]} color="#a0c0ff" intensity={3} distance={5} decay={1.5} />

      <ZeDetetive pos={[1.4, 0, 0.8]} rotY={-2.4} t={t} aponta expressao="serio" />

      {/* rótulos das peças principais */}
      <Rotulo texto="7 IDs" ancora={[0.0, 2.95, -3.0]} sobe={0.5} fundo="#c9302c" />
    </group>
  );
};

// ============================================================
// 2. id_escritorio — escritório elegante, poder/dinheiro
// ============================================================
const EscritorioLuxo: React.FC<{t: number}> = ({t}) => {
  const grafBar = useMemo(() => [0.6, 0.85, 0.72, 0.95, 0.65, 0.88, 1.0], []);
  return (
    <group>
      {/* chão madeira polida escura */}
      <mesh position={[0, 0, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#1f1810" roughness={0.3} metalness={0.08} />
      </mesh>
      {/* frisos do assoalho */}
      {Array.from({length: 7}).map((_, i) => (
        <Caixa key={i} pos={[-5 + i * 1.65, 0.004, 0]} tam={[0.04, 0.008, 10]} cor="#2b2010" sombra={false} />
      ))}

      {/* paredes laterais com lambri em nogueira */}
      <Caixa pos={[0, 2.0, -5.0]} tam={[12, 4.0, 0.15]} cor="#3a2a1a" />
      <Caixa pos={[-6.0, 2.0, 0]} tam={[0.15, 4.0, 10]} cor="#3a2a1a" />
      {/* frisos horizontais do lambri */}
      {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((y) => (
        <Caixa key={y} pos={[-5.92, y, 0]} tam={[0.02, 0.04, 9.9]} cor="#4a3826" sombra={false} />
      ))}

      {/* janelões de vidro na parede direita (cidade à noite) */}
      {[-1.8, 0.8].map((x, i) => (
        <group key={i} position={[x, 1.6, 4.9]}>
          <mesh rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[2.6, 2.8]} />
            <meshStandardMaterial color="#0d1226" roughness={0.05} metalness={0.3} transparent opacity={0.85} />
          </mesh>
          {/* moldura do janelão */}
          <Caixa pos={[0, 1.44, 0.04]} tam={[2.7, 0.08, 0.06]} cor="#5a4a36" />
          <Caixa pos={[0, -1.44, 0.04]} tam={[2.7, 0.08, 0.06]} cor="#5a4a36" />
          <Caixa pos={[-1.35, 0, 0.04]} tam={[0.08, 2.9, 0.06]} cor="#5a4a36" />
          <Caixa pos={[1.35, 0, 0.04]} tam={[0.08, 2.9, 0.06]} cor="#5a4a36" />
        </group>
      ))}
      {/* reflexo da cidade atrás das janelas */}
      <Skyline z={9} seed={12} n={16} xRange={80} />

      {/* mesa de reunião ovalada (aproximada com caixa + meias-caixas) */}
      <Caixa pos={[0, 0.74, -0.5]} tam={[5.2, 0.07, 1.5]} cor="#4a3020" />
      {/* tampo em mármore */}
      <mesh position={[0, 0.78, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.2, 1.5]} />
        <meshStandardMaterial color="#c8c0b8" roughness={0.1} metalness={0.05} />
      </mesh>
      {/* frisos laterais da mesa */}
      {[-1, 1].map((s) => (
        <Caixa key={s} pos={[0, 0.44, s * 0.76]} tam={[5.1, 0.6, 0.06]} cor="#3a2416" />
      ))}
      {/* pés da mesa */}
      {[[-2.1, -0.5], [2.1, -0.5]].map(([x, z], i) => (
        <Caixa key={i} pos={[x, 0.36, z]} tam={[0.12, 0.72, 0.9]} cor="#2b1a0e" />
      ))}

      {/* cadeiras de couro em volta da mesa */}
      {[[-2.1, 0.75], [-0.6, 0.75], [0.75, 0.75], [2.1, 0.75], [-0.6, -1.75], [0.75, -1.75]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Caixa pos={[0, 0.44, 0]} tam={[0.6, 0.08, 0.6]} cor="#1a1210" />
          <Caixa pos={[0, 0.82, -0.3]} rot={[-0.08, 0, 0]} tam={[0.6, 0.72, 0.08]} cor="#1a1210" />
          <Cil pos={[0, 0.2, 0]} r={0.055} h={0.4} cor="#2b2f3a" seg={8} />
          {/* botões de couro */}
          {[-0.18, 0.18].map((bx) => (
            <mesh key={bx} position={[bx, 0.82, -0.26]}>
              <sphereGeometry args={[0.016, 6, 5]} />
              <meshBasicMaterial color="#2b1a0e" />
            </mesh>
          ))}
        </group>
      ))}

      {/* tela de projeção na parede esquerda com gráfico de barras */}
      <Caixa pos={[-5.88, 1.75, -1.0]} tam={[0.06, 1.8, 2.4]} cor="#f4f0e8" />
      {grafBar.map((h, i) => (
        <Caixa key={i} pos={[-5.84, 0.9 + (h * 0.72) / 2, -2.0 + i * 0.34]}
          tam={[0.03, h * 0.72, 0.22]} cor={i === 6 ? '#ffd23f' : i % 2 ? '#2f6fd6' : '#5a9f6a'} sombra={false} />
      ))}
      <Placa texto="PATRIMÔNIO" pos={[-5.84, 2.3, -1.0]} rot={[0, Math.PI / 2, 0]} larg={1.0} fundo="#1d1b26" cor="#ffd23f" />

      {/* quadro na parede de fundo */}
      <Caixa pos={[2.4, 2.1, -4.9]} tam={[2.0, 1.4, 0.06]} cor="#1a1210" />
      <mesh position={[2.4, 2.1, -4.86]}>
        <planeGeometry args={[1.8, 1.2]} />
        <meshStandardMaterial color="#2f4a6f" roughness={0.8} />
      </mesh>
      {/* traços abstratos no quadro */}
      {[0.3, 0.6, 0.9, 1.2].map((bx) => (
        <Caixa key={bx} pos={[2.4 - 0.9 + bx, 2.1 + (Math.sin(bx * 3) * 0.3), -4.84]}
          tam={[0.08, 0.3 + Math.abs(Math.sin(bx * 2)) * 0.5, 0.02]} cor="#c9a046" sombra={false} />
      ))}

      {/* bar cabinet com taças e garrafas */}
      <Caixa pos={[-5.6, 0.5, 2.5]} tam={[0.5, 1.0, 1.4]} cor="#2b1a0e" />
      {[0.1, 0.5, 0.9].map((dz, i) => (
        <group key={i} position={[-5.3, 1.1, 2.5 - 0.6 + dz]}>
          <Cil pos={[0, 0, 0]} r={0.055} r2={0.07} h={0.28} cor={['#c9302c', '#8a7a3a', '#3a7a2a'][i]} seg={12} />
          <Cil pos={[0, 0.2, 0]} r={0.025} h={0.12} cor={['#9a2020', '#6a5a2a', '#2a5a1a'][i]} seg={8} />
        </group>
      ))}
      {/* taças ao lado */}
      {[-0.25, 0.25].map((dz) => (
        <group key={dz} position={[-5.28, 1.08, 2.5 + dz]}>
          <Cil pos={[0, 0, 0]} r={0.04} r2={0.065} h={0.1} cor="#c9d8e6" seg={12} />
          <Cil pos={[0, -0.06, 0]} r={0.012} h={0.09} cor="#9ab0c4" seg={6} />
        </group>
      ))}

      {/* planta ornamental (canto) */}
      <group position={[5.2, 0, 2.2]}>
        <Cil pos={[0, 0.2, 0]} r={0.22} r2={0.18} h={0.4} cor="#4a3426" seg={10} />
        {[0, 1.0, 2.1, 3.2, 4.4].map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * 0.08, 0.5 + Math.sin(a * 1.3) * 0.1, Math.sin(a) * 0.08]}
            rotation={[Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5]}>
            <coneGeometry args={[0.05, 0.4, 24]} />
            <meshStandardMaterial color={i % 2 ? '#5a8a3a' : '#4a7a2a'} roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* teto com calha de spots */}
      <Caixa pos={[0, 2.9, 0]} tam={[12, 0.12, 10]} cor="#2a2520" />
      {[-2.0, 0.0, 2.0].map((x) => (
        <group key={x} position={[x, 2.88, -0.5]}>
          <Cil pos={[0, 0, 0]} r={0.06} h={0.12} cor="#3a3540" seg={8} />
          <pointLight position={[0, -0.1, 0]} color="#fff0d0" intensity={12} distance={5} decay={1.3} />
        </group>
      ))}
      {/* luz suave de preenchimento pela janela */}
      <pointLight position={[2.0, 2.4, 3.8]} color="#6080c0" intensity={5} distance={9} decay={1.4} />
      {/* contraluz fria atrás do Zé */}
      <pointLight position={[0.5, 2.2, 1.5]} color="#a0b8ff" intensity={3} distance={6} decay={1.5} />

      <ZeDetetive pos={[0.4, 0, 1.0]} rotY={Math.PI} t={t} aponta={false} expressao="serio" />
      <Boneco pos={[1.6, 0, 1.0]} rotY={Math.PI + 0.3} acao="fala" t={t + 1} v={EXECUTIVO} />
      <Boneco pos={[-1.4, 0, 1.0]} rotY={Math.PI - 0.3} acao="senta" t={t + 2} v={EXECUTIVA} />

      <Rotulo texto="escritório" ancora={[0, 2.4, -4.5]} sobe={0.4} fundo="#c9a046" />
    </group>
  );
};

// ============================================================
// 3. id_concessio — concessionária de carros de luxo
// ============================================================
const Concessio: React.FC<{t: number}> = ({t}) => (
  <group>
    {/* chão polido branco (porcelana) */}
    <mesh position={[0, 0, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[18, 14]} />
      <meshStandardMaterial color="#e9e6e0" roughness={0.08} metalness={0.12} />
    </mesh>
    {/* linhas do rejunte do piso */}
    {Array.from({length: 10}).map((_, i) => [
      <Caixa key={`h${i}`} pos={[-8 + i * 1.6, 0.003, 0]} tam={[0.04, 0.006, 14]} cor="#d4d1cb" sombra={false} />,
      <Caixa key={`v${i}`} pos={[0, 0.003, -6 + i * 1.2]} tam={[18, 0.006, 0.04]} cor="#d4d1cb" sombra={false} />,
    ])}

    {/* paredes: lateral esquerda sólida, restantes com vidro */}
    <Caixa pos={[-9.0, 2.0, 0]} tam={[0.15, 4.0, 14]} cor="#2a2a2f" />
    {/* fachada traseira em vidro fumê */}
    <mesh position={[0, 2.0, -7.0]} rotation={[0, 0, 0]}>
      <planeGeometry args={[18, 4.0]} />
      <meshStandardMaterial color="#0a1020" roughness={0.05} metalness={0.4} transparent opacity={0.7} />
    </mesh>
    {/* grade de alumínio na fachada */}
    {[-7.5, -5, -2.5, 0, 2.5, 5, 7.5].map((x) => (
      <Caixa key={x} pos={[x, 2.0, -6.9]} tam={[0.06, 4.1, 0.04]} cor="#9aa0aa" sombra={false} />
    ))}

    {/* skyline noturna visível pela fachada de vidro */}
    <Skyline z={-16} seed={42} n={18} xRange={100} />

    {/* letreiro da concessionária */}
    <Caixa pos={[0, 3.4, -6.88]} tam={[6, 0.5, 0.08]} cor="#1d1b26" />
    <Placa texto="LUXURY MOTORS" pos={[0, 3.4, -6.82]} larg={5.6} fundo="#1d1b26" cor="#c9a046" />
    {/* logo círculo dourado */}
    <mesh position={[-3.4, 3.4, -6.82]}>
      <torusGeometry args={[0.26, 0.04, 8, 28]} />
      <meshStandardMaterial color="#c9a046" roughness={0.3} metalness={0.6} />
    </mesh>

    {/* plataformas elevadas para os carros */}
    {[-4.5, 0, 4.5].map((x, i) => (
      <group key={i}>
        <Caixa pos={[x, 0.1, -1.5]} tam={[4.0, 0.2, 5.0]} cor="#d9d6cf" />
        {/* borda da plataforma em alumínio escovado */}
        <Caixa pos={[x, 0.19, -1.5]} tam={[4.05, 0.04, 5.05]} cor="#9aa0aa" sombra={false} />
      </group>
    ))}

    {/* carros nas plataformas */}
    <CarroEsporte pos={[-4.5, 0.2, -1.5]} rotY={0.3} cor="#c9302c" tipo="porsche" />
    <CarroEsporte pos={[0, 0.2, -1.5]} rotY={-0.15} cor="#ffd23f" tipo="ferrari" />
    <CarroEsporte pos={[4.5, 0.2, -1.5]} rotY={0.4} cor="#1d1b26" tipo="lambo" />

    {/* cordas de veludo em volta de cada carro */}
    <CordaVeludo cx={-4.5} cz={-1.5} larg={5.2} prof={5.8} />
    <CordaVeludo cx={0} cz={-1.5} larg={5.5} prof={5.8} />
    <CordaVeludo cx={4.5} cz={-1.5} larg={5.2} prof={5.8} />

    {/* plaquinhas com modelo e preço */}
    <PlaquinhaCarro pos={[-4.5, 1.6, 0.9]} preco="R$ 850.000" modelo="TURBO S" />
    <PlaquinhaCarro pos={[0.0, 1.6, 0.9]} preco="R$ 1.400.000" modelo="488 GTB" />
    <PlaquinhaCarro pos={[4.5, 1.6, 0.9]} preco="R$ 2.100.000" modelo="URUS" />

    {/* spots de luz halógena sobre cada carro */}
    {[-4.5, 0, 4.5].map((x, i) => (
      <group key={i} position={[x, 3.6, -1.5]}>
        <Cil pos={[0, 0, 0]} r={0.1} h={0.3} cor="#3a3a44" seg={6} />
        <spotLight position={[0, -0.2, 0]} target-position={[x, 0, -1.5]}
          angle={0.45} penumbra={0.3} intensity={120} distance={6} decay={1.2}
          color={i === 1 ? '#fff8e8' : '#fff0d8'} />
      </group>
    ))}

    {/* recepção (balcão branco) */}
    <Caixa pos={[-7.0, 0.55, 2.5]} tam={[2.4, 1.1, 0.8]} cor="#f4f0e8" />
    <Caixa pos={[-7.0, 1.12, 2.5]} tam={[2.5, 0.06, 0.95]} cor="#c9a046" />
    <Caixa pos={[-7.0, 1.12, 2.1]} tam={[2.42, 0.004, 0.08]} cor="#2b2b3a" sombra={false} />
    {/* computador na recepção */}
    <Caixa pos={[-7.6, 1.2, 2.5]} tam={[0.42, 0.28, 0.02]} cor="#1d1b26" />
    <Caixa pos={[-7.6, 1.08, 2.5]} tam={[0.06, 0.06, 0.28]} cor="#3a3a44" />
    <Boneco pos={[-6.6, 0, 2.5]} rotY={1.6} acao="fala" t={t} v={VENDEDOR} />

    {/* plantas ornamentais nos cantos */}
    {[[-7.5, 5.5], [7.5, 5.5], [-7.5, -5.5], [7.5, -5.5]].map(([x, z], i) => (
      <group key={i} position={[x, 0, z]}>
        <Cil pos={[0, 0.3, 0]} r={0.26} r2={0.2} h={0.6} cor="#4a3426" seg={8} />
        {[0, 1.3, 2.6, 4.0, 5.3].map((a, j) => (
          <mesh key={j} position={[Math.cos(a) * 0.1, 0.72 + j * 0.04, Math.sin(a) * 0.1]}
            rotation={[Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6]}>
            <coneGeometry args={[0.055, 0.5, 24]} />
            <meshStandardMaterial color={j % 2 ? '#5a8a3a' : '#4a7a2a'} roughness={0.9} />
          </mesh>
        ))}
      </group>
    ))}

    {/* teto com trilhos de spot */}
    <Caixa pos={[0, 3.8, 0]} tam={[18, 0.12, 14]} cor="#1d1d24" />
    {/* luz geral de preenchimento */}
    <pointLight position={[0, 3.4, 2.0]} color="#fff4e0" intensity={15} distance={14} decay={1.2} />
    <pointLight position={[0, 3.4, -4.0]} color="#fff4e0" intensity={10} distance={12} decay={1.2} />
    {/* contraluz fria */}
    <pointLight position={[1.0, 2.8, 1.5]} color="#a0c0ff" intensity={4} distance={6} decay={1.5} />

    <ZeDetetive pos={[1.5, 0, 1.4]} rotY={-2.5} t={t} aponta expressao="surpreso" />

    <Rotulo texto="R$ 2 mi" ancora={[4.5, 1.8, 0.0]} sobe={0.3} fundo="#c9302c" />
  </group>
);

// ============================================================
// 4. id_apartamento — apartamento de luxo em LA, busca policial
// ============================================================
const ApartamentoLA: React.FC<{t: number; p: number}> = ({t, p}) => {
  const policiaEntra = clamp01(p / 0.3);
  // luz pulsante de viatura policial (vermelho/azul alternados)
  const corPolicia = Math.sin(t * 6) > 0 ? '#ff2a2a' : '#2a4aff';
  const intPolicia = 0.6 + 0.4 * Math.abs(Math.sin(t * 6));
  return (
    <group>
      {/* chão mármore branco */}
      <mesh position={[0, 0, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#e8e4e0" roughness={0.12} metalness={0.06} />
      </mesh>
      {/* veias do mármore (diagonal) */}
      {[-3, -1, 0.5, 2.5, 4].map((bx, i) => (
        <Caixa key={i} pos={[bx + i * 0.3, 0.003, 0]} rot={[0, 0.15, 0]} tam={[0.025, 0.004, 14]} cor="#c8c2ba" sombra={false} />
      ))}

      {/* parede de fundo */}
      <Caixa pos={[0, 2.1, -6.0]} tam={[14, 4.2, 0.15]} cor="#e0dbd5" />
      {/* quadros abstratos na parede */}
      {[-3.5, 0, 3.5].map((x, i) => (
        <group key={i}>
          <Caixa pos={[x, 2.2, -5.9]} tam={[1.6, 1.2, 0.07]} cor="#2b2b3a" />
          <mesh position={[x, 2.2, -5.84]}>
            <planeGeometry args={[1.44, 1.04]} />
            <meshStandardMaterial color={['#c9302c', '#2f6fd6', '#ffd23f'][i]} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* parede lateral esquerda com cofre aberto */}
      <Caixa pos={[-7.0, 2.1, -1.0]} tam={[0.15, 4.2, 10]} cor="#e0dbd5" />
      {/* nicho do cofre */}
      <Caixa pos={[-6.9, 1.6, -0.5]} tam={[0.5, 0.9, 1.0]} cor="#2b2b3a" />
      {/* porta do cofre (aberta 90°) */}
      <group position={[-6.6, 1.6, -0.0]} rotation={[0, Math.PI / 2, 0]}>
        <Caixa pos={[0, 0, -0.44]} tam={[0.06, 0.82, 0.88]} cor="#8a9090" />
        {/* dobradiças e maçaneta */}
        <Cil pos={[0, 0.3, -0.0]} r={0.025} h={0.08} cor="#c9ced6" seg={8} />
        <Cil pos={[0, -0.3, -0.0]} r={0.025} h={0.08} cor="#c9ced6" seg={8} />
        <Cil pos={[0.04, 0, -0.86]} r={0.055} h={0.08} cor="#c9a046" seg={12} />
      </group>
      <Rotulo texto="cofre vazio" ancora={[-6.6, 2.0, -0.5]} sobe={0.5} fundo="#c9302c" />

      {/* janelão de piso a teto com vista de LA */}
      <group position={[0, 1.6, 6.0]}>
        <mesh rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[12, 2.9]} />
          <meshStandardMaterial color="#0d1832" roughness={0.05} metalness={0.3} transparent opacity={0.6} />
        </mesh>
        {/* grade do janelão */}
        {[-5, -2.5, 0, 2.5, 5].map((x) => (
          <Caixa key={x} pos={[x, 0, 0.04]} tam={[0.05, 2.9, 0.04]} cor="#c9ced6" sombra={false} />
        ))}
        <Caixa pos={[0, 1.44, 0.04]} tam={[12, 0.07, 0.06]} cor="#c9ced6" sombra={false} />
      </group>
      {/* skyline de LA à noite */}
      <Skyline z={14} seed={99} n={22} xRange={120} />
      {/* luz de viatura pulsante vinda pela janela */}
      <pointLight position={[0, 2.0, 5.5]} color={corPolicia} intensity={intPolicia * 20} distance={10} decay={1.4} />

      {/* sofá de luxo branco (tombado — busca) */}
      <group position={[1.5, 0, 1.5]} rotation={[0, -0.1, 0]}>
        <Caixa pos={[0, 0.38, 0]} tam={[2.4, 0.12, 0.9]} cor="#f4f0ea" />
        <Caixa pos={[0, 0.65, -0.4]} tam={[2.4, 0.5, 0.1]} cor="#ede9e3" />
        {[-1.1, 1.1].map((x) => (
          <Caixa key={x} pos={[x, 0.55, 0]} tam={[0.12, 0.3, 0.9]} cor="#ede9e3" />
        ))}
      </group>

      {/* mesa de centro virada (tampo de vidro) */}
      <group position={[1.5, 0, 2.8]} rotation={[0, 0.3, Math.PI * 0.06]}>
        <Caixa pos={[0, 0.3, 0]} tam={[1.2, 0.07, 0.65]} cor="#c9d8e6" />
        {[[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].map(([x, z], i) => (
          <Caixa key={i} pos={[x, 0.14, z]} tam={[0.05, 0.28, 0.05]} cor="#9aa0aa" />
        ))}
      </group>

      {/* objetos espalhados: pasta, documentos, vaso quebrado */}
      <Caixa pos={[-1.2, 0.015, 1.8]} rot={[0, 1.1, 0]} tam={[0.42, 0.03, 0.3]} cor="#d9a85a" />
      <Caixa pos={[3.2, 0.012, 2.2]} rot={[0, -0.4, 0]} tam={[0.36, 0.024, 0.24]} cor="#f4efe2" />
      <Caixa pos={[2.5, 0.014, 0.8]} rot={[0, 0.7, 0]} tam={[0.28, 0.02, 0.2]} cor="#f4efe2" />
      {/* vaso partido */}
      <Cil pos={[-3.0, 0, 3.5]} r={0.2} r2={0.15} h={0.35} cor="#9a7a5a" seg={8} />
      <Cil pos={[-3.0, 0.3, 3.5]} r={0.14} r2={0.2} h={0.1} cor="#9a7a5a" seg={8} />
      {/* terra e planta espalhadas */}
      {[0, 0.4, 0.8, 1.2].map((a, i) => (
        <Caixa key={i} pos={[-3.0 + Math.cos(a * 3) * 0.4, 0.014, 3.5 + Math.sin(a * 3) * 0.4]}
          tam={[0.14, 0.025, 0.1]} cor="#6b4a2f" sombra={false} />
      ))}

      {/* sacolas de evidências (amarelas) */}
      {[[-2.0, 0, 0.5], [4.0, 0, 1.0], [1.0, 0, -0.5]].map((pos, i) => (
        <group key={i} position={pos as V3}>
          <Caixa pos={[0, 0.1, 0]} tam={[0.3, 0.2, 0.2]} cor="#c9b623" />
          <Placa texto={`EV.0${i + 1}`} pos={[0, 0.1, 0.11]} larg={0.26} fundo="#c9b623" cor="#1d1b26" />
        </group>
      ))}

      {/* policiais fazendo busca */}
      <Boneco pos={[-4.5, 0, 1.0]} rotY={0.6} acao="carrega" t={t} v={POLICIAL} />
      <Boneco pos={[4.0, 0, -1.5]} rotY={2.4} acao="aponta" t={t + 1} v={POLICIAL2} />
      <Boneco pos={[0.5, 0, -3.0]} rotY={Math.PI} acao="carrega" t={t + 2} v={POLICIAL3} />

      {/* teto */}
      <Caixa pos={[0, 2.95, 0]} tam={[14, 0.12, 12]} cor="#ebe7e3" />
      {/* lustres de teto */}
      {[-3.5, 0, 3.5].map((x) => (
        <group key={x} position={[x, 2.88, 0]}>
          <Cil pos={[0, 0, 0]} r={0.04} h={0.3} cor="#c9a046" seg={8} />
          <mesh position={[0, -0.26, 0]} rotation={[0, 0, 0]}>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshStandardMaterial color="#f4f0d8" roughness={0.4} transparent opacity={0.85} />
          </mesh>
          <pointLight position={[0, -0.28, 0]} color="#fff0d0" intensity={8} distance={5} decay={1.4} />
        </group>
      ))}
      {/* contraluz fria atrás do Zé */}
      <pointLight position={[0.0, 2.3, 0.8]} color="#a0b8ff" intensity={3} distance={6} decay={1.5} />

      <ZeDetetive pos={[0.0, 0, 0.6]} rotY={-1.8} t={t} aponta expressao="serio" />
    </group>
  );
};

// ============================================================
// 5. id_delegacia — sala de tribunal, banco dos réus
// ============================================================
const Tribunal: React.FC<{t: number; p: number}> = ({t, p}) => {
  const maletaAberta = p > 0.5;
  return (
    <group>
      {/* chão parquet (madeira clara) */}
      <mesh position={[0, 0, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 14]} />
        <meshStandardMaterial color="#c8a870" roughness={0.65} />
      </mesh>
      {/* linhas do parquet */}
      {Array.from({length: 10}).map((_, i) => (
        <Caixa key={i} pos={[-7 + i * 1.4, 0.004, 0]} tam={[0.03, 0.006, 14]} cor="#b8986a" sombra={false} />
      ))}

      {/* lambri nas paredes (todo ao redor) */}
      <Caixa pos={[0, 2.2, -7.0]} tam={[16, 4.4, 0.18]} cor="#6b4a2a" />
      <Caixa pos={[0, 2.2, 7.0]} tam={[16, 4.4, 0.18]} cor="#6b4a2a" />
      <Caixa pos={[-8.0, 2.2, 0]} tam={[0.18, 4.4, 14]} cor="#6b4a2a" />
      <Caixa pos={[8.0, 2.2, 0]} tam={[0.18, 4.4, 14]} cor="#6b4a2a" />
      {/* frisos horizontais do lambri */}
      {[0.6, 1.2, 1.8, 2.4, 3.0, 3.6].map((y) => (
        <group key={y}>
          <Caixa pos={[0, y, -6.9]} tam={[16, 0.05, 0.02]} cor="#8a6a3a" sombra={false} />
          <Caixa pos={[0, y, 6.9]} tam={[16, 0.05, 0.02]} cor="#8a6a3a" sombra={false} />
          <Caixa pos={[-7.9, y, 0]} tam={[0.02, 0.05, 14]} cor="#8a6a3a" sombra={false} />
          <Caixa pos={[7.9, y, 0]} tam={[0.02, 0.05, 14]} cor="#8a6a3a" sombra={false} />
        </group>
      ))}

      {/* janelas altas na parede esquerda (luz natural) */}
      {[-3.5, 3.5].map((z) => (
        <group key={z} position={[-7.9, 2.6, z]}>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.6, 2.4]} />
            <meshStandardMaterial color="#c9d8e6" roughness={0.1} transparent opacity={0.5} />
          </mesh>
          <Caixa pos={[0, 0, 0]} tam={[0.04, 2.5, 1.7]} cor="#8a6a3a" sombra={false} />
        </group>
      ))}

      {/* bancada do juiz (plataforma elevada 0,5 m) */}
      <Caixa pos={[0, 0.25, -5.8]} tam={[6, 0.5, 2.0]} cor="#8a6040" />
      <Caixa pos={[0, 0.52, -5.8]} tam={[6.1, 0.06, 2.1]} cor="#a07850" />
      {/* friso frontal da bancada */}
      <Caixa pos={[0, 0.25, -4.78]} tam={[6.0, 0.5, 0.06]} cor="#6b4a2a" />
      {/* placa "JUÍZO FEDERAL" */}
      <Placa texto="JUÍZO FEDERAL" pos={[0, 0.25, -4.74]} larg={2.4} fundo="#1d1b26" cor="#c9a046" />
      {/* cadeira e mesa do juiz sobre a plataforma */}
      <Caixa pos={[0, 0.86, -6.2]} tam={[1.8, 0.07, 0.9]} cor="#6b4a2a" />
      <Caixa pos={[0, 1.14, -6.5]} rot={[-0.1, 0, 0]} tam={[1.6, 0.6, 0.08]} cor="#4a3020" />
      <Caixa pos={[0, 0.65, -6.2]} tam={[0.1, 0.56, 0.06]} cor="#2b1a0e" />
      {/* martelo do juiz */}
      <Barra a={[0.5, 0.94, -5.85]} b={[0.65, 0.94, -6.0]} r={0.014} cor="#6b4429" sombra={false} />
      <Caixa pos={[0.57, 0.94, -5.92]} tam={[0.08, 0.055, 0.1]} cor="#6b4429" />
      <Boneco pos={[0, 0.5, -5.5]} rotY={Math.PI} acao="fala" t={t} v={JUIZ} esc={0.9} />

      {/* bandeira dos EUA (direita) e bandeira do estado (esquerda) */}
      {[[-2.0, '#c9302c'], [2.0, '#2f6fd6']].map(([x, cor], i) => (
        <group key={i} position={[x as number, 0, -6.4]}>
          <Cil pos={[0, 1.3, 0]} r={0.025} h={2.6} cor="#c9ced6" seg={6} />
          <Caixa pos={[0.5, 2.2, 0]} tam={[1.0, 0.65, 0.02]} cor={cor as string} />
          {/* listras */}
          {[0, 1, 2].map((j) => (
            <Caixa key={j} pos={[0.5, 2.0 + j * 0.22, 0.02]} tam={[0.9, 0.08, 0.01]}
              cor={i === 0 ? (j % 2 ? '#f4f0e8' : '#c9302c') : '#c9d8e6'} sombra={false} />
          ))}
        </group>
      ))}

      {/* mesa do promotor (esquerda) */}
      <Caixa pos={[-3.0, 0.75, -1.5]} tam={[2.6, 0.07, 1.2]} cor="#8a6040" />
      <Caixa pos={[-3.0, 0.78, -1.5]} tam={[2.5, 0.015, 1.1]} cor="#a09060" sombra={false} />
      {[[-1.6, -0.4], [-4.4, -0.4], [-1.6, -2.6], [-4.4, -2.6]].map(([x, z], i) => (
        <Caixa key={i} pos={[x, 0.36, z]} tam={[0.07, 0.72, 0.07]} cor="#6b4a2a" />
      ))}
      {/* itens sobre a mesa do promotor */}
      <Caixa pos={[-2.6, 0.8, -1.4]} rot={[0, 0.1, 0]} tam={[0.44, 0.03, 0.3]} cor="#c9302c" />
      <Caixa pos={[-3.4, 0.79, -1.6]} rot={[0, -0.2, 0]} tam={[0.36, 0.025, 0.24]} cor="#f4efe2" />
      <Boneco pos={[-3.0, 0, -0.6]} rotY={Math.PI} acao="aponta" t={t + 1} v={ADVOGADO} />

      {/* mesa da defesa (direita) */}
      <Caixa pos={[3.0, 0.75, -1.5]} tam={[2.6, 0.07, 1.2]} cor="#8a6040" />
      <Caixa pos={[3.0, 0.78, -1.5]} tam={[2.5, 0.015, 1.1]} cor="#a09060" sombra={false} />
      {[[1.6, -0.4], [4.4, -0.4], [1.6, -2.6], [4.4, -2.6]].map(([x, z], i) => (
        <Caixa key={i} pos={[x, 0.36, z]} tam={[0.07, 0.72, 0.07]} cor="#6b4a2a" />
      ))}
      {/* maleta da defesa */}
      <group position={[3.4, 0.82, -1.3]} rotation={[0, 0.2, 0]}>
        <Caixa pos={[0, 0, 0]} tam={[0.44, 0.24, 0.26]} cor="#1d1b26" />
        <Caixa pos={[0, 0.14, 0]} tam={[0.46, 0.04, 0.28]} cor="#2b2b3a" />
        {maletaAberta && (
          <group rotation={[1.3, 0, 0]}>
            <Caixa pos={[0, 0.12, 0.13]} tam={[0.42, 0.04, 0.26]} cor="#2b2b3a" />
          </group>
        )}
      </group>

      {/* banco dos réus (plataforma central separada) */}
      <Caixa pos={[0, 0.14, 1.0]} tam={[2.8, 0.28, 1.6]} cor="#6b4a2a" />
      <Caixa pos={[0, 0.3, 0.2]} tam={[2.9, 0.6, 0.08]} cor="#4a3020" />
      {/* baixo-relevo frontal */}
      <Caixa pos={[0, 0.2, 0.33]} tam={[2.6, 0.18, 0.02]} cor="#8a6040" sombra={false} />
      {/* Zé no banco dos réus */}
      <ZeDetetive pos={[0.0, 0.28, 0.9]} rotY={Math.PI} t={t} aponta={false} expressao="serio" esc={0.88} />

      {/* tribuna da testemunha */}
      <Caixa pos={[-1.8, 0.4, -3.5]} tam={[1.4, 0.8, 1.2]} cor="#8a6040" />
      <Caixa pos={[-1.8, 0.82, -3.0]} tam={[1.5, 0.06, 0.08]} cor="#6b4a2a" />

      {/* tela de projeção com evidência */}
      <Caixa pos={[6.5, 2.1, -1.5]} tam={[0.08, 2.4, 3.2]} cor="#f4f0e8" />
      {/* foto/documento de evidência na tela */}
      <mesh position={[6.46, 2.1, -1.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.0, 2.2]} />
        <meshStandardMaterial color="#2a3550" roughness={0.8} />
      </mesh>
      {/* texto na tela */}
      <Placa texto="PASSAPORTE FALSO" pos={[6.44, 2.4, -1.5]} rot={[0, Math.PI / 2, 0]} larg={2.4} fundo="#2a3550" cor="#ffd23f" />
      <Placa texto="EVIDÊNCIA 03" pos={[6.44, 1.8, -1.5]} rot={[0, Math.PI / 2, 0]} larg={2.4} fundo="#c9302c" cor="#ffffff" />

      {/* bancadas do júri (esquerda) */}
      <Caixa pos={[-5.5, 0.5, -2.0]} tam={[2.0, 1.0, 5.0]} cor="#6b4a2a" />
      {[0, 1, 2].map((i) => (
        <group key={i} position={[-5.5, 0, -4.0 + i * 1.6]}>
          <Boneco pos={[0, 0.5, 0]} rotY={Math.PI / 2 + 0.2} acao={i === 1 ? 'fala' : 'parado'} t={t + i}
            v={[EXECUTIVO, ADVOGADO, VENDEDOR][i]} esc={0.82} />
        </group>
      ))}

      {/* plateia (fileiras de bancos atrás) */}
      {[2.5, 3.8, 5.1].map((z) => (
        <Caixa key={z} pos={[0, 0.44, z]} tam={[13, 0.08, 1.0]} cor="#6b4a2a" />
      ))}
      {/* pessoas na plateia */}
      {[[-3.5, 2.5], [0, 2.5], [3.5, 2.5], [-2, 3.8], [2, 3.8]].map(([x, z], i) => (
        <Boneco key={i} pos={[x, 0.44, z]} rotY={Math.PI} acao="parado" t={t + i * 0.5}
          v={[ADVOGADO, EXECUTIVA, VENDEDOR, POLICIAL, EXECUTIVO][i]} esc={0.8} />
      ))}

      {/* teto com caixilhos e spots */}
      <Caixa pos={[0, 4.2, 0]} tam={[16, 0.14, 14]} cor="#c8a870" />
      {/* claraboias simuladas */}
      {[[-3.5, 0], [3.5, 0]].map(([x, z]) => (
        <mesh key={x} position={[x, 4.14, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 2.0]} />
          <meshBasicMaterial color="#c9e0f4" transparent opacity={0.5} />
        </mesh>
      ))}
      {/* spots sobre bancada do juiz */}
      {[-1.5, 0, 1.5].map((x) => (
        <group key={x} position={[x, 4.1, -5.6]}>
          <Cil pos={[0, 0, 0]} r={0.07} h={0.2} cor="#3a3540" seg={8} />
          <pointLight position={[0, -0.15, 0]} color="#fff4e0" intensity={15} distance={5} decay={1.3} />
        </group>
      ))}
      {/* iluminação geral */}
      <pointLight position={[0, 3.8, 0]} color="#fff4d0" intensity={18} distance={12} decay={1.2} />
      <pointLight position={[0, 3.8, 3.5]} color="#fff0d0" intensity={10} distance={10} decay={1.3} />
      {/* contraluz fria */}
      <pointLight position={[0.0, 3.0, 1.5]} color="#a0b8ff" intensity={4} distance={8} decay={1.5} />

      <Rotulo texto="tribunal" ancora={[0, 1.5, -4.5]} sobe={0.6} fundo="#1d1b26" cor="#c9a046" />
    </group>
  );
};

// ============================================================
// SETS exportados (prefixo id_)
// ============================================================
export const SETS_IDENTIDADES: Record<string, SetCaso> = {

  // ----- 1. sala de investigação -----
  id_quadro: {
    ceu: ['#0d0a14', '#1a1626'],
    luz: 'interior',
    render: ({t, p}) => <SalaInvestigacao t={t} p={p} />,
    cams: {
      geral:  orb([0.4, 1.4, 0], 20, 10, 5.0, 4.4, 44, 8),
      quadro: orb([0.0, 2.0, -3.0], 0, 2, 3.4, 2.8, 48, 6),
      close:  orb([0.3, 1.9, -2.8], -8, 5, 2.6, 2.2, 46, 6),
      ze:     orb([1.2, 1.2, 0.8], -35, 8, 2.8, 2.4, 42, 8),
      detalhe: orb([0.0, 2.1, -3.1], 5, 0, 1.6, 1.3, 50, 4),
      espelho: orb([-0.2, 1.8, -2.8], 180, 8, 4.2, 3.8, 44, 6),
    },
  },

  // ----- 2. escritório de luxo -----
  id_escritorio: {
    ceu: ['#060814', '#10182e'],
    luz: 'interior',
    render: ({t}) => <EscritorioLuxo t={t} />,
    cams: {
      geral:  orb([0.5, 1.2, 0], 25, 12, 7.5, 6.5, 44, 8),
      mesa:   orb([0.0, 0.9, -0.4], -5, 18, 4.0, 3.4, 46, 8),
      close:  orb([0.5, 1.4, 0.8], -15, 8, 2.4, 2.1, 42, 6),
      detalhe: orb([-5.5, 1.7, -1.0], 90, 2, 2.0, 1.7, 44, 4),
      espelho: orb([3.5, 1.5, -4.5], 160, 6, 5.0, 4.4, 42, 6),
    },
  },

  // ----- 3. concessionária de luxo -----
  id_concessio: {
    ceu: ['#080a1a', '#141c35'],
    luz: 'interior',
    render: ({t}) => <Concessio t={t} />,
    cams: {
      geral:   orb([0.5, 1.2, 0.5], 15, 14, 9.0, 8.0, 44, 8),
      close:   orb([0.0, 0.9, -1.5], -5, 10, 3.0, 2.6, 46, 8),
      detalhe: orb([0.0, 0.5, -1.5], -10, 5, 1.8, 1.4, 44, 4),
      mesa:    orb([-7.0, 1.0, 2.5], 90, 8, 2.8, 2.4, 42, 6),
      espelho: orb([0.0, 2.8, 2.5], 0, 55, 6.5, 5.5, 44, 6),
    },
  },

  // ----- 4. apartamento de luxo em LA -----
  id_apartamento: {
    ceu: ['#04080f', '#0d1826'],
    luz: 'interior',
    render: ({t, p}) => <ApartamentoLA t={t} p={p} />,
    cams: {
      geral:   orb([0.5, 1.2, 1.5], 30, 12, 7.5, 6.5, 44, 8),
      close:   orb([0.2, 1.4, 0.6], -10, 8, 2.4, 2.1, 42, 6),
      detalhe: orb([-6.5, 1.5, -0.5], 90, 2, 2.0, 1.6, 44, 4),
      mesa:    orb([1.5, 0.6, 2.8], -15, 20, 2.5, 2.2, 42, 6),
      espelho: orb([0.0, 1.5, 5.5], 180, 8, 5.0, 4.4, 44, 6),
    },
  },

  // ----- 5. sala de tribunal -----
  id_delegacia: {
    ceu: ['#0a0a0e', '#181818'],
    luz: 'interior',
    render: ({t, p}) => <Tribunal t={t} p={p} />,
    cams: {
      geral:   orb([0.0, 1.8, 2.0], 0, 14, 9.0, 8.0, 44, 8),
      close:   orb([0.0, 1.4, 0.9], 0, 6, 2.4, 2.1, 44, 6),
      mesa:    orb([0.0, 0.9, -1.5], -5, 18, 4.5, 3.8, 46, 8),
      detalhe: orb([6.5, 2.1, -1.5], -90, 2, 2.0, 1.6, 44, 4),
      espelho: orb([0.0, 2.6, -5.6], 180, 10, 5.5, 4.8, 44, 6),
    },
  },
};
