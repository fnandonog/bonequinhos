// A casa de 50 m² em todas as fases da obra. Cada fase é um parâmetro (0 a 1), então qualquer cena
// pode mostrar a casa exatamente no ponto da obra em que a narração está.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {CASA, ESP_LAJE, ESP_PAREDE, LOTE, NIVEL_PISO, PAREDES, PE_DIREITO, PILARES, Parede, TOPO_LAJE, TOPO_PAREDE, V2, V3, angulo, comprimento, solidos} from './planta';
import {Barra, Caixa, Cil, Instancias, Mat, Tufo, caixaUV, clamp01, lerp, texBloco, texTerra} from './kit';
import {Armario, Bancada, Cama, Chuveiro, Geladeira, Sofa, Vaso} from '../v3/Pecas';

// ---------- terreno em corte (maquete): dá para ver embaixo da terra ----------
const FURO = 0.8; // sapata 80 x 80 cm
const PROF = 1.0; // 1 m de profundidade

export const QUINTAL = 4.0; // metros de frente (calçada + jardim) quando a cena não é em corte
// furos/furo/fundo: outra obra (ex.: brocas da edícula) usa o mesmo lote com outros buracos
export const Lote: React.FC<{cava?: number; topo?: 'terra' | 'grama'; mato?: boolean; quintal?: boolean; furos?: V2[]; furo?: number; fundo?: number}> = ({cava = 0, topo = 'terra', mato = false, quintal = true, furos = PILARES, furo = FURO, fundo = PROF}) => {
  const FURO = furo, PROF = fundo, PILARES = furos;
  const terra = texTerra();
  const corTopo = topo === 'grama' ? '#7cc576' : '#b98b5e';
  // grade de células que deixa um buraco em cada sapata
  const celulas = useMemo(() => {
    const xs = new Set<number>([LOTE.x0, LOTE.x1]);
    const zs = new Set<number>([LOTE.z0, LOTE.z1]);
    PILARES.forEach(([x, z]) => {
      xs.add(x - FURO / 2); xs.add(x + FURO / 2);
      zs.add(Math.max(LOTE.z0, z - FURO / 2)); zs.add(Math.min(LOTE.z1, z + FURO / 2));
    });
    const X = [...xs].sort((a, b) => a - b);
    const Z = [...zs].sort((a, b) => a - b);
    const out: {x0: number; x1: number; z0: number; z1: number; furo: boolean}[] = [];
    for (let i = 0; i < X.length - 1; i++) for (let j = 0; j < Z.length - 1; j++) {
      const cx = (X[i] + X[i + 1]) / 2, cz = (Z[j] + Z[j + 1]) / 2;
      if (X[i + 1] - X[i] < 1e-4 || Z[j + 1] - Z[j] < 1e-4) continue;
      const furo = PILARES.some(([x, z]) => Math.abs(cx - x) < FURO / 2 && Math.abs(cz - z) < FURO / 2);
      out.push({x0: X[i], x1: X[i + 1], z0: Z[j], z1: Z[j + 1], furo});
    }
    return out;
  }, [PILARES, FURO]);
  const prof = PROF * clamp01(cava);
  return (
    <group>
      {/* bloco de baixo */}
      <mesh position={[(LOTE.x0 + LOTE.x1) / 2, (LOTE.fundo - PROF) / 2, (LOTE.z0 + LOTE.z1) / 2]} receiveShadow>
        <boxGeometry args={[LOTE.x1 - LOTE.x0, -PROF - LOTE.fundo, LOTE.z1 - LOTE.z0]} />
        <Mat cor="#a65f2c" />
      </mesh>
      {celulas.map((c, i) => {
        const h = c.furo ? PROF - prof : PROF;
        if (h <= 0.001) return null;
        const w = c.x1 - c.x0, d = c.z1 - c.z0;
        return (
          <mesh key={i} position={[(c.x0 + c.x1) / 2, -PROF + h / 2, (c.z0 + c.z1) / 2]} receiveShadow castShadow={false}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial attach="material-0" color="#ffffff" map={terra} flatShading />
            <meshStandardMaterial attach="material-1" color="#ffffff" map={terra} flatShading />
            <meshStandardMaterial attach="material-2" color={c.furo ? '#8a5a35' : corTopo} flatShading />
            <meshStandardMaterial attach="material-3" color="#8a5a35" />
            <meshStandardMaterial attach="material-4" color="#ffffff" map={terra} flatShading />
            <meshStandardMaterial attach="material-5" color="#ffffff" map={terra} flatShading />
          </mesh>
        );
      })}
      {quintal && (
        <group>
          <mesh position={[(LOTE.x0 + LOTE.x1) / 2, LOTE.fundo / 2, LOTE.z1 + QUINTAL / 2]} receiveShadow>
            <boxGeometry args={[LOTE.x1 - LOTE.x0, -LOTE.fundo, QUINTAL]} />
            <meshStandardMaterial attach="material-0" color="#ffffff" map={terra} flatShading />
            <meshStandardMaterial attach="material-1" color="#ffffff" map={terra} flatShading />
            <meshStandardMaterial attach="material-2" color={corTopo} flatShading />
            <meshStandardMaterial attach="material-3" color="#8a5a35" />
            <meshStandardMaterial attach="material-4" color="#ffffff" map={terra} flatShading />
            <meshStandardMaterial attach="material-5" color="#ffffff" map={terra} flatShading />
          </mesh>
          <Caixa pos={[0, 0.03, LOTE.z1 + QUINTAL - 0.6]} tam={[LOTE.x1 - LOTE.x0, 0.06, 1.2]} cor="#d9d4ca" />
          <Caixa pos={[1.5, 0.02, LOTE.z1 + 1.4]} tam={[1.0, 0.04, 2.8]} cor="#cfc8bb" />
        </group>
      )}
      {/* calçada / grama da borda para a maquete ter acabamento */}
      {mato && Array.from({length: 46}).map((_, i) => {
        const a = (i * 137.5 * Math.PI) / 180;
        const r = 1 + ((i * 37) % 50) / 10;
        return <Tufo key={i} pos={[Math.cos(a) * r * 0.9, 0, -3 + Math.sin(a) * r]} esc={1 + (i % 3) * 0.4} />;
      })}
    </group>
  );
};

