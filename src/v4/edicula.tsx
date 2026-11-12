// Edícula com churrasqueira (24 m²) em todas as fases da obra. Mesma escala da casa (1 unidade = 1 m).
// Fica no mesmo lote da casa (planta.ts), com a frente aberta em z = 3,6 (linha de corte das vistas em corte).
// Planta: 6,0 × 4,0 m (X de -3 a 3, Z de -0,4 a 3,6). Fundo e laterais em bloco, frente aberta com viga de 6 m,
// churrasqueira no fundo à esquerda, bancada de granito de 2 m com pia no meio e lavabo 1,4 × 1,6 m no canto direito.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ESP_PAREDE, NIVEL_PISO, PE_DIREITO, Parede, TOPO_PAREDE, V2, V3, angulo, comprimento, solidos} from './planta';
import {Barra, Caixa, Cil, Instancias, Mat, clamp01, lerp, suave} from './kit';
import {Vaso} from '../v3/Pecas';

export const ED = {x0: -3, x1: 3, z0: -0.4, z1: 3.6};
export const ED_CENTRO: V3 = [0, 1.3, 1.6];

const porta = (c: number, larg = 0.7): Parede['vaos'][number] => ({c, larg, base: 0, alt: 2.1, tipo: 'porta'});
const janela = (c: number, larg = 1.2, base = 1.0, alt = 1.0): Parede['vaos'][number] => ({c, larg, base, alt, tipo: 'janela'});

export const ED_PAREDES: Parede[] = [
  {id: 'fundo', a: [-3, -0.4], b: [3, -0.4], ext: true, vaos: [janela(5.3, 0.6, 1.6, 0.5)]},
  {id: 'esq', a: [-3, -0.4], b: [-3, 3.6], ext: true, vaos: [janela(2.4, 1.2)]},
  {id: 'dir', a: [3, -0.4], b: [3, 3.6], ext: true, vaos: []},
  {id: 'lav1', a: [1.6, -0.4], b: [1.6, 1.2], ext: false, vaos: []},
  {id: 'lav2', a: [1.6, 1.2], b: [3, 1.2], ext: false, vaos: [porta(0.7)]},
];
// pilares de concreto nos cantos e nas pontas da frente aberta
export const ED_PILARES: V2[] = [[-3, -0.4], [3, -0.4], [-3, 3.6], [3, 3.6], [1.6, -0.4], [1.6, 1.2], [3, 1.2]];
// brocas (estacas de 25 cm) embaixo do baldrame, a cada ~1,5–2 m
export const ED_BROCAS: V2[] = [
  [-3, -0.4], [-1.5, -0.4], [0, -0.4], [1.6, -0.4], [3, -0.4],
  [-3, 1.6], [3, 1.6], [1.6, 1.2],
  [-3, 3.47], [-1, 3.47], [1, 3.47], [3, 3.47], // as da frente ficam 13 cm para dentro: aparecem inteiras na vista em corte
];
const BROCA_R = 0.125;
export const BROCA_FURO = 0.26;
export const BROCA_FUNDO = 1.5;

// ---------- fundação: brocas + viga baldrame (inclui a viga da frente, embaixo da borda do piso) ----------
const VIGAS_BALDRAME: Parede[] = [...ED_PAREDES, {id: 'frente', a: [-3, 3.6], b: [3, 3.6], ext: true, vaos: []}];

