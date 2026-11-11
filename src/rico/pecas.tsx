// PEÇAS do "Como Ficou Rico: Silvio Santos" (versão 2). Escala real: 1 unidade = 1 metro.
// Cada peça é um objeto reconhecível da história: capa de título de eleitor, tabuleiro de camelô, microfone de rádio dos anos 40,
// barca Rio-Niterói, alto-falante, carnê de 12 parcelas, baú de brinquedos, câmera de estúdio dos anos 60, TV de tubo,
// torre de transmissão, mapa do Brasil, cartela de capitalização, cofre de banco, miniaturas das empresas.
// Nada de logo real nem rosto do Silvio: o Zé faz o papel dele (terno + microfone no peito).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Barra, Boneco, Caixa, Cil, Mat, Visual, AcaoBoneco, clamp01, lerp, suave} from '../v4/kit';

export {Barra, Boneco, Caixa, Cil, clamp01, lerp, suave};

// ---------- texturas com texto (canvas) ----------
const cache = new Map<string, THREE.Texture>();
export function tex(id: string, w: number, h: number, pinta: (g: CanvasRenderingContext2D) => void, rep?: [number, number]) {
  const k = id + (rep ? `@${rep[0]}x${rep[1]}` : '');
  const c0 = cache.get(k);
  if (c0) return c0;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  pinta(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (rep) t.repeat.set(rep[0], rep[1]);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(k, t);
  return t;
}
const FONTE = "'Baloo 2', sans-serif";
// escreve uma linha centralizada que cabe na largura
export const linha = (g: CanvasRenderingContext2D, txt: string, x: number, y: number, max: number, px: number, cor: string, peso = 800) => {
  let fs = px;
  g.font = `${peso} ${fs}px ${FONTE}`;
  while (g.measureText(txt).width > max && fs > 10) {
    fs -= 2;
    g.font = `${peso} ${fs}px ${FONTE}`;
  }
  g.fillStyle = cor;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(txt, x, y);
};

// placa plana com texto (letreiro, cartaz, faixa). Fica de frente para +Z.
export const Letreiro: React.FC<{pos: V3; rotY?: number; rot?: V3; larg: number; alt: number; linhas: string[]; fundo?: string; cor?: string; borda?: string; emissivo?: boolean; dupla?: boolean}> = ({pos, rotY = 0, rot, larg, alt, linhas, fundo = '#f4ead2', cor = '#1d1b26', borda, emissivo, dupla}) => {
  const W = 512;
  const H = Math.max(64, Math.round((W * alt) / larg));
  const t = tex(`let:${linhas.join('|')}:${fundo}:${cor}:${borda}:${H}`, W, H, (g) => {
    g.fillStyle = fundo;
    g.fillRect(0, 0, W, H);
    if (borda) {
      g.lineWidth = Math.max(6, H * 0.06);
      g.strokeStyle = borda;
      g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, H - g.lineWidth);
    }
    const n = linhas.length;
    linhas.forEach((l, i) => linha(g, l, W / 2, (H * (i + 0.5)) / n + 2, W * 0.9, Math.min((H / n) * 0.72, 120), cor));
  });
  return (
    <mesh position={pos} rotation={rot ?? [0, rotY, 0]}>
      <planeGeometry args={[larg, alt]} />
      {emissivo ? <meshBasicMaterial map={t} toneMapped={false} side={dupla ? 2 : 0} /> : <meshStandardMaterial map={t} roughness={0.85} side={dupla ? 2 : 0} />}
    </mesh>
  );
};

// ---------- personagens ----------
// Zé camelô (14 a 17 anos): camisa clara, suspensório, boné de jornaleiro
export const ZE_JOVEM: Visual = {camisa: '#f2ecdf', calca: '#4a4f66', colete: null, capacete: null, cabelo: '#2b1d14', bone: '#6b5a48'};
// Zé apresentador: terno azul-marinho, gravata vermelha (o microfone de peito é posto pelo <ZeTerno>)
export const ZE_TERNO: Visual = {camisa: '#26324f', calca: '#26324f', colete: null, capacete: null, cabelo: '#2b1d14', gravata: '#c62f2f'};
export const SOCIO: Visual = {camisa: '#7a6a58', calca: '#4a3e32', colete: null, capacete: null, cabelo: '#c8c8c8', pele: '#f0c8a0', gravata: '#2f5d8a'};
export const DIRETOR_TV: Visual = {camisa: '#5d6470', calca: '#3a404a', colete: null, capacete: null, cabelo: '#8a8a8a', pele: '#e8b892', gravata: '#2b2233'};
export const EXECUTIVO: Visual = {camisa: '#4a505c', calca: '#3a404a', colete: null, capacete: null, cabelo: '#1d1b26', gravata: '#d9b23f', pele: '#e8b892'};
export const BANCARIO: Visual = {camisa: '#e9e6df', calca: '#3a404a', colete: null, capacete: null, cabelo: '#5a4030', gravata: '#2f5d8a', pele: '#c98e62'};
export const PASSANTES_40: Visual[] = [
  {camisa: '#d9cdb0', calca: '#4a4a55', colete: null, capacete: null, cabelo: '#3b2a20', gravata: '#7a3a2a', bone: '#5a4a3a'},
  {camisa: '#e9e1cf', calca: '#2b2b3a', colete: null, capacete: null, cabelo: '#1d1b26', pele: '#c98e62', gravata: '#2b2233'},
  {camisa: '#b84a4a', calca: '#e9e1cf', colete: null, capacete: null, cabelo: '#8a6a43'},
  {camisa: '#f2efe6', calca: '#5b4a3a', colete: null, capacete: null, cabelo: '#2b1d14', pele: '#8d5a3b', gravata: '#2b2233', bone: '#3a3a3a'},
  {camisa: '#4f6f9a', calca: '#3a3f55', colete: null, capacete: null, cabelo: '#c8c8c8', gravata: '#d9cdb0'},
  {camisa: '#6b8f5a', calca: '#2b2233', colete: null, capacete: null, cabelo: '#5a4030', pele: '#e7b48c'},
  {camisa: '#e7c25a', calca: '#3a3f55', colete: null, capacete: null, cabelo: '#3b2a20', pele: '#f2c9a4'},
];
export const FAMILIA: Visual[] = [
  {camisa: '#e26d5a', calca: '#2f5d8a', colete: null, capacete: null, cabelo: '#3b2a20'},
  {camisa: '#f2c94c', calca: '#6b3e26', colete: null, capacete: null, cabelo: '#1d1b26', pele: '#c98e62'},
  {camisa: '#5aa0c8', calca: '#2b2233', colete: null, capacete: null, cabelo: '#8a6a43', pele: '#f2c9a4'},
];
export const CORES_ROUPA = ['#c94f4f', '#4f7fb0', '#e7c25a', '#6b8f5a', '#f2efe6', '#8a5aa0', '#e98a3a', '#3fa0a0', '#e26d9a'];
export const CORES_PELE = ['#ffd2ad', '#e7b48c', '#c98e62', '#8d5a3b', '#f2c9a4'];

export const rnd = (seed: number) => {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};

// microfone de peito pendurado no pescoço (o "jeito" do apresentador), preso ao boneco
const MicPeito: React.FC = () => (
  <group>
    <Barra a={[-0.12, 1.02, 0.18]} b={[0, 0.8, 0.31]} r={0.008} cor="#1d1b26" sombra={false} />
    <Barra a={[0.12, 1.02, 0.18]} b={[0, 0.8, 0.31]} r={0.008} cor="#1d1b26" sombra={false} />
    <Cil pos={[0, 0.74, 0.32]} r={0.035} h={0.13} cor="#2b2b30" seg={10} />
    <mesh position={[0, 0.82, 0.32]}>
      <sphereGeometry args={[0.04, 10, 8]} />
      <meshStandardMaterial color="#c9ced6" metalness={0.6} roughness={0.35} />
    </mesh>
    {/* colarinho branco por trás da gravata */}
    <mesh position={[0, 0.99, 0.245]} rotation={[0.3, 0, 0]}>
      <boxGeometry args={[0.24, 0.1, 0.04]} />
      <Mat cor="#f4f4f4" />
    </mesh>
  </group>
);

// o Zé: jovem camelô ou apresentador de terno (com microfone no peito)
export const Ze: React.FC<{pos: V3; rotY?: number; acao?: AcaoBoneco; t: number; terno?: boolean; mic?: boolean; esc?: number}> = ({pos, rotY = 0, acao = 'parado', t, terno = false, mic = true, esc}) => {
  const e = esc ?? (terno ? 0.92 : 0.84);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Boneco pos={[0, 0, 0]} acao={acao} t={t} v={terno ? ZE_TERNO : ZE_JOVEM} esc={e} />
      {terno && mic && acao !== 'senta' && (
        <group scale={e}>
          <MicPeito />
        </group>
      )}
      {!terno && (
        <group scale={e}>
          {/* suspensório */}
          {[-0.12, 0.12].map((x) => (
            <Caixa key={x} pos={[x, 0.8, 0.255]} tam={[0.05, 0.5, 0.02]} cor="#6b3e26" sombra={false} />
          ))}
        </group>
      )}
    </group>
  );
};

