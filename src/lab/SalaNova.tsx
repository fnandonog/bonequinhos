// LAB: sala de estar no padrão NOVO (cheia, arredondada, luz de janela, rim light, paleta).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {QUAL, Ambiente, Bola, CaixaR, CilN, MBrilho, MN, PAL, SombraContato, Torno, V3, geoArred, texAssoalho, texN, texCeuJanela, texLombada, texParede, texQuadro, texTapete} from './visual';
import {AcaoZe, ZeNovo} from './ZeNovo';

// medidas do cômodo (m)
export const SALA = {x0: -2.6, x1: 2.6, zF: -2.2, zFrente: 6.5, pe: 2.7, jan: {x0: -1.75, x1: -0.35, y0: 0.85, y1: 2.3}};
// direção do sol (entra pela janela, desce e vem para a frente)
const SOL_DIR = new THREE.Vector3(0.35, -0.75, 1).normalize();
export const ZE_POS: V3 = [-0.25, 0, 0.75];

const rnd = (seed: number) => {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};

// ---------- paredes, piso, teto ----------
const Casca: React.FC = () => {
  const {x0, x1, zF, zFrente, pe, jan} = SALA;
  const prof = zFrente - zF;
  const piso = useMemo(() => {
    const t = texAssoalho().clone();
    t.needsUpdate = true;
    t.repeat.set((x1 - x0) / 1.44, prof / 1.44);
    return t;
  }, []);
  const pf = texParede(PAL.paredeFundo);
  const pl = texParede(PAL.parede);
  const e = 0.12;
  const zc = zF - e / 2;
  const pedaco = (xa: number, xb: number, ya: number, yb: number, k: string) => (
    <mesh key={k} position={[(xa + xb) / 2, (ya + yb) / 2, zc]} castShadow receiveShadow>
      <boxGeometry args={[xb - xa, yb - ya, e]} />
      <MN cor="#ffffff" map={pf} r={0.92} />
    </mesh>
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (zF + zFrente) / 2]} receiveShadow>
        <planeGeometry args={[x1 - x0, prof]} />
        <MN cor="#ffffff" map={piso} r={0.55} />
      </mesh>
      {/* parede do fundo com vão da janela */}
      {pedaco(x0, jan.x0, 0, pe, 'a')}
      {pedaco(jan.x1, x1, 0, pe, 'b')}
      {pedaco(jan.x0, jan.x1, 0, jan.y0, 'c')}
      {pedaco(jan.x0, jan.x1, jan.y1, pe, 'd')}
      {/* paredes laterais */}
      {[x0 - e / 2, x1 + e / 2].map((x) => (
        <mesh key={x} position={[x, pe / 2, (zF + zFrente) / 2]} castShadow receiveShadow>
          <boxGeometry args={[e, pe, prof]} />
          <MN cor="#ffffff" map={pl} r={0.92} />
        </mesh>
      ))}
      {/* teto (não bloqueia o sol: castShadow desligado) */}
      <mesh position={[0, pe + 0.05, (zF + zFrente) / 2]} receiveShadow>
        <boxGeometry args={[x1 - x0 + 0.3, 0.1, prof]} />
        <MN cor="#f7f1e6" r={0.95} emissivo="#efe6d6" ei={QUAL.envGlobal ? 0 : 0.6} />
      </mesh>
      {/* rodapés e sanca */}
      <CaixaR pos={[(x0 + x1) / 2, 0.05, zF + 0.012]} tam={[x1 - x0, 0.1, 0.024]} raio={0.008} cor={PAL.rodape} r={0.5} />
      {[x0 + 0.012, x1 - 0.012].map((x) => (
        <CaixaR key={x} pos={[x, 0.05, (zF + zFrente) / 2]} tam={[0.024, 0.1, prof]} raio={0.008} cor={PAL.rodape} r={0.5} />
      ))}
      <CaixaR pos={[(x0 + x1) / 2, pe - 0.04, zF + 0.03]} tam={[x1 - x0, 0.08, 0.06]} raio={0.02} cor={PAL.rodape} r={0.6} sombra={false} />
      {/* sanca de gesso e spots embutidos no teto */}
      {[x0 + 0.25, x1 - 0.25].map((x) => (
        <CaixaR key={'s' + x} pos={[x, pe - 0.06, (zF + zFrente) / 2]} tam={[0.5, 0.12, prof]} raio={0.03} cor="#f8f3ea" r={0.9} sombra={false} />
      ))}
      {[[-1.4, 0.3], [0.6, 0.3], [-1.4, 2.4], [0.6, 2.4], [1.9, -1.0], [-2.0, -1.0]].map(([x, z], i) => (
        <group key={'spot' + i} position={[x, pe - 0.001, z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.06, 32]} />
            <meshBasicMaterial color="#fff6e2" toneMapped={false} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
            <ringGeometry args={[0.06, 0.075, 32]} />
            <MN cor="#d9d2c4" r={0.4} metal={0.5} />
          </mesh>
        </group>
      ))}
      {/* tomada e interruptor */}
      <CaixaR pos={[1.95, 0.32, zF + 0.01]} tam={[0.08, 0.12, 0.012]} raio={0.005} cor="#fbfaf6" r={0.4} />
      <CaixaR pos={[x1 - 0.008, 1.1, 1.6]} tam={[0.012, 0.12, 0.08]} raio={0.005} cor="#fbfaf6" r={0.4} />
    </group>
  );
};