export const EdFundacao: React.FC<{broca?: number; ferro?: number; baldrame?: number; forma?: boolean; contrapiso?: number}> = ({broca = 0, ferro = 0, baldrame = 0, forma = false, contrapiso = 0}) => (
  <group>
    {ED_BROCAS.map(([x, z], i) => {
      const k = clamp01(broca * ED_BROCAS.length * 0.6 - i * 0.6 * 0.85);
      return (
        <group key={i} position={[x, 0, z]}>
          {k > 0 && <Cil pos={[0, -BROCA_FUNDO + (BROCA_FUNDO * k) / 2, 0]} r={BROCA_R - 0.01} h={BROCA_FUNDO * k} cor="#9aa0a6" seg={10} />}
          {ferro > 0 && [[-0.05, 0], [0.05, 0]].map(([dx, dz], j) => (
            <Barra key={j} a={[dx, -0.6, dz]} b={[dx, -0.6 + 0.75 * ferro, dz]} r={0.008} cor="#8a4b2a" />
          ))}
        </group>
      );
    })}
    {VIGAS_BALDRAME.map((w) => {
      const L = comprimento(w) + (w.ext ? ESP_PAREDE : 0);
      const cx = (w.a[0] + w.b[0]) / 2, cz = (w.a[1] + w.b[1]) / 2;
      const alt = 0.3;
      return (
        <group key={w.id} position={[cx, NIVEL_PISO - alt / 2, cz]} rotation={[0, angulo(w), 0]}>
          {baldrame > 0 && <Caixa pos={[(-L / 2) * (1 - baldrame), 0, 0]} tam={[L * baldrame, alt, 0.15]} cor="#9aa0a6" />}
          {forma && (
            <>
              <Caixa pos={[0, 0.02, 0.1]} tam={[L, alt + 0.06, 0.025]} cor="#c99a6a" />
              <Caixa pos={[0, 0.02, -0.1]} tam={[L, alt + 0.06, 0.025]} cor="#c99a6a" />
            </>
          )}
        </group>
      );
    })}
    {contrapiso > 0 && (
      <Caixa pos={[0, NIVEL_PISO - 0.06, ED.z0 + ((ED.z1 - ED.z0) * contrapiso) / 2]} tam={[ED.x1 - ED.x0, 0.1, (ED.z1 - ED.z0) * contrapiso]} cor="#a4a19b" />
    )}
  </group>
);

// trado manual (T de ferro com a broca em espiral) girando dentro do furo
export const Trado: React.FC<{pos: V3; t: number; desce: number}> = ({pos, t, desce}) => {
  const y = -BROCA_FUNDO * clamp01(desce) + 0.15;
  return (
    <group position={[pos[0], pos[1] + y, pos[2]]} rotation={[0, t * 5, 0]}>
      <Barra a={[0, 0, 0]} b={[0, 1.25, 0]} r={0.02} cor="#5d6670" />
      <Barra a={[-0.35, 1.25, 0]} b={[0.35, 1.25, 0]} r={0.025} cor="#c84b31" />
      {[0, 1, 2, 3].map((i) => (
        <Caixa key={i} pos={[0, 0.06 + i * 0.07, 0]} rot={[0, i * 0.9, 0.35]} tam={[0.22, 0.015, 0.06]} cor="#7f8790" />
      ))}
    </group>
  );
};

// ---------- piso cerâmico 60 × 60 assentado peça por peça (do fundo para a frente) ----------
export const EdPiso: React.FC<{ceramica?: number; cor?: string}> = ({ceramica = 1, cor = '#d9cbb5'}) => {
  const geo = useMemo(() => new THREE.BoxGeometry(0.585, 0.012, 0.585), []);
  const mats = useMemo(() => {
    const m: THREE.Matrix4[] = [];
    for (let z = ED.z0 + 0.3; z < ED.z1; z += 0.6) for (let x = ED.x0 + 0.3; x < ED.x1; x += 0.6) m.push(new THREE.Matrix4().makeTranslation(x, NIVEL_PISO + 0.006, z));
    return m;
  }, []);
  return (
    <group>
      <Caixa pos={[0, NIVEL_PISO - 0.06, (ED.z0 + ED.z1) / 2]} tam={[ED.x1 - ED.x0, 0.1, ED.z1 - ED.z0]} cor="#a4a19b" />
      {ceramica > 0 && <Instancias matrizes={mats} n={mats.length * ceramica} geo={geo} cor={cor} />}
    </group>
  );
};

