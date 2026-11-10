// CENÁRIOS (sets). Cada set é um lugar/momento diferente da obra, com câmeras nomeadas.
// O diretor escolhe no roteiro: {"set": "alvenaria", "cam": "close", "p": [0, 0.6]}.
// p = progresso da ação dentro do plano (0 a 1); t = segundos desde o começo do plano.
import React from 'react';
import {CASA, COMODOS, NIVEL_PISO, PAREDES, PE_DIREITO, TOPO_LAJE, TOPO_PAREDE, V3, comprimento, solidos} from './planta';
import {Arvore, Barra, Betoneira, Boneco, Caixa, Carrinho, Chuva, CRIANCA, ENGENHEIRA, MORADOR, MonteTerra, OBREIRO, PilhaBlocos, Rotulo, SacosCimento, SERVENTE, clamp01, lerp, suave} from './kit';
import {ALTURA_CUMEEIRA, Arredores, Esquadrias, Fundacao, Gabarito, Laje, Lote, Moveis, Paredes, Piso, Telhado} from './casa';

export type Cam = {de: V3; para: V3; alvo: V3; alvoPara?: V3; fov?: number; corte?: boolean};
export type Ctx = {t: number; p: number};
export type SetDef = {
  ceu?: [string, string];
  luz?: 'dia' | 'tarde' | 'nublado';
  corte?: boolean; // corta tudo que passa da frente do lote (vista em corte)
  render: (c: Ctx) => React.ReactNode;
  cams: Record<string, Cam>;
};

// câmera por órbita: azimute 0 = de frente (+Z), positivo gira para a direita (+X); elevação em graus.
// O movimento vai de d0 a d1 (dolly) e de az a az+giro (órbita leve) durante o plano.
export const orb = (alvo: V3, az: number, el: number, d0: number, d1: number, fov = 44, giro = 6, corte?: boolean): Cam => {
  const pt = (a: number, d: number): V3 => {
    const r = (Math.PI / 180) * a, e = (Math.PI / 180) * el;
    return [alvo[0] + Math.sin(r) * Math.cos(e) * d, alvo[1] + Math.sin(e) * d, alvo[2] + Math.cos(r) * Math.cos(e) * d];
  };
  return {de: pt(az, d0), para: pt(az + giro, d1), alvo, fov, corte};
};

const fiadas = (p: number) => {
  // a parede sobe em fiadas de 20 cm, uma de cada vez
  const n = 14;
  const k = p * n;
  return Math.min(PE_DIREITO, (Math.floor(k) + suave((k % 1) * 1.6)) * 0.2);
};

const Obra0: React.FC<{cava?: number; topo?: 'terra' | 'grama'; mato?: boolean; corte?: boolean}> = ({corte = false, ...pr}) => (
  <>
    <Arredores quintal={!corte} muro={false} />
    <Lote {...pr} quintal={!corte} />
  </>
);

const FUND_PRONTA = <Fundacao sapata={1} baldrame={1} imp={1} pilarAte={NIVEL_PISO} />;