// pessoa sentada simplificada (plateia, passageiros): corpo + cabeça + cabelo
export const Sentado: React.FC<{pos: V3; rotY?: number; roupa: string; pele: string; cabelo?: string; bracos?: number; esc?: number}> = ({pos, rotY = 0, roupa, pele, cabelo = '#3b2a20', bracos = 0, esc = 1}) => (
  <group position={pos} rotation={[0, rotY, 0]} scale={esc}>
    <mesh position={[0, 0.35, 0]} castShadow>
      <capsuleGeometry args={[0.2, 0.3, 3, 8]} />
      <Mat cor={roupa} />
    </mesh>
    <mesh position={[0, 0.82, 0]} castShadow>
      <sphereGeometry args={[0.24, 12, 10]} />
      <Mat cor={pele} />
    </mesh>
    <mesh position={[0, 0.88, -0.03]}>
      <sphereGeometry args={[0.25, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
      <Mat cor={cabelo} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.24, 0.45 + bracos * 0.35, 0.05]} rotation={[0, 0, s * (0.25 + bracos * 2.4)]} castShadow>
        <capsuleGeometry args={[0.06, 0.24, 3, 6]} />
        <Mat cor={roupa} />
      </mesh>
    ))}
  </group>
);

// ======================= RIO, 1945 =======================
// calçada de pedra portuguesa: ondas largas e de contraste baixo (sem "zebra" de longe)
export const texCalcada = (rep: [number, number]) =>
  tex('calcada3', 512, 512, (g) => {
    g.fillStyle = '#e6decb';
    g.fillRect(0, 0, 512, 512);
    g.fillStyle = '#9a9286';
    for (let y = -128; y < 640; y += 128) {
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= 512; x += 8) g.lineTo(x, y + Math.sin((x / 512) * Math.PI * 2) * 34);
      for (let x = 512; x >= 0; x -= 8) g.lineTo(x, y + 44 + Math.sin((x / 512) * Math.PI * 2) * 34);
      g.closePath();
      g.fill();
    }
    // juntas das pedrinhas
    g.fillStyle = 'rgba(0,0,0,0.05)';
    for (let i = 0; i < 512; i += 16) {
      g.fillRect(i, 0, 1, 512);
      g.fillRect(0, i, 512, 1);
    }
  }, rep);

// fachada art déco dos anos 40 (janelas altas, faixas horizontais)
const texFachada = (cor: string) =>
  tex('fach40:' + cor, 256, 256, (g) => {
    g.fillStyle = cor;
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = 'rgba(0,0,0,0.08)';
    g.fillRect(0, 236, 256, 20);
    for (const x of [36, 148]) {
      g.fillStyle = '#efe8d8';
      g.fillRect(x - 6, 50, 84, 150);
      g.fillStyle = '#41505e';
      g.fillRect(x, 56, 72, 138);
      g.fillStyle = '#efe8d8';
      g.fillRect(x + 34, 56, 4, 138);
      g.fillRect(x, 120, 72, 4);
    }
  });

export const Predio40: React.FC<{pos: V3; tam: V3; cor: string; rotY?: number; loja?: string; toldo?: string}> = ({pos, tam, cor, rotY = 0, loja, toldo}) => {
  const [w, h, d] = tam;
  const m = useMemo(() => {
    const t = texFachada(cor).clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, Math.round(w / 3.2)), Math.max(1, Math.round((h - 4.5) / 3.4)));
    return t;
  }, [cor, w, h]);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {/* corpo com janelas, acima do térreo */}
      <mesh position={[0, 4.5 + (h - 4.5) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h - 4.5, d]} />
        <meshStandardMaterial color="#ffffff" map={m} roughness={0.9} />
      </mesh>
      {/* térreo: loja com vitrine */}
      <Caixa pos={[0, 2.25, 0]} tam={[w, 4.5, d]} cor={cor} />
      <Caixa pos={[0, 1.6, d / 2 + 0.01]} tam={[w * 0.82, 2.6, 0.05]} cor="#33414d" sombra={false} />
      {/* marquise */}
      <Caixa pos={[0, 3.6, d / 2 + 0.9]} tam={[w, 0.18, 1.8]} cor="#e9e1cf" />
      {toldo && <Caixa pos={[0, 3.25, d / 2 + 0.6]} rot={[0.35, 0, 0]} tam={[w * 0.9, 0.04, 1.3]} cor={toldo} />}
      {loja && <Letreiro pos={[0, 4.05, d / 2 + 0.03]} larg={Math.min(w * 0.8, 6)} alt={0.7} linhas={[loja]} fundo="#1d1b26" cor="#ffd23f" />}
      {/* coroamento escalonado art déco */}
      <Caixa pos={[0, h + 0.5, 0]} tam={[w * 0.7, 1, d * 0.8]} cor={cor} />
      <Caixa pos={[0, h + 1.3, 0]} tam={[w * 0.35, 0.6, d * 0.6]} cor={cor} />
      {[0.25, 0.5, 0.75].map((k) => (
        <Caixa key={k} pos={[0, 4.5 + (h - 4.5) * k, d / 2 + 0.03]} tam={[w + 0.06, 0.12, 0.1]} cor="#f2ecdf" sombra={false} />
      ))}
    </group>
  );
};

// Theatro Municipal do Rio (silhueta simplificada): fecha a Avenida Rio Branco ao fundo
export const Theatro: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 6, 0]} tam={[34, 12, 26]} cor="#e9dfc6" />
    <Caixa pos={[0, 1.2, 13.6]} tam={[24, 2.4, 2]} cor="#d9cdb0" />
    {Array.from({length: 10}).map((_, i) => (
      <Cil key={i} pos={[-11 + i * 2.45, 7, 13.4]} r={0.45} h={9} cor="#f2ecdf" seg={10} />
    ))}
    <Caixa pos={[0, 12.4, 13.4]} tam={[26, 1.2, 1.6]} cor="#d9cdb0" />
    {/* cúpula verde e as duas cupulazinhas laterais */}
    <mesh position={[0, 16, 2]} castShadow>
      <sphereGeometry args={[7, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <Mat cor="#4f9a7a" rugoso={0.5} />
    </mesh>
    <Cil pos={[0, 13.5, 2]} r={7.2} h={5} cor="#e9dfc6" seg={20} />
    <mesh position={[0, 24, 2]}>
      <coneGeometry args={[0.6, 3, 8]} />
      <Mat cor="#d9b23f" rugoso={0.4} />
    </mesh>
    {[-14, 14].map((x) => (
      <group key={x}>
        <Cil pos={[x, 13.5, 11]} r={2.2} h={3} cor="#e9dfc6" seg={12} />
        <mesh position={[x, 15, 11]}>
          <sphereGeometry args={[2.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Mat cor="#4f9a7a" rugoso={0.5} />
        </mesh>
      </group>
    ))}
  </group>
);

// bonde aberto do Rio (9 m)
export const Bonde: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.65, 0]} tam={[9, 0.5, 2.4]} cor="#3a5a3a" />
    <Caixa pos={[0, 2.85, 0]} tam={[9.4, 0.2, 2.6]} cor="#e7c25a" />
    <Caixa pos={[0, 2.68, 0]} tam={[9.2, 0.18, 2.5]} cor="#3a5a3a" />
    {Array.from({length: 10}).map((_, i) => (<Cil key={i} pos={[-4.3 + i * 0.95, 1.9, 1.15]} r={0.04} h={1.9} cor="#5a4a3a" seg={5} />))}
    {Array.from({length: 10}).map((_, i) => (<Cil key={'b' + i} pos={[-4.3 + i * 0.95, 1.9, -1.15]} r={0.04} h={1.9} cor="#5a4a3a" seg={5} />))}
    {Array.from({length: 8}).map((_, i) => (<Caixa key={'s' + i} pos={[-3.7 + i * 1.05, 1.15, 0]} tam={[0.45, 0.5, 2.2]} cor="#8b5a3c" />))}
    {Array.from({length: 6}).map((_, i) => (
      <Sentado key={'p' + i} pos={[-3.2 + i * 1.3, 0.95, (i % 2 ? 0.5 : -0.5)]} rotY={Math.PI / 2} roupa={CORES_ROUPA[i % 9]} pele={CORES_PELE[i % 5]} esc={0.9} />
    ))}
    <Barra a={[2, 2.95, 0]} b={[-1, 6.2, 0]} r={0.03} cor="#2b2b30" />
    {[-3, 3].map((x) => (<Cil key={x} pos={[x, 0.3, 0]} rot={[Math.PI / 2, 0, 0]} r={0.3} h={2.2} cor="#2b2b30" />))}
    <Letreiro pos={[4.71, 2.3, 0]} rotY={Math.PI / 2} larg={1.6} alt={0.4} linhas={['CINELÂNDIA']} fundo="#f4ead2" />
  </group>
);