// mundo em volta da maquete (grama, vizinhos ao fundo, muros laterais)
export const Arredores: React.FC<{muro?: boolean; quintal?: boolean}> = ({muro = true, quintal = true}) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LOTE.fundo - 0.01, -10]} receiveShadow>
      <planeGeometry args={[120, 120]} />
      <Mat cor="#8fcf7a" />
    </mesh>
    {muro && (
      <>
        <Caixa pos={[LOTE.x0 + 0.07, 0.9, (LOTE.z0 + LOTE.z1 + (quintal ? QUINTAL - 1.2 : 0)) / 2]} tam={[0.14, 1.8, LOTE.z1 - LOTE.z0 + (quintal ? QUINTAL - 1.2 : 0)]} cor="#e7dccb" />
        <Caixa pos={[LOTE.x1 - 0.07, 0.9, (LOTE.z0 + LOTE.z1 + (quintal ? QUINTAL - 1.2 : 0)) / 2]} tam={[0.14, 1.8, LOTE.z1 - LOTE.z0 + (quintal ? QUINTAL - 1.2 : 0)]} cor="#e7dccb" />
        <Caixa pos={[0, 0.9, LOTE.z0 + 0.07]} tam={[LOTE.x1 - LOTE.x0, 1.8, 0.14]} cor="#e7dccb" />
      </>
    )}
  </group>
);