// ---------- viga de concreto da frente (vão livre de 6 m) ----------
export const VigaFrente: React.FC<{p?: number}> = ({p = 1}) => {
  const L = ED.x1 - ED.x0 + ESP_PAREDE;
  if (p <= 0) return null;
  return <Caixa pos={[ED.x0 - ESP_PAREDE / 2 + (L * p) / 2, TOPO_PAREDE - 0.2, ED.z1]} tam={[L * p, 0.4, ESP_PAREDE + 0.01]} cor="#a7acb1" />;
};

// ---------- telhado de duas águas (cumeeira no eixo X, sobre z = 1,6), telha cerâmica ----------
const INCL = 0.32;
const BEIRAL = 0.5;
const ZC = (ED.z0 + ED.z1) / 2;
const HZ = (ED.z1 - ED.z0) / 2 + ESP_PAREDE / 2; // meia profundidade até a face externa
export const ED_YC = TOPO_PAREDE + 0.12 + HZ * INCL; // altura da cumeeira
const yEm = (z: number) => ED_YC - Math.abs(z - ZC) * INCL;
const ZB = HZ + BEIRAL;
const XB = ED.x1 + ESP_PAREDE / 2 + 0.35;

export const EdTelhado: React.FC<{madeira?: number; telhas?: number}> = ({madeira = 1, telhas = 1}) => {
  const ang = Math.atan(INCL);
  const geoT = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.115, 0.115, 0.42, 7, 1, false, 0, Math.PI);
    g.rotateX(Math.PI / 2);
    g.rotateZ(Math.PI / 2);
    return g;
  }, []);
  const matsT = useMemo(() => {
    const m: THREE.Matrix4[] = [];
    const passo = 0.36;
    const comp = ZB / Math.cos(ang);
    const linhas = Math.ceil(comp / passo);
    for (let r = 0; r < linhas; r++) for (const lado of [1, -1]) for (let x = -XB + 0.1; x <= XB; x += 0.21) {
      const s = comp - (r + 0.5) * passo;
      const z = ZC + lado * s * Math.cos(ang);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(lado * ang, 0, 0));
      m.push(new THREE.Matrix4().compose(new THREE.Vector3(x, yEm(z) + 0.1, z), q, new THREE.Vector3(1, 1, 1)));
    }
    return m;
  }, [ang]);
  const caibros = useMemo(() => {
    const a: number[] = [];
    for (let x = -XB; x <= XB + 1e-6; x += 0.5) a.push(x);
    return a;
  }, []);
  const oitaoGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-HZ, 0);
    s.lineTo(HZ, 0);
    s.lineTo(0, ED_YC - TOPO_PAREDE - 0.02);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {depth: ESP_PAREDE, bevelEnabled: false});
    g.rotateY(Math.PI / 2);
    return g;
  }, []);
  return (
    <group>
      {[ED.x0 - ESP_PAREDE / 2, ED.x1 - ESP_PAREDE / 2].map((x) => (
        <mesh key={x} geometry={oitaoGeo} position={[x, TOPO_PAREDE, ZC]} castShadow receiveShadow>
          <Mat cor="#d9773e" />
        </mesh>
      ))}
      {madeira > 0 && [0, 1.1, -1.1, ZB - 0.3, -(ZB - 0.3)].map((dz, i) => (
        <Caixa key={'t' + i} pos={[0, yEm(ZC + dz) - 0.06, ZC + dz]} tam={[2 * XB * clamp01(madeira * 3 - i * 0.3), 0.12, 0.06]} cor="#9c6b42" />
      ))}
      {madeira > 0.3 && caibros.map((x, i) => {
        const k = clamp01((madeira - 0.3) * 2.5 - i / caibros.length);
        if (k <= 0) return null;
        return (
          <group key={'c' + i}>
            <Barra a={[x, ED_YC - 0.01, ZC]} b={[x, ED_YC + (yEm(ZC + ZB) - ED_YC) * k, ZC + ZB * k]} r={0.03} quadrada cor="#b07a4a" />
            <Barra a={[x, ED_YC - 0.01, ZC]} b={[x, ED_YC + (yEm(ZC + ZB) - ED_YC) * k, ZC - ZB * k]} r={0.03} quadrada cor="#b07a4a" />
          </group>
        );
      })}
      {madeira > 0.75 && Array.from({length: 8}).map((_, r) => {
        const dz = ZB - r * 0.36;
        if (dz < 0.1) return null;
        const k = clamp01((madeira - 0.75) * 4 * 8 - r);
        if (k <= 0) return null;
        return (
          <group key={'r' + r}>
            <Caixa pos={[0, yEm(ZC + dz) + 0.045, ZC + dz]} tam={[2 * XB * k, 0.02, 0.05]} cor="#d2a26d" />
            <Caixa pos={[0, yEm(ZC - dz) + 0.045, ZC - dz]} tam={[2 * XB * k, 0.02, 0.05]} cor="#d2a26d" />
          </group>
        );
      })}
      {telhas > 0 && <Instancias matrizes={matsT} n={matsT.length * telhas} geo={geoT} cor="#c8582f" />}
      {telhas > 0.98 && <Caixa pos={[0, ED_YC + 0.14, ZC]} tam={[2 * XB, 0.14, 0.3]} cor="#b04a26" />}
    </group>
  );
};