// poste de luz de ferro (4,5 m)
export const Poste: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Cil pos={[0, 2.2, 0]} r={0.07} r2={0.12} h={4.4} cor="#2f3a34" seg={8} />
    <Barra a={[0, 4.3, 0]} b={[0.6, 4.5, 0]} r={0.04} cor="#2f3a34" />
    <mesh position={[0.6, 4.4, 0]}>
      <sphereGeometry args={[0.2, 10, 8]} />
      <meshStandardMaterial color="#fff6d8" emissive="#ffe9a8" emissiveIntensity={0.4} />
    </mesh>
  </group>
);

export const Palmeira: React.FC<{pos: V3; h?: number}> = ({pos, h = 9}) => (
  <group position={pos}>
    <Cil pos={[0, h / 2, 0]} r={0.22} r2={0.3} h={h} cor="#9a8a70" seg={8} />
    {Array.from({length: 8}).map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 1.4, h - 0.3, Math.sin(a) * 1.4]} rotation={[0, -a, -0.45]} castShadow>
          <boxGeometry args={[3, 0.06, 0.6]} />
          <Mat cor="#4f8f4a" />
        </mesh>
      );
    })}
  </group>
);

// título de eleitor de 1945 (papel 10 x 7 cm, ampliado nos closes via esc) e a capinha de plástico
const texTitulo = () =>
  tex('titulo45', 512, 360, (g) => {
    g.fillStyle = '#efe2bf';
    g.fillRect(0, 0, 512, 360);
    g.strokeStyle = '#8a6a43';
    g.lineWidth = 10;
    g.strokeRect(12, 12, 488, 336);
    linha(g, 'JUSTIÇA ELEITORAL', 256, 62, 440, 40, '#5a3a20');
    linha(g, 'TÍTULO DE ELEITOR', 256, 118, 440, 52, '#1d1b26');
    g.fillStyle = 'rgba(90,58,32,0.45)';
    for (let i = 0; i < 4; i++) g.fillRect(60, 170 + i * 36, 392, 4);
    g.strokeStyle = '#7a2a2a';
    g.lineWidth = 6;
    g.beginPath();
    g.arc(410, 290, 40, 0, Math.PI * 2);
    g.stroke();
    linha(g, '1945', 410, 292, 70, 26, '#7a2a2a');
  });
export const Titulo: React.FC<{pos: V3; rot?: V3; esc?: number; capa?: number}> = ({pos, rot = [-Math.PI / 2, 0, 0], esc = 1, capa = 0}) => (
  <group position={pos} rotation={rot} scale={esc}>
    <mesh>
      <planeGeometry args={[0.1, 0.07]} />
      <meshStandardMaterial map={texTitulo()} roughness={0.9} side={2} />
    </mesh>
    {capa > 0 && (
      <mesh position={[0, 0, 0.0015]} scale={[1, capa, 1]}>
        <boxGeometry args={[0.108, 0.078, 0.002]} />
        <meshStandardMaterial color="#bfe3f2" transparent opacity={0.45} roughness={0.15} />
      </mesh>
    )}
  </group>
);

// moeda de cruzeiro (2,5 cm); "valor" vai escrito na face
const texMoeda = (v: string) =>
  tex('moeda:' + v, 128, 128, (g) => {
    g.fillStyle = '#d9b23f';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#a07a1f';
    g.lineWidth = 8;
    g.beginPath();
    g.arc(64, 64, 54, 0, Math.PI * 2);
    g.stroke();
    linha(g, v, 64, 66, 100, 60, '#6b4a10');
  });
export const Moeda: React.FC<{pos: V3; rot?: V3; valor?: string; r?: number}> = ({pos, rot = [0, 0, 0], valor = '1', r = 0.0125}) => (
  <group position={pos} rotation={rot}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[r, r, r * 0.16, 16]} />
      <meshStandardMaterial color="#d9b23f" metalness={0.6} roughness={0.35} />
    </mesh>
    <mesh position={[0, 0, r * 0.09]}>
      <circleGeometry args={[r * 0.98, 16]} />
      <meshStandardMaterial map={texMoeda(valor)} metalness={0.5} roughness={0.4} />
    </mesh>
  </group>
);

// cédula (15,6 x 7 cm) e maço
const texNota = (v: string, cor: string) =>
  tex('nota:' + v + cor, 256, 116, (g) => {
    g.fillStyle = cor;
    g.fillRect(0, 0, 256, 116);
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    g.lineWidth = 6;
    g.strokeRect(8, 8, 240, 100);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.beginPath();
    g.ellipse(190, 58, 30, 36, 0, 0, Math.PI * 2);
    g.fill();
    linha(g, v, 80, 60, 140, 46, '#1d1b26');
  });
export const Nota: React.FC<{pos: V3; rot?: V3; valor?: string; cor?: string; esc?: number}> = ({pos, rot = [-Math.PI / 2, 0, 0], valor = 'Cr$', cor = '#8fbf8a', esc = 1}) => (
  <mesh position={pos} rotation={rot} scale={esc}>
    <planeGeometry args={[0.156, 0.07]} />
    <meshStandardMaterial map={texNota(valor, cor)} side={2} roughness={0.9} />
  </mesh>
);
export const Maco: React.FC<{pos: V3; rotY?: number; n?: number; cor?: string; valor?: string}> = ({pos, rotY = 0, n = 12, cor = '#8fbf8a', valor = 'Cr$'}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, (n * 0.0012) / 2, 0]} tam={[0.156, n * 0.0012, 0.07]} cor={cor} />
    <Nota pos={[0, n * 0.0012 + 0.0005, 0]} valor={valor} cor={cor} />
    <Caixa pos={[0, (n * 0.0012) / 2, 0]} tam={[0.03, n * 0.0012 + 0.002, 0.072]} cor="#f2e6c8" sombra={false} />
  </group>
);

// tabuleiro de camelô em cavalete (0,85 m), com títulos encapados à venda e uma lata de moedas
export const Tabuleiro: React.FC<{pos: V3; rotY?: number; capas?: number; lata?: number; placa?: boolean}> = ({pos, rotY = 0, capas = 18, lata = 0, placa = true}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {[-1, 1].map((s) => (
      <group key={s}>
        <Barra a={[s * 0.45, 0, 0.25]} b={[s * 0.4, 0.82, -0.05]} r={0.018} cor="#6b4a2f" />
        <Barra a={[s * 0.45, 0, -0.3]} b={[s * 0.4, 0.82, 0.05]} r={0.018} cor="#6b4a2f" />
      </group>
    ))}
    <Caixa pos={[0, 0.85, 0]} tam={[1.1, 0.03, 0.6]} cor="#8b5a3c" />
    {[[0, 0.28], [0, -0.28], [0.54, 0], [-0.54, 0]].map(([x, z], i) => (
      <Caixa key={i} pos={[x, 0.89, z]} tam={i < 2 ? [1.1, 0.05, 0.03] : [0.03, 0.05, 0.6]} cor="#6b4a2f" />
    ))}
    {Array.from({length: capas}).map((_, i) => (
      <Titulo key={i} pos={[-0.42 + (i % 6) * 0.165, 0.868 + (i % 2) * 0.001, -0.17 + Math.floor(i / 6) * 0.12]} rot={[-Math.PI / 2, 0, (i % 3) * 0.05 - 0.05]} capa={1} />
    ))}
    {/* placa de preço */}
    {placa && <Letreiro pos={[0, 0.98, 0.3]} rot={[-0.5, 0, 0]} larg={0.42} alt={0.16} linhas={['CAPA Cr$ 4']} fundo="#fff6d8" cor="#b8322b" />}
    {lata > 0 && (
      <group position={[0.42, 0.87, 0.18]}>
        <Cil pos={[0, 0.07, 0]} r={0.07} h={0.14} cor="#9aa0aa" seg={14} />
        <Cil pos={[0, 0.02 + 0.11 * lata, 0]} r={0.065} h={0.01} cor="#d9b23f" seg={14} />
        {lata > 0.6 && Array.from({length: Math.round((lata - 0.6) * 20)}).map((_, i) => (
          <Moeda key={i} pos={[-0.04 + (i % 4) * 0.025, 0.14 + Math.floor(i / 4) * 0.008, -0.02 + (i % 3) * 0.02]} rot={[-Math.PI / 2 + 0.3, 0, i]} />
        ))}
      </group>
    )}
  </group>
);

