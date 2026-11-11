// Peças da COZINHA em escala real (1 unidade = 1 metro). Bancada 0,92 m, forma de 22 cm, liquidificador ~42 cm.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {Barra, Caixa, Cil, Instancias, Mat, clamp01, lerp, suave} from '../v4/kit';

export const TOPO = 0.94; // altura do tampo da ilha
export const COR = {
  massaCrua: '#f5a23a', massaAssada: '#c9772c', miolo: '#f0b049', calda: '#4a2414', caldaBrilho: '#5c2e1a',
  cenoura: '#f07a1a', folha: '#3f9b5a', ovo: '#f6ead6', gema: '#ffb81c', oleo: '#f4c430', farinha: '#fbf7ee',
  acucar: '#ffffff', inox: '#c3c8cf', ilha: '#2f8f83', tampo: '#f4efe6', parede: '#fbe3c2', piso: '#d9b48a',
};

// ---------- texturas com texto (rótulos, telas) ----------
const cache = new Map<string, THREE.Texture>();
export function texCanvas(id: string, w: number, h: number, pinta: (g: CanvasRenderingContext2D) => void, repetir = false) {
  const c0 = cache.get(id);
  if (c0) return c0;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  pinta(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(id, t);
  return t;
}
const F = "'Baloo 2', sans-serif";
function texRotulo(texto: string, fundo: string, cor: string, linha2?: string) {
  return texCanvas(`rot:${texto}:${fundo}:${linha2}`, 256, 256, (g) => {
    g.fillStyle = fundo;
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = cor;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const linhas = texto.split('\n');
    let fs = 64;
    g.font = `800 ${fs}px ${F}`;
    while (linhas.some((l) => g.measureText(l).width > 230) && fs > 24) {
      fs -= 4;
      g.font = `800 ${fs}px ${F}`;
    }
    linhas.forEach((l, i) => g.fillText(l, 128, 110 + (i - (linhas.length - 1) / 2) * fs * 0.95));
    if (linha2) {
      g.font = `800 36px ${F}`;
      g.fillText(linha2, 128, 212);
    }
  });
}

// plaquinha de rótulo colada na frente de uma embalagem
const Etiqueta: React.FC<{pos: V3; w: number; h: number; texto: string; fundo: string; cor: string; linha2?: string; rot?: number}> = ({pos, w, h, texto, fundo, cor, linha2, rot = 0}) => (
  <mesh position={pos} rotation={[0, rot, 0]}>
    <planeGeometry args={[w, h]} />
    <meshStandardMaterial map={texRotulo(texto, fundo, cor, linha2)} roughness={0.8} />
  </mesh>
);

export const Vidro: React.FC<{cor?: string; op?: number}> = ({cor = '#dff3ff', op = 0.28}) => (
  <meshStandardMaterial color={cor} transparent opacity={op} roughness={0.1} metalness={0.1} depthWrite={false} side={THREE.DoubleSide} />
);

// ---------- partículas que caem (farinha, açúcar, granulado) ----------
export const Chuvisco: React.FC<{t: number; de: V3; y1: number; raio?: number; n?: number; cor: string; tam?: number; vel?: number; on?: number; seed?: number}> = ({t, de, y1, raio = 0.03, n = 60, cor, tam = 0.006, vel = 1.2, on = 1, seed = 3}) => {
  const geo = useMemo(() => new THREE.BoxGeometry(tam, tam * 1.6, tam), [tam]);
  const base = useMemo(() => {
    let s = seed;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    return Array.from({length: n}).map(() => [r() * 2 - 1, r(), r() * 2 - 1, 0.7 + r() * 0.6, r() * 6]);
  }, [n, seed]);
  const h = de[1] - y1;
  const mats = base.map(([x, y0, z, v, a]) => {
    const y = de[1] - (((y0 * h + t * vel * v) % h) + h) % h;
    return new THREE.Matrix4().compose(new THREE.Vector3(de[0] + x * raio, y, de[2] + z * raio), new THREE.Quaternion().setFromEuler(new THREE.Euler(a, a * 2, 0)), new THREE.Vector3(1, 1, 1));
  });
  if (on <= 0.01) return null;
  return <Instancias matrizes={mats} n={Math.floor(mats.length * clamp01(on))} geo={geo} cor={cor} sombra={false} />;
};

// vapor subindo
export const Vapor: React.FC<{t: number; pos: V3; forca?: number; raio?: number}> = ({t, pos, forca = 1, raio = 0.07}) => (
  <group>
    {Array.from({length: 7}).map((_, i) => {
      const k = ((t * 0.35 + i / 7) % 1);
      const op = Math.sin(k * Math.PI) * 0.45 * forca;
      return (
        <mesh key={i} position={[pos[0] + Math.sin(i * 2.3 + t) * raio, pos[1] + k * 0.35, pos[2] + Math.cos(i * 1.7) * raio * 0.6]} scale={0.03 + k * 0.05}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={op} depthWrite={false} />
        </mesh>
      );
    })}
  </group>
);

// fio de líquido entre dois pontos (óleo, massa, calda, leite condensado)
export const Fio: React.FC<{a: V3; b: V3; r?: number; cor: string; vis?: number}> = ({a, r = 0.008, b, cor, vis = 1}) => {
  if (vis <= 0.01) return null;
  const y1 = lerp(a[1], b[1], vis);
  const h = a[1] - y1;
  return (
    <group>
      <mesh position={[a[0], (a[1] + y1) / 2, a[2]]}>
        <cylinderGeometry args={[r * 1.25, r * 0.8, h, 14]} />
        <meshStandardMaterial color={cor} roughness={0.15} metalness={0.05} />
      </mesh>
      <mesh position={[a[0], y1, a[2]]} scale={[r * 1.8, r * 0.7, r * 1.8]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color={cor} roughness={0.15} />
      </mesh>
    </group>
  );
};

// ---------- cozinha (cenário base) ----------
const texPiso = () =>
  texCanvas('piso', 256, 256, (g) => {
    g.fillStyle = '#d6b085';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#e3c39a';
    g.fillRect(4, 4, 120, 120);
    g.fillRect(132, 132, 120, 120);
    g.fillStyle = '#cfa679';
    g.fillRect(132, 4, 120, 120);
    g.fillRect(4, 132, 120, 120);
  }, true);
const texAzulejo = () =>
  texCanvas('azulejo', 256, 128, (g) => {
    g.fillStyle = '#d9d2c4';
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = '#ffffff';
    [[0, 0], [128, 0], [-64, 64], [64, 64], [192, 64]].forEach(([x, y]) => g.fillRect(x + 3, y + 3, 122, 58));
  }, true);

export const Ilha: React.FC = () => (
  <group>
    <Caixa pos={[0, 0.45, 0]} tam={[2.0, 0.9, 0.86]} cor={COR.ilha} />
    {[-0.66, 0, 0.66].map((x) => (
      <group key={x}>
        <Caixa pos={[x, 0.45, 0.432]} tam={[0.6, 0.8, 0.01]} cor="#37a294" sombra={false} />
        <Caixa pos={[x, 0.78, 0.445]} tam={[0.18, 0.025, 0.02]} cor="#e8e2d4" sombra={false} />
      </group>
    ))}
    <Caixa pos={[0, TOPO - 0.02, 0]} tam={[2.1, 0.04, 0.96]} cor={COR.tampo} />
  </group>
);

export const Fogao: React.FC<{pos: V3; t?: number; chama?: number[]; dial?: number; aceso?: number}> = ({pos, t = 0, chama = [0, 0, 0, 0], dial = 0, aceso = 0}) => (
  <group position={pos}>
    <Caixa pos={[0, 0.45, 0]} tam={[0.76, 0.9, 0.62]} cor="#f2f2f0" />
    <Caixa pos={[0, 0.905, 0]} tam={[0.76, 0.012, 0.62]} cor="#1f1f26" />
    {[[-0.18, -0.13], [0.18, -0.13], [-0.18, 0.14], [0.18, 0.14]].map(([x, z], i) => (
      <group key={i} position={[x, 0.915, z]}>
        <Cil r={0.06} h={0.012} cor="#3a3a44" seg={14} />
        {[0, 1, 2, 3].map((k) => (<Caixa key={k} pos={[0, 0.03, 0]} rot={(k * Math.PI) / 4} tam={[0.22, 0.012, 0.012]} cor="#2a2a30" />))}
        {chama[i] > 0.02 &&
          Array.from({length: 10}).map((_, k) => {
            const a = (k / 10) * Math.PI * 2;
            const h = (0.024 + 0.006 * Math.sin(t * 20 + k)) * chama[i];
            return (
              <mesh key={'c' + k} position={[Math.cos(a) * 0.055, 0.012 + h / 2, Math.sin(a) * 0.055]}>
                <coneGeometry args={[0.009, h, 5]} />
                <meshStandardMaterial color="#4fa3ff" emissive="#2b7cff" emissiveIntensity={1.4} transparent opacity={0.9} />
              </mesh>
            );
          })}
      </group>
    ))}
    {/* painel e botões */}
    <Caixa pos={[0, 0.83, 0.315]} tam={[0.76, 0.1, 0.02]} cor="#e6e6e3" />
    {[-0.27, -0.13, 0.13, 0.27, 0].map((x, i) => (
      <Cil key={i} pos={[x, 0.83, 0.335]} rot={[Math.PI / 2, i === 4 ? dial : 0, 0]} r={0.022} h={0.025} cor="#2b2b33" seg={10} />
    ))}
    {/* porta do forno com vidro */}
    <Caixa pos={[0, 0.42, 0.315]} tam={[0.68, 0.56, 0.02]} cor="#f7f7f5" />
    <mesh position={[0, 0.44, 0.328]}>
      <boxGeometry args={[0.5, 0.3, 0.005]} />
      <meshStandardMaterial color={aceso > 0 ? '#5a2a10' : '#2a2120'} emissive="#ff7a1a" emissiveIntensity={aceso * 0.9} />
    </mesh>
    <Barra a={[-0.26, 0.66, 0.36]} b={[0.26, 0.66, 0.36]} r={0.012} cor={COR.inox} />
    <Caixa pos={[0, 0.06, 0.3]} tam={[0.7, 0.1, 0.03]} cor="#d8d8d4" />
  </group>
);

export const Geladeira: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Caixa pos={[0, 0.9, 0]} tam={[0.7, 1.8, 0.66]} cor="#e85a4f" />
    <Caixa pos={[0, 1.33, 0.335]} tam={[0.66, 0.005, 0.01]} cor="#a8372f" sombra={false} />
    <Barra a={[0.27, 1.45, 0.37]} b={[0.27, 1.7, 0.37]} r={0.015} cor={COR.inox} />
    <Barra a={[0.27, 0.8, 0.37]} b={[0.27, 1.2, 0.37]} r={0.015} cor={COR.inox} />
  </group>
);

export const Janela: React.FC<{pos: V3; w?: number; h?: number}> = ({pos, w = 0.9, h = 0.8}) => (
  <group position={pos}>
    <Caixa pos={[0, 0, 0]} tam={[w + 0.1, h + 0.1, 0.06]} cor="#ffffff" />
    <mesh position={[0, 0, 0.035]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color="#a8dcff" />
    </mesh>
    <Caixa pos={[0, 0, 0.045]} tam={[0.03, h, 0.02]} cor="#ffffff" />
    <Caixa pos={[0, 0, 0.045]} tam={[w, 0.03, 0.02]} cor="#ffffff" />
    <Caixa pos={[0, -h / 2 - 0.06, 0.08]} tam={[w + 0.2, 0.04, 0.16]} cor="#ffffff" />
  </group>
);

export const Planta: React.FC<{pos: V3; esc?: number}> = ({pos, esc = 1}) => (
  <group position={pos} scale={esc}>
    <Cil pos={[0, 0.06, 0]} r={0.07} r2={0.05} h={0.12} cor="#c8643c" />
    {[0, 1.3, 2.6, 3.9, 5.2].map((a, i) => (
      <mesh key={i} position={[Math.cos(a) * 0.04, 0.2, Math.sin(a) * 0.04]} rotation={[Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5]}><coneGeometry args={[0.035, 0.22, 4]} /><Mat cor={i % 2 ? '#4caf50' : '#3f9b5a'} /></mesh>
    ))}
  </group>
);

// fundo da cozinha: piso, parede com azulejo, bancada do fundo, fogão, geladeira, janela, armários
export const Cozinha: React.FC<{t?: number; chama?: number[]; dial?: number; semFogao?: boolean; aceso?: number}> = ({t = 0, chama, dial, semFogao, aceso}) => {
  const piso = texPiso();
  piso.repeat.set(12, 12);
  const az = texAzulejo();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial map={piso} roughness={0.9} />
      </mesh>
      {/* paredes */}
      <Caixa pos={[0, 1.5, -2.35]} tam={[9, 3, 0.1]} cor={COR.parede} />
      <Caixa pos={[-3.8, 1.5, 0]} tam={[0.1, 3, 9]} cor="#f6d6ae" />
      <Caixa pos={[3.9, 1.5, 0]} tam={[0.1, 3, 9]} cor="#f6d6ae" />
      <mesh position={[-0.55, 1.27, -2.295]}>
        <planeGeometry args={[4.9, 0.66]} />
        <meshStandardMaterial map={(() => { const k = az.clone(); k.needsUpdate = true; k.repeat.set(16, 4); return k; })()} roughness={0.5} />
      </mesh>
      {/* bancada do fundo + pia */}
      <Caixa pos={[-1.0, 0.45, -2.0]} tam={[2.6, 0.9, 0.6]} cor={COR.ilha} />
      <Caixa pos={[-1.0, 0.92, -2.0]} tam={[2.65, 0.04, 0.64]} cor={COR.tampo} />
      <Caixa pos={[-1.4, 0.93, -2.0]} tam={[0.6, 0.02, 0.4]} cor={COR.inox} />
      <Barra a={[-1.4, 0.94, -2.25]} b={[-1.4, 1.2, -2.25]} r={0.015} cor={COR.inox} />
      <Barra a={[-1.4, 1.2, -2.25]} b={[-1.4, 1.2, -2.08]} r={0.015} cor={COR.inox} />
      <Planta pos={[-2.1, 0.94, -2.1]} />
      {/* armários altos */}
      <Caixa pos={[-1.0, 2.05, -2.12]} tam={[2.6, 0.7, 0.36]} cor="#f7f1e6" />
      {[-2.0, -1.35, -0.7, -0.05].map((x) => (<Caixa key={x} pos={[x + 0.3, 1.78, -1.93]} tam={[0.15, 0.025, 0.02]} cor={COR.inox} sombra={false} />))}
      {/* fogão, bancada direita, janela */}
      {!semFogao && <Fogao pos={[0.68, 0, -2.0]} t={t} chama={chama} dial={dial} aceso={aceso} />}
      <Caixa pos={[2.3, 0.45, -2.0]} tam={[2.4, 0.9, 0.6]} cor={COR.ilha} />
      <Caixa pos={[2.3, 0.92, -2.0]} tam={[2.45, 0.04, 0.64]} cor={COR.tampo} />
      <Janela pos={[2.4, 1.55, -2.28]} w={1.1} h={0.8} />
      <Geladeira pos={[3.2, 0, -1.2]} />
      {/* luminárias pendentes sobre a ilha */}
      {[-0.55, 0.55].map((x) => (
        <group key={x} position={[x, 2.2, 0]}>
          <Barra a={[0, 0.8, 0]} b={[0, 0.1, 0]} r={0.006} cor="#2b2233" sombra={false} />
          <mesh position={[0, 0.05, 0]}><coneGeometry args={[0.16, 0.18, 12, 1, true]} /><meshStandardMaterial color="#ffd23f" side={THREE.DoubleSide} flatShading /></mesh>
          <mesh position={[0, -0.02, 0]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#fff6d8" emissive="#fff1b0" emissiveIntensity={1.5} /></mesh>
        </group>
      ))}
    </group>
  );
};

// ---------- ingredientes ----------
export const Cenoura: React.FC<{pos: V3; rot?: V3; esc?: number; folha?: boolean}> = ({pos, rot = [0, 0, Math.PI / 2], esc = 1, folha = true}) => (
  <group position={pos} rotation={rot} scale={esc}>
    <mesh castShadow><coneGeometry args={[0.022, 0.17, 8]} /><Mat cor={COR.cenoura} /></mesh>
    {folha && [-0.3, 0, 0.3].map((a) => (
      <mesh key={a} position={[Math.sin(a) * 0.01, 0.12, 0]} rotation={[0, 0, a]}><coneGeometry args={[0.008, 0.08, 4]} /><Mat cor={COR.folha} /></mesh>
    ))}
  </group>
);

// rodelas de cenoura (instanciadas)
export const Rodelas: React.FC<{n: number; centro: V3; raio?: number; altura?: number; seed?: number; cai?: number}> = ({n, centro, raio = 0.05, altura = 0.0, seed = 5, cai = 0}) => {
  const geo = useMemo(() => new THREE.CylinderGeometry(0.018, 0.018, 0.006, 10), []);
  const mats = useMemo(() => {
    let s = seed;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    return Array.from({length: 60}).map((_, i) => {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * raio;
      const y = centro[1] + 0.003 + (i / 60) * altura + cai * (1 - i / 60) * 0.25;
      return new THREE.Matrix4().compose(new THREE.Vector3(centro[0] + Math.cos(a) * d, y, centro[2] + Math.sin(a) * d), new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 0.6, 0, r() * 0.6)), new THREE.Vector3(1, 1, 1));
    });
  }, [n, centro[0], centro[1], centro[2], raio, altura, seed, cai]);
  return <Instancias matrizes={mats} n={n} geo={geo} cor={COR.cenoura} />;
};