// conduítes e canos embutidos (para a cena de instalações)
const Instalacoes: React.FC<{p: number}> = ({p}) => {
  const k = (i: number, n: number) => clamp01(p * n - i);
  const y0 = NIVEL_PISO;
  const yT = TOPO_PAREDE;
  const conduites: [V3, V3][] = [
    [[-3.43, y0 + 0.3, 0.6], [-3.43, yT, 0.6]],
    [[-3.43, y0 + 1.1, -1.2], [-3.43, yT, -1.2]],
    [[3.43, y0 + 1.1, -0.2], [3.43, yT, -0.2]],
    [[-0.5 + 0.08, y0 + 1.1, -0.9], [-0.42, yT, -0.9]],
    [[-1.6, y0 + 1.1, -0.53], [-1.6, yT, -0.53]],
  ];
  const agua: [V3, V3][] = [
    [[0.95, yT, -3.0], [0.95, y0 + 2.1, -3.0]],
    [[0.95, y0 + 2.1, -3.0], [0.0, y0 + 2.1, -3.0]],
    [[0.95, yT, -1.0], [0.95, y0 + 1.0, -1.0]],
    [[3.43, yT, 1.2], [3.43, y0 + 1.0, 1.2]],
  ];
  const esgoto: [V3, V3][] = [
    [[0.65, y0 - 0.1, -3.2], [0.65, y0 - 0.1, 3.6]],
    [[3.0, y0 - 0.1, 2.0], [0.65, y0 - 0.1, 2.0]],
  ];
  return (
    <group>
      {conduites.map(([a, b], i) => (k(i, conduites.length) > 0 ? <Barra key={'e' + i} a={a} b={[a[0], lerp(a[1], b[1], k(i, conduites.length)), a[2]]} r={0.025} cor="#ffd23f" /> : null))}
      {conduites.map(([a], i) => (<Caixa key={'cx' + i} pos={a} tam={[0.06, 0.1, 0.06]} cor="#ff8a1f" />))}
      {agua.map(([a, b], i) => (k(i, agua.length) > 0 ? <Barra key={'a' + i} a={a} b={[lerp(a[0], b[0], k(i, agua.length)), lerp(a[1], b[1], k(i, agua.length)), lerp(a[2], b[2], k(i, agua.length))]} r={0.03} cor="#3d7fe0" /> : null))}
      {esgoto.map(([a, b], i) => (k(i, esgoto.length) > 0 ? <Barra key={'g' + i} a={a} b={[lerp(a[0], b[0], k(i, esgoto.length)), a[1], lerp(a[2], b[2], k(i, esgoto.length))]} r={0.055} cor="#f2f2f2" /> : null))}
      <Caixa pos={[-3.42, y0 + 1.6, 2.6]} tam={[0.06, 0.4, 0.3]} cor="#f7f7f7" />
    </group>
  );
};

// camadas do revestimento na fachada: bloco -> chapisco -> reboco (andam da esquerda para a direita)
const Camadas: React.FC<{chapisco: number; reboco: number}> = ({chapisco, reboco}) => {
  const w = PAREDES.find((x) => x.id === 'frente')!;
  const L = comprimento(w);
  const faixa = (lim: number, dz: number, esp: number, cor: string, tag: string) =>
    solidos(w).map((s, i) => {
      const u0 = Math.max(-0.07, s.u0 - (s.u0 < 1e-6 ? 0.07 : 0));
      const u1 = Math.min(s.u1 + (s.u1 > L - 1e-6 ? 0.07 : 0), lim * (L + 0.14) - 0.07);
      if (u1 - u0 < 0.01) return null;
      return <Caixa key={tag + i} pos={[w.a[0] + (u0 + u1) / 2, NIVEL_PISO + (s.v0 + s.v1) / 2, w.a[1] + dz]} tam={[u1 - u0, s.v1 - s.v0, esp]} cor={cor} />;
    });
  return (
    <group>
      {faixa(chapisco, 0.075, 0.012, '#7d7f84', 'ch')}
      {faixa(reboco, 0.09, 0.02, '#d8d4cb', 'rb')}
    </group>
  );
};

const corTinta = (p: number) => {
  const a = [0xd8, 0xd4, 0xcb], b = [0xf5, 0xd4, 0x91];
  return '#' + a.map((x, i) => Math.round(lerp(x, b[i], clamp01(p))).toString(16).padStart(2, '0')).join('');
};