// ---------- gabarito: tábuas em volta + linhas de nylon no eixo das paredes ----------
export const Gabarito: React.FC<{p: number}> = ({p}) => {
  const o = 1.0, y = 0.6;
  const x0 = CASA.x0 - o, x1 = CASA.x1 + o, z0 = CASA.z0 - o, z1 = CASA.z1 + o;
  const estacas: [number, number][] = [];
  for (let x = x0; x <= x1 + 1e-6; x += 1.15) { estacas.push([x, z0]); }
  for (let z = z0; z <= z1 + 1e-6; z += 1.2) { estacas.push([x0, z]); estacas.push([x1, z]); }
  const linhas = PAREDES.filter((w) => w.ext || w.id === 'meio');
  return (
    <group>
      {estacas.map(([x, z], i) => (<Caixa key={i} pos={[x, y / 2, z]} tam={[0.06, y + 0.1, 0.06]} cor="#9c6b42" />))}
      {[z0, z1].map((z) => (<Caixa key={z} pos={[0, y, z]} tam={[x1 - x0, 0.15, 0.025]} cor="#c99a6a" />))}
      {Array.from({length: 7}).map((_, i) => (<Caixa key={'f' + i} pos={[x0 + i * ((x1 - x0) / 6), y / 2, z1]} tam={[0.06, y + 0.1, 0.06]} cor="#9c6b42" />))}
      <Caixa pos={[x0, y, (z0 + z1) / 2]} tam={[0.025, 0.15, z1 - z0]} cor="#c99a6a" />
      <Caixa pos={[x1, y, (z0 + z1) / 2]} tam={[0.025, 0.15, z1 - z0]} cor="#c99a6a" />
      {linhas.map((w, i) => {
        const k = clamp01(p * linhas.length - i);
        if (k <= 0) return null;
        const horizontal = w.a[1] === w.b[1];
        const a: V3 = horizontal ? [x0, y + 0.08, w.a[1]] : [w.a[0], y + 0.08, z0];
        const b: V3 = horizontal ? [x1, y + 0.08, w.a[1]] : [w.a[0], y + 0.08, z1];
        return <Barra key={w.id} a={a} b={[lerp(a[0], b[0], k), b[1], lerp(a[2], b[2], k)]} r={0.012} cor="#ff3b6b" sombra={false} />;
      })}
    </group>
  );
};

// ---------- fundação ----------
// sapata (concreto) + arranque do pilar (4 ferros) + viga baldrame no perímetro e nas paredes internas
export const Fundacao: React.FC<{sapata?: number; ferro?: number; baldrame?: number; forma?: boolean; imp?: number; pilarAte?: number}> = ({sapata = 0, ferro = 0, baldrame = 0, forma = false, imp = 0, pilarAte = 0}) => {
  const vigas = PAREDES;
  return (
    <group>
      {PILARES.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {sapata > 0 && <Caixa pos={[0, -PROF + 0.15 * sapata, 0]} tam={[FURO - 0.06, 0.3 * sapata, FURO - 0.06]} cor="#9aa0a6" />}
          {sapata > 0.5 && <Cil pos={[0, -PROF + 0.3 + 0.1, 0]} r={0.25} r2={0.38} h={0.2} seg={4} rot={[0, Math.PI / 4, 0]} cor="#9aa0a6" />}
          {ferro > 0 && [[-0.06, -0.1], [0.06, -0.1], [-0.06, 0.1], [0.06, 0.1]].map(([dx, dz], k) => (
            <Barra key={k} a={[dx, -PROF + 0.05, dz]} b={[dx, -PROF + 0.05 + (PROF + 0.8) * ferro, dz]} r={0.008} cor="#8a4b2a" />
          ))}
          {ferro > 0.6 && [0, 0.3, 0.6, 0.9, 1.2, 1.5].map((y) => (
            <Caixa key={y} pos={[0, -PROF + 0.2 + y, 0]} tam={[0.16, 0.012, 0.24]} cor="#8a4b2a" sombra={false} />
          ))}
          {pilarAte > 0 && <Caixa pos={[0, -PROF + 0.3 + (pilarAte - (-PROF + 0.3)) / 2, 0]} tam={[0.14, pilarAte + PROF - 0.3, 0.3]} cor="#a7acb1" />}
        </group>
      ))}
      {vigas.map((w) => (
        <Viga key={w.id} w={w} baldrame={baldrame} forma={forma} imp={imp} />
      ))}
    </group>
  );
};