// ======================= RÁDIO, 1948 =======================
// microfone de fita dos anos 40 (corpo de cápsula com grade), num pedestal
export const MicRadio: React.FC<{pos: V3; rotY?: number; mesa?: boolean}> = ({pos, rotY = 0, mesa = false}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {mesa ? <Cil pos={[0, 0.02, 0]} r={0.1} h={0.04} cor="#2b2b30" /> : <Cil pos={[0, 0.02, 0]} r={0.2} h={0.04} cor="#2b2b30" />}
    <Cil pos={[0, mesa ? 0.17 : 0.75, 0]} r={0.015} h={mesa ? 0.3 : 1.45} cor="#9aa0aa" seg={6} />
    <group position={[0, mesa ? 0.38 : 1.58, 0]}>
      <mesh scale={[0.75, 1, 0.6]} castShadow>
        <capsuleGeometry args={[0.07, 0.12, 6, 12]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.043]} scale={[0.6, 0.85, 1]}>
        <capsuleGeometry args={[0.065, 0.1, 4, 10]} />
        <meshStandardMaterial color="#3a3a40" roughness={0.8} wireframe />
      </mesh>
      <Caixa pos={[0, -0.13, 0]} tam={[0.12, 0.03, 0.03]} cor="#9aa0aa" />
    </group>
  </group>
);

// relógio de parede
export const Relogio: React.FC<{pos: V3; rotY?: number; r?: number}> = ({pos, rotY = 0, r = 0.22}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Cil rot={[Math.PI / 2, 0, 0]} r={r} h={0.05} cor="#2b2b30" seg={20} />
    <mesh position={[0, 0, 0.027]}>
      <circleGeometry args={[r * 0.88, 20]} />
      <meshStandardMaterial color="#fffbf0" />
    </mesh>
    <Caixa pos={[0, r * 0.25, 0.03]} tam={[0.015, r * 0.5, 0.005]} cor="#1d1b26" sombra={false} />
    <Caixa pos={[r * 0.3, 0, 0.032]} rot={[0, 0, Math.PI / 2]} tam={[0.015, r * 0.6, 0.005]} cor="#1d1b26" sombra={false} />
  </group>
);

// ======================= BAÍA DE GUANABARA =======================
// Pão de Açúcar + Urca (silhuetas), morros de Niterói
export const Morro: React.FC<{pos: V3; r: number; h: number; cor?: string; inclina?: number}> = ({pos, r, h, cor = '#5f8f5a', inclina = 0}) => (
  <group position={pos} rotation={[0, 0, inclina]}>
    <mesh position={[0, h / 2, 0]} scale={[1, h / (2 * r), 1]} castShadow receiveShadow>
      <sphereGeometry args={[r, 14, 10]} />
      <Mat cor={cor} />
    </mesh>
  </group>
);
export const PaoDeAcucar: React.FC<{pos: V3; esc?: number}> = ({pos, esc = 1}) => (
  <group position={pos} scale={esc}>
    {/* o "pão": rocha alta e arredondada, pedra cinza com mata na base */}
    <mesh position={[0, 200, 0]} scale={[1, 2.1, 0.9]} castShadow>
      <sphereGeometry args={[95, 16, 12]} />
      <Mat cor="#8a8f86" />
    </mesh>
    <mesh position={[0, 40, 0]} scale={[1.25, 0.6, 1.1]}>
      <sphereGeometry args={[110, 14, 10]} />
      <Mat cor="#4f8a4a" />
    </mesh>
    {/* morro da Urca, mais baixo */}
    <mesh position={[-230, 60, 30]} scale={[1.4, 0.8, 1]}>
      <sphereGeometry args={[110, 14, 10]} />
      <Mat cor="#5f8f5a" />
    </mesh>
  </group>
);

// água da baía com marolas
export const Agua: React.FC<{t: number; tam?: number; cor?: string}> = ({t, tam = 3000, cor = '#3f8fb0'}) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[tam, tam]} />
      <meshStandardMaterial color={cor} roughness={0.35} metalness={0.1} />
    </mesh>
    {Array.from({length: 60}).map((_, i) => {
      const r = rnd(i + 3);
      const x = (r() - 0.5) * 160;
      const z = (r() - 0.5) * 160;
      return (
        <mesh key={i} position={[x + Math.sin(t + i) * 0.4, 0.02, z]} rotation={[-Math.PI / 2, 0, r() * 3]}>
          <planeGeometry args={[1.6 + r() * 2, 0.12]} />
          <meshBasicMaterial color="#d6eef6" transparent opacity={0.55} />
        </mesh>
      );
    })}
  </group>
);

// barca de passageiros Rio-Niterói (anos 50): casco de 44 m, dois conveses, passadiço e chaminé
export const Barca: React.FC<{pos: V3; rotY?: number; t: number; som?: number}> = ({pos, rotY = 0, t, som = 1}) => {
  const balanco = Math.sin(t * 1.3) * 0.012;
  return (
    <group position={pos} rotation={[balanco, rotY, balanco * 0.5]}>
      {/* casco */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[44, 2.4, 11]} />
        <Mat cor="#f2efe6" />
      </mesh>
      <Caixa pos={[0, -0.1, 0]} tam={[44.2, 0.9, 11.1]} cor="#7a2a2a" />
      <Caixa pos={[0, 1.6, 0]} tam={[44.4, 0.25, 11.4]} cor="#2f5d6a" />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 22, 0.6, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[5.5, 5.5, 2.4, 16, 1, false, s > 0 ? 0 : Math.PI, Math.PI]} />
          <Mat cor="#f2efe6" />
        </mesh>
      ))}
      {/* convés de baixo (salão) */}
      <Caixa pos={[0, 3.2, 0]} tam={[34, 3, 9.6]} cor="#f4f0e4" />
      {Array.from({length: 14}).map((_, i) => (
        <group key={i}>
          <Caixa pos={[-15.6 + i * 2.4, 3.4, 4.82]} tam={[1.5, 1.1, 0.04]} cor="#41505e" sombra={false} />
          <Caixa pos={[-15.6 + i * 2.4, 3.4, -4.82]} tam={[1.5, 1.1, 0.04]} cor="#41505e" sombra={false} />
        </group>
      ))}
      {/* convés de cima, aberto, com guarda-corpo */}
      <Caixa pos={[0, 4.8, 0]} tam={[36, 0.2, 10.4]} cor="#c9b48a" />
      {[-5.1, 5.1].map((z) => (
        <group key={z}>
          <Caixa pos={[0, 5.85, z]} tam={[36, 0.06, 0.06]} cor="#2f5d6a" />
          {Array.from({length: 19}).map((_, i) => (<Cil key={i} pos={[-18 + i * 2, 5.3, z]} r={0.03} h={1} cor="#2f5d6a" seg={5} />))}
        </group>
      ))}
      {/* passadiço do comandante e chaminé */}
      <Caixa pos={[8, 6.2, 0]} tam={[4, 2.6, 5]} cor="#f2efe6" />
      <Caixa pos={[8, 6.5, 2.52]} tam={[3.4, 0.9, 0.04]} cor="#41505e" sombra={false} />
      <Cil pos={[2, 8, 0]} r={0.9} h={4} cor="#2f5d6a" seg={14} />
      <Cil pos={[2, 9.6, 0]} r={0.95} h={0.6} cor="#1d1b26" seg={14} />
      {/* mastro com os alto-falantes */}
      <Cil pos={[-8, 8, 0]} r={0.08} h={6.4} cor="#5a5a60" seg={6} />
      {som > 0 && (
        <>
          <Corneta pos={[-8, 9.8, 0.25]} rot={[0.25, 0, 0]} />
          <Corneta pos={[-8, 9.8, -0.25]} rot={[0.25, Math.PI, 0]} />
          <Corneta pos={[-7.75, 10.6, 0]} rot={[0.25, Math.PI / 2, 0]} />
        </>
      )}
      {/* passageiros no convés de cima */}
      {Array.from({length: 16}).map((_, i) => {
        const r = rnd(i + 11);
        return <Sentado key={i} pos={[-15 + (i % 8) * 3.2 + r(), 4.9, i < 8 ? 2.6 : -2.6]} rotY={i < 8 ? 0 : Math.PI} roupa={CORES_ROUPA[i % 9]} pele={CORES_PELE[i % 5]} />;
      })}
      {Array.from({length: 4}).map((_, i) => (<Caixa key={'bk' + i} pos={[-14 + i * 8, 5.15, 0]} tam={[5, 0.4, 0.5]} cor="#8b5a3c" />))}
      <Letreiro pos={[0, 2.6, 5.72]} larg={10} alt={1.1} linhas={['RIO · NITERÓI']} fundo="#f2efe6" cor="#2f5d6a" />
    </group>
  );
};

// alto-falante tipo corneta (cone de 50 cm)
export const Corneta: React.FC<{pos: V3; rot?: V3; esc?: number}> = ({pos, rot = [0, 0, 0], esc = 1}) => (
  <group position={pos} rotation={rot} scale={esc}>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.25]} castShadow>
      <cylinderGeometry args={[0.26, 0.05, 0.5, 14, 1, true]} />
      <meshStandardMaterial color="#9aa0aa" metalness={0.5} roughness={0.4} side={2} />
    </mesh>
    <Cil pos={[0, 0, -0.05]} rot={[Math.PI / 2, 0, 0]} r={0.09} h={0.18} cor="#3a3a40" />
  </group>
);