// ---------- churrasqueira de alvenaria (base, braseiro refratário, coifa, duto de inox) ----------
export const CH = {x: -1.7, z: 0.02, larg: 1.3, prof: 0.7};
const Y0 = NIVEL_PISO;
const Y_BRASEIRO = Y0 + 0.85;
const Y_COIFA = Y0 + 1.55;
const Y_DUTO = Y0 + 2.35;
export const DUTO_TOPO = ED_YC + 0.75;

export const Churrasqueira: React.FC<{p?: number; t?: number; fogo?: boolean; duto?: boolean}> = ({p = 1, t = 0, fogo = false, duto = true}) => {
  const k = (a: number, b: number) => clamp01((p - a) / (b - a));
  const base = k(0, 0.3), refr = k(0.3, 0.5), coifa = k(0.5, 0.7), dt = k(0.7, 0.85), grelha = k(0.85, 1);
  const {x, z, larg, prof} = CH;
  const tijolo = '#b5562f';
  const hb = (Y_BRASEIRO - Y0) * base;
  return (
    <group>
      {/* base de tijolo com a boca do depósito de lenha */}
      {base > 0 && <Caixa pos={[x, Y0 + hb / 2, z]} tam={[larg, hb, prof]} cor={tijolo} />}
      {base > 0.95 && <Caixa pos={[x, Y0 + 0.35, z + prof / 2 + 0.005]} tam={[0.8, 0.45, 0.02]} cor="#3a2a22" sombra={false} />}
      {base > 0.95 && <Caixa pos={[x, Y_BRASEIRO - 0.02, z + 0.06]} tam={[larg + 0.1, 0.06, prof + 0.12]} cor="#d8d2c6" />}
      {/* caixa refratária (fundo e laterais) onde bate o fogo */}
      {refr > 0 && (
        <group>
          <Caixa pos={[x, Y_BRASEIRO + (0.7 * refr) / 2, z - prof / 2 + 0.06]} tam={[larg, 0.7 * refr, 0.12]} cor="#e8cf9a" />
          {[-1, 1].map((s) => (<Caixa key={s} pos={[x + s * (larg / 2 - 0.06), Y_BRASEIRO + (0.7 * refr) / 2, z]} tam={[0.12, 0.7 * refr, prof]} cor="#e8cf9a" />))}
        </group>
      )}
      {/* coifa (tronco de pirâmide) */}
      {coifa > 0 && (
        <group>
          <Caixa pos={[x, Y_COIFA + 0.05, z]} tam={[larg + 0.06, 0.1, prof + 0.04]} cor={tijolo} />
          <Cil pos={[x, Y_COIFA + 0.1 + (0.7 * coifa) / 2, z - 0.02]} r={lerp(0.92, 0.16, coifa)} r2={0.92} h={0.7 * coifa} seg={4} rot={[0, Math.PI / 4, 0]} cor={tijolo} />
        </group>
      )}
      {/* duto de inox subindo até passar a cumeeira, com chapéu */}
      {duto && dt > 0 && (
        <group>
          <Cil pos={[x, Y_DUTO + ((DUTO_TOPO - Y_DUTO) * dt) / 2 - 0.05, z - 0.02]} r={0.1} h={(DUTO_TOPO - Y_DUTO) * dt} cor="#d7dde3" seg={14} />
          {dt > 0.98 && <Cil pos={[x, DUTO_TOPO + 0.12, z - 0.02]} r={0.02} r2={0.24} h={0.16} cor="#bfc6cd" seg={14} />}
        </group>
      )}
      {/* grelha e fogo */}
      {grelha > 0 && Array.from({length: 9}).map((_, i) => (
        <Barra key={i} a={[x - 0.5, Y_BRASEIRO + 0.32, z - 0.25 + i * 0.065]} b={[x - 0.5 + 1.0 * grelha, Y_BRASEIRO + 0.32, z - 0.25 + i * 0.065]} r={0.006} cor="#3b3b40" sombra={false} />
      ))}
      {fogo && <Fogo pos={[x, Y_BRASEIRO + 0.03, z]} t={t} />}
    </group>
  );
};