export const Ovo: React.FC<{pos: V3; rot?: V3; aberto?: number}> = ({pos, rot = [0, 0, 0], aberto = 0}) => {
  if (aberto <= 0)
    return (
      <mesh position={pos} rotation={rot} scale={[0.022, 0.03, 0.022]} castShadow>
        <sphereGeometry args={[1, 12, 10]} />
        <Mat cor={COR.ovo} rugoso={0.6} />
      </mesh>
    );
  const k = suave(aberto);
  return (
    <group position={pos}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.02 * k, 0, 0]} rotation={[0, 0, s * (Math.PI / 2) * k]} scale={[0.022, 0.03, 0.022]}>
          <sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={COR.ovo} flatShading side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh position={[0, -0.02 - 0.2 * clamp01(aberto * 1.5 - 0.3), 0]} scale={[0.016, 0.014, 0.016]}>
        <sphereGeometry args={[1, 10, 8]} />
        <Mat cor={COR.gema} rugoso={0.3} />
      </mesh>
    </group>
  );
};

export const CaixaOvos: React.FC<{pos: V3; n?: number}> = ({pos, n = 6}) => (
  <group position={pos}>
    <Caixa pos={[0, 0.02, 0]} tam={[0.16, 0.04, 0.11]} cor="#b9a07a" />
    {Array.from({length: n}).map((_, i) => (<Ovo key={i} pos={[(i % 3) * 0.05 - 0.05, 0.06, Math.floor(i / 3) * 0.05 - 0.025]} />))}
  </group>
);