// notas musicais saindo do alto-falante
export const NotasMusicais: React.FC<{orig: V3; dir: V3; t: number; n?: number}> = ({orig, dir, t, n = 6}) => (
  <group>
    {Array.from({length: n}).map((_, i) => {
      const k = (t * 0.5 + i / n) % 1;
      return (
        <group key={i} position={[orig[0] + dir[0] * k * 3, orig[1] + dir[1] * k * 3 + Math.sin(k * 9 + i) * 0.15, orig[2] + dir[2] * k * 3]} scale={1 - k * 0.4}>
          <mesh>
            <sphereGeometry args={[0.09, 8, 6]} />
            <meshBasicMaterial color="#1d1b26" />
          </mesh>
          <Caixa pos={[0.08, 0.2, 0]} tam={[0.025, 0.4, 0.025]} cor="#1d1b26" sombra={false} />
          <Caixa pos={[0.14, 0.38, 0]} rot={[0, 0, -0.6]} tam={[0.14, 0.04, 0.025]} cor="#1d1b26" sombra={false} />
        </group>
      );
    })}
  </group>
);

// garrafa de refrigerante de vidro (anos 50, 290 ml: ~22 cm)
export const Garrafa: React.FC<{pos: V3; cor?: string; tampa?: string}> = ({pos, cor = '#5a3a20', tampa = '#c62f2f'}) => (
  <group position={pos}>
    <Cil pos={[0, 0.07, 0]} r={0.03} h={0.14} cor={cor} seg={10} />
    <Cil pos={[0, 0.17, 0]} r={0.012} r2={0.03} h={0.07} cor={cor} seg={10} />
    <Cil pos={[0, 0.21, 0]} r={0.013} h={0.015} cor={tampa} seg={10} />
  </group>
);

// cartela de bingo (15 x 15 cm)
const texBingo = () =>
  tex('bingo', 256, 280, (g) => {
    g.fillStyle = '#fffaf0';
    g.fillRect(0, 0, 256, 280);
    g.fillStyle = '#c62f2f';
    g.fillRect(0, 0, 256, 52);
    linha(g, 'B I N G O', 128, 28, 230, 40, '#ffffff');
    const r = rnd(5);
    for (let i = 0; i < 5; i++)
      for (let j = 0; j < 5; j++) {
        g.strokeStyle = '#1d1b26';
        g.lineWidth = 2;
        g.strokeRect(14 + i * 46, 62 + j * 42, 46, 42);
        linha(g, String(Math.floor(i * 15 + 1 + r() * 14)), 37 + i * 46, 84 + j * 42, 40, 24, '#1d1b26');
      }
  });
export const Cartela: React.FC<{pos: V3; rot?: V3; esc?: number}> = ({pos, rot = [-Math.PI / 2, 0, 0], esc = 1}) => (
  <mesh position={pos} rotation={rot} scale={esc}>
    <planeGeometry args={[0.15, 0.165]} />
    <meshStandardMaterial map={texBingo()} side={2} roughness={0.9} />
  </mesh>
);

// ======================= BAÚ DA FELICIDADE =======================
// baú de madeira (80 x 50 x 50 cm) cheio de brinquedos; a tampa abre
export const Bau: React.FC<{pos: V3; rotY?: number; abre?: number; t?: number; brinquedos?: boolean}> = ({pos, rotY = 0, abre = 0, t = 0, brinquedos = true}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.25, 0]} tam={[0.8, 0.5, 0.5]} cor="#a0522d" />
    {[-0.3, 0.3].map((x) => (<Caixa key={x} pos={[x, 0.25, 0]} tam={[0.06, 0.52, 0.52]} cor="#d9b23f" />))}
    <Caixa pos={[0, 0.48, 0.26]} tam={[0.12, 0.1, 0.02]} cor="#d9b23f" />
    <group position={[0, 0.5, -0.25]} rotation={[-abre * 1.9, 0, 0]}>
      <mesh position={[0, 0.06, 0.25]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.8, 12, 1, false, 0, Math.PI]} />
        <Mat cor="#8b4513" />
      </mesh>
    </group>
    {brinquedos && abre > 0.2 && (
      <group position={[0, 0.5 + Math.sin(t * 3) * 0.01, 0]}>
        <Boneca pos={[-0.2, 0.0, 0]} />
        <mesh position={[0.05, 0.1, 0.05]} castShadow>
          <sphereGeometry args={[0.11, 12, 10]} />
          <Mat cor="#e9473f" />
        </mesh>
        <Carrinho pos={[0.25, 0.02, -0.05]} rotY={0.5} />
        <Urso pos={[0.05, 0.02, -0.12]} />
      </group>
    )}
  </group>
);
export const Boneca: React.FC<{pos: V3; rotY?: number; esc?: number}> = ({pos, rotY = 0, esc = 1}) => (
  <group position={pos} rotation={[0, rotY, 0]} scale={esc}>
    <mesh position={[0, 0.1, 0]} castShadow>
      <coneGeometry args={[0.08, 0.2, 10]} />
      <Mat cor="#e26d9a" />
    </mesh>
    <mesh position={[0, 0.24, 0]} castShadow>
      <sphereGeometry args={[0.06, 10, 8]} />
      <Mat cor="#ffd2ad" />
    </mesh>
    <mesh position={[0, 0.27, -0.01]}>
      <sphereGeometry args={[0.064, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <Mat cor="#d9a85a" />
    </mesh>
  </group>
);
export const Carrinho: React.FC<{pos: V3; rotY?: number; cor?: string}> = ({pos, rotY = 0, cor = '#2f6fd6'}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.05, 0]} tam={[0.22, 0.06, 0.1]} cor={cor} />
    <Caixa pos={[-0.02, 0.1, 0]} tam={[0.11, 0.05, 0.09]} cor={cor} />
    {[[-0.07, 0.05], [0.07, 0.05], [-0.07, -0.05], [0.07, -0.05]].map(([x, z], i) => (
      <Cil key={i} pos={[x, 0.025, z]} rot={[Math.PI / 2, 0, 0]} r={0.025} h={0.02} cor="#1d1b26" />
    ))}
  </group>
);
export const Urso: React.FC<{pos: V3; esc?: number}> = ({pos, esc = 1}) => (
  <group position={pos} scale={esc}>
    <mesh position={[0, 0.08, 0]}>
      <sphereGeometry args={[0.08, 10, 8]} />
      <Mat cor="#a0703f" />
    </mesh>
    <mesh position={[0, 0.19, 0]}>
      <sphereGeometry args={[0.06, 10, 8]} />
      <Mat cor="#a0703f" />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.045, 0.24, 0]}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <Mat cor="#7a5030" />
      </mesh>
    ))}
  </group>
);
// árvore de Natal (1,8 m)
export const ArvoreNatal: React.FC<{pos: V3; t?: number}> = ({pos, t = 0}) => (
  <group position={pos}>
    <Cil pos={[0, 0.15, 0]} r={0.08} h={0.3} cor="#6b3e26" />
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0, 0.55 + i * 0.42, 0]} castShadow>
        <coneGeometry args={[0.65 - i * 0.17, 0.7, 10]} />
        <Mat cor="#2f7a3f" />
      </mesh>
    ))}
    <mesh position={[0, 1.78, 0]}>
      <octahedronGeometry args={[0.1]} />
      <meshStandardMaterial color="#ffd23f" emissive="#ffb000" emissiveIntensity={0.6} />
    </mesh>
    {Array.from({length: 14}).map((_, i) => {
      const a = i * 2.3;
      const y = 0.45 + (i % 7) * 0.17;
      const r = 0.56 - (y - 0.4) * 0.38;
      return (
        <mesh key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color={['#e9473f', '#ffd23f', '#5aa0c8'][i % 3]} emissive={['#e9473f', '#ffd23f', '#5aa0c8'][i % 3]} emissiveIntensity={0.3 + 0.3 * Math.max(0, Math.sin(t * 4 + i))} />
        </mesh>
      );
    })}
  </group>
);

// carnê de 12 parcelas (folha de 21 x 30 cm, cupons em 3 x 4); "pagos" = quantos já têm o carimbo PAGO
const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const texCupom = (i: number) =>
  tex('cupom:' + i, 256, 180, (g) => {
    g.fillStyle = '#fff6dc';
    g.fillRect(0, 0, 256, 180);
    g.fillStyle = '#e8a33a';
    g.fillRect(0, 0, 256, 40);
    linha(g, 'BAÚ · CARNÊ', 128, 22, 230, 26, '#ffffff');
    linha(g, `PARCELA ${i + 1}/12`, 128, 78, 230, 30, '#1d1b26');
    linha(g, MESES[i], 128, 132, 230, 56, '#a0522d');
    g.setLineDash([8, 6]);
    g.strokeStyle = '#a08a60';
    g.lineWidth = 3;
    g.strokeRect(3, 3, 250, 174);
  });