const Viga: React.FC<{w: Parede; baldrame: number; forma: boolean; imp: number}> = ({w, baldrame, forma, imp}) => {
  const L = comprimento(w) + (w.ext ? ESP_PAREDE : 0);
  const ang = angulo(w);
  const cx = (w.a[0] + w.b[0]) / 2, cz = (w.a[1] + w.b[1]) / 2;
  const alt = 0.3; // viga 15 x 30, topo no nível do piso
  return (
    <group position={[cx, NIVEL_PISO - alt / 2, cz]} rotation={[0, ang, 0]}>
      {baldrame > 0 && <Caixa pos={[(-L / 2) * (1 - baldrame), 0, 0]} tam={[L * baldrame, alt, 0.15]} cor={imp > 0 ? '#1f1f24' : '#9aa0a6'} />}
      {baldrame > 0 && imp > 0 && imp < 1 && <Caixa pos={[(L / 2) * imp, 0, 0]} tam={[L * (1 - imp), alt + 0.002, 0.152]} cor="#9aa0a6" />}
      {forma && (
        <>
          <Caixa pos={[0, 0.02, 0.1]} tam={[L, alt + 0.06, 0.025]} cor="#c99a6a" />
          <Caixa pos={[0, 0.02, -0.1]} tam={[L, alt + 0.06, 0.025]} cor="#c99a6a" />
        </>
      )}
    </group>
  );
};

// ---------- paredes ----------
export type Acab = 'bloco' | 'reboco' | 'pintura';
export const Paredes: React.FC<{h?: number; acab?: Acab; corExt?: string; corInt?: string; esconder?: string[]; corte?: number; pilares?: boolean; vergas?: boolean; so?: string[]; lista?: Parede[]; listaPilares?: V2[]}> = ({h = PE_DIREITO, acab = 'bloco', corExt = '#f2e2c4', corInt = '#fbf7ef', esconder = [], corte, pilares = false, vergas = false, so, lista = PAREDES, listaPilares = PILARES}) => {
  const bloco = texBloco();
  const PAREDES = lista, PILARES = listaPilares;
  return (
    <group>
      {PAREDES.filter((w) => !esconder.includes(w.id) && (!so || so.includes(w.id))).map((w) => {
        const L = comprimento(w);
        const ang = angulo(w);
        const dx = (w.b[0] - w.a[0]) / L, dz = (w.b[1] - w.a[1]) / L;
        const hMax = corte !== undefined && w.id !== 'fundo' && w.id !== 'esq' ? Math.min(h, corte) : h;
        const cor = acab === 'bloco' ? '#ffffff' : acab === 'reboco' ? '#cfcac0' : w.ext ? corExt : corInt;
        return (
          <group key={w.id}>
            {solidos(w).map((s, i) => {
              let u0 = s.u0, u1 = s.u1;
              if (w.ext && u0 < 1e-6) u0 -= ESP_PAREDE / 2;
              if (w.ext && u1 > L - 1e-6) u1 += ESP_PAREDE / 2;
              const v0 = s.v0, v1 = Math.min(s.v1, hMax);
              if (v1 - v0 < 0.005) return null;
              const um = (u0 + u1) / 2;
              return (
                <PecaParede key={i} pos={[w.a[0] + dx * um, NIVEL_PISO + (v0 + v1) / 2, w.a[1] + dz * um]} ang={ang} w={u1 - u0} h={v1 - v0} ou={u0} ov={v0} map={acab === 'bloco' ? bloco : null} cor={cor} esp={acab === 'bloco' ? ESP_PAREDE : ESP_PAREDE + 0.04} />
              );
            })}
            {vergas && w.vaos.map((v, i) => {
              const u = v.c;
              const y = NIVEL_PISO + v.base + v.alt + 0.05;
              if (y > NIVEL_PISO + hMax) return null;
              return <Caixa key={i} pos={[w.a[0] + dx * u, y, w.a[1] + dz * u]} rot={ang} tam={[v.larg + 0.6, 0.1, ESP_PAREDE + 0.01]} cor="#a7acb1" />;
            })}
          </group>
        );
      })}
      {pilares && PILARES.map(([x, z], i) => (
        <Caixa key={i} pos={[x, NIVEL_PISO + Math.min(h, PE_DIREITO) / 2, z]} tam={[ESP_PAREDE + 0.012, Math.min(h, PE_DIREITO), ESP_PAREDE + 0.012]} cor="#a7acb1" />
      ))}
    </group>
  );
};