export const GarrafaOleo: React.FC<{pos: V3; rot?: V3}> = ({pos, rot = [0, 0, 0]}) => (
  <group position={pos} rotation={rot}>
    <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.036, 0.036, 0.2, 12]} /><Vidro cor="#ffe27a" op={0.55} /></mesh>
    <Cil pos={[0, 0.085, 0]} r={0.032} h={0.17} cor={COR.oleo} seg={12} />
    <Cil pos={[0, 0.225, 0]} r={0.02} r2={0.036} h={0.05} cor="#ffe27a" seg={12} />
    <Cil pos={[0, 0.26, 0]} r={0.016} h={0.025} cor="#e8322b" seg={10} />
    <Etiqueta pos={[0, 0.1, 0.0375]} w={0.06} h={0.06} texto={'ÓLEO'} fundo="#2f8f3a" cor="#ffffff" linha2="900 ml" />
  </group>
);

export const Pacote: React.FC<{pos: V3; texto: string; fundo: string; cor?: string; linha2?: string; rotY?: number; tam?: V3}> = ({pos, texto, fundo, cor = '#ffffff', linha2, rotY = 0, tam = [0.12, 0.18, 0.07]}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Caixa pos={[0, tam[1] / 2, 0]} tam={tam} cor="#f5f1e8" />
    <Caixa pos={[0, tam[1] + 0.008, 0]} tam={[tam[0] * 0.98, 0.016, tam[2] * 0.4]} cor="#f5f1e8" />
    <Etiqueta pos={[0, tam[1] * 0.5, tam[2] / 2 + 0.001]} w={tam[0] * 0.9} h={tam[1] * 0.7} texto={texto} fundo={fundo} cor={cor} linha2={linha2} />
  </group>
);

export const Lata: React.FC<{pos: V3; rot?: V3; texto: string; fundo: string; cor?: string; linha2?: string; r?: number; h?: number}> = ({pos, rot = [0, 0, 0], texto, fundo, cor = '#ffffff', linha2, r = 0.038, h = 0.08}) => (
  <group position={pos} rotation={rot}>
    <Cil pos={[0, h / 2, 0]} r={r} h={h} cor={fundo} seg={14} />
    <Cil pos={[0, h + 0.002, 0]} r={r * 0.97} h={0.004} cor={COR.inox} seg={14} />
    <Etiqueta pos={[0, h / 2, r + 0.001]} w={r * 1.5} h={h * 0.8} texto={texto} fundo={fundo} cor={cor} linha2={linha2} />
  </group>
);