export const Fogo: React.FC<{pos: V3; t: number}> = ({pos, t}) => (
  <group position={pos}>
    <Caixa pos={[0, 0.03, 0]} tam={[0.9, 0.05, 0.45]} cor="#2a1d17" sombra={false} />
    {[-0.3, -0.1, 0.1, 0.3].map((dx, i) => {
      const h = 0.16 + 0.06 * Math.sin(t * 9 + i * 1.7);
      return (
        <mesh key={i} position={[dx, 0.06 + h / 2, (i % 2) * 0.1 - 0.05]}>
          <coneGeometry args={[0.07, h, 24]} />
          <meshStandardMaterial color={i % 2 ? '#ffb02e' : '#ff6a1f'} emissive={i % 2 ? '#ff9a1f' : '#ff4a10'} emissiveIntensity={1.2} />
        </mesh>
      );
    })}
  </group>
);

// fumaça: bolinhas subindo. 'boa' = sai pelo chapéu do duto; 'ruim' = sai pela frente da coifa, na altura do rosto
export const Fumaca: React.FC<{t: number; modo: 'boa' | 'ruim'; n?: number}> = ({t, modo, n = 14}) => (
  <group>
    {Array.from({length: n}).map((_, i) => {
      const fase = ((t * 0.55 + i / n) % 1 + 1) % 1;
      const s = 0.12 + fase * 0.35;
      let pos: V3;
      if (modo === 'boa') pos = [CH.x + Math.sin(i * 2.1 + t) * 0.15 * fase + fase * 0.6, DUTO_TOPO + 0.3 + fase * 2.4, CH.z + Math.cos(i * 1.3) * 0.15 * fase];
      else pos = [CH.x + Math.sin(i * 2.1 + t * 2) * 0.25 * fase - fase * 0.8, Y_BRASEIRO + 0.45 + fase * 0.8, CH.z + 0.3 + fase * 1.6];
      return (
        <mesh key={i} position={pos} scale={s}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={modo === 'boa' ? '#e9edf2' : '#8d9198'} transparent opacity={0.85 * (1 - fase * 0.7)} depthWrite={false} />
        </mesh>
      );
    })}
  </group>
);