const PecaParede: React.FC<{pos: V3; ang: number; w: number; h: number; ou: number; ov: number; map: THREE.Texture | null; cor: string; esp: number}> = ({pos, ang, w, h, ou, ov, map, cor, esp}) => {
  const geo = useMemo(() => caixaUV(w, h, esp, 0.6, 0.4, ou, ov), [w, h, esp, ou, ov]);
  return (
    <mesh geometry={geo} position={pos} rotation={[0, ang, 0]} castShadow receiveShadow>
      <Mat cor={cor} map={map} />
    </mesh>
  );
};

// portas e janelas
export const Esquadrias: React.FC<{esconder?: string[]; p?: number; lista?: Parede[]}> = ({esconder = [], p = 1, lista = PAREDES}) => (
  <group>
    {lista.filter((w) => !esconder.includes(w.id)).flatMap((w) => {
      const L = comprimento(w), ang = angulo(w);
      const dx = (w.b[0] - w.a[0]) / L, dz = (w.b[1] - w.a[1]) / L;
      return w.vaos.filter((v) => v.tipo !== 'passagem').map((v, i) => {
        const pos: V3 = [w.a[0] + dx * v.c, NIVEL_PISO + v.base + v.alt / 2, w.a[1] + dz * v.c];
        const s = clamp01(p);
        if (s <= 0) return null;
        return (
          <group key={w.id + i} position={pos} rotation={[0, ang, 0]} scale={[1, s, 1]}>
            {v.tipo === 'porta' ? (
              <>
                <Caixa tam={[v.larg, v.alt, 0.04]} cor={w.ext ? '#8b5a3c' : '#e9d8b6'} />
                <mesh position={[v.larg * 0.35, -0.05, 0.05]}><sphereGeometry args={[0.035, 6, 6]} /><Mat cor="#ffd23f" /></mesh>
              </>
            ) : (
              <>
                <Caixa tam={[v.larg, v.alt, 0.06]} cor="#f7f7f7" />
                <Caixa tam={[v.larg - 0.1, v.alt - 0.1, 0.07]} cor="#a8dcff" />
                <Caixa tam={[0.04, v.alt - 0.1, 0.08]} cor="#f7f7f7" />
              </>
            )}
          </group>
        );
      });
    })}
  </group>
);

// piso: contrapiso + porcelanato 60x60 assentado peça por peça
export const Piso: React.FC<{contrapiso?: number; ceramica?: number; cor?: string}> = ({contrapiso = 1, ceramica = 0, cor = '#efe6d8'}) => {
  const geo = useMemo(() => new THREE.BoxGeometry(0.585, 0.012, 0.585), []);
  const mats = useMemo(() => {
    const m: THREE.Matrix4[] = [];
    for (let z = CASA.z1 - 0.3; z > CASA.z0; z -= 0.6) for (let x = CASA.x0 + 0.3; x < CASA.x1; x += 0.6) m.push(new THREE.Matrix4().makeTranslation(x, NIVEL_PISO - 0.006, z));
    return m;
  }, []);
  return (
    <group>
      {contrapiso > 0 && <Caixa pos={[0, NIVEL_PISO - 0.08, CASA.z1 - (CASA.z1 - CASA.z0) * contrapiso / 2]} tam={[CASA.x1 - CASA.x0, 0.12, (CASA.z1 - CASA.z0) * contrapiso]} cor="#a4a19b" />}
      {ceramica > 0 && <Instancias matrizes={mats} n={mats.length * ceramica} geo={geo} cor={cor} />}
    </group>
  );
};