export const Manteiga: React.FC<{pos: V3; frac?: number}> = ({pos, frac = 1}) => (
  <group position={pos}>
    <Caixa pos={[0, 0.006, 0]} tam={[0.16, 0.012, 0.09]} cor="#f2f2f2" />
    <Caixa pos={[-0.06 * (1 - frac), 0.03, 0]} tam={[0.12 * frac, 0.04, 0.05]} cor="#ffe27a" />
  </group>
);

// ---------- utensílios ----------
// copo do liquidificador: nível 0..1, cor do conteúdo, girando = batendo
export const Liquidificador: React.FC<{pos: V3; t: number; nivel?: number; cor?: string; batendo?: number; tampa?: boolean; rot?: V3; conteudo?: React.ReactNode; semBase?: boolean}> = ({pos, t, nivel = 0, cor = COR.massaCrua, batendo = 0, tampa = false, rot = [0, 0, 0], conteudo, semBase}) => {
  const treme = batendo > 0 ? Math.sin(t * 70) * 0.0015 * batendo : 0;
  const hCopo = 0.25;
  const h = 0.005 + nivel * (hCopo - 0.03);
  return (
    <group position={[pos[0] + treme, pos[1], pos[2]]} rotation={rot}>
      {!semBase && (
        <>
          <Caixa pos={[0, 0.07, 0]} tam={[0.18, 0.14, 0.18]} cor="#2b2b3a" />
          <Caixa pos={[0, 0.07, 0.091]} tam={[0.12, 0.05, 0.004]} cor="#3d3d50" sombra={false} />
          <mesh position={[0.03, 0.07, 0.095]}><sphereGeometry args={[0.012, 8, 6]} /><meshStandardMaterial color={batendo > 0 ? '#5cff7a' : '#e8322b'} emissive={batendo > 0 ? '#2fbf55' : '#000'} emissiveIntensity={1} /></mesh>
          <Cil pos={[-0.03, 0.07, 0.095]} rot={[Math.PI / 2, 0, 0]} r={0.012} h={0.012} cor="#c3c8cf" />
        </>
      )}
      <group position={[0, semBase ? 0 : 0.14, 0]}>
        <Cil pos={[0, 0.015, 0]} r={0.065} h={0.03} cor="#3d3d50" seg={14} />
        {/* lâmina */}
        <group position={[0, 0.04, 0]} rotation={[0, t * 40 * batendo, 0]}>
          <Caixa tam={[0.08, 0.004, 0.012]} cor={COR.inox} sombra={false} />
          <Caixa rot={Math.PI / 2} tam={[0.08, 0.004, 0.012]} cor={COR.inox} sombra={false} />
        </group>
        {nivel > 0.001 && (
          <group>
            <mesh position={[0, 0.03 + h / 2, 0]}>
              <cylinderGeometry args={[0.058 + nivel * 0.015, 0.056, h, 16]} />
              <Mat cor={cor} rugoso={0.5} />
            </mesh>
            {batendo > 0 && (
              <mesh position={[0, 0.03 + h - 0.012 * batendo, 0]} rotation={[Math.PI, t * 30, 0]}>
                <coneGeometry args={[0.05, 0.03 * batendo, 10]} />
                <meshStandardMaterial color="#e08a28" flatShading />
              </mesh>
            )}
          </group>
        )}
        {conteudo}
        <mesh position={[0, 0.03 + hCopo / 2, 0]}>
          <cylinderGeometry args={[0.078, 0.062, hCopo, 16, 1, true]} />
          <Vidro />
        </mesh>
        {/* alça */}
        <Barra a={[0.085, 0.08, 0]} b={[0.11, 0.1, 0]} r={0.01} cor="#cfd8e0" />
        <Barra a={[0.11, 0.1, 0]} b={[0.11, 0.24, 0]} r={0.01} cor="#cfd8e0" />
        <Barra a={[0.11, 0.24, 0]} b={[0.08, 0.26, 0]} r={0.01} cor="#cfd8e0" />
        {tampa && <Cil pos={[0, 0.03 + hCopo + 0.008, 0]} r={0.082} h={0.016} cor="#2b2b3a" seg={16} />}
      </group>
    </group>
  );
};