const texPago = () =>
  tex('pago', 256, 110, (g) => {
    g.clearRect(0, 0, 256, 110);
    g.strokeStyle = '#c62f2f';
    g.lineWidth = 10;
    g.strokeRect(10, 10, 236, 90);
    linha(g, 'PAGO', 128, 58, 220, 70, '#c62f2f');
  });
export const Carne: React.FC<{pos: V3; rot?: V3; pagos?: number; esc?: number}> = ({pos, rot = [-Math.PI / 2, 0, 0], pagos = 0, esc = 1}) => (
  <group position={pos} rotation={rot} scale={esc}>
    <mesh position={[0, 0, -0.002]}>
      <planeGeometry args={[0.23, 0.33]} />
      <meshStandardMaterial color="#e8a33a" roughness={0.9} />
    </mesh>
    {Array.from({length: 12}).map((_, i) => {
      const x = -0.07 + (i % 3) * 0.07;
      const y = 0.12 - Math.floor(i / 3) * 0.08;
      const k = clamp01(pagos - i);
      return (
        <group key={i} position={[x, y, 0]}>
          <mesh>
            <planeGeometry args={[0.066, 0.046]} />
            <meshStandardMaterial map={texCupom(i)} roughness={0.9} />
          </mesh>
          {k > 0 && (
            <mesh position={[0, 0, 0.001 + 0.004 * (1 - k)]} rotation={[0, 0, -0.25]} scale={1.6 - 0.6 * suave(k)}>
              <planeGeometry args={[0.06, 0.026]} />
              <meshBasicMaterial map={texPago()} transparent opacity={suave(k)} />
            </mesh>
          )}
        </group>
      );
    })}
  </group>
);

// caixote de madeira (a "mesa" do porão)
export const Caixote: React.FC<{pos: V3; rotY?: number; tam?: V3}> = ({pos, rotY = 0, tam = [0.8, 0.6, 0.5]}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {[0, 1, 2].map((i) => (<Caixa key={i} pos={[0, 0.1 + i * (tam[1] / 3), 0]} tam={[tam[0], tam[1] / 3 - 0.02, tam[2]]} cor={i % 2 ? '#b98a56' : '#a87a48'} />))}
    <Caixa pos={[0, tam[1] / 2, 0]} tam={[tam[0] * 0.98, tam[1], tam[2] * 0.9]} cor="#8b6a40" />
  </group>
);

export const Lampada: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Cil pos={[0, 0.5, 0]} r={0.006} h={1} cor="#1d1b26" seg={4} />
    <mesh>
      <sphereGeometry args={[0.07, 10, 8]} />
      <meshStandardMaterial color="#fff2c0" emissive="#ffd890" emissiveIntensity={1.2} />
    </mesh>
    <pointLight intensity={2.2} distance={7} color="#ffd8a0" />
  </group>
);

// ======================= TV, ANOS 60 =======================
// câmera de estúdio de válvula: caixa grande, torre de 4 lentes, pedestal com rodas, cabo no chão
export const CameraEstudio: React.FC<{pos: V3; rotY?: number; t?: number; operador?: boolean; luz?: boolean}> = ({pos, rotY = 0, t = 0, operador = true, luz = true}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {[0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2;
      return (
        <group key={i}>
          <Barra a={[0, 0.25, 0]} b={[Math.cos(a) * 0.55, 0.1, Math.sin(a) * 0.55]} r={0.03} cor="#3a3a40" />
          <Cil pos={[Math.cos(a) * 0.55, 0.06, Math.sin(a) * 0.55]} rot={[Math.PI / 2, 0, 0]} r={0.06} h={0.04} cor="#1d1b26" />
        </group>
      );
    })}
    <Cil pos={[0, 0.7, 0]} r={0.07} h={1} cor="#5a5a60" seg={8} />
    <group position={[0, 1.42, 0]} rotation={[Math.sin(t * 0.7) * 0.03, Math.sin(t * 0.5) * 0.08, 0]}>
      <Caixa pos={[0, 0, -0.1]} tam={[0.5, 0.48, 0.75]} cor="#4a4f5a" />
      <Caixa pos={[0, 0.27, -0.1]} tam={[0.3, 0.06, 0.4]} cor="#3a3a40" />
      <Cil pos={[0, 0, 0.3]} rot={[Math.PI / 2, 0, 0]} r={0.2} h={0.06} cor="#2b2b30" seg={14} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        return <Cil key={i} pos={[Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0.4 - (i === 0 ? 0 : 0.06)]} rot={[Math.PI / 2, 0, 0]} r={0.045} h={i === 0 ? 0.22 : 0.12} cor="#1d1b26" seg={10} />;
      })}
      {luz && (
        <mesh position={[0.2, 0.18, 0.28]}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshStandardMaterial color="#ff3030" emissive="#ff2020" emissiveIntensity={1.5} />
        </mesh>
      )}
      {/* braços de manobra */}
      {[-1, 1].map((s) => (<Barra key={s} a={[s * 0.2, -0.15, -0.45]} b={[s * 0.35, -0.3, -0.85]} r={0.018} cor="#9aa0aa" />))}
    </group>
    {operador && <Boneco pos={[0, 0, -1.05]} t={t} v={{camisa: '#5a6270', calca: '#2b2b3a', colete: null, capacete: null, cabelo: '#1d1b26', bone: '#2b2b3a'}} esc={0.9} />}
  </group>
);

// refletor de estúdio com luz amarelada (spot)
export const Refletor: React.FC<{pos: V3; alvo: V3; cor?: string; intens?: number}> = ({pos, alvo, cor = '#fff0c8', intens = 30}) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(...alvo);
  tgt.updateMatrixWorld();
  return (
    <group>
      <primitive object={tgt} />
      <mesh position={pos}>
        <cylinderGeometry args={[0.25, 0.18, 0.4, 10]} />
        <Mat cor="#2b2b30" />
      </mesh>
      <spotLight position={pos} target={tgt} color={cor} intensity={intens} angle={0.5} penumbra={0.6} distance={30} decay={1.2} />
    </group>
  );
};

// plateia em arquibancada (fileiras sobem para trás); agito = braços para cima
export const Plateia: React.FC<{pos: V3; rotY?: number; filas?: number; porFila?: number; t: number; agito?: number; passo?: number}> = ({pos, rotY = 0, filas = 5, porFila = 14, t, agito = 0, passo = 0.75}) => {
  const r = rnd(42);
  const gente = Array.from({length: filas * porFila}).map((_, i) => ({f: Math.floor(i / porFila), c: i % porFila, roupa: CORES_ROUPA[Math.floor(r() * 9)], pele: CORES_PELE[Math.floor(r() * 5)], cab: ['#3b2a20', '#1d1b26', '#8a6a43', '#d9a85a', '#c8c8c8'][Math.floor(r() * 5)], fase: r() * 6}));
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {Array.from({length: filas}).map((_, f) => (
        <Caixa key={f} pos={[0, (f * 0.45 + 0.4) / 2, -f * 0.9]} tam={[porFila * passo + 1, f * 0.45 + 0.4, 0.9]} cor={f % 2 ? '#7a2a3a' : '#8a3444'} />
      ))}
      {gente.map((g, i) => {
        const pula = agito * Math.abs(Math.sin(t * 7 + g.fase)) * 0.12;
        return <Sentado key={i} pos={[(g.c - (porFila - 1) / 2) * passo, g.f * 0.45 + 0.4 + pula, -g.f * 0.9]} roupa={g.roupa} pele={g.pele} cabelo={g.cab} bracos={agito * (0.5 + 0.5 * Math.sin(t * 7 + g.fase))} esc={0.95} />;
      })}
    </group>
  );
};

// carro de prêmio (sedã compacto dos anos 60, 4 m) com laço
export const CarroPremio: React.FC<{pos: V3; rotY?: number; cor?: string; laco?: boolean}> = ({pos, rotY = 0, cor = '#e9473f', laco = true}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.55, 0]} scale={[2, 0.45, 0.85]} castShadow>
      <sphereGeometry args={[1, 16, 10]} />
      <Mat cor={cor} rugoso={0.4} />
    </mesh>
    <mesh position={[0.1, 0.95, 0]} scale={[1.05, 0.5, 0.75]} castShadow>
      <sphereGeometry args={[1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#9fc6dd" roughness={0.2} metalness={0.3} />
    </mesh>
    {[[-1.25, 0.72], [1.25, 0.72], [-1.25, -0.72], [1.25, -0.72]].map(([x, z], i) => (
      <Cil key={i} pos={[x, 0.32, z]} rot={[Math.PI / 2, 0, 0]} r={0.32} h={0.2} cor="#1d1b26" seg={14} />
    ))}
    {[-0.45, 0.45].map((z) => (
      <mesh key={z} position={[1.98, 0.6, z]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color="#fffbe0" emissive="#fff0a0" emissiveIntensity={0.4} />
      </mesh>
    ))}
    {laco && (
      <group position={[0.1, 1.48, 0]}>
        <Caixa pos={[0, -0.02, 0]} tam={[0.1, 0.06, 1.6]} cor="#ffd23f" />
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, 0.12, s * 0.16]} rotation={[s * 0.6, 0, 0]}>
            <torusGeometry args={[0.15, 0.05, 6, 12]} />
            <Mat cor="#ffd23f" />
          </mesh>
        ))}
      </group>
    )}
  </group>
);