// ---------- laje treliçada ----------
export const Laje: React.FC<{vigotas?: number; lajotas?: number; capa?: number; escoras?: boolean; esconder?: boolean}> = ({vigotas = 1, lajotas = 1, capa = 1, escoras = false, esconder = false}) => {
  const xs = useMemo(() => {
    const a: number[] = [];
    for (let x = CASA.x0 + 0.21; x < CASA.x1; x += 0.42) a.push(x);
    return a;
  }, []);
  const geoL = useMemo(() => new THREE.BoxGeometry(0.29, 0.08, 0.24), []);
  const matsL = useMemo(() => {
    const m: THREE.Matrix4[] = [];
    for (let z = CASA.z0 + 0.12; z < CASA.z1; z += 0.25) for (let i = 0; i < xs.length - 1; i++) m.push(new THREE.Matrix4().makeTranslation((xs[i] + xs[i + 1]) / 2, TOPO_PAREDE + 0.04, z));
    return m;
  }, [xs]);
  const geoE = useMemo(() => new THREE.CylinderGeometry(0.04, 0.04, PE_DIREITO - 0.1, 5), []);
  const matsE = useMemo(() => {
    const m: THREE.Matrix4[] = [];
    for (let x = CASA.x0 + 0.6; x < CASA.x1; x += 1.0) for (let z = CASA.z0 + 0.6; z < CASA.z1; z += 1.0) m.push(new THREE.Matrix4().makeTranslation(x, NIVEL_PISO + (PE_DIREITO - 0.1) / 2, z));
    return m;
  }, []);
  if (esconder) return null;
  const L = CASA.z1 - CASA.z0 + ESP_PAREDE;
  return (
    <group>
      {xs.map((x, i) => {
        const k = clamp01(vigotas * xs.length - i);
        if (k <= 0) return null;
        return (
          <group key={i} position={[x, TOPO_PAREDE + 0.03 + (1 - k) * 1.5, 0]}>
            <Caixa tam={[0.12, 0.04, L]} cor="#b7b9bb" />
            <Barra a={[0, 0.02, -L / 2]} b={[0, 0.02, L / 2]} r={0.006} cor="#8a4b2a" sombra={false} />
            <Barra a={[0, 0.1, -L / 2]} b={[0, 0.1, L / 2]} r={0.006} cor="#8a4b2a" sombra={false} />
          </group>
        );
      })}
      {lajotas > 0 && <Instancias matrizes={matsL} n={matsL.length * lajotas} geo={geoL} cor="#f4f4f0" />}
      {capa > 0 && <Caixa pos={[CASA.x0 - ESP_PAREDE / 2 + (CASA.x1 - CASA.x0 + ESP_PAREDE) * capa / 2, TOPO_LAJE - 0.025, 0]} tam={[(CASA.x1 - CASA.x0 + ESP_PAREDE) * capa, 0.05 + ESP_LAJE - 0.08, L]} cor="#9aa0a6" />}
      {escoras && <Instancias matrizes={matsE} n={matsE.length} geo={geoE} cor="#b07a4a" />}
    </group>
  );
};

// ---------- telhado de duas águas (cumeeira no eixo X), telha cerâmica ----------
const INCL = 0.32; // 32% de caimento (mínimo para telha cerâmica ~30%)
const BEIRAL = 0.5;
const YC = TOPO_LAJE + 0.25 + (CASA.z1 + ESP_PAREDE / 2) * INCL; // altura da cumeeira
const yEm = (z: number) => YC - Math.abs(z) * INCL;
const ZB = CASA.z1 + ESP_PAREDE / 2 + BEIRAL; // beiral
const XB = CASA.x1 + ESP_PAREDE / 2 + 0.4;