// ---------- mancha de sol (decalque aditivo projetado da janela no chão, com a sombra da cruzeta) ----------
// Custa quase nada (1 quad) e substitui uma 2ª luz com sombra (a parte mais cara do render).
const texMancha = () =>
  texN('manchaSol', 256, 256, (g) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, 256, 256);
    g.filter = 'blur(7px)';
    g.fillStyle = '#ffffff';
    g.fillRect(16, 16, 224, 224);
    g.fillStyle = '#000';
    g.fillRect(124, 0, 8, 256); // montante vertical
    g.fillRect(0, 256 - 0.67 * 256 - 4, 256, 8); // travessa
    g.filter = 'none';
  });

export const ManchaSol: React.FC<{forca?: number}> = ({forca = 0.55}) => {
  const {jan, zF} = SALA;
  const geo = useMemo(() => {
    const cantos: [number, number, number, number][] = [
      [jan.x0, jan.y0, 0, 0],
      [jan.x1, jan.y0, 1, 0],
      [jan.x1, jan.y1, 1, 1],
      [jan.x0, jan.y1, 0, 1],
    ];
    const pts = cantos.map(([x, y]) => {
      const s = y / -SOL_DIR.y;
      return [x + SOL_DIR.x * s, 0.021, zF + SOL_DIR.z * s];
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(cantos.flatMap(([, , u, v]) => [u, v]), 2));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    return g;
  }, []);
  return (
    <mesh geometry={geo} renderOrder={2}>
      <meshBasicMaterial map={texMancha()} color={new THREE.Color('#ffcf8a').multiplyScalar(forca)} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
};

// ---------- janela, cortina, vista e feixe de luz ----------
const Cortina: React.FC<{x: number; larg: number; pos: V3}> = ({larg, pos}) => {
  const g = useMemo(() => {
    const geo = new THREE.PlaneGeometry(larg, 2.2, 48, 8);
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const amp = 0.035 + (1.1 - y) * 0.004;
      p.setZ(i, Math.sin((x / larg) * Math.PI * 7) * amp);
    }
    geo.computeVertexNormals();
    return geo;
  }, [larg]);
  return (
    <mesh geometry={g} position={pos} castShadow receiveShadow>
      <meshStandardMaterial color={PAL.linho} roughness={0.95} side={THREE.DoubleSide} />
    </mesh>
  );
};

export const Feixe: React.FC = () => {
  const {jan, zF} = SALA;
  const geo = useMemo(() => {
    const cantos: V3[] = [
      [jan.x0, jan.y0, zF],
      [jan.x1, jan.y0, zF],
      [jan.x1, jan.y1, zF],
      [jan.x0, jan.y1, zF],
    ];
    const chao = cantos.map(([x, y, z]) => {
      const s = y / -SOL_DIR.y;
      return [x + SOL_DIR.x * s, 0.01, z + SOL_DIR.z * s] as V3;
    });
    const pos: number[] = [];
    const col: number[] = [];
    const c0 = [0.06, 0.05, 0.034];
    for (let i = 0; i < 4; i++) {
      const a = cantos[i], b = cantos[(i + 1) % 4], ca = chao[i], cb = chao[(i + 1) % 4];
      [a, b, cb, a, cb, ca].forEach((v, k) => {
        pos.push(...v);
        col.push(...(k === 2 || k === 4 || k === 5 ? [0, 0, 0] : c0));
      });
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, []);
  return (
    <mesh geometry={geo} renderOrder={5}>
      <meshBasicMaterial vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} fog={false} toneMapped={false} />
    </mesh>
  );
};

const Janela: React.FC = () => {
  const {jan, zF} = SALA;
  const w = jan.x1 - jan.x0;
  const h = jan.y1 - jan.y0;
  const cx = (jan.x0 + jan.x1) / 2;
  const cy = (jan.y0 + jan.y1) / 2;
  const mold = '#fbf8f2';
  return (
    <group>
      {/* vista: céu + copas de árvore + prédio distante */}
      <mesh position={[cx, cy + 0.3, zF - 1.6]}>
        <planeGeometry args={[4, 3.2]} />
        <meshBasicMaterial map={texCeuJanela()} fog={false} toneMapped={false} />
      </mesh>
      {[[-1.6, 1.2, -3.2, 0.7], [-0.6, 1.0, -3.4, 0.9], [-1.1, 1.7, -3.5, 0.6]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 24, 16]} />
          <meshStandardMaterial color={i % 2 ? '#6fae6a' : '#5f9e5c'} roughness={0.9} emissive="#3e7a40" emissiveIntensity={0.35} fog={false} />
        </mesh>
      ))}
      {/* batente e caixilho */}
      {[
        [cx, jan.y0 - 0.03, w + 0.16, 0.06],
        [cx, jan.y1 + 0.03, w + 0.16, 0.06],
      ].map(([x, y, ww, hh], i) => (
        <CaixaR key={i} pos={[x, y, zF + 0.01]} tam={[ww, hh, 0.1]} raio={0.015} cor={mold} r={0.45} />
      ))}
      {[jan.x0 - 0.04, jan.x1 + 0.04].map((x) => (
        <CaixaR key={x} pos={[x, cy, zF + 0.01]} tam={[0.08, h + 0.12, 0.1]} raio={0.015} cor={mold} r={0.45} />
      ))}
      {/* peitoril */}
      <CaixaR pos={[cx, jan.y0 - 0.06, zF + 0.1]} tam={[w + 0.3, 0.04, 0.22]} raio={0.015} cor={mold} r={0.4} />
      {/* folhas de vidro com montante */}
      <CaixaR pos={[cx, cy, zF - 0.04]} tam={[0.045, h, 0.045]} raio={0.01} cor={mold} r={0.45} />
      <CaixaR pos={[cx, cy + 0.25, zF - 0.04]} tam={[w, 0.04, 0.04]} raio={0.01} cor={mold} r={0.45} />
      <mesh position={[cx, cy, zF - 0.06]}>
        <planeGeometry args={[w, h]} />
        <meshPhysicalMaterial color="#e8f3ff" transparent opacity={0.12} roughness={0.05} metalness={0} />
      </mesh>
      {/* vaso pequeno no peitoril */}
      <Torno pos={[cx + 0.42, jan.y0 - 0.04, zF + 0.1]} perfil={[[0.001, 0], [0.05, 0], [0.06, 0.08], [0.055, 0.1], [0.001, 0.1]]} cor={PAL.terracota} rug={0.8} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Bola key={i} pos={[cx + 0.42 + Math.cos(i * 1.3) * 0.03, jan.y0 + 0.1 + i * 0.012, zF + 0.1 + Math.sin(i * 1.3) * 0.03]} r={0.035} cor={PAL.folha} rug={0.6} />
      ))}
      {/* varão e cortinas */}
      <CilN pos={[cx, jan.y1 + 0.18, zF + 0.14]} rot={[0, 0, Math.PI / 2]} r={0.016} h={w + 1.0} cor={PAL.latao} rug={0.3} metal={0.8} />
      {[-1, 1].map((s) => (
        <Bola key={s} pos={[cx + s * (w / 2 + 0.5), jan.y1 + 0.18, zF + 0.14]} r={0.035} cor={PAL.latao} rug={0.3} />
      ))}
      <Cortina x={0} larg={0.5} pos={[jan.x0 - 0.2, jan.y1 + 0.17 - 1.1, zF + 0.2]} />
      <Cortina x={0} larg={0.5} pos={[jan.x1 + 0.2, jan.y1 + 0.17 - 1.1, zF + 0.2]} />
      {/* <Feixe /> feixe aditivo: fica disponível, mas desligado (marcava borda dura no 9:16) */}
    </group>
  );
};