// casinha de prêmio (maquete de 2 m no palco)
export const CasaPremio: React.FC<{pos: V3; rotY?: number; esc?: number}> = ({pos, rotY = 0, esc = 1}) => (
  <group position={pos} rotation={[0, rotY, 0]} scale={esc}>
    <Caixa pos={[0, 0.5, 0]} tam={[1.4, 1, 1.1]} cor="#f2e6c8" />
    <mesh position={[0, 1.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
      <coneGeometry args={[1.1, 0.7, 4]} />
      <Mat cor="#c0563a" />
    </mesh>
    <Caixa pos={[0, 0.35, 0.56]} tam={[0.3, 0.6, 0.02]} cor="#6b3e26" />
    {[-0.42, 0.42].map((x) => (<Caixa key={x} pos={[x, 0.6, 0.56]} tam={[0.28, 0.26, 0.02]} cor="#5aa0c8" />))}
  </group>
);

// TV de tubo anos 60 (móvel de pé) com imagem na tela
export const TVTubo: React.FC<{pos: V3; rotY?: number; tela: THREE.Texture}> = ({pos, rotY = 0, tela}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {[[-0.3, 0.2], [0.3, 0.2], [-0.3, -0.15], [0.3, -0.15]].map(([x, z], i) => (
      <Barra key={i} a={[x * 0.9, 0, z * 0.9]} b={[x, 0.4, z]} r={0.02} cor="#3b2a20" />
    ))}
    <Caixa pos={[0, 0.75, 0]} tam={[0.82, 0.7, 0.55]} cor="#8b5a3c" />
    <Caixa pos={[0, 0.78, 0.276]} tam={[0.6, 0.48, 0.01]} cor="#1d1b26" sombra={false} />
    <mesh position={[0, 0.78, 0.283]}>
      <planeGeometry args={[0.56, 0.44]} />
      <meshBasicMaterial map={tela} toneMapped={false} />
    </mesh>
    {[-0.08, 0.08].map((x) => (<Caixa key={x} pos={[0.33, 0.6 + x, 0.28]} tam={[0.06, 0.06, 0.02]} cor="#d9cdb0" />))}
    <Barra a={[0, 1.1, 0]} b={[-0.3, 1.5, 0]} r={0.008} cor="#9aa0aa" />
    <Barra a={[0, 1.1, 0]} b={[0.3, 1.5, 0]} r={0.008} cor="#9aa0aa" />
  </group>
);

export const Sofa: React.FC<{pos: V3; rotY?: number; cor?: string}> = ({pos, rotY = 0, cor = '#5f8f8a'}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.25, 0]} tam={[2, 0.4, 0.85]} cor={cor} />
    <Caixa pos={[0, 0.65, -0.35]} tam={[2, 0.6, 0.18]} cor={cor} />
    {[-1, 1].map((s) => (<Caixa key={s} pos={[s * 0.95, 0.45, 0]} tam={[0.16, 0.45, 0.85]} cor={cor} />))}
  </group>
);

// ======================= EMISSORA, 1981 =======================
// torre de transmissão treliçada (vermelho e branco), h metros
export const Torre: React.FC<{pos: V3; h?: number}> = ({pos, h = 90}) => {
  const n = Math.round(h / 6);
  const larg = (y: number) => lerp(5, 1.2, y / h);
  return (
    <group position={pos}>
      {Array.from({length: n}).map((_, i) => {
        const y0 = (i / n) * h;
        const y1 = ((i + 1) / n) * h;
        const a0 = larg(y0) / 2;
        const a1 = larg(y1) / 2;
        const cor = i % 2 ? '#f2efe6' : '#d6282b';
        const cantos: [number, number][] = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
        return (
          <group key={i}>
            {cantos.map(([sx, sz], k) => (<Barra key={k} a={[sx * a0, y0, sz * a0]} b={[sx * a1, y1, sz * a1]} r={0.12} cor={cor} quadrada />))}
            {cantos.map(([sx, sz], k) => {
              const [tx, tz] = cantos[(k + 1) % 4];
              return <Barra key={'d' + k} a={[sx * a0, y0, sz * a0]} b={[tx * a1, y1, tz * a1]} r={0.05} cor={cor} quadrada />;
            })}
          </group>
        );
      })}
      <Cil pos={[0, h + 4, 0]} r={0.25} h={8} cor="#d6282b" seg={6} />
      <mesh position={[0, h + 8.3, 0]}>
        <sphereGeometry args={[0.45, 8, 6]} />
        <meshStandardMaterial color="#ff3030" emissive="#ff2020" emissiveIntensity={1.2} />
      </mesh>
      {/* antenas painel */}
      {[0, 1, 2, 3].map((k) => (
        <Caixa key={k} pos={[Math.cos((k * Math.PI) / 2) * 1, h - 3, Math.sin((k * Math.PI) / 2) * 1]} rot={[0, (k * Math.PI) / 2, 0]} tam={[0.3, 4, 1.2]} cor="#e9e6df" />
      ))}
    </group>
  );
};

// prédio de emissora de TV com letreiro genérico
export const PredioTV: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 5, 0]} tam={[30, 10, 16]} cor="#e9e6df" />
    <Caixa pos={[0, 5, 8.02]} tam={[28, 2, 0.06]} cor="#41505e" sombra={false} />
    <Caixa pos={[0, 8.2, 8.02]} tam={[28, 1.6, 0.06]} cor="#41505e" sombra={false} />
    <Caixa pos={[-9, 12, 0]} tam={[10, 4, 12]} cor="#d9d6cc" />
    <Letreiro pos={[0, 11, 8.1]} larg={14} alt={2.4} linhas={['ESTÚDIOS DE TV']} fundo="#1d1b26" cor="#ffd23f" />
    {/* parabólica */}
    <group position={[8, 10.2, 2]} rotation={[-0.7, 0.4, 0]}>
      <mesh>
        <sphereGeometry args={[2.4, 16, 8, 0, Math.PI * 2, 0, 0.9]} />
        <meshStandardMaterial color="#f2efe6" side={2} roughness={0.6} />
      </mesh>
      <Barra a={[0, 0, 0]} b={[0, 2, 0]} r={0.05} cor="#9aa0aa" />
    </group>
    <Cil pos={[8, 10.5, 2]} r={0.2} h={1} cor="#9aa0aa" />
  </group>
);

// mapa do Brasil (contorno simplificado em lon/lat) em relevo; pinos nas cidades
const BR: [number, number][] = [
  [-60.0, 5.2], [-56.5, 1.9], [-51.6, 4.2], [-50.0, 1.8], [-48.5, -1.0], [-44.3, -2.5], [-41.0, -2.9], [-38.5, -3.7], [-35.2, -5.4], [-34.8, -7.5], [-35.3, -9.4], [-37.0, -11.0],
  [-38.5, -13.0], [-39.0, -17.5], [-40.5, -20.5], [-42.0, -23.0], [-44.7, -23.4], [-48.0, -25.5], [-48.6, -28.5], [-50.2, -30.5], [-52.5, -33.7], [-53.5, -33.0], [-55.6, -30.9],
  [-57.6, -30.2], [-53.8, -27.2], [-54.6, -25.6], [-55.0, -24.0], [-58.0, -20.0], [-57.6, -18.0], [-60.1, -16.3], [-60.5, -13.8], [-65.4, -11.7], [-69.6, -11.0], [-73.0, -9.0],
  [-73.5, -7.4], [-70.0, -4.2], [-69.5, -1.0], [-70.0, 1.5], [-67.0, 2.0], [-64.0, 4.0],
];
// lon/lat -> x/z (1 grau = esc metros; centro do Brasil na origem)
export const mapaXZ = (lon: number, lat: number, esc: number): [number, number] => [(lon + 52) * esc, -(lat + 14) * esc];
export const MapaBrasil: React.FC<{pos: V3; esc?: number; cor?: string}> = ({pos, esc = 0.1, cor = '#4fa86a'}) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    BR.forEach(([lo, la], i) => {
      const [x, z] = mapaXZ(lo, la, esc);
      if (i === 0) s.moveTo(x, -z);
      else s.lineTo(x, -z);
    });
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {depth: esc * 0.6, bevelEnabled: false});
    g.rotateX(-Math.PI / 2);
    return g;
  }, [esc]);
  return (
    <mesh position={pos} geometry={geo} castShadow receiveShadow>
      <Mat cor={cor} />
    </mesh>
  );
};
export const Pino: React.FC<{pos: V3; vis: number; cor?: string; h?: number}> = ({pos, vis, cor = '#ffd23f', h = 0.5}) =>
  vis > 0.01 ? (
    <group position={pos} scale={[1, suave(vis), 1]}>
      <Cil pos={[0, h / 2, 0]} r={h * 0.04} h={h} cor="#1d1b26" seg={6} />
      <mesh position={[0, h, 0]}>
        <sphereGeometry args={[h * 0.18, 12, 10]} />
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={0.5} />
      </mesh>
    </group>
  ) : null;