export const Telhado: React.FC<{madeira?: number; telhas?: number; oitao?: boolean; caixaDagua?: boolean}> = ({madeira = 1, telhas = 1, oitao = true, caixaDagua = false}) => {
  const ang = Math.atan(INCL);
  const geoT = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.115, 0.115, 0.42, 7, 1, false, 0, Math.PI);
    g.rotateX(Math.PI / 2); // eixo ao longo de Z (na direção do caimento)
    g.rotateZ(Math.PI / 2);
    return g;
  }, []);
  const matsT = useMemo(() => {
    const m: THREE.Matrix4[] = [];
    const passo = 0.36; // galga
    const comp = ZB / Math.cos(ang);
    const linhas = Math.ceil(comp / passo);
    for (let r = 0; r < linhas; r++) for (const lado of [1, -1]) for (let x = -XB + 0.1; x <= XB; x += 0.21) {
      const s = comp - (r + 0.5) * passo; // distância da cumeeira ao longo do caimento
      const z = lado * s * Math.cos(ang);
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
    const z1 = CASA.z1 + ESP_PAREDE / 2;
    s.moveTo(-z1, 0);
    s.lineTo(z1, 0);
    s.lineTo(0, YC - TOPO_LAJE - 0.02);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {depth: ESP_PAREDE, bevelEnabled: false});
    g.rotateY(Math.PI / 2);
    return g;
  }, []);
  return (
    <group>
      {caixaDagua && <Cil pos={[1.5, TOPO_LAJE + 0.4, -1.5]} r={0.55} r2={0.5} h={0.8} cor="#3d7fe0" seg={14} />}
      {oitao && [CASA.x0 - ESP_PAREDE / 2, CASA.x1 - ESP_PAREDE / 2].map((x) => (
        <mesh key={x} geometry={oitaoGeo} position={[x, TOPO_LAJE, 0]} castShadow receiveShadow>
          <Mat cor="#d9773e" />
        </mesh>
      ))}
      {/* terças */}
      {madeira > 0 && [0, 1.8, -1.8, ZB - 0.3, -(ZB - 0.3)].map((z, i) => (
        <Caixa key={'t' + i} pos={[0, yEm(z) - 0.06, z]} tam={[2 * XB * clamp01(madeira * 3 - i * 0.3), 0.12, 0.06]} cor="#9c6b42" />
      ))}
      {madeira > 0.3 && caibros.map((x, i) => {
        const k = clamp01((madeira - 0.3) * 2.5 - i / caibros.length);
        if (k <= 0) return null;
        return (
          <group key={'c' + i}>
            <Barra a={[x, YC - 0.01, 0]} b={[x, YC + (yEm(ZB) - YC) * k, ZB * k]} r={0.03} quadrada cor="#b07a4a" />
            <Barra a={[x, YC - 0.01, 0]} b={[x, YC + (yEm(ZB) - YC) * k, -ZB * k]} r={0.03} quadrada cor="#b07a4a" />
          </group>
        );
      })}
      {madeira > 0.75 && Array.from({length: 13}).map((_, r) => {
        const z = ZB - r * 0.36;
        if (z < 0.1) return null;
        const k = clamp01((madeira - 0.75) * 4 * 13 - r);
        if (k <= 0) return null;
        return (
          <group key={'r' + r}>
            <Caixa pos={[0, yEm(z) + 0.045, z]} tam={[2 * XB * k, 0.02, 0.05]} cor="#d2a26d" />
            <Caixa pos={[0, yEm(z) + 0.045, -z]} tam={[2 * XB * k, 0.02, 0.05]} cor="#d2a26d" />
          </group>
        );
      })}
      {telhas > 0 && <Instancias matrizes={matsT} n={matsT.length * telhas} geo={geoT} cor="#c8582f" />}
      {telhas > 0.98 && <Caixa pos={[0, YC + 0.14, 0]} tam={[2 * XB, 0.14, 0.3]} cor="#b04a26" />}
    </group>
  );
};
export const ALTURA_CUMEEIRA = YC;

// ---------- móveis e moradores ----------
export const Moveis: React.FC = () => (
  <group position={[0, NIVEL_PISO, 0]}>
    <Cama pos={[-2.1, 0, -2.55]} cor="#7c6cf0" />
    <Armario pos={[-1.15, 0, -3.25]} />
    <Cama pos={[2.5, 0, -2.55]} cor="#2fbf71" />
    <Vaso pos={[0.65, 0, -3.25]} />
    <Chuveiro pos={[-0.03, 0, -3.05]} />
    <Sofa pos={[-2.7, 0, 1.4]} rot={Math.PI / 2} cor="#4f8cff" />
    <Bancada pos={[3.1, 0, 2.0]} rot={-Math.PI / 2} />
    <Geladeira pos={[3.12, 0, 0.3]} rot={-Math.PI / 2} />
    <group position={[0.5, 0, 0.9]}>
      <Caixa pos={[0, 0.75, 0]} tam={[1.2, 0.05, 0.8]} cor="#c99a6a" />
      {[[-0.5, -0.32], [0.5, -0.32], [-0.5, 0.32], [0.5, 0.32]].map(([x, z], i) => (<Caixa key={i} pos={[x, 0.37, z]} tam={[0.05, 0.74, 0.05]} cor="#9c6b42" />))}
    </group>
    <Caixa pos={[-1.0, 0.003, 1.4]} tam={[1.6, 0.006, 1.2]} cor="#ffb347" sombra={false} />
  </group>
);