// ---------- móveis ----------
const Sofa: React.FC<{pos: V3}> = ({pos}) => {
  const c = PAL.terracota;
  const c2 = '#cf6b40';
  return (
    <group position={pos}>
      <SombraContato pos={[0, 0, 0]} raio={1.2} esc={[1, 0.55]} forca={0.5} />
      {[[-0.88, -0.34], [0.88, -0.34], [-0.88, 0.34], [0.88, 0.34]].map(([x, z], i) => (
        <CilN key={i} pos={[x, 0.06, z]} r={0.022} r2={0.014} h={0.12} cor={PAL.madeiraEsc} rug={0.5} />
      ))}
      <CaixaR pos={[0, 0.25, 0]} tam={[2.0, 0.26, 0.88]} raio={0.08} cor={c2} r={0.9} />
      {[-0.46, 0.46].map((x) => (
        <CaixaR key={x} pos={[x, 0.44, 0.06]} tam={[0.9, 0.16, 0.74]} raio={0.07} cor={c} r={0.92} seg={5} />
      ))}
      {[-0.46, 0.46].map((x) => (
        <CaixaR key={x} pos={[x, 0.72, -0.3]} rot={[-0.14, 0, 0]} tam={[0.9, 0.46, 0.2]} raio={0.09} cor={c} r={0.92} seg={5} />
      ))}
      {[-1, 1].map((s) => (
        <CaixaR key={s} pos={[s * 0.98, 0.45, 0]} tam={[0.2, 0.42, 0.88]} raio={0.09} cor={c2} r={0.9} seg={5} />
      ))}
      {/* almofadas */}
      <Bola pos={[-0.72, 0.68, -0.12]} rot={[-0.25, 0.3, 0.2]} r={1} esc={[0.2, 0.2, 0.08]} cor={PAL.mostarda} rug={0.95} />
      <Bola pos={[0.74, 0.68, -0.12]} rot={[-0.25, -0.3, -0.25]} r={1} esc={[0.2, 0.2, 0.08]} cor={PAL.creme} rug={0.95} />
      <Bola pos={[0.48, 0.64, -0.06]} rot={[-0.2, -0.1, 0.1]} r={1} esc={[0.16, 0.16, 0.07]} cor={PAL.petroleo} rug={0.95} />
      {/* manta dobrada no braço */}
      <CaixaR pos={[-0.98, 0.68, 0.05]} rot={[0, 0, 0.05]} tam={[0.26, 0.05, 0.5]} raio={0.02} cor={PAL.creme} r={0.95} />
      <CaixaR pos={[-1.09, 0.5, 0.05]} rot={[0, 0, 1.45]} tam={[0.36, 0.04, 0.5]} raio={0.018} cor={PAL.creme} r={0.95} />
    </group>
  );
};