// tigela: conteúdo como disco na altura do nível
export const Tigela: React.FC<{pos: V3; r?: number; nivel?: number; cor?: string; cor2?: string; mistura?: number; rot?: V3; t?: number; monte?: number; corMonte?: string}> = ({pos, r = 0.13, nivel = 0, cor = COR.massaCrua, cor2, mistura = 1, rot = [0, 0, 0], t = 0, monte = 0, corMonte = COR.farinha}) => {
  const prof = r * 0.75;
  const y = -prof + nivel * prof * 0.92; // altura do conteúdo relativa à boca (y=0 boca)
  const rr = r * Math.sqrt(Math.max(0, 1 - (y / r) ** 2)) * 0.97;
  return (
    <group position={pos} rotation={rot}>
      <group position={[0, prof, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[r, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.acos(0.25) - 0.02]} />
          <meshStandardMaterial color="#ffffff" flatShading side={THREE.DoubleSide} roughness={0.4} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
          <ringGeometry args={[r * 0.985, r * 1.03, 24]} />
          <meshStandardMaterial color="#e8322b" side={THREE.DoubleSide} />
        </mesh>
        {nivel > 0.01 && (
          <group position={[0, y, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[rr, 24]} />
              <meshStandardMaterial color={cor} roughness={0.6} />
            </mesh>
            {cor2 && mistura < 1 && (
              <group rotation={[0, t * 2, 0]}>
                {[0, 1, 2].map((i) => (
                  <mesh key={i} rotation={[-Math.PI / 2, 0, (i * 2 * Math.PI) / 3]} position={[Math.cos(i * 2.1) * rr * 0.4, 0.002, Math.sin(i * 2.1) * rr * 0.4]} scale={1 - mistura}>
                    <circleGeometry args={[rr * 0.35, 10]} />
                    <meshStandardMaterial color={cor2} />
                  </mesh>
                ))}
              </group>
            )}
          </group>
        )}
        {monte > 0.01 && (
          <mesh position={[0, -prof * 0.7 + (monte * r * 0.4) / 2, 0]}>
            <coneGeometry args={[r * 0.5 * Math.min(1, 0.4 + monte), monte * r * 0.4, 12]} />
            <Mat cor={corMonte} />
          </mesh>
        )}
      </group>
    </group>
  );
};

export const Peneira: React.FC<{pos: V3; rot?: V3; balanca?: number}> = ({pos, rot = [0, 0, 0], balanca = 0}) => (
  <group position={[pos[0] + balanca * 0.01, pos[1], pos[2]]} rotation={rot}>
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[0.09, 14, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      <meshStandardMaterial color="#9aa0aa" wireframe />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.09, 0.006, 6, 20]} /><Mat cor={COR.inox} rugoso={0.3} /></mesh>
    <Barra a={[0.09, 0, 0]} b={[0.26, 0.02, 0]} r={0.008} cor="#e8322b" />
    <mesh position={[0, -0.035, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.06, 0.04, 12]} /><Mat cor={COR.farinha} /></mesh>
  </group>
);

export const Fue: React.FC<{pos: V3; rot?: V3}> = ({pos, rot = [0, 0, 0]}) => (
  <group position={pos} rotation={rot}>
    {[0, 1, 2, 3].map((i) => (
      <mesh key={i} position={[0, 0.06, 0]} rotation={[0, (i * Math.PI) / 4, 0]} scale={[0.03, 0.065, 0.03]}>
        <torusGeometry args={[1, 0.08, 4, 16]} />
        <Mat cor={COR.inox} rugoso={0.3} />
      </mesh>
    ))}
    <Cil pos={[0, 0.2, 0]} r={0.012} h={0.14} cor="#e8322b" />
  </group>
);

export const Colher: React.FC<{pos: V3; rot?: V3; cheia?: string | null; esc?: number}> = ({pos, rot = [0, 0, 0], cheia = null, esc = 1}) => (
  <group position={pos} rotation={rot} scale={esc}>
    <mesh scale={[0.022, 0.008, 0.032]}><sphereGeometry args={[1, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial color={COR.inox} side={THREE.DoubleSide} roughness={0.3} /></mesh>
    {cheia && <mesh position={[0, 0.002, 0]} scale={[0.02, 0.008, 0.029]}><sphereGeometry args={[1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /><Mat cor={cheia} /></mesh>}
    <Barra a={[0, 0, -0.03]} b={[0, 0.02, -0.15]} r={0.004} cor={COR.inox} />
  </group>
);

export const Xicara: React.FC<{pos: V3; rot?: V3; cheia?: string | null}> = ({pos, rot = [0, 0, 0], cheia = null}) => (
  <group position={pos} rotation={rot}>
    <mesh position={[0, 0.035, 0]}><cylinderGeometry args={[0.042, 0.034, 0.07, 14, 1, true]} /><meshStandardMaterial color="#ff8a1f" side={THREE.DoubleSide} flatShading /></mesh>
    <Cil pos={[0, 0.002, 0]} r={0.034} h={0.004} cor="#ff8a1f" />
    {cheia && <Cil pos={[0, 0.06, 0]} r={0.039} h={0.006} cor={cheia} />}
    <Barra a={[0.04, 0.05, 0]} b={[0.12, 0.06, 0]} r={0.006} cor="#ff8a1f" />
  </group>
);

export const Faca: React.FC<{pos: V3; rot?: V3}> = ({pos, rot = [0, 0, 0]}) => (
  <group position={pos} rotation={rot}>
    <Caixa pos={[0, 0, 0.07]} tam={[0.003, 0.03, 0.12]} cor={COR.inox} />
    <Caixa pos={[0, 0, -0.04]} tam={[0.014, 0.022, 0.1]} cor="#2b2233" />
  </group>
);

export const Tabua: React.FC<{pos: V3}> = ({pos}) => (
  <Caixa pos={[pos[0], pos[1] + 0.01, pos[2]]} tam={[0.36, 0.02, 0.24]} cor="#c8955c" />
);

export const Panela: React.FC<{pos: V3; t: number; nivel?: number; cor?: string; bolhas?: number; desgruda?: number; rot?: V3}> = ({pos, t, nivel = 0, cor = COR.calda, bolhas = 0, desgruda = 0, rot = [0, 0, 0]}) => {
  const r = 0.1, h = 0.08;
  const hh = 0.006 + nivel * 0.05;
  return (
    <group position={pos} rotation={rot}>
      <mesh position={[0, h / 2, 0]} castShadow><cylinderGeometry args={[r, r * 0.95, h, 18, 1, true]} /><meshStandardMaterial color="#d8442f" side={THREE.DoubleSide} flatShading /></mesh>
      <Cil pos={[0, 0.003, 0]} r={r * 0.95} h={0.006} cor="#5a5a62" seg={18} />
      <Barra a={[r, h * 0.8, 0]} b={[r + 0.17, h * 0.95, 0]} r={0.012} cor="#2b2233" />
      {nivel > 0.01 && (
        <group position={[desgruda * 0.02, 0, 0]}>
          <mesh position={[0, 0.006 + hh / 2, 0]} scale={[1 - desgruda * 0.28, 1 + desgruda * 0.5, 1 - desgruda * 0.28]}>
            <cylinderGeometry args={[r * 0.93, r * 0.92, hh, 18]} />
            <meshStandardMaterial color={cor} roughness={0.25} flatShading />
          </mesh>
          {bolhas > 0 &&
            Array.from({length: 6}).map((_, i) => {
              const k = (t * 1.6 + i * 0.37) % 1;
              return (
                <mesh key={i} position={[Math.cos(i * 2.4) * 0.05, 0.006 + hh * (1 + desgruda * 0.5), Math.sin(i * 2.4) * 0.05]} scale={0.012 * Math.sin(k * Math.PI) * bolhas}>
                  <sphereGeometry args={[1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial color={COR.caldaBrilho} />
                </mesh>
              );
            })}
        </group>
      )}
    </group>
  );
};

export const Espatula: React.FC<{pos: V3; rot?: V3}> = ({pos, rot = [0, 0, 0]}) => (
  <group position={pos} rotation={rot}>
    <Caixa pos={[0, 0.03, 0]} tam={[0.05, 0.06, 0.008]} cor="#e8322b" />
    <Cil pos={[0, 0.17, 0]} r={0.007} h={0.22} cor="#f2f2f2" />
  </group>
);

// forma redonda 22 cm (r = 0,11 m, 7 cm de altura) com a massa crescendo
export const Forma: React.FC<{pos: V3; massa?: number; cresce?: number; assado?: number; untada?: number; enfarinhada?: number; murcha?: number}> = ({pos, massa = 0, cresce = 0, assado = 0, untada = 0, enfarinhada = 0, murcha = 0}) => {
  const r = 0.11, h = 0.07;
  const corFundo = enfarinhada > 0.5 ? '#f3efe6' : untada > 0.5 ? '#e8d48a' : '#a9afb7';
  const altura = massa * 0.035 * (1 + cresce * 0.75) * (1 - murcha * 0.45);
  const cor = new THREE.Color(COR.massaCrua).lerp(new THREE.Color(COR.massaAssada), assado).getStyle();
  return (
    <group position={pos}>
      <mesh position={[0, h / 2, 0]} castShadow><cylinderGeometry args={[r, r, h, 24, 1, true]} /><meshStandardMaterial color="#a9afb7" side={THREE.DoubleSide} metalness={0.4} roughness={0.4} /></mesh>
      <Cil pos={[0, 0.002, 0]} r={r} h={0.004} cor={corFundo} seg={24} />
      {massa > 0.01 && (
        <group>
          <Cil pos={[0, 0.004 + altura / 2, 0]} r={r * 0.99} h={altura} cor={cor} seg={24} />
          <mesh position={[0, 0.004 + altura, 0]} scale={[r * 0.99, 0.012 * cresce * (1 - murcha) + 0.002, r * 0.99]}>
            <sphereGeometry args={[1, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Mat cor={cor} />
          </mesh>
        </group>
      )}
    </group>
  );
};

// bolo desenformado com calda (cobre 0..1), granulado (0..1) e fatia tirada
export const Bolo: React.FC<{pos: V3; calda?: number; granulado?: number; semFatia?: number; escorre?: number; esc?: number}> = ({pos, calda = 1, granulado = 1, semFatia = 0, escorre = 1, esc = 1}) => {
  const r = 0.11, h = 0.075, w = 0.72; // fatia de ~41°
  const th0 = semFatia > 0 ? w * semFatia : 0;
  const len = Math.PI * 2 - th0;
  const gran = useMemo(() => {
    let s = 17;
    const rr = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    return Array.from({length: 160}).map(() => {
      const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * r * 0.95;
      return {a, d, m: new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * d, h + 0.016, Math.sin(a) * d), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, rr() * 3)), new THREE.Vector3(1, 1, 1))};
    });
  }, []);
  const geoG = useMemo(() => new THREE.CylinderGeometry(0.0018, 0.0018, 0.01, 4), []);
  // three: thetaStart conta a partir do +z no sentido anti-horário visto de cima
  const fora = (a: number) => {
    const x = Math.sin(a), z = Math.cos(a);
    const ang = Math.atan2(x, z); // 0 = +z
    const u = (ang + Math.PI * 2) % (Math.PI * 2);
    return u < th0;
  };
  const gm = gran.filter((g) => !fora(Math.atan2(Math.cos(g.a), Math.sin(g.a)))).map((g) => g.m);
  const corte = (ang: number) => (
    <mesh position={[Math.sin(ang) * r * 0.5, h / 2, Math.cos(ang) * r * 0.5]} rotation={[0, ang + Math.PI / 2, 0]}>
      <planeGeometry args={[r, h]} />
      <meshStandardMaterial color={COR.miolo} side={THREE.DoubleSide} />
    </mesh>
  );
  return (
    <group position={pos} scale={esc}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, h, 32, 1, false, th0, len]} />
        <Mat cor={COR.massaAssada} />
      </mesh>
      {th0 > 0 && corte(0)}
      {th0 > 0 && corte(th0)}
      {calda > 0.01 && (
        <mesh position={[0, h + 0.006, 0]}>
          <cylinderGeometry args={[r * 1.01 * Math.min(1, calda * 1.2), r * 1.01 * Math.min(1, calda * 1.2), 0.012, 32, 1, false, th0, len]} />
          <meshStandardMaterial color={COR.calda} roughness={0.2} flatShading />
        </mesh>
      )}
      {calda > 0.8 &&
        Array.from({length: 14}).map((_, i) => {
          const a = th0 + ((i + 0.5) / 14) * len;
          const comp = (0.015 + (i % 3) * 0.012) * escorre * clamp01((calda - 0.8) * 5);
          return (
            <mesh key={i} position={[Math.sin(a) * r * 1.01, h + 0.004 - comp / 2, Math.cos(a) * r * 1.01]}>
              <capsuleGeometry args={[0.006, comp, 3, 6]} />
              <meshStandardMaterial color={COR.calda} roughness={0.2} />
            </mesh>
          );
        })}
      {granulado > 0.01 && <Instancias matrizes={gm} n={gm.length * clamp01(granulado)} geo={geoG} cor="#3a1c0e" sombra={false} />}
    </group>
  );
};

// fatia solta (cunha) com miolo à mostra
export const Fatia: React.FC<{pos: V3; rot?: V3}> = ({pos, rot = [0, 0, 0]}) => {
  const r = 0.11, h = 0.075, w = 0.72;
  const corte = (ang: number) => (
    <mesh position={[Math.sin(ang) * r * 0.5, h / 2, Math.cos(ang) * r * 0.5]} rotation={[0, ang + Math.PI / 2, 0]}>
      <planeGeometry args={[r, h]} />
      <meshStandardMaterial color={COR.miolo} side={THREE.DoubleSide} />
    </mesh>
  );
  return (
    <group position={pos} rotation={rot}>
      <mesh position={[0, h / 2, 0]} castShadow><cylinderGeometry args={[r, r, h, 8, 1, false, 0, w]} /><Mat cor={COR.massaAssada} /></mesh>
      {corte(0)}
      {corte(w)}
      <mesh position={[0, h + 0.006, 0]}><cylinderGeometry args={[r * 1.01, r * 1.01, 0.012, 8, 1, false, 0, w]} /><meshStandardMaterial color={COR.calda} roughness={0.2} flatShading /></mesh>
      {[0.3, 0.5, 0.7].map((d, i) => (<mesh key={i} position={[Math.sin(w * (0.3 + i * 0.2)) * r * d, h + 0.014, Math.cos(w * (0.3 + i * 0.2)) * r * d]}><boxGeometry args={[0.009, 0.003, 0.003]} /><Mat cor="#3a1c0e" /></mesh>))}
    </group>
  );
};

export const Prato: React.FC<{pos: V3; r?: number}> = ({pos, r = 0.12}) => (
  <group position={pos}>
    <Cil pos={[0, 0.006, 0]} r={r} r2={r * 0.75} h={0.012} cor="#ffffff" seg={24} />
    <mesh position={[0, 0.0125, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[r * 0.8, r * 0.86, 24]} /><meshStandardMaterial color="#2f8f83" /></mesh>
  </group>
);

export const Boleira: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Cil pos={[0, 0.005, 0]} r={0.06} h={0.01} cor="#ffffff" seg={16} />
    <Cil pos={[0, 0.045, 0]} r={0.02} h={0.08} cor="#ffffff" seg={10} />
    <Cil pos={[0, 0.09, 0]} r={0.15} h={0.012} cor="#ffffff" seg={24} />
  </group>
);

export const Grade: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    {Array.from({length: 7}).map((_, i) => (<Barra key={i} a={[-0.15, 0.025, -0.15 + i * 0.05]} b={[0.15, 0.025, -0.15 + i * 0.05]} r={0.002} cor={COR.inox} sombra={false} />))}
    {[-0.15, 0.15].map((x) => (<Barra key={x} a={[x, 0.025, -0.16]} b={[x, 0.025, 0.16]} r={0.003} cor={COR.inox} sombra={false} />))}
    {[[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].map(([x, z], i) => (<Barra key={'p' + i} a={[x, 0, z]} b={[x, 0.025, z]} r={0.003} cor={COR.inox} sombra={false} />))}
  </group>
);

export const Palito: React.FC<{pos: V3; sujo?: number}> = ({pos, sujo = 0}) => (
  <group position={pos}>
    <Barra a={[0, 0, 0]} b={[0, 0.13, 0]} r={0.0025} cor="#e3c08a" sombra={false} />
    {sujo > 0 && <Barra a={[0, 0, 0]} b={[0, 0.04, 0]} r={0.004} cor={COR.massaCrua} sombra={false} />}
  </group>
);

// celular com tela (site / Telegram)
export const texSite = () =>
  texCanvas('site', 360, 740, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 360, 740);
    g.fillStyle = '#14213D';
    g.fillRect(0, 0, 360, 120);
    g.fillStyle = '#ffd23f';
    g.font = `800 34px ${F}`;
    g.textAlign = 'center';
    g.fillText('Precinho de Ouro', 180, 62);
    g.fillStyle = '#ffffff';
    g.font = `800 20px ${F}`;
    g.fillText('precinhodeouro.com.br/receitas', 180, 98);
    g.fillStyle = '#14213D';
    g.font = `800 30px ${F}`;
    g.fillText('142 receitas fáceis', 180, 168);
    const cards = [['Bolo de cenoura', '#f07a1a'], ['Pão de queijo', '#ffb81c'], ['Strogonoff 20 min', '#c8643c'], ['Mousse de maracujá', '#f4c430']];
    cards.forEach(([t, c], i) => {
      const y = 196 + i * 112;
      g.fillStyle = '#f4efe6';
      g.beginPath();
      g.roundRect(20, y, 320, 96, 18);
      g.fill();
      g.fillStyle = c;
      g.beginPath();
      g.roundRect(30, y + 10, 76, 76, 14);
      g.fill();
      g.fillStyle = '#14213D';
      g.textAlign = 'left';
      g.font = `800 25px ${F}`;
      g.fillText(t, 120, y + 54);
    });
    g.fillStyle = '#229ED9';
    g.beginPath();
    g.roundRect(30, 650, 300, 64, 32);
    g.fill();
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.font = `800 25px ${F}`;
    g.fillText('Receber no Telegram ➤', 180, 692);
  });

export const texTelegram = () =>
  texCanvas('telegram', 360, 740, (g) => {
    g.fillStyle = '#cfe3c2';
    g.fillRect(0, 0, 360, 740);
    g.fillStyle = '#229ED9';
    g.fillRect(0, 0, 360, 110);
    g.fillStyle = '#ffffff';
    g.font = `800 30px ${F}`;
    g.textAlign = 'center';
    g.fillText('Receitas Precinho', 180, 55);
    g.font = `800 19px ${F}`;
    g.fillText('canal · 5 receitas por dia', 180, 88);
    const msgs = [['08h  Café fit', '#ffffff'], ['10h  Almoço', '#ffffff'], ['13h  Suco', '#ffffff'], ['16h  Lanche', '#ffffff'], ['19h  Sobremesa', '#ffffff']];
    msgs.forEach(([t, c], i) => {
      const y = 140 + i * 112;
      g.fillStyle = c;
      g.beginPath();
      g.roundRect(20, y, 300, 92, 18);
      g.fill();
      g.fillStyle = ['#ffb81c', '#c8643c', '#4caf50', '#f07a1a', '#6b3e26'][i];
      g.beginPath();
      g.roundRect(30, y + 10, 72, 72, 12);
      g.fill();
      g.fillStyle = '#1d1b26';
      g.textAlign = 'left';
      g.font = `800 26px ${F}`;
      g.fillText(t, 116, y + 54);
    });
  });

export const Celular: React.FC<{pos: V3; rot?: V3; tela: 'site' | 'telegram'; esc?: number; brilho?: number}> = ({pos, rot = [0, 0, 0], tela, esc = 1, brilho = 1}) => (
  <group position={pos} rotation={rot} scale={esc}>
    <mesh castShadow>
      <boxGeometry args={[0.078, 0.16, 0.009]} />
      <meshStandardMaterial color="#1d1b26" roughness={0.3} />
    </mesh>
    <mesh position={[0, 0, 0.0047]}>
      <planeGeometry args={[0.072, 0.148]} />
      <meshBasicMaterial map={tela === 'site' ? texSite() : texTelegram()} color={new THREE.Color(brilho, brilho, brilho)} toneMapped={false} />
    </mesh>
  </group>
);

// mostrador do forno com graus (para o close do botão)
export const texDial = () =>
  texCanvas('dial', 512, 512, (g) => {
    g.fillStyle = '#f2f2f0';
    g.fillRect(0, 0, 512, 512);
    g.translate(256, 256);
    g.fillStyle = '#1d1b26';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const marcas = ['OFF', '120', '150', '180', '210', '240', 'MAX'];
    marcas.forEach((m, i) => {
      const a = (-120 + i * 40) * (Math.PI / 180);
      g.save();
      g.rotate(a);
      g.font = `800 ${m === '180' ? 64 : 48}px ${F}`;
      g.fillStyle = m === '180' ? '#e8322b' : '#1d1b26';
      g.fillText(m, 0, -200);
      g.restore();
    });
  });
export const DIAL_ANG = (graus: number) => {
  // OFF=-120°, 120=-80°, 150=-40°, 180=0°...
  const idx = graus <= 0 ? 0 : 1 + (graus - 120) / 30;
  return ((-120 + idx * 40) * Math.PI) / 180;
};
// ================= BROWNIE (peças novas; não alteram as do bolo) =================
export const BW = {
  crua: '#5a3222', crosta: '#6e4430', brilho: '#8a5a40', miolo: '#3f2316', seco: '#7a5038', lado: '#4a2a1b',
  derretido: '#3a1c10', claro: '#f7e2a6', papel: '#f1e7cf', forma: '#9aa1aa',
};

// barra de chocolate (tablete ~200 g: 16 × 7,5 × 1 cm, em gomos 4 × 2) que encolhe conforme os pedaços saem
export const BarraChocolate: React.FC<{pos: V3; rot?: V3; frac?: number}> = ({pos, rot = [0, 0, 0], frac = 1}) => {
  const cols = Math.max(0, Math.round(4 * frac));
  return (
    <group position={pos} rotation={rot}>
      {Array.from({length: cols * 2}).map((_, i) => (
        <Caixa key={i} pos={[-0.06 + (i % cols) * 0.04, 0.005, (Math.floor(i / cols) - 0.5) * 0.037]} tam={[0.038, 0.01, 0.035]} cor={BW.derretido} />
      ))}
      {/* embalagem aberta na ponta que sobra */}
      <Caixa pos={[0.1, 0.006, 0]} tam={[0.035, 0.013, 0.08]} cor="#c41d14" />
    </group>
  );
};

// pedaços de chocolate/manteiga numa pilha (instanciados) que derretem (escala cai com "derrete")
export const Pedacos: React.FC<{centro: V3; n: number; raio?: number; tam?: number; cor: string; derrete?: number; cai?: number; seed?: number}> = ({centro, n, raio = 0.05, tam = 0.02, cor, derrete = 0, cai = 0, seed = 7}) => {
  const geo = useMemo(() => new THREE.BoxGeometry(tam, tam * 0.5, tam * 0.8), [tam]);
  const mats = useMemo(() => {
    let s = seed;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const k = Math.max(0.05, 1 - derrete);
    return Array.from({length: 40}).map((_, i) => {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * raio;
      const y = centro[1] + tam * 0.3 * k + (i / 40) * 0.02 * k + cai * (1 - i / 40) * 0.22;
      return new THREE.Matrix4().compose(new THREE.Vector3(centro[0] + Math.cos(a) * d, y, centro[2] + Math.sin(a) * d), new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 0.5, r() * 3, r() * 0.5)), new THREE.Vector3(k, k, k));
    });
  }, [centro[0], centro[1], centro[2], raio, tam, derrete, cai, seed]);
  if (derrete >= 0.98) return null;
  return <Instancias matrizes={mats} n={n} geo={geo} cor={cor} />;
};