export const SETS: Record<string, SetDef> = {
  // ===== gancho / final: casa pronta vista de fora =====
  fachada: {
    luz: 'tarde',
    ceu: ['#ffb37a', '#ffe7c7'],
    render: ({t}) => (
      <>
        <Obra0 topo="grama" />
        {FUND_PRONTA}
        <Piso ceramica={1} />
        <Paredes acab="pintura" corExt="#f5d491" pilares={false} />
        <Esquadrias />
        <Laje />
        <Telhado />
        <Arvore pos={[-4.8, 0, 2.6]} esc={1.1} />
        <Arvore pos={[4.9, 0, -6]} esc={1.3} />
        <Boneco pos={[2.3, 0, 3.0]} rotY={0.3} acao="acena" t={t} v={MORADOR} />
        <Boneco pos={[3.0, 0, 3.0]} rotY={-0.2} acao="comemora" t={t} v={CRIANCA} esc={0.6} />
      </>
    ),
    cams: {drone: orb([0, 1.8, 0], 35, 22, 27, 20, 46), baixa: orb([0.5, 2.0, 1], 20, 6, 14, 11.5, 46)},
  },
  // ===== terreno vazio =====
  terreno: {
    luz: 'dia',
    render: ({t}) => (
      <>
        <Obra0 topo="terra" mato />
        <Boneco pos={[0.6, 0, 2.2]} rotY={-0.4} acao="parado" t={t} ferramenta="planta" />
        <Rotulo texto="TERRENO 12 × 18 m" ancora={[-3, 0, -6]} sobe={1.8} />
      </>
    ),
    cams: {geral: orb([0, 0, -3], 30, 35, 27, 22, 46), ze: orb([0.5, 1.0, 2], 25, 12, 6.2, 5.2, 42)},
  },
  // ===== projeto: a planta em cima da prancheta, com a engenheira em miniatura =====
  projeto: {
    luz: 'dia',
    ceu: ['#cfe8ff', '#eef7ff'],
    render: ({t, p}) => (
      <>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#c9a477" />
        </mesh>
        <Caixa pos={[0, -0.01, 0.4]} tam={[11, 0.02, 11]} cor="#2f6fd6" />
        {PAREDES.map((w, i) => {
          const k = clamp01(p * PAREDES.length * 1.3 - i);
          if (k <= 0) return null;
          const a: V3 = [w.a[0], 0.02, w.a[1]];
          const b: V3 = [lerp(w.a[0], w.b[0], k), 0.02, lerp(w.a[1], w.b[1], k)];
          return <Barra key={w.id} a={a} b={b} r={0.07} quadrada cor="#ffffff" sombra={false} />;
        })}
        {COMODOS.map((c, i) => (
          <Rotulo key={c.nome} texto={`${c.nome} ${c.area.toLocaleString('pt-BR')} m²`} ancora={[c.c[0], 0.03, c.c[1]]} sobe={0.6} vis={clamp01(p * 6 - 2 - i)} tam={0.8} />
        ))}
        <Boneco pos={[-4.8, 0, 4.4]} rotY={0.6} acao="aponta" t={t} v={ENGENHEIRA} esc={0.95} />
      </>
    ),
    cams: {cima: orb([0, 0, 0.3], 0, 78, 24, 21, 50, 4), lado: orb([-2.5, 0.5, 2.2], -35, 22, 11, 9.5, 44)},
  },
  // ===== gabarito =====
  gabarito: {
    luz: 'dia',
    render: ({t, p}) => (
      <>
        <Obra0 topo="terra" />
        <Gabarito p={p} />
        <Boneco pos={[-4.4, 0, -0.6]} rotY={Math.PI / 2} acao="martela" t={t} ferramenta="martelo" />
        <Boneco pos={[4.4, 0, 2.5]} rotY={-Math.PI / 2} acao="parado" t={t} v={SERVENTE} />
      </>
    ),
    cams: {alto: orb([0, 0, -0.5], 30, 40, 25, 20, 48), linha: orb([-3.5, 0.6, 1.5], 25, 10, 7.5, 6, 44)},
  },
  // ===== escavação das sapatas (vista em corte) =====
  escavacao: {
    luz: 'dia',
    corte: true,
    render: ({t, p}) => (
      <>
        <Obra0 corte topo="terra" cava={suave(p * 1.2)} />
        <Gabarito p={1} />
        <MonteTerra pos={[1.6, 0, 2.2]} esc={0.4 + 0.6 * p} />
        <MonteTerra pos={[-2.2, 0, 2.6]} esc={0.3 + 0.5 * p} />
        <Boneco pos={[0.85, 0, 3.0]} rotY={-1.4} acao="cava" t={t} ferramenta="pa" />
        <Boneco pos={[-3.0, 0, 2.6]} rotY={-0.6} acao="cava" t={t + 0.4} v={SERVENTE} ferramenta="pa" />
        <Carrinho pos={[2.6, 0, 1.6]} rotY={0.8} carga="#a9652f" />
        <Rotulo texto="1 m DE FUNDO" ancora={[0, -0.9, 3.6]} sobe={0} lado={1.6} vis={clamp01(p * 3 - 1.2)} />
      </>
    ),
    cams: {cima: orb([0, -0.3, 0], 25, 40, 23, 18, 48), corte: orb([0, -0.4, 3.4], 15, 8, 7.5, 5.8, 44)},
  },
  // ===== ferragem da sapata e do pilar =====
  armadura: {
    luz: 'dia',
    corte: true,
    render: ({t, p}) => (
      <>
        <Obra0 corte topo="terra" cava={1} />
        <Fundacao ferro={suave(p)} />
        <Boneco pos={[0.8, 0, 2.9]} rotY={-1.2} acao="aponta" t={t} />
        <Rotulo texto="FERRO 10 mm" ancora={[0.06, 0.2, 3.5]} sobe={0.6} lado={0.7} vis={clamp01(p * 3 - 1)} />
      </>
    ),
    cams: {macro: orb([0, -0.3, 3.5], 12, 6, 4.6, 3.6, 44), cima: orb([0, -0.3, 1], 25, 40, 18, 15, 48)},
  },
  // ===== concretagem =====
  concretagem: {
    luz: 'dia',
    corte: true,
    render: ({t, p}) => (
      <>
        <Obra0 corte topo="terra" cava={1} />
        <Fundacao ferro={1} sapata={suave(p * 1.2)} pilarAte={p > 0.85 ? NIVEL_PISO : 0} />
        <Betoneira pos={[2.4, 0, 2.2]} rotY={-0.8} t={t} />
        <SacosCimento pos={[3.6, 0, 1.4]} n={12} rotY={0.3} />
        <Carrinho pos={[0.9, 0, 2.6]} rotY={-1.9} />
        <Boneco pos={[1.7, 0, 2.9]} rotY={-1.0} acao="carrega" t={t} v={SERVENTE} />
        <Rotulo texto="CONCRETO" ancora={[0, -0.75, 3.55]} sobe={0.2} lado={0.9} vis={clamp01(p * 3 - 0.8)} />
      </>
    ),
    cams: {betoneira: orb([2.3, 0.8, 2.2], 30, 12, 5.2, 4.2, 44), corte: orb([0, -0.4, 3.4], -15, 6, 6.5, 5.2, 44)},
  },
  // ===== viga baldrame + impermeabilização =====
  baldrame: {
    luz: 'dia',
    corte: true,
    render: ({t, p}) => (
      <>
        <Obra0 corte topo="terra" />
        <Fundacao sapata={1} pilarAte={NIVEL_PISO} baldrame={suave(p * 1.4)} forma />
        <Boneco pos={[-3.2, 0, 2.6]} rotY={0.4} acao="martela" t={t} ferramenta="martelo" />
        <Rotulo texto="VIGA BALDRAME" ancora={[-2.5, 0.15, 3.6]} sobe={1.4} lado={1.8} vis={clamp01(p * 3 - 1)} />
      </>
    ),
    cams: {perimetro: orb([0, 0, 0], 35, 35, 23, 18, 48), rente: orb([-1.5, 0, 3.6], 35, 8, 7, 5.6, 44)},
  },
  impermeabiliza: {
    luz: 'nublado',
    ceu: ['#8fa2b8', '#c9d3de'],
    corte: true,
    render: ({t, p}) => (
      <>
        <Obra0 corte topo="terra" />
        <Fundacao sapata={1} pilarAte={NIVEL_PISO} baldrame={1} imp={suave(p)} />
        <Boneco pos={[-0.6, 0, 2.95]} rotY={0} acao="pinta" t={t} ferramenta="rolo" />
        {p > 0.55 && <Chuva t={t} centro={[0, 0, 0]} />}
        <Rotulo texto="PICHE" ancora={[-2.0, 0.1, 3.62]} sobe={1.2} lado={0.6} vis={clamp01(p * 3 - 0.6)} />
      </>
    ),
    cams: {rolo: orb([-0.8, 0.5, 3.4], 25, 12, 5.8, 4.8, 44), chuva: orb([0, 0, 1.5], 35, 18, 18, 14, 48)},
  },
  // ===== alvenaria =====
  alvenaria: {
    luz: 'dia',
    render: ({t, p}) => (
      <>
        <Obra0 topo="terra" />
        {FUND_PRONTA}
        <Piso contrapiso={1} />
        <Paredes h={fiadas(p)} acab="bloco" />
        <PilhaBlocos pos={[4.6, 0, 1.5]} nx={4} ny={4} nz={3} rotY={Math.PI / 2} />
        <PilhaBlocos pos={[-4.6, 0, -6.5]} nx={4} ny={3} nz={3} />
        <SacosCimento pos={[4.7, 0, -1.5]} n={8} />
        <Boneco pos={[-2.0, NIVEL_PISO, 2.9]} rotY={Math.PI} acao="martela" t={t} ferramenta="colher" />
        <Boneco pos={[2.6, 0, 4.1]} rotY={-2.6} acao="carrega" t={t} v={SERVENTE} ferramenta="bloco" />
      </>
    ),
    cams: {geral: orb([0, 1, 0], 35, 32, 23, 19, 48), close: orb([-2, 0.9, 3.6], 25, 10, 5.4, 4.4, 44), lateral: orb([0, 1, 0], -55, 25, 21, 17, 48)},
  },
  // ===== estrutura: pilares, cinta e vergas =====
  estrutura: {
    luz: 'dia',
    render: ({t, p}) => (
      <>
        <Obra0 topo="terra" />
        {FUND_PRONTA}
        <Piso contrapiso={1} />
        <Paredes h={PE_DIREITO} acab="bloco" pilares vergas />
        <Caixa pos={[0, TOPO_PAREDE + 0.0, CASA.z1]} tam={[7.14 * clamp01(p * 1.6), 0.02, 0.15]} cor="#a7acb1" />
        <Boneco pos={[0.7, 0, 4.6]} rotY={-0.6} acao="aponta" t={t} v={ENGENHEIRA} />
        <Rotulo texto="VERGA" ancora={[-1.8, NIVEL_PISO + 2.25, 3.68]} sobe={0.9} lado={-0.4} vis={clamp01(p * 4 - 0.5)} />
        <Rotulo texto="PILAR" ancora={[-3.57, NIVEL_PISO + 1.4, 3.62]} sobe={0.8} lado={-0.8} vis={clamp01(p * 4 - 1.5)} />
      </>
    ),
    cams: {quina: orb([-2, 1.4, 1], -45, 20, 17, 13.5, 46), janela: orb([-1.8, 1.7, 3.6], 15, 8, 7.4, 6, 44)},
  },
  // ===== laje treliçada =====
  laje: {
    luz: 'dia',
    render: ({t, p}) => (
      <>
        <Obra0 topo="terra" />
        {FUND_PRONTA}
        <Piso contrapiso={1} />
        <Paredes h={PE_DIREITO} acab="bloco" pilares vergas />
        <Laje vigotas={suave(p * 2.2)} lajotas={clamp01(p * 2.2 - 1)} capa={clamp01(p * 3 - 2.1)} escoras />
        <Boneco pos={[0.5, TOPO_PAREDE + 0.08, 2.9]} rotY={-0.6} acao="carrega" t={t} v={SERVENTE} />
      </>
    ),
    cams: {cima: orb([0, 2.8, 0], 30, 40, 23, 19, 48)},
  },
  // ===== telhado =====
  telhado: {
    luz: 'dia',
    render: ({t, p}) => (
      <>
        <Obra0 topo="terra" />
        {FUND_PRONTA}
        <Paredes h={PE_DIREITO} acab="bloco" pilares vergas />
        <Laje />
        <Telhado madeira={suave(p * 2)} telhas={clamp01(p * 2 - 1)} caixaDagua />
        <Boneco pos={[2.2, ALTURA_CUMEEIRA - 0.6, 1.4]} rotY={0.3} acao="martela" t={t} ferramenta="martelo" />
      </>
    ),
    cams: {madeira: orb([0, 3.5, 0], 35, 35, 22, 18, 48), telhas: orb([0, 3.8, 0.5], 70, 15, 18, 14.5, 46)},
  },
  // ===== elétrica e hidráulica (sem laje para ver de cima) =====
  instalacoes: {
    luz: 'dia',
    render: ({t, p}) => (
      <>
        <Obra0 topo="terra" />
        {FUND_PRONTA}
        <Piso contrapiso={1} />
        <Paredes h={PE_DIREITO} acab="bloco" pilares />
        <Instalacoes p={p} />
        <Boneco pos={[2.2, NIVEL_PISO, 1.2]} rotY={Math.PI / 2} acao="martela" t={t} ferramenta="martelo" />
        <Rotulo texto="ÁGUA" ancora={[0.95, NIVEL_PISO + 2.5, -1.0]} sobe={0.4} vis={clamp01(p * 3 - 0.8)} fundo="#d6e8ff" />
        <Rotulo texto="ESGOTO" ancora={[0.65, NIVEL_PISO, 1.5]} sobe={1.3} vis={clamp01(p * 3 - 1.4)} />
        <Rotulo texto="FIOS" ancora={[-3.43, NIVEL_PISO + 1.8, 0.6]} sobe={0.3} lado={0.8} vis={clamp01(p * 3 - 0.4)} fundo="#fff3b0" />
      </>
    ),
    cams: {cima: orb([0, 1, -0.6], 20, 55, 19, 15, 48), banheiro: orb([0.3, 1.0, -2.0], 200, 50, 10, 8, 46)},
  },
  // ===== chapisco e reboco =====
  reboco: {
    luz: 'dia',
    render: ({t, p}) => (
      <>
        <Obra0 topo="terra" />
        {FUND_PRONTA}
        <Paredes h={PE_DIREITO} acab="bloco" pilares vergas />
        <Laje />
        <Telhado />
        <Camadas chapisco={0.15 + p * 0.8} reboco={p * 0.62} />
        <Boneco pos={[-3.5 + 7 * (p * 0.62) + 0.3, 0, 4.25]} rotY={Math.PI} acao="pinta" t={t} ferramenta="colher" />
        <Rotulo texto="BLOCO" ancora={[2.4, 1.2, 3.68]} sobe={1.5} vis={clamp01(p * 4 - 0.3)} />
        <Rotulo texto="CHAPISCO" ancora={[0.9, 1.0, 3.69]} sobe={1.0} vis={clamp01(p * 4 - 1.0)} fundo="#d9d9de" />
        <Rotulo texto="REBOCO" ancora={[-1.6, 1.6, 3.7]} sobe={1.3} vis={clamp01(p * 4 - 1.7)} fundo="#f2efe8" />
      </>
    ),
    cams: {fachada: orb([0, 1.6, 3.6], 30, 10, 16, 13, 46), rente: orb([0.6, 1.6, 3.7], 40, 6, 8.5, 7, 44)},
  },
  // ===== piso e esquadrias (sem laje: vista de cima) =====
  piso: {
    luz: 'dia',
    render: ({t, p}) => (
      <>
        <Obra0 topo="terra" />
        {FUND_PRONTA}
        <Piso contrapiso={1} ceramica={suave(p * 1.1)} />
        <Paredes h={PE_DIREITO} acab="reboco" />
        <Esquadrias p={clamp01(p * 2.5 - 1.5)} />
        <Boneco pos={[-2.0 + p * 3, NIVEL_PISO, 3.6 - 7.2 * suave(p * 1.1) + 0.4]} rotY={Math.PI} acao="martela" t={t} esc={0.85} ferramenta="colher" />
      </>
    ),
    cams: {cima: orb([0, 0, 0], 0, 70, 21, 17, 48, 10), porta: orb([0.5, 1.4, 3.6], 30, 10, 10, 8.5, 44)},
  },
  // ===== pintura =====
  pintura: {
    luz: 'dia',
    render: ({t, p}) => (
      <>
        <Obra0 topo="terra" />
        {FUND_PRONTA}
        <Piso ceramica={1} />
        <Paredes h={PE_DIREITO} acab="pintura" corExt={corTinta(p)} corInt={p > 0.3 ? '#fbf7ef' : '#d8d4cb'} />
        <Esquadrias />
        <Laje />
        <Telhado />
        <Boneco pos={[-1.0, 0, 4.25]} rotY={Math.PI} acao="pinta" t={t} ferramenta="rolo" />
        <Boneco pos={[2.6, 0, 4.25]} rotY={Math.PI} acao="pinta" t={t + 0.5} v={SERVENTE} ferramenta="rolo" />
      </>
    ),
    cams: {fachada: orb([0, 1.7, 3.6], 20, 10, 15, 12.5, 46), pintor: orb([-1, 1.4, 4], -25, 10, 9, 8, 44)},
  },
  // ===== casa pronta em corte (casa de bonecas) =====
  casaCorte: {
    luz: 'tarde',
    ceu: ['#ffb37a', '#ffe7c7'],
    corte: true,
    render: ({t}) => (
      <>
        <Obra0 corte topo="grama" />
        {FUND_PRONTA}
        <Piso ceramica={1} />
        <Paredes acab="pintura" corExt="#f5d491" esconder={['frente']} />
        <Esquadrias esconder={['frente']} />
        <Laje />
        <Telhado caixaDagua />
        <Moveis />
        <Boneco pos={[-1.4, NIVEL_PISO, 1.6]} rotY={-1.2} acao="senta" t={t} v={MORADOR} />
        <Boneco pos={[2.4, NIVEL_PISO, 1.8]} rotY={0.4} acao="acena" t={t} v={{...MORADOR, camisa: '#2fbf71', cabelo: '#1d1b26'}} />
        <Boneco pos={[2.0, NIVEL_PISO, -1.6]} rotY={0.3} acao="comemora" t={t} v={CRIANCA} esc={0.6} />
        <Arvore pos={[-5.0, 0, -7.5]} esc={1.2} />
      </>
    ),
    cams: {frente: orb([0, 1.4, 0], 0, 12, 21, 16.5, 46, 8), sala: orb([0, 1.2, 1], -20, 20, 9.5, 7.6, 46)},
  },
  // ===== planta humanizada: sem teto, de cima, com os moradores =====
  casaAberta: {
    luz: 'tarde',
    ceu: ['#ffb37a', '#ffe7c7'],
    render: ({t, p}) => (
      <>
        <Obra0 topo="grama" />
        {FUND_PRONTA}
        <Piso ceramica={1} />
        <Paredes acab="pintura" corExt="#f5d491" />
        <Esquadrias />
        <Moveis />
        <Boneco pos={[-1.4, NIVEL_PISO, 1.6]} rotY={-1.2} acao="senta" t={t} v={MORADOR} />
        <Boneco pos={[2.4, NIVEL_PISO, 1.8]} rotY={0.4} acao="acena" t={t} v={{...MORADOR, camisa: '#2fbf71', cabelo: '#1d1b26'}} />
        <Boneco pos={[2.0, NIVEL_PISO, -1.6]} rotY={0.3} acao="comemora" t={t} v={CRIANCA} esc={0.6} />
        {COMODOS.map((c, i) => (
          <Rotulo key={c.nome} texto={`${c.area.toLocaleString('pt-BR')} m²`} ancora={[c.c[0], NIVEL_PISO + 0.1, c.c[1]]} sobe={2.4} vis={clamp01(p * 5 - i * 0.6)} tam={0.8} />
        ))}
      </>
    ),
    cams: {cima: orb([0, 0, -0.2], 15, 62, 22, 18, 48)},
  },
  // laje vista por dentro: sem a parede da frente, para ver as escoras
  lajeEscoras: {
    luz: 'dia',
    render: ({t}) => (
      <>
        <Obra0 topo="terra" />
        {FUND_PRONTA}
        <Piso contrapiso={1} />
        <Paredes h={PE_DIREITO} acab="bloco" pilares vergas esconder={['frente']} />
        <Laje escoras />
        <Boneco pos={[-1.2, NIVEL_PISO, 2.2]} rotY={0.4} acao="aponta" t={t} v={ENGENHEIRA} />
        <Rotulo texto="ESCORAS" ancora={[0.1, 1.6, 2.1]} sobe={1.6} lado={0.9} />
      </>
    ),
    cams: {dentro: orb([0, 1.6, 0.5], 15, 10, 13, 10.5, 46)},
  },
};