// ---------- bancada de granito de 2 m com cuba e torneira ----------
export const BANC = {x0: -0.75, x1: 1.25, z: -0.33 + 0.3};
export const Bancada: React.FC<{p?: number}> = ({p = 1}) => {
  const {x0, x1, z} = BANC;
  const L = x1 - x0;
  const k = clamp01(p);
  return (
    <group>
      <Caixa pos={[(x0 + x1) / 2, NIVEL_PISO + 0.43, z]} tam={[L, 0.86, 0.56]} cor="#efe8dc" />
      {[0.25, 0.75, 1.25, 1.75].map((u) => (<Caixa key={u} pos={[x0 + u, NIVEL_PISO + 0.45, z + 0.285]} tam={[0.46, 0.7, 0.02]} cor="#e2d8c8" sombra={false} />))}
      {k > 0 && <Caixa pos={[x0 + (L * k) / 2, NIVEL_PISO + 0.88, z + 0.02]} tam={[L * k, 0.035, 0.62]} cor="#26292f" />}
      {k > 0.99 && (
        <>
          <Caixa pos={[x0 + 1.3, NIVEL_PISO + 0.9, z + 0.02]} tam={[0.5, 0.012, 0.38]} cor="#b9c0c7" sombra={false} />
          <Barra a={[x0 + 1.3, NIVEL_PISO + 0.9, z - 0.24]} b={[x0 + 1.3, NIVEL_PISO + 1.22, z - 0.24]} r={0.018} cor="#c9d0d6" />
          <Barra a={[x0 + 1.3, NIVEL_PISO + 1.22, z - 0.24]} b={[x0 + 1.3, NIVEL_PISO + 1.18, z - 0.06]} r={0.016} cor="#c9d0d6" />
          <Caixa pos={[(x0 + x1) / 2, NIVEL_PISO + 0.95, z - 0.285]} tam={[L, 0.1, 0.02]} cor="#26292f" />
        </>
      )}
    </group>
  );
};

// ---------- lavabo: vaso + pia pequena ----------
export const Lavabo: React.FC = () => (
  <group position={[0, NIVEL_PISO, 0]}>
    <Vaso pos={[2.6, 0, -0.05]} />
    <Caixa pos={[2.75, 0.8, 0.85]} tam={[0.35, 0.12, 0.45]} cor="#f7f7f7" />
  </group>
);

// ---------- mesa de churrasco com bancos ----------
export const Mesa: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Caixa pos={[0, 0.75, 0]} tam={[1.8, 0.06, 0.9]} cor="#a8703f" />
    {[[-0.8, -0.38], [0.8, -0.38], [-0.8, 0.38], [0.8, 0.38]].map(([x, z], i) => (<Caixa key={i} pos={[x, 0.37, z]} tam={[0.07, 0.74, 0.07]} cor="#8b5a3c" />))}
    {[-0.75, 0.75].map((z) => (<Caixa key={z} pos={[0, 0.44, z]} tam={[1.7, 0.05, 0.3]} cor="#8b5a3c" />))}
    <Cil pos={[-0.4, 0.82, 0]} r={0.18} h={0.04} cor="#f2f2f2" />
    <Cil pos={[0.4, 0.82, 0.1]} r={0.15} h={0.04} cor="#f2f2f2" />
    <Caixa pos={[-0.4, 0.86, 0]} tam={[0.2, 0.04, 0.12]} cor="#8a3b22" />
  </group>
);