// trincas da casquinha (linhas claras finas sobre o topo)
const Trincas: React.FC<{lado: number; y: number; vis: number}> = ({lado, y, vis}) => {
  if (vis <= 0.02) return null;
  const linhas: [number, number, number, number][] = [[-0.6, -0.3, 0.1, -0.05], [0.1, -0.05, 0.55, 0.2], [-0.3, 0.4, 0.2, 0.25], [-0.5, 0.1, -0.2, 0.45], [0.3, -0.5, 0.45, -0.15], [-0.1, -0.55, 0.15, -0.35]];
  return (
    <group>
      {linhas.slice(0, Math.ceil(linhas.length * vis)).map(([x0, z0, x1, z1], i) => (
        <Barra key={i} a={[x0 * lado * 0.5, y, z0 * lado * 0.5]} b={[x1 * lado * 0.5, y, z1 * lado * 0.5]} r={0.0008} cor="#94664b" sombra={false} />
      ))}
    </group>
  );
};

// topo brilhante (casquinha): de fosco a espelhado conforme "casquinha"
const Topo: React.FC<{w: number; d: number; y: number; casquinha: number; cor: string}> = ({w, d, y, casquinha, cor}) => (
  <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={[w, d]} />
    <meshStandardMaterial color={new THREE.Color(cor).lerp(new THREE.Color(BW.brilho), casquinha * 0.4).getStyle()} roughness={lerp(0.85, 0.12, casquinha)} metalness={casquinha * 0.25} />
  </mesh>
);