// ======================= TELE SENA (genérica) =======================
const texCartelaCap = () =>
  tex('cartcap', 256, 400, (g) => {
    g.fillStyle = '#fff8e6';
    g.fillRect(0, 0, 256, 400);
    g.fillStyle = '#2f6fd6';
    g.fillRect(0, 0, 256, 80);
    linha(g, 'CAPITALIZAÇÃO', 128, 40, 230, 34, '#ffffff');
    const r = rnd(9);
    for (let i = 0; i < 5; i++)
      for (let j = 0; j < 5; j++) {
        g.fillStyle = (i + j) % 2 ? '#e9eef8' : '#ffffff';
        g.fillRect(18 + i * 44, 98 + j * 44, 44, 44);
        linha(g, String(Math.floor(1 + r() * 60)).padStart(2, '0'), 40 + i * 44, 121 + j * 44, 40, 24, '#1d1b26');
      }
    g.fillStyle = '#ffd23f';
    g.fillRect(0, 330, 256, 70);
    linha(g, '50% DE VOLTA', 128, 366, 230, 34, '#1d1b26');
  });
export const CartelaCap: React.FC<{pos: V3; rot?: V3; esc?: number}> = ({pos, rot = [0, 0, 0], esc = 1}) => (
  <mesh position={pos} rotation={rot} scale={esc}>
    <planeGeometry args={[0.1, 0.156]} />
    <meshStandardMaterial map={texCartelaCap()} side={2} roughness={0.8} />
  </mesh>
);

// pilha de moedas (n moedas de 2,5 cm)
export const PilhaMoedas: React.FC<{pos: V3; n: number; r?: number}> = ({pos, n, r = 0.0125}) => (
  <group position={pos}>
    {n > 0 && (
      <mesh position={[0, (n * r * 0.18) / 2, 0]} castShadow>
        <cylinderGeometry args={[r, r, n * r * 0.18, 16]} />
        <meshStandardMaterial color="#d9b23f" metalness={0.6} roughness={0.35} />
      </mesh>
    )}
  </group>
);

// ======================= BANCO, 2010 =======================
// porta de cofre redonda (2,2 m), abre em "abre" (0 a 1)
export const PortaCofre: React.FC<{pos: V3; rotY?: number; abre?: number}> = ({pos, rotY = 0, abre = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 1.4, -0.2]} tam={[3.2, 2.8, 0.4]} cor="#7a7f88" />
    <group position={[1.15, 1.25, 0.05]} rotation={[0, -abre * 1.6, 0]}>
      <group position={[-1.15, 0, 0]}>
        <Cil rot={[Math.PI / 2, 0, 0]} r={1.1} h={0.35} cor="#b9bec6" seg={28} />
        <Cil pos={[0, 0, 0.2]} rot={[Math.PI / 2, 0, 0]} r={0.35} h={0.08} cor="#8a8f98" seg={16} />
        {[0, 1, 2].map((i) => (<Caixa key={i} pos={[0, 0, 0.26]} rot={[0, 0, (i * Math.PI) / 3]} tam={[0.9, 0.06, 0.06]} cor="#d9b23f" />))}
      </group>
    </group>
  </group>
);

// balão do "balanço inflado" (cresce com k)
export const Balao: React.FC<{pos: V3; k: number; texto?: string; estoura?: boolean}> = ({pos, k, texto = 'LUCRO', estoura}) =>
  estoura ? null : (
    <group position={pos}>
      <mesh position={[0, 0.4 + k * 1.4, 0]} scale={[0.3 + k * 1.4, 0.36 + k * 1.6, 0.3 + k * 1.4]} castShadow>
        <sphereGeometry args={[1, 18, 14]} />
        <meshStandardMaterial color="#4ade80" roughness={0.35} />
      </mesh>
      <Letreiro pos={[0, 0.4 + k * 1.4, 0.32 + k * 1.42]} larg={0.5 + k * 1.6} alt={0.2 + k * 0.6} linhas={[texto]} fundo="#4ade80" cor="#14532d" />
      <Barra a={[0, 0, 0]} b={[0, 0.06 + k * 0.4, 0]} r={0.01} cor="#1d1b26" />
    </group>
  );

// ======================= GARANTIA: as empresas em miniatura =======================
// miniatura de empresa (maquete de 40 a 90 cm); tipo escolhe o formato
export const Miniatura: React.FC<{pos: V3; tipo: number; rotY?: number}> = ({pos, tipo, rotY = 0}) => {
  const cores = ['#e9e6df', '#e8a33a', '#5aa0c8', '#e26d9a', '#4fa86a', '#c0563a'];
  const c = cores[tipo % cores.length];
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {tipo % 4 === 0 && (
        <>
          <Caixa pos={[0, 0.15, 0]} tam={[0.5, 0.3, 0.35]} cor="#e9e6df" />
          <Barra a={[0.15, 0.3, 0]} b={[0.15, 0.85, 0]} r={0.02} cor="#d6282b" quadrada />
        </>
      )}
      {tipo % 4 === 1 && (
        <>
          <Caixa pos={[0, 0.12, 0]} tam={[0.55, 0.24, 0.3]} cor={c} />
          <Caixa pos={[0, 0.2, 0.152]} tam={[0.45, 0.06, 0.01]} cor="#1d1b26" sombra={false} />
        </>
      )}
      {tipo % 4 === 2 && <Caixa pos={[0, 0.3, 0]} tam={[0.3, 0.6, 0.3]} cor={c} />}
      {tipo % 4 === 3 && (
        <>
          <Caixa pos={[0, 0.1, 0]} tam={[0.4, 0.2, 0.4]} cor={c} />
          <mesh position={[0, 0.3, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.32, 0.2, 4]} />
            <Mat cor="#8b4513" />
          </mesh>
        </>
      )}
    </group>
  );
};

export const Cadeado: React.FC<{pos: V3; esc?: number; abre?: number; rotY?: number}> = ({pos, esc = 1, abre = 0, rotY = 0}) => (
  <group position={pos} scale={esc} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0, 0]} tam={[0.5, 0.42, 0.18]} cor="#d9b23f" />
    <group position={[0.15, 0.2 + abre * 0.18, 0]} rotation={[0, abre * 1.2, 0]}>
      <mesh position={[-0.15, 0.06, 0]}>
        <torusGeometry args={[0.15, 0.04, 6, 14, Math.PI]} />
        <meshStandardMaterial color="#9aa0aa" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
    <Caixa pos={[0, -0.03, 0.095]} tam={[0.06, 0.12, 0.01]} cor="#1d1b26" sombra={false} />
  </group>
);

// cofre forte de pé (1,4 m) com porta aberta e barras de ouro
export const CofreOuro: React.FC<{pos: V3; rotY?: number; brilho?: number}> = ({pos, rotY = 0, brilho = 1}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, 0.7, 0]} tam={[1.2, 1.4, 1]} cor="#4a4f5a" />
    <Caixa pos={[0, 0.7, 0.45]} tam={[1.0, 1.2, 0.12]} cor="#2b2b30" />
    {Array.from({length: 9}).map((_, i) => (
      <mesh key={i} position={[-0.3 + (i % 3) * 0.3, 0.25 + Math.floor(i / 3) * 0.33, 0.35]} castShadow>
        <boxGeometry args={[0.26, 0.11, 0.3]} />
        <meshStandardMaterial color="#e8b923" metalness={0.75} roughness={0.25} emissive="#7a5a00" emissiveIntensity={0.3 * brilho} />
      </mesh>
    ))}
    <group position={[-0.55, 0.7, 0.5]} rotation={[0, -1.9, 0]}>
      <Caixa pos={[0.5, 0, 0]} tam={[1.0, 1.3, 0.14]} cor="#5a5f6a" />
      <Cil pos={[0.5, 0, 0.1]} rot={[Math.PI / 2, 0, 0]} r={0.16} h={0.06} cor="#9aa0aa" seg={12} />
    </group>
  </group>
);

// pilha de cédulas grande (o dinheiro que chega antes, no caixa)
export const PilhaNotas: React.FC<{pos: V3; n: number; cor?: string}> = ({pos, n, cor = '#8fbf8a'}) => (
  <group position={pos}>
    {Array.from({length: n}).map((_, i) => (
      <Maco key={i} pos={[((i % 3) - 1) * 0.17, Math.floor(i / 6) * 0.016, (Math.floor(i / 3) % 2) * 0.08 - 0.04]} rotY={((i * 37) % 10) * 0.01} cor={cor} />
    ))}
  </group>
);