// ---------- instalações: vala do fundo do quintal até a casa + canos e conduítes nas paredes ----------
export const EdInstalacoes: React.FC<{p: number}> = ({p}) => {
  const k = (i: number, n: number) => clamp01(p * n - i);
  const y0 = NIVEL_PISO;
  const vala = suave(p * 2.2);
  const xa = 0.55; // eixo da vala (sai embaixo da pia)
  const zf = 7.4; // perto da calçada (lado da casa)
  const tubos: {a: V3; b: V3; r: number; cor: string}[] = [
    {a: [xa - 0.08, 0.04, ED.z1], b: [xa - 0.08, 0.04, zf], r: 0.05, cor: '#f2f2f2'}, // esgoto
    {a: [xa + 0.06, 0.05, ED.z1], b: [xa + 0.06, 0.05, zf], r: 0.025, cor: '#3d7fe0'}, // água
    {a: [xa + 0.16, 0.05, ED.z1], b: [xa + 0.16, 0.05, zf], r: 0.02, cor: '#ffd23f'}, // luz
    {a: [xa + 0.06, y0 + 0.02, ED.z1], b: [xa + 0.06, y0 + 0.02, -0.3], r: 0.025, cor: '#3d7fe0'},
    {a: [xa - 0.08, y0 + 0.02, ED.z1], b: [xa - 0.08, y0 + 0.02, -0.25], r: 0.045, cor: '#f2f2f2'},
    {a: [xa + 0.06, y0 + 0.02, -0.3], b: [xa + 0.06, y0 + 1.1, -0.3], r: 0.025, cor: '#3d7fe0'},
    {a: [-2.93, y0 + 0.3, 3.1], b: [-2.93, TOPO_PAREDE, 3.1], r: 0.025, cor: '#ffd23f'},
    {a: [-0.2, y0 + 1.1, -0.33], b: [-0.2, TOPO_PAREDE, -0.33], r: 0.025, cor: '#ffd23f'},
    {a: [2.93, y0 + 1.1, 2.4], b: [2.93, TOPO_PAREDE, 2.4], r: 0.025, cor: '#ffd23f'},
  ];
  return (
    <group>
      <Caixa pos={[xa + 0.04, 0.008, ED.z1 + ((zf - ED.z1) * vala) / 2]} tam={[0.55, 0.016, (zf - ED.z1) * vala]} cor="#7a4a2a" sombra={false} />
      {tubos.map((tb, i) => {
        const kk = k(i * 0.7, tubos.length * 0.7 + 0.5);
        if (kk <= 0) return null;
        return <Barra key={i} a={tb.a} b={[lerp(tb.a[0], tb.b[0], kk), lerp(tb.a[1], tb.b[1], kk), lerp(tb.a[2], tb.b[2], kk)]} r={tb.r} cor={tb.cor} />;
      })}
      {[[-2.93, y0 + 0.3, 3.1], [-0.2, y0 + 1.1, -0.33], [2.93, y0 + 1.1, 2.4]].map((a, i) => (<Caixa key={i} pos={a as V3} tam={[0.08, 0.1, 0.08]} cor="#ff8a1f" />))}
      <Caixa pos={[-2.92, y0 + 1.6, 0.9]} tam={[0.06, 0.4, 0.3]} cor="#f7f7f7" />
    </group>
  );
};

// ---------- chapisco e reboco na parede esquerda, pelo lado de fora (andam do fundo para a frente) ----------
export const CamadasEsq: React.FC<{chapisco: number; reboco: number}> = ({chapisco, reboco}) => {
  const w = ED_PAREDES.find((x) => x.id === 'esq')!;
  const L = comprimento(w);
  const faixa = (lim: number, dx: number, esp: number, cor: string, tag: string) =>
    solidos(w).map((s, i) => {
      const u0 = Math.max(-0.07, s.u0 - (s.u0 < 1e-6 ? 0.07 : 0));
      const u1 = Math.min(s.u1 + (s.u1 > L - 1e-6 ? 0.07 : 0), lim * (L + 0.14) - 0.07);
      if (u1 - u0 < 0.01) return null;
      return <Caixa key={tag + i} pos={[w.a[0] - dx, NIVEL_PISO + (s.v0 + s.v1) / 2, w.a[1] + (u0 + u1) / 2]} tam={[esp, s.v1 - s.v0, u1 - u0]} cor={cor} />;
    });
  return (
    <group>
      {faixa(chapisco, 0.075, 0.012, '#7d7f84', 'ch')}
      {faixa(reboco, 0.09, 0.02, '#d8d4cb', 'rb')}
    </group>
  );
};

export const ED_PE = PE_DIREITO;