// um quadradinho de brownie de 5 × 5 × 3 cm com casquinha
export const Quadradinho: React.FC<{pos: V3; rotY?: number; esc?: number}> = ({pos, rotY = 0, esc = 1}) => (
  <group position={pos} rotation={[0, rotY, 0]} scale={esc}>
    <Caixa pos={[0, 0.015, 0]} tam={[0.05, 0.03, 0.05]} cor={BW.miolo} />
    <Topo w={0.05} d={0.05} y={0.0302} casquinha={1} cor={BW.crosta} />
    <Barra a={[-0.015, 0.0305, -0.01]} b={[0.012, 0.0305, 0.008]} r={0.0007} cor="#94664b" sombra={false} />
  </group>
);

// forma quadrada 20 × 20 × 5 cm, com papel-manteiga, massa, casquinha, cortes e pedaços
export const FormaQuadrada: React.FC<{pos: V3; rot?: V3; papel?: number; massa?: number; assado?: number; casquinha?: number; cortes?: number; pedacos?: boolean; faltam?: number[]; vazia?: boolean}> = ({pos, rot = [0, 0, 0], papel = 0, massa = 0, assado = 0, casquinha = 0, cortes = 0, pedacos = false, faltam = [], vazia = false}) => {
  const L = 0.2, h = 0.05, e = 0.003;
  const alt = massa * 0.03;
  const cor = new THREE.Color(BW.crua).lerp(new THREE.Color(BW.crosta), assado).getStyle();
  const kp = suave(papel);
  return (
    <group position={pos} rotation={rot}>
      <Caixa pos={[0, 0.0015, 0]} tam={[L + 2 * e, 0.003, L + 2 * e]} cor={BW.forma} />
      {[[0, -1], [0, 1], [-1, 0], [1, 0]].map(([sx, sz], i) => (
        <Caixa key={i} pos={[sx * (L / 2 + e / 2), h / 2, sz * (L / 2 + e / 2)]} tam={sx ? [e, h, L + 2 * e] : [L + 2 * e, h, e]} cor={BW.forma} />
      ))}
      {kp > 0.01 && (
        <group position={[0, (1 - kp) * 0.14, 0]}>
          <Caixa pos={[0, 0.0035, 0]} tam={[L - 0.002, 0.001, L - 0.002]} cor={BW.papel} sombra={false} />
          {[-1, 1].map((sz) => (<Caixa key={sz} pos={[0, h / 2 + 0.008, sz * (L / 2 - 0.002)]} tam={[L - 0.004, h + 0.016, 0.001]} cor={BW.papel} sombra={false} />))}
        </group>
      )}
      {!vazia && massa > 0.01 && !pedacos && (
        <group>
          <Caixa pos={[0, 0.004 + alt / 2, 0]} tam={[L - 0.003, alt, L - 0.003]} cor={cor} />
          <Topo w={L - 0.003} d={L - 0.003} y={0.0042 + alt} casquinha={casquinha} cor={cor} />
          <Trincas lado={L} y={0.0046 + alt} vis={casquinha > 0.5 ? (casquinha - 0.5) * 2 : 0} />
          {cortes > 0.01 &&
            [-1, 0, 1].flatMap((k) => [0, 1].map((dir) => {
              const i = (k + 1) * 2 + dir;
              const vis = clamp01(cortes * 6 - i);
              if (vis <= 0) return null;
              const comp = (L - 0.004) * vis;
              return (
                <Caixa key={`${k}${dir}`} pos={dir ? [k * 0.05, 0.0046 + alt, -L / 2 + comp / 2] : [-L / 2 + comp / 2, 0.0046 + alt, k * 0.05]} tam={dir ? [0.0025, 0.002, comp] : [comp, 0.002, 0.0025]} cor="#1e0f08" sombra={false} />
              );
            }))}
        </group>
      )}
      {pedacos &&
        Array.from({length: 16}).map((_, i) =>
          faltam.includes(i) ? null : <Quadradinho key={i} pos={[-0.075 + (i % 4) * 0.05, 0.004, -0.075 + Math.floor(i / 4) * 0.05]} esc={0.97} />,
        )}
    </group>
  );
};