const MesaCentro: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <SombraContato pos={[0, 0, 0]} raio={0.6} forca={0.45} />
    <CilN pos={[0, 0.42, 0]} r={0.46} h={0.045} cor={PAL.madeira} rug={0.45} />
    <CilN pos={[0, 0.39, 0]} r={0.44} r2={0.42} h={0.02} cor={PAL.madeiraEsc} rug={0.5} />
    {[0, 2.09, 4.19].map((a) => (
      <CilN key={a} pos={[Math.cos(a) * 0.28, 0.2, Math.sin(a) * 0.28]} rot={[Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18]} r={0.025} r2={0.016} h={0.4} cor={PAL.madeiraEsc} rug={0.5} />
    ))}
    {/* livros empilhados */}
    <CaixaR pos={[-0.18, 0.465, 0.08]} rot={0.3} tam={[0.26, 0.04, 0.19]} raio={0.008} cor={PAL.marinho} r={0.7} />
    <CaixaR pos={[-0.17, 0.5, 0.07]} rot={0.15} tam={[0.22, 0.03, 0.16]} raio={0.008} cor={PAL.mostarda} r={0.7} />
    {/* xícara */}
    <Torno pos={[0.16, 0.445, 0.14]} perfil={[[0.001, 0], [0.032, 0], [0.042, 0.02], [0.045, 0.075], [0.04, 0.075], [0.037, 0.02], [0.001, 0.02]]} cor="#ffffff" brilho rug={0.2} />
    <mesh position={[0.207, 0.49, 0.14]}>
      <torusGeometry args={[0.022, 0.006, 10, 24]} />
      <MBrilho cor="#ffffff" r={0.2} />
    </mesh>
    <CilN pos={[0.16, 0.51, 0.14]} r={0.038} h={0.004} cor="#5b3a24" rug={0.2} sombra={false} />
    {/* vaso com flores */}
    <Torno pos={[0.1, 0.445, -0.18]} perfil={[[0.001, 0], [0.05, 0], [0.075, 0.08], [0.06, 0.16], [0.03, 0.2], [0.035, 0.22], [0.001, 0.22]]} cor={PAL.petroleo} brilho rug={0.25} />
    {[[0.0, 0.0], [0.05, 0.03], [-0.04, 0.04], [0.03, -0.05], [-0.05, -0.03]].map(([x, z], i) => (
      <group key={i}>
        <mesh position={[0.1 + x * 0.6, 0.75 + (i % 2) * 0.05, -0.18 + z * 0.6]}>
          <cylinderGeometry args={[0.004, 0.004, 0.2, 6]} />
          <MN cor={PAL.folhaEsc} />
        </mesh>
        <Bola pos={[0.1 + x * 1.6, 0.85 + (i % 2) * 0.06, -0.18 + z * 1.6]} r={0.035} cor={[PAL.coral, '#ffffff', PAL.mostarda, PAL.coral, '#f7b7c3'][i]} rug={0.7} />
      </group>
    ))}
  </group>
);