// pedaço em corte (comparar miolo úmido × seco × "virou bolo")
export const CorteBrownie: React.FC<{pos: V3; tipo: 'umido' | 'seco' | 'bolo'}> = ({pos, tipo}) => {
  const h = tipo === 'bolo' ? 0.05 : 0.03;
  const corFrente = tipo === 'umido' ? BW.miolo : tipo === 'seco' ? BW.seco : '#6a4330';
  const furos = tipo === 'umido' ? 0 : tipo === 'seco' ? 26 : 34;
  return (
    <group position={pos}>
      <Caixa pos={[0, h / 2, -0.03]} tam={[0.08, h, 0.06]} cor={tipo === 'umido' ? BW.lado : BW.seco} />
      <Topo w={0.08} d={0.06} y={h + 0.0003} casquinha={tipo === 'umido' ? 1 : 0.2} cor={BW.crosta} />
      <mesh position={[0, h / 2, 0.0005]}>
        <planeGeometry args={[0.08, h]} />
        <meshStandardMaterial color={corFrente} roughness={tipo === 'umido' ? 0.35 : 0.95} />
      </mesh>
      {Array.from({length: furos}).map((_, i) => (
        <mesh key={i} position={[(((i * 37) % 17) / 17) * 0.074 - 0.037, (((i * 23) % 11) / 11) * h * 0.8 + h * 0.1, 0.0015]}>
          <circleGeometry args={[0.0018 + (i % 3) * 0.0012, 6]} />
          <meshBasicMaterial color={tipo === 'seco' ? '#a77a58' : '#3a2015'} />
        </mesh>
      ))}
    </group>
  );
};

// palito com migalhas úmidas (ponto certo) ou limpo
export const PalitoBrownie: React.FC<{pos: V3; migalhas?: number}> = ({pos, migalhas = 0}) => (
  <group position={pos}>
    <Barra a={[0, 0, 0]} b={[0, 0.13, 0]} r={0.0025} cor="#e3c08a" sombra={false} />
    {migalhas > 0.01 &&
      Array.from({length: 9}).map((_, i) => (
        <mesh key={i} position={[Math.cos(i * 2.1) * 0.0032, 0.008 + i * 0.0045, Math.sin(i * 2.1) * 0.0032]} scale={0.0028 * migalhas * (1 + (i % 3) * 0.3)}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={BW.miolo} roughness={0.5} flatShading />
        </mesh>
      ))}
  </group>
);

export {lerp, clamp01, suave};