const Luminaria: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <SombraContato pos={[0, 0, 0]} raio={0.3} forca={0.4} />
    <CilN pos={[0, 0.015, 0]} r={0.16} r2={0.17} h={0.03} cor="#2b2b33" rug={0.35} metal={0.6} />
    <CilN pos={[0, 0.78, 0]} r={0.012} h={1.5} cor={PAL.latao} rug={0.3} metal={0.85} />
    <CilN pos={[0, 1.6, 0]} r={0.17} r2={0.24} h={0.3} cor="#fff3dc" rug={0.9} aberto sombra={false} />
    <mesh position={[0, 1.55, 0]}>
      <sphereGeometry args={[0.05, 16, 12]} />
      <meshBasicMaterial color="#fff2c8" toneMapped={false} />
    </mesh>
    {QUAL.ponto && <pointLight position={[0, 1.5, 0]} color="#ffc98a" intensity={2.5} distance={4.5} decay={2} />}
  </group>
);

const Estante: React.FC<{pos: V3}> = ({pos}) => {
  const L = 1.25, A = 1.95, P = 0.32;
  const prateleiras = [0.08, 0.5, 0.92, 1.34, 1.76];
  const livros = useMemo(() => {
    const r = rnd(21);
    const cores = [PAL.mostarda, PAL.petroleo, PAL.coral, PAL.marinho, PAL.creme, '#8c6bb1', '#d9774b', '#6aa3c9'];
    const out: {x: number; y: number; w: number; h: number; d: number; cor: string; inc: number}[] = [];
    [0, 1, 3].forEach((pi) => {
      let x = -L / 2 + 0.06;
      const fim = pi === 1 ? 0.05 : L / 2 - 0.06;
      while (x < fim) {
        const w = 0.025 + r() * 0.03;
        const h = 0.22 + r() * 0.12;
        const inc = r() > 0.88 ? 0.25 : 0;
        out.push({x: x + w / 2, y: prateleiras[pi] + 0.02, w, h, d: 0.18 + r() * 0.05, cor: cores[Math.floor(r() * cores.length)], inc});
        x += w + 0.004 + (inc ? 0.06 : 0);
      }
    });
    return out;
  }, []);
  const lomb = texLombada();
  return (
    <group position={pos} rotation={[0, Math.PI / 2, 0]}>
      <SombraContato pos={[0, 0, 0.05]} raio={0.8} esc={[1, 0.4]} forca={0.4} />
      {[-1, 1].map((s) => (
        <CaixaR key={s} pos={[s * (L / 2 - 0.015), A / 2, 0]} tam={[0.03, A, P]} raio={0.008} cor={PAL.madeiraEsc} r={0.55} />
      ))}
      {prateleiras.map((y) => (
        <CaixaR key={y} pos={[0, y, 0]} tam={[L, 0.03, P]} raio={0.008} cor={PAL.madeira} r={0.5} />
      ))}
      <CaixaR pos={[0, A / 2, -P / 2 + 0.005]} tam={[L, A, 0.01]} raio={0.003} cor="#b37b4c" r={0.7} />
      {livros.map((b, i) => (
        <mesh key={i} position={[b.x, b.y + b.h / 2, -P / 2 + 0.02 + b.d / 2]} rotation={[0, 0, b.inc]} geometry={geoArred(b.w, b.h, b.d, 0.004, 1)} receiveShadow>
          <MN cor={b.cor} map={lomb} r={0.75} />
        </mesh>
      ))}
      {/* livros deitados */}
      {[0, 1, 2].map((i) => (
        <CaixaR key={i} pos={[0.35, prateleiras[2] + 0.035 + i * 0.035, 0]} rot={[0, 0.1 * i, 0]} tam={[0.26, 0.033, 0.19]} raio={0.006} cor={[PAL.coral, PAL.creme, PAL.petroleo][i]} r={0.75} />
      ))}
      {/* jiboia caindo da prateleira */}
      <Torno pos={[0.3, prateleiras[1] + 0.015, 0.02]} perfil={[[0.001, 0], [0.07, 0], [0.085, 0.13], [0.09, 0.15], [0.001, 0.15]]} cor="#f2ede4" brilho rug={0.3} />
      {Array.from({length: 22}).map((_, i) => {
        const ramo = i % 3;
        const k = Math.floor(i / 3);
        return (
          <Bola key={i} pos={[0.3 + (ramo - 1) * 0.07 + Math.sin(k) * 0.02, prateleiras[1] + 0.17 - k * 0.07 * (ramo === 1 ? 0.6 : 1), 0.06 + k * 0.03 + ramo * 0.02]} rot={[0.4, k, 0.3]} r={1} esc={[0.04, 0.012, 0.03]} cor={k % 2 ? PAL.folha : '#68b36b'} rug={0.55} />
        );
      })}
      {/* vaso, cacto e porta-retrato */}
      <Torno pos={[-0.35, prateleiras[2] + 0.015, 0]} perfil={[[0.001, 0], [0.05, 0], [0.07, 0.1], [0.05, 0.22], [0.02, 0.26], [0.025, 0.28], [0.001, 0.28]]} cor={PAL.mostarda} brilho rug={0.25} />
      <Torno pos={[-0.38, prateleiras[3] + 0.015, 0]} perfil={[[0.001, 0], [0.05, 0], [0.055, 0.08], [0.001, 0.08]]} cor={PAL.terracota} rug={0.85} />
      <Bola pos={[-0.38, prateleiras[3] + 0.15, 0]} r={1} esc={[0.045, 0.08, 0.045]} cor="#5aa36b" rug={0.6} />
      <Bola pos={[-0.33, prateleiras[3] + 0.16, 0]} rot={[0, 0, -0.6]} r={1} esc={[0.022, 0.04, 0.022]} cor="#5aa36b" rug={0.6} />
      <group position={[0.25, prateleiras[3] + 0.13, -0.05]} rotation={[-0.1, -0.2, 0]}>
        <CaixaR tam={[0.2, 0.24, 0.02]} raio={0.006} cor={PAL.madeiraEsc} r={0.5} />
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[0.15, 0.19]} />
          <MN cor="#ffffff" map={texQuadro()} r={0.6} />
        </mesh>
      </group>
      {/* caixas organizadoras */}
      {[-0.32, 0.02].map((x) => (
        <CaixaR key={x} pos={[x + 0.15, prateleiras[0] + 0.13, 0]} tam={[0.3, 0.22, 0.26]} raio={0.03} cor="#d8c4a0" r={0.95} />
      ))}
      <CaixaR pos={[-0.38, prateleiras[0] + 0.13, 0]} tam={[0.3, 0.22, 0.26]} raio={0.03} cor="#d8c4a0" r={0.95} />
      {/* bola de lã e globo no topo */}
      <Bola pos={[0.35, A + 0.1, 0]} r={0.085} cor={PAL.coral} rug={0.95} />
      <Torno pos={[-0.3, A + 0.015, 0]} perfil={[[0.001, 0], [0.06, 0], [0.06, 0.012], [0.01, 0.03], [0.01, 0.1], [0.001, 0.1]]} cor={PAL.latao} rug={0.3} />
      <Bola pos={[-0.3, A + 0.2, 0]} r={0.1} cor="#6aa3c9" rug={0.4} />
    </group>
  );
};

// planta grande (costela-de-adão estilizada)
const PlantaGrande: React.FC<{pos: V3}> = ({pos}) => {
  const folhas = useMemo(() => {
    const r = rnd(5);
    return Array.from({length: 13}).map((_, i) => {
      const a = i * 2.4 + r() * 0.4;
      const h = 0.55 + r() * 0.9;
      const d = 0.18 + r() * 0.3;
      return {a, h, d, s: 0.16 + r() * 0.08, inc: 0.5 + r() * 0.6};
    });
  }, []);
  return (
    <group position={pos}>
      <SombraContato pos={[0, 0, 0]} raio={0.4} forca={0.45} />
      <Torno perfil={[[0.001, 0], [0.16, 0], [0.2, 0.36], [0.215, 0.4], [0.2, 0.41], [0.001, 0.41]]} cor="#f1ebe1" brilho rug={0.35} />
      <CilN pos={[0, 0.395, 0]} r={0.195} h={0.02} cor="#5b4030" rug={1} sombra={false} />
      {folhas.map((f, i) => {
        const x = Math.cos(f.a) * f.d;
        const z = Math.sin(f.a) * f.d;
        return (
          <group key={i}>
            <mesh position={[x / 2, 0.4 + f.h / 2, z / 2]} rotation={[Math.sin(f.a) * 0.3, 0, -Math.cos(f.a) * 0.3]}>
              <cylinderGeometry args={[0.006, 0.008, f.h, 6]} />
              <MN cor={PAL.folhaEsc} />
            </mesh>
            <group position={[x, 0.4 + f.h, z]} rotation={[0, -f.a + Math.PI / 2, 0]}>
              <mesh rotation={[f.inc, 0, 0]} scale={[f.s, f.s * 1.25, 0.02]} castShadow>
                <sphereGeometry args={[1, 24, 16]} />
                <MN cor={i % 3 ? PAL.folha : '#3f8a50'} r={0.5} />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
};

const Quadros: React.FC = () => {
  const z = SALA.zF + 0.02;
  return (
    <group>
      <group position={[0.75, 1.72, z]}>
        <CaixaR tam={[0.72, 0.88, 0.04]} raio={0.01} cor="#2d2a28" r={0.5} />
        <CaixaR pos={[0, 0, 0.02]} tam={[0.62, 0.78, 0.01]} raio={0.003} cor="#fbf8f2" r={0.8} sombra={false} />
        <mesh position={[0, 0, 0.027]}>
          <planeGeometry args={[0.5, 0.62]} />
          <MN cor="#ffffff" map={texQuadro()} r={0.7} />
        </mesh>
      </group>
      {/* relógio redondo */}
      <group position={[1.6, 1.85, z]}>
        <CilN rot={[Math.PI / 2, 0, 0]} r={0.17} h={0.04} cor={PAL.latao} rug={0.3} metal={0.7} />
        <CilN pos={[0, 0, 0.021]} rot={[Math.PI / 2, 0, 0]} r={0.15} h={0.005} cor="#fbf8f2" rug={0.6} sombra={false} />
        <CaixaR pos={[0.035, 0.03, 0.027]} rot={[0, 0, -0.9]} tam={[0.012, 0.1, 0.004]} raio={0.002} cor="#2d2a28" sombra={false} />
        <CaixaR pos={[-0.02, 0.045, 0.029]} rot={[0, 0, 0.4]} tam={[0.01, 0.12, 0.004]} raio={0.002} cor="#2d2a28" sombra={false} />
      </group>
      {/* prateleira com dois enfeites */}
      <group position={[1.6, 1.42, z + 0.09]}>
        <CaixaR tam={[0.5, 0.025, 0.16]} raio={0.006} cor={PAL.madeira} r={0.5} />
        <Torno pos={[-0.12, 0.012, 0]} perfil={[[0.001, 0], [0.04, 0], [0.05, 0.06], [0.03, 0.12], [0.001, 0.12]]} cor={PAL.coral} brilho rug={0.25} />
        <Bola pos={[0.12, 0.06, 0]} r={0.05} cor={PAL.folha} rug={0.6} />
      </group>
    </group>
  );
};

const Pendente: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <mesh position={[0, -0.25, 0]}>
      <cylinderGeometry args={[0.004, 0.004, 0.5, 6]} />
      <MN cor="#2b2b33" />
    </mesh>
    <mesh position={[0, -0.6, 0]} castShadow={false}>
      <sphereGeometry args={[0.2, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={PAL.mostarda} roughness={0.5} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, -0.58, 0]}>
      <sphereGeometry args={[0.05, 16, 12]} />
      <meshBasicMaterial color="#fff2c8" toneMapped={false} />
    </mesh>
  </group>
);

const Tapete: React.FC<{pos: V3}> = ({pos}) => (
  <mesh position={[pos[0], 0.008, pos[2]]} geometry={geoArred(2.8, 0.016, 1.95, 0.008, 2)} receiveShadow>
    <MN cor="#ffffff" map={texTapete()} r={0.98} />
  </mesh>
);

// pufe de tricô (anéis empilhados)
const Pufe: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <SombraContato pos={[0, 0, 0]} raio={0.38} forca={0.45} />
    {[0.06, 0.15, 0.24, 0.32].map((y, i) => (
      <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <torusGeometry args={[0.2 - (i === 3 ? 0.03 : 0), 0.06, 16, 40]} />
        <MN cor={PAL.mostarda} r={0.95} />
      </mesh>
    ))}
    <CilN pos={[0, 0.2, 0]} r={0.2} h={0.36} cor="#d9a33c" rug={0.95} />
  </group>
);

// mesinha lateral com abajur e planta
const Lateral: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <SombraContato pos={[0, 0, 0]} raio={0.35} forca={0.4} />
    <CilN pos={[0, 0.55, 0]} r={0.24} h={0.03} cor={PAL.madeira} rug={0.45} />
    <CilN pos={[0, 0.27, 0]} r={0.03} h={0.54} cor={PAL.madeiraEsc} rug={0.5} />
    <CilN pos={[0, 0.02, 0]} r={0.16} h={0.03} cor={PAL.madeiraEsc} rug={0.5} />
    <Torno pos={[0.05, 0.565, 0.02]} perfil={[[0.001, 0], [0.07, 0], [0.08, 0.1], [0.07, 0.13], [0.001, 0.13]]} cor="#ffffff" brilho rug={0.3} />
    {Array.from({length: 7}).map((_, i) => (
      <group key={i} position={[0.05, 0.7, 0.02]} rotation={[0, i * 0.9, 0.5]}>
        <mesh position={[0, 0.12, 0]} scale={[0.035, 0.13, 0.012]} castShadow>
          <sphereGeometry args={[1, 16, 12]} />
          <MN cor={i % 2 ? '#5aa36b' : PAL.folha} r={0.55} />
        </mesh>
      </group>
    ))}
  </group>
);

export const SalaNova: React.FC<{t: number; acao?: AcaoZe}> = ({t, acao = 'fala'}) => {
  const alvoSol: V3 = [-0.7, 0, -0.2];
  const pSol: V3 = [alvoSol[0] - SOL_DIR.x * 14, alvoSol[1] - SOL_DIR.y * 14, alvoSol[2] - SOL_DIR.z * 14];
  return (
    <group>
      <Ambiente nevoa="#efe2cf" perto={7} longe={20} env={0.42} exposicao={1.0} />
      {/* luz de preenchimento: céu frio x chão quente */}
      <hemisphereLight args={QUAL.envGlobal ? ['#dbe9ff', '#c7996b', 0.55] : ['#f3f6ff', '#e2c6a4', 1.35]} />
      {/* principal: lado da câmera, quente-neutra, sombra suave */}
      <directionalLight position={[4.5, 6, 7]} color="#fff0dc" intensity={1.7} castShadow shadow-mapSize={[QUAL.mapa, QUAL.mapa]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-camera-far={25} shadow-bias={-0.0003} shadow-normalBias={0.02} shadow-radius={6} shadow-blurSamples={16} />
      {/* sol entrando pela janela (desenha a mancha no chão) */}
      <directionalLight position={pSol} color="#ffd9a0" intensity={4.0} castShadow={QUAL.sol} shadow-mapSize={[QUAL.mapa, QUAL.mapa]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-camera-far={30} shadow-bias={-0.0003} shadow-normalBias={0.02} shadow-radius={4} shadow-blurSamples={16}>
        <object3D attach="target" position={alvoSol} />
      </directionalLight>
      {/* luz de recorte (rim) só no Zé: contorno claro separando o boneco do fundo */}
      {QUAL.rim && <spotLight position={[ZE_POS[0] - 1.2, 3.2, ZE_POS[2] - 2.4]} color="#fff4e0" intensity={22} angle={0.42} penumbra={0.8} distance={8} decay={2}>
        <object3D attach="target" position={[ZE_POS[0], 1.0, ZE_POS[2]]} />
      </spotLight>}
      <Casca />
      {!QUAL.sol && <ManchaSol forca={0.3} />}
      <Janela />
      <Tapete pos={[0.35, 0, -0.45]} />
      <Sofa pos={[0.75, 0, -1.7]} />
      <Quadros />
      <MesaCentro pos={[0.62, 0, -0.42]} />
      <Luminaria pos={[2.15, 0, -1.65]} />
      <Estante pos={[SALA.x0 + 0.17, 0, -0.55]} />
      <PlantaGrande pos={[-2.1, 0, -1.78]} />
      <Pendente pos={[0.62, SALA.pe, -0.42]} />
      <Pufe pos={[1.75, 0, 0.35]} />
      <Lateral pos={[2.2, 0, -0.55]} />
      <SombraContato pos={ZE_POS} raio={0.35} forca={0.55} />
      <ZeNovo pos={ZE_POS} rotY={0.12} acao={acao} t={t} v={{camisa: '#4f8cff', calca: '#30406b', colete: null, capacete: null, cabelo: '#3b2a20'}} />
    </group>
  );
};
