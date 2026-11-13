// CENÁRIOS do "Como Ficou Rico: Silvio Santos" (versão 2). Um cenário real e reconhecível por degrau da escada do dinheiro.
// Escala real (1 unidade = 1 m). O diretor escolhe no roteiro: {"set": "rua", "cam": "venda", "p": [0, 1]}.
// p = progresso da ação no plano (0 a 1); t = segundos desde o começo do plano.
import type {Expressao} from '../estilo/ze';
import React from 'react';
import * as THREE from 'three';
import {V3} from '../v4/planta';
import {orb, Cam, Ctx} from '../v4/sets';
import {Corrente} from '../historia/pecas';
import {SETS_MCD} from './mcd';
import {SETS_COLLOR} from './collor';
import {
  ArvoreNatal, Agua, Balao, Barca, Barra, Bau, BANCARIO, Boneca, Boneco, Bonde, Caixa, Caixote, CameraEstudio, Carne, CarroPremio, Cartela, CartelaCap, CasaPremio, Cil,
  CofreOuro, MonteMoedas, Corneta, CORES_PELE, CORES_ROUPA, DIRETOR_TV, EXECUTIVO, FAMILIA, Garrafa, Lampada, Letreiro, Maco, MapaBrasil, MicRadio, Miniatura, Moeda, Morro, NotasMusicais,
  PaoDeAcucar, PASSANTES_40, Pino, Plateia, Poste, PilhaMoedas, PilhaNotas, PortaCofre, Predio40, Refletor, Relogio, Sentado, Sofa, Tabuleiro, Theatro, Titulo, Torre, TVTubo,
  Urso, Ze, Cadeado, Carrinho, Nota, PredioTV, Cartela as CartelaBingo, clamp01, lerp, linha, mapaXZ, rnd, suave, tex, texCalcada,
} from './pecas';

export type LuzRico = 'dia' | 'tarde' | 'interior' | 'nublado';
export type SetRico = {
  ceu?: [string, string];
  luz?: LuzRico;
  clima?: Expressao; // expressão padrão dos bonecos no set
  horizonte?: boolean | {raio?: number; y?: number}; // cena externa: morros, árvores e casas ao longe (src/estilo/visual.tsx)
  nevoa?: [number, number];
  render: (c: Ctx) => React.ReactNode;
  cams: Record<string, Cam>;
};

const CEU_DIA: [string, string] = ['#6fbcf2', '#fdf0d8'];
const CEU_TARDE: [string, string] = ['#f08a4b', '#ffd9a0'];
const CEU_SALA: [string, string] = ['#3a2f2a', '#5a4a3e'];
const CEU_ESTUDIO: [string, string] = ['#1d1a24', '#2b2433'];
const CEU_ESCRITORIO: [string, string] = ['#d9d6cc', '#efe9dc'];

// câmera "na mão": de -> para, olhando alvo (-> alvoPara)
const cam = (de: V3, para: V3, alvo: V3, fov = 40, alvoPara?: V3): Cam => ({de, para, alvo, fov, alvoPara});

// sala aberta em cima (para o sol entrar): piso + 3 paredes
const Sala: React.FC<{larg: number; prof: number; alt?: number; piso: string; parede: string; rodape?: string; semFrente?: boolean}> = ({larg, prof, alt = 3, piso, parede, rodape = '#6b4a2f'}) => (
  <group>
    <Caixa pos={[0, -0.05, 0]} tam={[larg, 0.1, prof]} cor={piso} />
    <Caixa pos={[0, alt / 2, -prof / 2]} tam={[larg, alt, 0.15]} cor={parede} />
    {[-1, 1].map((s) => (<Caixa key={s} pos={[(s * larg) / 2, alt / 2, 0]} tam={[0.15, alt, prof]} cor={parede} />))}
    <Caixa pos={[0, 0.06, -prof / 2 + 0.09]} tam={[larg, 0.12, 0.03]} cor={rodape} sombra={false} />
  </group>
);

// ======================= 1. RIO, 1945: Avenida Rio Branco =======================
// Avenida no eixo Z; o Theatro Municipal fecha a vista ao fundo. Banca do Zé na calçada da direita (x ≈ 8).
const CORES_40 = ['#e9dcc0', '#d9c6a0', '#efe4cc', '#cdbd98', '#e2c9a0', '#f2ecdf', '#d8cbb5', '#c9b49a'];
const BANCA: V3 = [8.0, 0.12, 0];
const Rua1945: React.FC<{t: number; p: number; modo: 'aberto' | 'eleicao' | 'capa' | 'venda' | 'caixa'}> = ({t, p, modo}) => {
  const pr = (lado: number) => {
    const out: React.ReactNode[] = [];
    let z = 30;
    let i = lado > 0 ? 0 : 3;
    while (z > -105) {
      const w = 8 + ((i * 5) % 6);
      const h = 16 + ((i * 7) % 4) * 4;
      const d = 14;
      const cart = lado < 0 && z - w / 2 < -2 && z - w / 2 > -14;
      out.push(
        <Predio40 key={lado + ':' + i} pos={[lado * (13 + d / 2), 0.12, z - w / 2]} rotY={lado > 0 ? -Math.PI / 2 : Math.PI / 2} tam={[w - 0.3, h, d]} cor={CORES_40[i % 8]}
          loja={cart ? 'CARTÓRIO ELEITORAL' : i % 3 === 1 ? ['CAFÉ', 'CHAPELARIA', 'MODAS', 'FARMÁCIA', 'LIVRARIA'][i % 5] : undefined} toldo={i % 2 ? '#b8322b' : '#2f6a5a'} />,
      );
      z -= w;
      i++;
    }
    return out;
  };
  const calc = texCalcada([3, 30]);
  const vendido = modo === 'venda' ? suave(clamp01(p * 1.4)) : 0;
  const mao = (ze: V3) => ze;
  void mao;
  return (
    <group>
      {/* pista, trilhos do bonde e calçadas de pedra portuguesa */}
      <Caixa pos={[0, -0.05, -40]} tam={[26, 0.1, 160]} cor="#55555a" />
      {[-2.7, -1.3].map((x) => (<Caixa key={x} pos={[x, 0.005, -40]} tam={[0.08, 0.02, 160]} cor="#9aa0aa" sombra={false} />))}
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 10, 0.06, -40]} receiveShadow>
          <boxGeometry args={[6, 0.12, 160]} />
          <meshStandardMaterial map={calc} roughness={0.9} />
        </mesh>
      ))}
      {[1, -1].map((s) => (<Caixa key={'m' + s} pos={[s * 7.05, 0.07, -40]} tam={[0.1, 0.14, 160]} cor="#bdb6a6" />))}
      {pr(1)}
      {pr(-1)}
      <Theatro pos={[3, 0, -128]} />
      {[-30, -10, 10].map((z) => (<Poste key={z} pos={[7.6, 0.12, z]} />))}
      {[-20, 0].map((z) => (<Poste key={'e' + z} pos={[-7.6, 0.12, z]} />))}
      {/* fiação do bonde */}
      {[-2, -2].slice(0, 1).map((x) => (<Caixa key={x} pos={[x, 6.2, -40]} tam={[0.02, 0.02, 160]} cor="#2b2b30" sombra={false} />))}
      <Bonde pos={[-2, 0, -36 + t * 2.4]} rotY={Math.PI / 2} />
      {/* faixa da eleição atravessando a avenida */}
      <Letreiro pos={[0, 6.6, -16]} larg={12} alt={1.7} linhas={['ELEIÇÃO 2 DE DEZEMBRO', 'TIRE SEU TÍTULO!']} fundo="#f4ead2" cor="#1d3a6a" borda="#2f6a5a" dupla />
      {[-6.6, 6.6].map((x) => (<Barra key={x} a={[x * 0.9, 7.4, -16]} b={[x * 1.55, 9, -16]} r={0.015} cor="#2b2b30" sombra={false} />))}
      {/* fila no cartório eleitoral (calçada da esquerda): cada um com o título de papel na mão */}
      {Array.from({length: 8}).map((_, i) => {
        const z = -8.5 + i * 1.15;
        const x = -11.2 + (i % 2) * 0.25;
        return (
          <group key={'f' + i}>
            <Boneco pos={[x, 0.12, z]} rotY={Math.PI} t={t + i} v={PASSANTES_40[i % 7]} esc={0.9 + (i % 3) * 0.03} pegada="lado"
              maoD={<Titulo pos={[0, -0.06, 0.03]} rot={[0, Math.PI / 2, 0.1]} esc={1.6} />} />
          </group>
        );
      })}
      {/* passantes na calçada da direita */}
      {Array.from({length: 6}).map((_, i) => {
        const vai = i % 2 ? 1 : -1;
        const z0 = -30 + i * 7;
        const z = z0 + vai * ((t * 1.2 + i * 3) % 14) - 7 * vai;
        if (Math.abs(z - BANCA[2]) < 2.5) return null;
        return <Boneco key={'p' + i} pos={[11.0 + (i % 3) * 0.6, 0.12, z]} rotY={vai > 0 ? 0 : Math.PI} acao="anda" t={t + i} v={PASSANTES_40[(i + 3) % 7]} esc={0.92} />;
      })}
      {/* a banca do Zé: tabuleiro virado para a pista, Zé atrás dele */}
      <group position={BANCA}>
        <Tabuleiro pos={[0, 0, 0]} capas={12} lata={modo === 'caixa' ? 0.4 + 0.6 * p : 0.35} placa={modo !== 'capa'} />
        {/* o close: título + capinha + moedas (posição na frente do tabuleiro) */}
        {modo === 'capa' && (
          <group position={[0, 0.875, 0.16]}>
            <Titulo pos={[0.02, 0, 0]} esc={1.25} capa={suave(clamp01(p * 1.6))} rot={[-Math.PI / 2, 0, 0.1]} />
            {[0, 1].map((i) => (<Moeda key={i} pos={[-0.13 + i * 0.035, 0.003 + 0.001 * i, 0.03 + i * 0.01]} rot={[-Math.PI / 2, 0, i * 0.4]} valor="1" r={0.014} />))}
            <Nota pos={[0.17, 0.001, 0.0]} rot={[-Math.PI / 2, 0, 0.3]} valor="Cr$ 2" cor="#e8c08a" esc={0.8} />
          </group>
        )}
        <Ze pos={[0, 0, -0.75]} t={t} acao={modo === 'venda' ? 'aponta' : modo === 'caixa' ? 'comemora' : 'parado'} />
      </group>
      {modo === 'venda' && (
        <group>
          {/* cliente do outro lado do tabuleiro; a capa vai da mão do Zé para a dele, a moeda de 4 vem de volta */}
          <Boneco pos={[BANCA[0] + 0.05, 0.12, 0.85]} rotY={Math.PI} t={t} v={PASSANTES_40[1]} esc={0.94} acao={vendido > 0.6 ? 'aponta' : 'parado'} />
          <Titulo pos={[BANCA[0] - 0.12, 1.08 + Math.sin(vendido * Math.PI) * 0.12, lerp(-0.4, 0.5, vendido)]} rot={[0, -Math.PI / 2, 0.15]} esc={1.8} capa={1} />
          <Moeda pos={[BANCA[0] - 0.12, 1.2 + Math.sin(vendido * Math.PI) * 0.1, lerp(0.5, -0.4, vendido)]} rot={[0, -Math.PI / 2, 0]} valor="4" r={0.035} />
        </group>
      )}
      {modo === 'caixa' && (
        <group>
          {/* freguesia em volta da banca */}
          {[[-0.95, 0.5, 2.06], [0.95, 0.5, -2.06], [1.7, 0.1, -1.7]].map(([dx, dz, ry], i) => (
            <Boneco key={i} pos={[BANCA[0] + dx, 0.12, dz]} rotY={ry} t={t + i} v={PASSANTES_40[(i + 2) % 7]} esc={0.92} acao={i === 0 ? 'aponta' : 'parado'} />
          ))}
          <group position={[BANCA[0] + 0.25, 0.9, 0.12]}>
            {Array.from({length: Math.round(2 + p * 6)}).map((_, i) => (<Maco key={i} pos={[(i % 3) * 0.17 - 0.17, Math.floor(i / 3) * 0.016, 0]} cor="#e8c08a" valor="Cr$" n={10} />))}
          </group>
        </group>
      )}
    </group>
  );
};

// ======================= 2. RÁDIO, 1948 =======================
const texAcustico = () =>
  tex('acustico', 256, 256, (g) => {
    g.fillStyle = '#c9b48a';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        g.fillStyle = (i + j) % 2 ? '#b9a074' : '#d6c29a';
        g.fillRect(i * 64 + 3, j * 64 + 3, 58, 58);
        g.fillStyle = 'rgba(0,0,0,0.12)';
        for (let k = 0; k < 6; k++) for (let m = 0; m < 6; m++) g.fillRect(i * 64 + 8 + k * 9, j * 64 + 8 + m * 9, 3, 3);
      }
  }, [3, 1.5]);
const Radio: React.FC<{t: number}> = ({t}) => (
  <group>
    <Caixa pos={[0, -0.05, 0]} tam={[6, 0.1, 5]} cor="#6b4a2f" />
    <mesh position={[0, 1.6, -1.6]} receiveShadow>
      <boxGeometry args={[6, 3.2, 0.15]} />
      <meshStandardMaterial map={texAcustico()} roughness={1} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 3, 1.6, 0.9]} receiveShadow>
        <boxGeometry args={[0.15, 3.2, 5]} />
        <meshStandardMaterial map={texAcustico()} roughness={1} />
      </mesh>
    ))}
    {/* janela do técnico com o operador e a mesa de som */}
    <Caixa pos={[0.9, 1.55, -1.5]} tam={[2.6, 1.2, 0.05]} cor="#9fc6dd" />
    <Caixa pos={[0.9, 2.17, -1.48]} tam={[2.7, 0.08, 0.1]} cor="#5a3a20" />
    <Caixa pos={[0.9, 0.93, -1.48]} tam={[2.7, 0.08, 0.1]} cor="#5a3a20" />
    <Boneco pos={[1.3, 0.25, -2.4]} t={t} v={{camisa: '#e9e1cf', calca: '#3a3f55', colete: null, capacete: null, cabelo: '#5a4030', gravata: '#2b2233'}} esc={0.9} />
    <Caixa pos={[0.9, 1.0, -2.0]} tam={[2.2, 0.15, 0.6]} cor="#4a4f5a" />
    {/* NO AR aceso */}
    <Letreiro pos={[0.9, 2.55, -1.5]} larg={1.1} alt={0.36} linhas={['NO AR']} fundo="#d6282b" cor="#ffffff" emissivo />
    <Relogio pos={[-1.9, 2.3, -1.5]} r={0.26} />
    <Letreiro pos={[0.22, 1.5, -1.44]} larg={0.5} alt={0.36} linhas={['CONCURSO DE', 'LOCUTORES', '1º LUGAR']} fundo="#fff6d8" cor="#1d1b26" borda="#8a6a43" />
    {/* o Zé de 17 anos no microfone de pedestal */}
    <group scale={0.86} position={[-0.38, 0, 0.32]}>
      <MicRadio pos={[0, 0, 0]} rotY={Math.PI - 0.7} />
    </group>
    <Ze pos={[0, 0, -0.05]} t={t} />
    {/* roteiro na estante de partitura */}
    <Barra a={[-0.75, 0, 0.3]} b={[-0.75, 1.0, 0.3]} r={0.012} cor="#2b2b30" />
    <Letreiro pos={[-0.75, 1.1, 0.32]} rot={[-0.4, 0.2, 0]} larg={0.3} alt={0.4} linhas={['COMERCIAL', '...', '...']} fundo="#ffffff" cor="#555" />
  </group>
);

// ======================= 3. BARCAS RIO-NITERÓI =======================
const Baia: React.FC<{t: number; modo: 'drone' | 'corneta' | 'bar'; p: number}> = ({t, modo, p}) => (
  <group>
    <Agua t={t} />
    <PaoDeAcucar pos={[-700, 0, -520]} esc={0.7} />
    {/* morros do Rio e de Niterói em volta da baía */}
    <Morro pos={[-480, 0, -1000]} r={160} h={200} cor="#4f8a4a" />
    <Morro pos={[-760, 0, -1200]} r={220} h={330} cor="#5a8f55" />
    <Morro pos={[300, 0, -900]} r={260} h={180} cor="#6a9a60" />
    <Morro pos={[700, 0, -400]} r={200} h={160} cor="#5f8f5a" />
    <Barca pos={[0, 0, 0]} rotY={0} t={t} />
    {modo !== 'drone' && <NotasMusicais orig={[-8, 10, 0.4]} dir={[0.4, 0.4, 1]} t={t} />}
    {/* placa do acordo no mastro */}
    <Letreiro pos={[-8, 8.3, 0.34]} larg={1.6} alt={0.7} linhas={['SOM CORTESIA DA', 'LOJA DE RÁDIOS']} fundo="#fff6d8" cor="#1d1b26" borda="#c62f2f" />
    {/* Zé no microfone do convés de cima, perto do mastro */}
    <group position={[-6.6, 4.9, 0.9]}>
      <Caixa pos={[0, 0.45, 0]} tam={[0.6, 0.9, 0.5]} cor="#8b5a3c" />
      <MicRadio pos={[0, 0.9, 0]} mesa rotY={-0.3} />
      <Ze pos={[0.15, 0, -0.55]} rotY={-0.2} t={t} acao={modo === 'corneta' ? 'acena' : 'parado'} />
    </group>
    {/* o bar na popa: balcão, engradados, refrigerante e a cartela de bingo de brinde */}
    <group position={[14, 4.9, 0]}>
      <Caixa pos={[0, 0.52, 0]} tam={[0.6, 1.04, 3.2]} cor="#a0522d" />
      <Caixa pos={[0, 1.06, 0]} tam={[0.75, 0.05, 3.3]} cor="#e9dcc0" />
      {Array.from({length: 7}).map((_, i) => (<Garrafa key={i} pos={[0.05, 1.085, -1.3 + i * 0.22]} />))}
      {Array.from({length: 4}).map((_, i) => (<CartelaBingo key={'c' + i} pos={[-0.1, 1.09 + i * 0.002, 1.1 + i * 0.01]} rot={[-Math.PI / 2, 0, i * 0.08]} />))}
      {[0, 1].map((i) => (<Caixa key={'e' + i} pos={[1.4, 0.25 + i * 0.5, -0.6]} tam={[0.6, 0.48, 0.4]} cor="#c0563a" />))}
      <Letreiro pos={[0.35, 2.25, -0.2]} rotY={-0.56} larg={1.5} alt={0.55} linhas={['BAR · REFRESCO', 'GANHE UMA CARTELA!']} fundo="#ffd23f" cor="#1d1b26" borda="#1d1b26" dupla />
      <Ze pos={[0.85, 0, 0.1]} rotY={-Math.PI / 2} t={t} acao={modo === 'bar' && p > 0.3 ? 'aponta' : 'parado'} />
      {/* clientes: um leva a garrafa e a cartela */}
      <Boneco pos={[-0.8, 0, 0.5]} rotY={Math.PI / 2} t={t} v={PASSANTES_40[2]} esc={0.92} acao="aponta" />
      <Boneco pos={[-1.0, 0, -0.6]} rotY={Math.PI / 2 - 0.3} t={t + 1} v={PASSANTES_40[4]} esc={0.92} />
      {modo === 'bar' && (
        <group position={[lerp(0.1, -0.45, suave(clamp01(p * 1.5))), 1.12, 0.45]}>
          <Garrafa pos={[0, 0, 0]} />
          <CartelaBingo pos={[0.02, 0.12, 0.12]} rot={[0, Math.PI / 2, 0]} esc={1.6} />
        </group>
      )}
    </group>
  </group>
);

// ======================= 4. O BAÚ: porão da Rua Líbero Badaró, 1958 =======================
const Porao: React.FC<{t: number}> = ({t}) => (
  <group>
    <Sala larg={5} prof={4} alt={2.6} piso="#7a6a58" parede="#b9a68a" />
    {/* janela basculante alta (o porão fica abaixo da calçada) */}
    <Caixa pos={[0.6, 2.25, -1.93]} tam={[1.4, 0.4, 0.05]} cor="#cfe3ea" />
    {[0, 1, 2].map((i) => (<Barra key={i} a={[0.15 + i * 0.45, 2.05, -1.9]} b={[0.15 + i * 0.45, 2.45, -1.9]} r={0.015} cor="#2b2b30" />))}
    <Lampada pos={[0, 2.1, 0]} />
    <Letreiro pos={[-1.3, 1.6, -1.91]} larg={1.6} alt={0.9} linhas={['BAÚ DA', 'FELICIDADE', 'carnê mensal']} fundo="#e8a33a" cor="#ffffff" borda="#a0522d" />
    {/* o caixote que servia de mesa, com carnês e o livro de contas */}
    <Caixote pos={[0, 0, 0]} tam={[0.9, 0.7, 0.6]} />
    {Array.from({length: 5}).map((_, i) => (<Carne key={i} pos={[-0.25 + (i % 3) * 0.02, 0.705 + i * 0.004, -0.05 + i * 0.01]} rot={[-Math.PI / 2, 0, 0.1 * i]} esc={0.9} />))}
    <Letreiro pos={[0.25, 0.706, 0.05]} rot={[-Math.PI / 2, 0, -0.2]} larg={0.3} alt={0.22} linhas={['CONTAS', 'Cr$ − 5.000']} fundo="#ffffff" cor="#c62f2f" />
    <Cil pos={[0.32, 0.76, -0.15]} r={0.05} h={0.12} cor="#e9e1cf" />
    {/* baús devolvidos empilhados no canto e caixas de carnês */}
    <Bau pos={[1.6, 0, -1.3]} rotY={-0.4} />
    <Bau pos={[1.7, 0.5, -1.3]} rotY={-0.3} />
    {[0, 1, 2].map((i) => (<Caixa key={i} pos={[-1.9, 0.2 + i * 0.4, -1.2 + (i % 2) * 0.1]} tam={[0.7, 0.38, 0.5]} cor="#c9a46a" />))}
    <Ze pos={[0.1, 0, -0.7]} t={t} terno mic={false} acao="aponta" />
  </group>
);

// close do carnê: as 12 parcelas recebendo o carimbo PAGO, o dinheiro se empilhando ao lado
const CarneClose: React.FC<{p: number; tudoPago?: boolean}> = ({p, tudoPago}) => (
  <group>
    <Caixa pos={[0, 0.74, 0]} tam={[1.6, 0.06, 1]} cor="#9a6a3a" />
    <Carne pos={[-0.05, 0.772, 0]} pagos={tudoPago ? 12 : 12 * p} esc={1} />
    <PilhaNotas pos={[-0.05, 0.771, -0.34]} n={tudoPago ? 18 : Math.round(1 + 17 * p)} />
    <Letreiro pos={[-0.05, 0.772, -0.215]} rot={[-Math.PI / 2, 0, 0]} larg={0.2} alt={0.05} linhas={['CAIXA']} fundo="#1d1b26" cor="#ffd23f" />
    <Cil pos={[0.13, 0.79, 0.1]} rot={[0, 0, Math.PI / 2 - 0.3]} r={0.006} h={0.14} cor="#1d3a6a" />
    {tudoPago && (
      <group position={[0.27, 0.77, -0.12]} scale={0.4}>
        <Bau pos={[0, 0, 0]} rotY={0.5} abre={0.9} />
      </group>
    )}
  </group>
);

// Natal: o baú de brinquedos finalmente chega
const Natal: React.FC<{t: number; p: number}> = ({t, p}) => (
  <group>
    <Sala larg={6} prof={5} piso="#a0703f" parede="#e9d8b8" />
    <Caixa pos={[0, 0.01, 0.2]} tam={[3, 0.02, 2]} cor="#b8322b" />
    <ArvoreNatal pos={[0.75, 0, -1.55]} t={t} />
    <Bau pos={[0, 0, -0.4]} abre={suave(clamp01(p * 1.8))} t={t} />
    <Boneco pos={[0.55, 0, 0.15]} rotY={-0.7} t={t} v={{camisa: '#ffd23f', calca: '#4f8cff', colete: null, capacete: null, cabelo: '#6b3e26'}} esc={0.62} acao={p > 0.35 ? 'comemora' : 'parado'} />
    <Boneco pos={[-0.55, 0, 0.2]} rotY={0.6} t={t + 0.5} v={{camisa: '#e26d9a', calca: '#5aa0c8', colete: null, capacete: null, cabelo: '#2b1d14', pele: '#c98e62'}} esc={0.56} acao={p > 0.45 ? 'comemora' : 'parado'} />
    {/* calendário de parede: DEZEMBRO */}
    <Letreiro pos={[-0.55, 1.45, -2.42]} larg={0.6} alt={0.75} linhas={['1958', 'DEZ', '25']} fundo="#ffffff" cor="#c62f2f" borda="#1d1b26" />
    <Caixa pos={[1.4, 0.4, -2.2]} tam={[1.2, 0.8, 0.4]} cor="#8b5a3c" />
  </group>
);

// fluxo: calendário de 12 meses na parede. Cada mês o cliente paga (PAGO) e a moeda já vai pro pote do caixa;
// o baú fica trancado embaixo até dezembro. É o "dinheiro chega antes" na tela.
const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const celula = (i: number): V3 => [-1.0 + (i % 3) * 1.0, 4.35 - Math.floor(i / 3) * 0.72, -0.4];
const POTE: V3 = [-0.75, 0, 0.5];
const Fluxo: React.FC<{t: number; p: number}> = ({t, p}) => {
  const m = p * 12.6;
  const cheio = clamp01(m / 12);
  return (
    <group>
      <Caixa pos={[0, -0.05, 0]} tam={[14, 0.1, 8]} cor="#c9b48a" />
      <Caixa pos={[0, 3, -0.6]} tam={[14, 6, 0.2]} cor="#efe6d2" />
      <Caixa pos={[0, 2.95, -0.48]} tam={[3.3, 3.25, 0.05]} cor="#1d1b26" />
      <Letreiro pos={[0, 4.85, -0.44]} larg={3.1} alt={0.3} linhas={['CARNÊ DO BAÚ · 1958']} fundo="#e8a33a" cor="#ffffff" />
      {MESES.map((nome, i) => {
        const k = clamp01(m - i);
        const c = celula(i);
        return (
          <group key={nome}>
            <Letreiro pos={[c[0], c[1] - 0.06, -0.44]} larg={0.92} alt={0.64} linhas={k > 0.15 ? [nome, 'PAGO'] : [nome, '']} fundo={k > 0.15 ? '#ffd23f' : '#ffffff'} cor="#1d1b26" />
            {/* a moeda da parcela sai do mês e cai no pote */}
            {k > 0 && k < 1 && (
              <Moeda pos={[lerp(c[0], POTE[0], suave(k)), lerp(c[1], 1.1, k * k), lerp(-0.2, POTE[2], k)]} rot={[0, k * 4, 0]} valor="1/12" r={0.16} />
            )}
          </group>
        );
      })}
      {/* pote de vidro do caixa: enche desde janeiro */}
      <group position={POTE}>
        <Cil pos={[0, 0.06, 0]} r={0.46} h={0.12} cor="#2b2d45" />
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.8, 20, 1, true]} />
          <meshStandardMaterial color="#cfe8f2" transparent opacity={0.35} roughness={0.1} side={2} />
        </mesh>
        <PilhaMoedas pos={[0, 0.12, 0]} n={Math.round(cheio * 10)} r={0.4} />
        <Letreiro pos={[0, 0.25, 0.47]} larg={0.7} alt={0.2} linhas={['CAIXA']} fundo="#1d1b26" cor="#ffd23f" />
      </group>
      {/* o baú trancado até dezembro */}
      <group position={[0.85, 0, 0.5]}>
        <Bau pos={[0, 0, 0]} abre={clamp01((m - 11.8) * 2.5)} t={t} rotY={-0.25} />
        {m < 11.8 && <Cadeado pos={[0.0, 0.42, 0.29]} esc={0.4} />}
        <Letreiro pos={[0, 0.85, 0.1]} larg={0.9} alt={0.24} linhas={['ENTREGA: DEZ']} fundo="#c62f2f" cor="#ffffff" />
      </group>
    </group>
  );
};

// ======================= 5. TV, anos 60 =======================
const texTelaPrograma = () =>
  tex('telaprog', 256, 200, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 200);
    gr.addColorStop(0, '#d9d9d9');
    gr.addColorStop(1, '#8a8a8a');
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 200);
    g.fillStyle = '#5a5a5a';
    g.fillRect(0, 140, 256, 60);
    // apresentador no palco
    g.fillStyle = '#2b2b2b';
    g.fillRect(118, 80, 22, 60);
    g.beginPath();
    g.arc(129, 70, 14, 0, Math.PI * 2);
    g.fillStyle = '#e9e9e9';
    g.fill();
    g.fillStyle = '#ffffff';
    g.fillRect(20, 14, 216, 40);
    linha(g, 'CARNÊ EM DIA = SORTEIO!', 128, 35, 206, 26, '#1d1b26');
    g.fillStyle = '#ffffff';
    g.fillRect(150, 100, 80, 34);
    linha(g, 'BAÚ', 190, 118, 70, 28, '#1d1b26');
    // linhas de varredura
    g.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = 0; y < 200; y += 4) g.fillRect(0, y, 256, 1);
  });

const ESTUDIO_PALCO: V3 = [0, 0.6, -3.2];
const Auditorio: React.FC<{t: number; agito?: number}> = ({t, agito = 0}) => (
  <group>
    <Caixa pos={[0, -0.05, 1]} tam={[22, 0.1, 20]} cor="#3a3038" />
    {/* palco com piso claro, degraus e cortina */}
    <Caixa pos={[0, 0.3, -4.5]} tam={[14, 0.6, 5]} cor="#d9cdb0" />
    {[0, 1].map((i) => (<Caixa key={i} pos={[0, 0.1 + i * 0.2, -1.85 - i * 0.25]} tam={[4, 0.2 + i * 0.2, 0.5]} cor="#c9bc9a" />))}
    {Array.from({length: 14}).map((_, i) => (
      <Cil key={i} pos={[-6.5 + i * 1, 3.6, -7]} r={0.5} h={6} cor={i % 2 ? '#a3232b' : '#b8322b'} seg={8} />
    ))}
    <Letreiro pos={[0, 5.4, -6.4]} larg={7} alt={1.1} linhas={['PROGRAMA DE DOMINGO']} fundo="#ffd23f" cor="#1d1b26" borda="#1d1b26" />
    {/* prêmios: carro no disco giratório e a casinha */}
    <Cil pos={[-4.2, 0.65, -4.5]} r={2.3} h={0.1} cor="#9aa0aa" seg={24} />
    <group position={[-4.2, 0.7, -4.5]} rotation={[0, t * 0.6 + 0.8, 0]}>
      <CarroPremio pos={[0, 0, 0]} />
    </group>
    <CasaPremio pos={[4.4, 0.6, -4.6]} rotY={-0.3} esc={1.1} />
    <Letreiro pos={[4.4, 3.2, -4.6]} rotY={-0.3} larg={2.2} alt={0.5} linhas={['PRÊMIO: CASA']} fundo="#ffffff" cor="#c62f2f" />
    {/* o Zé apresentador, de terno e microfone no peito */}
    <Ze pos={ESTUDIO_PALCO} t={t} terno acao="acena" />
    {/* câmeras de estúdio de válvula, viradas para o palco */}
    <CameraEstudio pos={[-3.2, 0, 1.4]} rotY={Math.PI + 0.35} t={t} />
    <CameraEstudio pos={[0.3, 0, 2.2]} rotY={Math.PI} t={t + 2} luz={false} />
    <CameraEstudio pos={[3.6, 0, 1.2]} rotY={Math.PI - 0.4} t={t + 4} luz={false} />
    {/* cabos no chão */}
    {[-3.2, 0.3, 3.6].map((x, i) => (<Barra key={i} a={[x, 0.02, 1.4 + i * 0.3]} b={[x * 1.8, 0.02, 4.4]} r={0.02} cor="#1d1b26" sombra={false} />))}
    {/* refletores */}
    <Refletor pos={[-5, 7, 0]} alvo={ESTUDIO_PALCO} />
    <Refletor pos={[5, 7, 0]} alvo={ESTUDIO_PALCO} />
    <Refletor pos={[0, 7.5, 4]} alvo={[0, 1, 6]} intens={14} />
    {/* plateia (de frente para o palco) */}
    <Plateia pos={[0, 0, 5.4]} rotY={Math.PI} filas={6} porFila={18} t={t} agito={agito} passo={0.7} />
    {/* luz de NO AR */}
    <Letreiro pos={[-6.8, 4.2, -6.4]} larg={1.4} alt={0.5} linhas={['NO AR']} fundo="#d6282b" cor="#ffffff" emissivo />
  </group>
);

// o escritório da emissora: o Zé PAGA o horário (é o contrário do que todo mundo pensa)
const Horario: React.FC<{t: number; p: number}> = ({t, p}) => {
  const k = suave(clamp01(p * 1.5));
  return (
    <group>
      <Sala larg={14} prof={5} piso="#8a7a62" parede="#d9cdb0" />
      {/* janela com a torre da emissora lá fora */}
      <Caixa pos={[-1.2, 1.7, -2.45]} tam={[1.8, 1.3, 0.05]} cor="#9fd0ea" />
      <Barra a={[-1.5, 1.1, -2.42]} b={[-1.3, 2.3, -2.42]} r={0.03} cor="#d6282b" />
      <Barra a={[-1.1, 1.1, -2.42]} b={[-1.3, 2.3, -2.42]} r={0.03} cor="#d6282b" />
      <Letreiro pos={[1.4, 2.2, -2.42]} larg={1.8} alt={0.9} linhas={['TV · CANAL 5', 'GRADE DE DOMINGO']} fundo="#ffffff" cor="#1d1b26" borda="#1d1b26" />
      <Relogio pos={[1.4, 1.35, -2.42]} r={0.22} />
      {/* mesa do diretor */}
      <Caixa pos={[0, 0.74, -0.6]} tam={[1.8, 0.06, 0.9]} cor="#6b4a2f" />
      {[[-0.8, -0.95], [0.8, -0.95], [-0.8, -0.25], [0.8, -0.25]].map(([x, z], i) => (<Caixa key={i} pos={[x, 0.37, z]} tam={[0.08, 0.74, 0.08]} cor="#5a3a20" />))}
      <Letreiro pos={[0.1, 0.775, -0.55]} rot={[-Math.PI / 2, 0, 0.15]} larg={0.3} alt={0.4} linhas={['CONTRATO', 'HORÁRIO', 'DOMINGO']} fundo="#ffffff" cor="#1d1b26" />
      <Boneco pos={[0, 0, -1.4]} t={t} v={DIRETOR_TV} esc={0.92} acao={k > 0.7 ? 'acena' : 'parado'} />
      {/* os maços vão da mão do Zé para a mesa */}
      <PilhaNotas pos={[-0.35, 0.771, -0.55]} n={Math.round(k * 9)} cor="#a8c8e8" />
      {k < 1 && <Maco pos={[lerp(-0.1, -0.35, k), 1.0 - k * 0.22, lerp(0.2, -0.55, k)]} cor="#a8c8e8" />}
      <Ze pos={[-0.2, 0, 0.55]} rotY={Math.PI} t={t} terno mic={false} acao={k < 0.95 ? 'aponta' : 'parado'} />
    </group>
  );
};

// a sala de casa: o programa era um grande comercial do carnê
const SalaTV: React.FC<{t: number}> = ({t}) => (
  <group>
    <Sala larg={6} prof={5} piso="#b98a56" parede="#e2d3a8" />
    <Caixa pos={[0, 0.01, -0.3]} tam={[3, 0.02, 2.4]} cor="#5f7f9a" />
    <TVTubo pos={[0, 0, -1.9]} tela={texTelaPrograma()} />
    <Sofa pos={[0, 0, 0.9]} rotY={Math.PI} />
    {FAMILIA.map((v, i) => (
      <Sentado key={i} pos={[-0.6 + i * 0.6, 0.42, 0.95]} rotY={Math.PI} roupa={v.camisa!} pele={v.pele ?? '#ffd2ad'} cabelo={v.cabelo} bracos={i === 1 ? 0.2 + 0.15 * Math.sin(t * 5) : 0} />
    ))}
    <Carne pos={[0.75, 0.62, 1.3]} rot={[-1.1, 0.4, 0]} esc={1} pagos={7} />
    <Caixa pos={[-2.2, 0.4, -2.1]} tam={[0.6, 0.8, 0.5]} cor="#8b5a3c" />
    <Cil pos={[-2.2, 1.0, -2.1]} r={0.15} r2={0.22} h={0.3} cor="#f2e6c8" />
  </group>
);

// ======================= 6. A EMISSORA, 1981 =======================
const Emissora: React.FC<{t: number}> = ({t}) => (
  <group>
    <Caixa pos={[0, -0.05, 0]} tam={[400, 0.1, 400]} cor="#7fae6a" />
    <Caixa pos={[0, 0.01, 22]} tam={[400, 0.02, 10]} cor="#55555a" />
    <PredioTV pos={[-6, 0, 0]} />
    <Torre pos={[13, 0, -12]} h={62} />
    {/* estacionamento com carros dos anos 80 */}
    {Array.from({length: 7}).map((_, i) => (
      <group key={i} position={[-18 + i * 4.2, 0, 12]} scale={[1, 0.85, 1]}>
        <CarroPremio pos={[0, 0, 0]} rotY={Math.PI / 2} cor={['#e9e6df', '#c94f4f', '#4f7fb0', '#e7c25a', '#3a3f55', '#6b8f5a', '#9aa0aa'][i]} laco={false} />
      </group>
    ))}
    {Array.from({length: 10}).map((_, i) => {
      const r = rnd(i + 70);
      return (
        <group key={'a' + i} position={[-60 + r() * 120, 0, -30 - r() * 60]}>
          <Cil pos={[0, 1.5, 0]} r={0.25} h={3} cor="#6b4a2f" />
          <mesh position={[0, 4, 0]}>
            <icosahedronGeometry args={[2.2, 0]} />
            <meshStandardMaterial color="#3f8a4a" />
          </mesh>
        </group>
      );
    })}
  </group>
);

// mapa do Brasil em relevo: os 4 canais do decreto de 1981 acendem
const ESC_MAPA = 0.05;
const CIDADES: [number, number, string][] = [[-46.6, -23.5, 'SÃO PAULO'], [-43.2, -22.9, 'RIO'], [-51.2, -30.0, 'PORTO ALEGRE'], [-48.5, -1.45, 'BELÉM']];
const Mapa: React.FC<{t: number; p: number}> = ({t, p}) => (
  <group>
    <Caixa pos={[0, -0.05, 0]} tam={[12, 0.1, 12]} cor="#1f3d5a" />
    {/* grade de "oceano" */}
    {Array.from({length: 13}).map((_, i) => (
      <group key={i}>
        <Caixa pos={[-3 + i * 0.5, 0.001, 0]} tam={[0.01, 0.002, 6]} cor="#2f5d7a" sombra={false} />
        <Caixa pos={[0, 0.001, -3 + i * 0.5]} tam={[6, 0.002, 0.01]} cor="#2f5d7a" sombra={false} />
      </group>
    ))}
    <MapaBrasil pos={[0, 0, 0]} esc={ESC_MAPA} />
    {CIDADES.map(([lo, la], i) => {
      const [x, z] = mapaXZ(lo, la, ESC_MAPA);
      return <Pino key={i} pos={[x, ESC_MAPA * 0.6, z]} vis={clamp01(p * 5 - i * 0.8)} h={0.32} />;
    })}
    {/* ondas saindo de cada antena */}
    {CIDADES.map(([lo, la], i) => {
      const [x, z] = mapaXZ(lo, la, ESC_MAPA);
      const k = (t * 0.8 + i * 0.25) % 1;
      return p * 5 - i * 0.8 > 1 ? (
        <mesh key={'o' + i} position={[x, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.05 + k * 0.35, 0.07 + k * 0.35, 24]} />
          <meshBasicMaterial color="#ffd23f" transparent opacity={1 - k} />
        </mesh>
      ) : null;
    })}
  </group>
);

// ======================= 7. TELE SENA, 1991 (cartela genérica de capitalização) =======================
const TeleSena: React.FC<{t: number; p: number}> = ({t, p}) => {
  const volta = clamp01(p * 2);
  const resto = clamp01(p * 2 - 1);
  return (
    <group>
      <Sala larg={5} prof={4} piso="#e9e6df" parede="#bcd3e8" />
      <Caixa pos={[0, 0.74, 0]} tam={[2.2, 0.06, 1.1]} cor="#f2efe6" />
      <Caixa pos={[0, 0.36, 0]} tam={[2.0, 0.72, 0.9]} cor="#5aa0c8" />
      {/* a cartela em pé num suporte */}
      <group position={[0, 0.77, -0.3]}>
        <Caixa pos={[0, 0.02, 0]} tam={[0.4, 0.04, 0.2]} cor="#1d1b26" />
        <CartelaCap pos={[0, 0.27, 0]} rot={[-0.15, 0, 0]} esc={3} />
      </group>
      {/* o dinheiro da cartela se divide: metade volta (em 12 meses), o resto vira prêmio e lucro */}
      <group position={[-0.18, 0.77, 0.18]}>
        <MonteMoedas pos={[0, 0, 0]} k={0.2 + 0.8 * volta} />
        <Letreiro pos={[0, 0.003, 0.15]} rot={[-Math.PI / 2, 0, 0]} larg={0.24} alt={0.075} linhas={['VOLTA: 50%']} fundo="#4ade80" cor="#14532d" />
        <Relogio pos={[-0.13, 0.12, -0.08]} r={0.06} rotY={0.4} />
      </group>
      <group position={[0.18, 0.77, 0.18]}>
        <MonteMoedas pos={[0, 0, 0]} k={0.2 + 0.8 * resto} />
        <Letreiro pos={[0, 0.003, 0.15]} rot={[-Math.PI / 2, 0, 0]} larg={0.24} alt={0.075} linhas={['PRÊMIO + LUCRO']} fundo="#ffd23f" cor="#1d1b26" />
        <group scale={0.045} position={[0.12, 0, -0.1]}>
          <CarroPremio pos={[0, 0, 0]} rotY={-0.6 + t * 0.3} />
        </group>
      </group>
      <Ze pos={[0.8, 0, -1.0]} rotY={-0.4} t={t} terno acao={p > 0.6 ? 'acena' : 'aponta'} />
    </group>
  );
};

// ======================= 8. O BANCO, 2010 =======================
const Diretoria: React.FC<{t: number; p: number}> = ({t, p}) => (
  <group>
    <Sala larg={7} prof={5} piso="#6b6f78" parede="#c9ccd2" />
    <Caixa pos={[0, 1.7, -2.42]} tam={[4, 1.6, 0.04]} cor="#9fc6dd" />
    {Array.from({length: 6}).map((_, i) => (<Caixa key={i} pos={[-1.6 + i * 0.65, 1.2 + (i % 3) * 0.25, -2.45]} tam={[0.5, 1.2 + (i % 3) * 0.5, 0.02]} cor="#7a8a9a" sombra={false} />))}
    {/* mesa de reunião, pilhas de balanço */}
    <Caixa pos={[0, 0.74, 0]} tam={[3, 0.06, 1.2]} cor="#3b2a20" />
    {[[-1.3, -0.5], [1.3, -0.5], [-1.3, 0.5], [1.3, 0.5]].map(([x, z], i) => (<Caixa key={i} pos={[x, 0.37, z]} tam={[0.08, 0.74, 0.08]} cor="#2b2020" />))}
    {[0, 1, 2].map((i) => (<Letreiro key={i} pos={[-1 + i * 1, 0.775 + i * 0.001, 0.25]} rot={[-Math.PI / 2, 0, 0.1 * i]} larg={0.3} alt={0.4} linhas={['BALANÇO', 'LUCRO ↑', '2009']} fundo="#ffffff" cor="#1d1b26" />))}
    {/* o balão do "balanço inflado" */}
    <Balao pos={[0, 0.77, -0.2]} k={0.08 + 0.32 * suave(p)} texto="LUCRO" />
    {/* diretores em volta (de terno cinza, sem rosto de ninguém real) */}
    <Boneco pos={[-1.0, 0, -0.95]} t={t} v={EXECUTIVO} esc={0.92} acao="aponta" />
    <Boneco pos={[0.95, 0, -0.95]} t={t + 1} v={{...EXECUTIVO, gravata: '#c94f4f', cabelo: '#8a8a8a'}} esc={0.92} acao="comemora" />
    <Boneco pos={[1.0, 0, 0.75]} rotY={-2.4} t={t + 2} v={{...EXECUTIVO, gravata: '#4f7fb0', pele: '#c98e62'}} esc={0.92} acao="aponta" />
    <Letreiro pos={[-1.3, 2.25, -2.4]} larg={1.6} alt={0.36} linhas={['BANCO · DIRETORIA']} fundo="#1d1b26" cor="#ffffff" />
  </group>
);

// o cofre do banco: aberto e vazio, com o buraco no chão
const CofreRombo: React.FC<{t: number; p: number}> = ({t, p}) => (
  <group>
    <Sala larg={7} prof={6} piso="#8a8f98" parede="#a8adb5" />
    <Caixa pos={[0, 1.25, -2.95]} tam={[2.0, 2.2, 0.1]} cor="#141218" />
    <PortaCofre pos={[0, 0, -2.85]} abre={0.45} />
    <Letreiro pos={[0, 2.62, -2.62]} larg={1.4} alt={0.36} linhas={['COFRE']} fundo="#1d1b26" cor="#ffd23f" />
    {/* prateleiras vazias */}
    {[-2.8, 2.8].map((x) => (
      <group key={x}>
        {[0.6, 1.3, 2.0].map((y) => (<Caixa key={y} pos={[x, y, -0.5]} tam={[0.6, 0.05, 4]} cor="#c9ced6" />))}
        <Caixa pos={[x, 1.2, -0.5]} tam={[0.6, 2.4, 0.05]} cor="#9aa0aa" />
      </group>
    ))}
    {/* a cratera cresce */}
    <mesh position={[0, 0.006, -1.0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.4 + 0.6 * suave(p)}>
      <circleGeometry args={[1.3, 40]} />
      <meshBasicMaterial color="#120f14" />
    </mesh>
    <mesh position={[0, -0.6, -1.0]} scale={0.4 + 0.6 * suave(p)}>
      <cylinderGeometry args={[1.3, 0.9, 1.2, 28, 1, true]} />
      <meshStandardMaterial color="#3a2f2a" side={1} />
    </mesh>
    {/* notas soltas caindo no buraco */}
    {Array.from({length: 10}).map((_, i) => {
      const k = (t * 0.7 + i / 10) % 1;
      return <Nota key={i} pos={[Math.cos(i * 2.1) * (1.2 - k), 1.6 - k * 2.2, -1.0 + Math.sin(i * 2.1) * (1.2 - k)]} rot={[-Math.PI / 2 + k * 3, i, k * 2]} valor="R$" cor="#8fbfd0" esc={2} />;
    })}
  </group>
);

// a garantia: as 44 empresas do grupo em miniatura, acorrentadas
const GARANTIA_N = 44;
const Garantia: React.FC<{t: number; p: number; solta?: boolean}> = ({t, p, solta}) => {
  const k = solta ? suave(clamp01(p * 1.6)) : 0;
  const cx = 2.6;
  const cz = 1.1;
  const yc = 0.86 - k * 0.5;
  return (
    <group>
      <Sala larg={18} prof={7} piso="#7a6a58" parede="#d9d1c0" />
      <Caixa pos={[-4.5, 1.6, 0]} tam={[0.15, 3.2, 7]} cor="#d9d1c0" />
      <Caixa pos={[0, 0.74, 0]} tam={[5.6, 0.06, 2.6]} cor="#4a3426" />
      {[[-2.6, -1.1], [2.6, -1.1], [-2.6, 1.1], [2.6, 1.1]].map(([x, z], i) => (<Caixa key={i} pos={[x, 0.37, z]} tam={[0.1, 0.74, 0.1]} cor="#3b2a20" />))}
      {Array.from({length: GARANTIA_N}).map((_, i) => (
        <Miniatura key={i} pos={[-2.3 + (i % 11) * 0.46, 0.77, -0.8 + Math.floor(i / 11) * 0.52]} tipo={i % 11 < 2 ? 1 + (i % 2) * 2 : i * 7} rotY={(i % 3) * 0.2 - 0.2} />
      ))}
      {/* a "TV" maior, na frente */}
      <group position={[0, 0.77, 0.95]} scale={1.6}>
        <Miniatura pos={[0, 0, 0]} tipo={0} />
      </group>
      {/* corrente em volta da mesa + cadeado */}
      {!solta || k < 1 ? (
        <group position={[0, -k * 0.6, 0]}>
          <Corrente a={[-cx, yc, cz]} b={[cx, yc, cz]} elo={0.14} />
          <Corrente a={[-cx, yc, -cz]} b={[cx, yc, -cz]} elo={0.14} />
          <Corrente a={[-cx, yc, -cz]} b={[-cx, yc, cz]} elo={0.14} />
          <Corrente a={[cx, yc, -cz]} b={[cx, yc, cz]} elo={0.14} />
        </group>
      ) : null}
      <Cadeado pos={[0.9, 0.95 - k * 0.6, 1.32]} esc={0.9} abre={k} />
      <Letreiro pos={[-4.4, 2.3, 0]} rotY={Math.PI / 2} larg={3.0} alt={0.7} linhas={['GARANTIA DO EMPRÉSTIMO', 'R$ 2,5 BILHÕES']} fundo="#ffffff" cor="#c62f2f" borda="#c62f2f" />
      {/* o Zé na cabeceira; o homem do fundo garantidor com o contrato */}
      <Ze pos={[-3.3, 0, 0.3]} rotY={Math.PI / 2} t={t} terno mic={false} acao={solta && k > 0.5 ? 'comemora' : 'parado'} />
      <Boneco pos={[1.6, 0, 1.9]} rotY={Math.PI} t={t} v={BANCARIO} esc={0.92} acao={solta ? 'acena' : 'aponta'} />
      {solta && <Letreiro pos={[-4.36, 2.25, -0.1]} rot={[0.12, Math.PI / 2, 0]} larg={1.9} alt={0.5} linhas={['DÍVIDA QUITADA']} fundo="#4ade80" cor="#14532d" />}
    </group>
  );
};

// ======================= 9. A ESCADA DA FORTUNA (fechamento) =======================
// cada degrau tem o objeto que trouxe dinheiro; no topo, o cofre
const DEG = 7;
const degY = (i: number) => (i + 1) * 0.6;
const degZ = (i: number) => -i * 1.3;
const ANOS = ['1945', '1949', '1958', '1963', '1981', '1991', '2024'];
const Escada: React.FC<{t: number; p: number; topo?: boolean}> = ({t, p, topo}) => {
  const s = topo ? DEG - 1 : Math.min(DEG - 1, p * (DEG - 0.6));
  const i0 = Math.floor(s);
  const fr = s - i0;
  const zeY = degY(i0) + Math.sin(fr * Math.PI) * 0.25 + (fr > 0.5 ? 0.6 * (fr - 0.5) * 2 : 0);
  const zeZ = lerp(degZ(i0), degZ(Math.min(DEG - 1, i0 + 1)), suave(fr)) + 0.3;
  return (
    <group>
      <Caixa pos={[0, -0.05, -3]} tam={[30, 0.1, 30]} cor="#2b2433" />
      {Array.from({length: DEG}).map((_, i) => (
        <group key={i}>
          <Caixa pos={[0, degY(i) / 2, degZ(i)]} tam={[3.4, degY(i), 1.3]} cor={i % 2 ? '#f2e6c8' : '#e9dcc0'} />
          <Letreiro pos={[1.15, degY(i) - 0.3, degZ(i) + 0.66]} larg={0.9} alt={0.36} linhas={[ANOS[i]]} fundo="#1d1b26" cor="#ffd23f" />
        </group>
      ))}
      {/* objetos de cada degrau */}
      <group position={[-1.0, degY(0), degZ(0)]}>
        <Titulo pos={[0, 0.3, 0]} rot={[-0.3, 0.3, 0]} esc={5} capa={1} />
      </group>
      <group position={[-1.0, degY(1), degZ(1)]}>
        <Corneta pos={[0, 0.45, 0]} rot={[0.1, 0.5, 0]} esc={1.2} />
        <Garrafa pos={[0.45, 0, 0.2]} />
      </group>
      <Bau pos={[-1.0, degY(2), degZ(2)]} rotY={0.4} abre={0.8} t={t} />
      <group position={[-1.0, degY(3), degZ(3)]} scale={0.7}>
        <CameraEstudio pos={[0, 0, 0]} rotY={0.6} operador={false} t={t} />
      </group>
      <group position={[-1.0, degY(4), degZ(4)]} scale={0.04}>
        <Torre pos={[0, 0, 0]} h={50} />
      </group>
      <group position={[-1.0, degY(5), degZ(5)]}>
        <CartelaCap pos={[0, 0.35, 0]} rot={[0, 0.4, 0]} esc={4.5} />
      </group>
      <CofreOuro pos={[-0.6, degY(6), degZ(6) - 0.1]} rotY={0.3} />
      <Ze pos={[0.6, zeY, zeZ]} rotY={topo ? 0.2 : Math.PI + 0.3} t={t} terno acao={topo || s > DEG - 1.2 ? 'acena' : 'anda'} />
      {/* brilho do topo */}
      <pointLight position={[0, degY(6) + 2.5, degZ(6) + 1]} intensity={8} distance={8} color="#ffd890" />
    </group>
  );
};

// ======================= registro dos sets e câmeras =======================
export const SETS: Record<string, SetRico> = {
  rua: {
    ceu: CEU_DIA,
    luz: 'dia',
    nevoa: [60, 220],
    render: ({t, p}) => <Rua1945 t={t} p={p} modo="aberto" />,
    cams: {
      // Zé na banca, a avenida e o Theatro Municipal ao fundo
      aberto: cam([8.4, 1.9, 4.8], [8.15, 1.75, 3.6], [7.95, 1.0, -0.6], 42),
    },
  },
  ruaeleicao: {
    ceu: CEU_DIA,
    luz: 'dia',
    nevoa: [60, 220],
    render: ({t, p}) => <Rua1945 t={t} p={p} modo="eleicao" />,
    cams: {
      // faixa da eleição e a fila do cartório
      faixa: cam([1.2, 2.0, 12], [0.6, 2.4, 8.5], [-0.5, 5.0, -16], 44),
      fila: orb([-11.0, 1.1, -4.5], 150, 10, 7.5, 6.2, 40, 8),
    },
  },
  ruacapa: {
    ceu: CEU_DIA,
    luz: 'dia',
    nevoa: [60, 220],
    render: ({t, p}) => <Rua1945 t={t} p={p} modo="capa" />,
    cams: {
      // close de cima: o título recebendo a capa de plástico, as moedas e a nota de 2
      close: orb([BANCA[0], 0.99, 0.13], 0, 64, 0.62, 0.48, 40, 10),
    },
  },
  ruavenda: {
    ceu: CEU_DIA,
    luz: 'dia',
    nevoa: [60, 220],
    render: ({t, p}) => <Rua1945 t={t} p={p} modo="venda" />,
    cams: {
      // de lado: a capa vai para o cliente, a moeda de 4 vem para o Zé
      lado: orb([BANCA[0], 1.1, 0.0], -90, 8, 6.2, 5.5, 40, 4),
    },
  },
  ruacaixa: {
    ceu: CEU_DIA,
    luz: 'dia',
    nevoa: [60, 220],
    render: ({t, p}) => <Rua1945 t={t} p={p} modo="caixa" />,
    cams: {
      // a freguesia em volta e o dinheiro se empilhando na banca
      roda: orb([BANCA[0], 1.0, 0.1], -18, 20, 4.8, 4.0, 40, 10),
    },
  },
  radio: {
    ceu: CEU_SALA,
    luz: 'interior',
    render: ({t}) => <Radio t={t} />,
    cams: {
      micro: orb([0.1, 1.0, 0], 16, 6, 4.4, 3.6, 40, 8),
    },
  },
  barca: {
    ceu: CEU_DIA,
    luz: 'dia',
    nevoa: [250, 2200],
    render: ({t, p}) => <Baia t={t} p={p} modo="drone" />,
    cams: {
      // a barca no meio da baía, Pão de Açúcar ao fundo
      drone: cam([46, 9, 31], [39, 8.5, 26], [-4, 6, -4], 40, [-6, 6, -5]),
    },
  },
  barcasom: {
    ceu: CEU_DIA,
    luz: 'dia',
    nevoa: [250, 2200],
    render: ({t, p}) => <Baia t={t} p={p} modo="corneta" />,
    cams: {
      // o mastro com os alto-falantes, a placa do acordo e o Zé no microfone
      corneta: orb([-7.6, 8.7, 0.4], 22, 4, 8.6, 7.2, 42, 6),
    },
  },
  barcabar: {
    ceu: CEU_DIA,
    luz: 'dia',
    nevoa: [250, 2200],
    render: ({t, p}) => <Baia t={t} p={p} modo="bar" />,
    cams: {
      bar: orb([14.3, 5.95, 0.4], -32, 14, 6.0, 5.2, 40, 6),
    },
  },
  porao: {
    ceu: CEU_SALA,
    luz: 'interior',
    render: ({t}) => <Porao t={t} />,
    cams: {
      geral: orb([0, 1.0, -0.3], 20, 18, 4.6, 3.6, 42, 8),
    },
  },
  carne: {
    ceu: CEU_SALA,
    luz: 'interior',
    render: ({p}) => <CarneClose p={p} />,
    cams: {
      // de cima: os carimbos PAGO caem mês a mês, o caixa enche
      topo: orb([-0.05, 0.77, -0.09], 0, 64, 1.0, 0.8, 40, 6),
    },
  },
  carnefinal: {
    ceu: CEU_SALA,
    luz: 'interior',
    render: ({p}) => <CarneClose p={p} tudoPago />,
    cams: {
      baixo: orb([0.05, 0.8, -0.1], -15, 32, 1.3, 1.05, 40, 10),
    },
  },
  natal: {
    ceu: CEU_SALA,
    luz: 'interior',
    render: ({t, p}) => <Natal t={t} p={p} />,
    cams: {
      sala: orb([0.05, 0.75, -0.6], -8, 14, 4.2, 3.6, 42, 6),
    },
  },
  fluxo: {
    ceu: CEU_ESCRITORIO,
    luz: 'dia',
    render: ({t, p}) => <Fluxo t={t} p={p} />,
    cams: {
      // trilho ao longo dos 12 meses: o caixa enche lá atrás, o baú só no fim
      trilho: orb([0, 2.75, 0], 0, 5, 9.0, 8.0, 42, 3),
    },
  },
  auditorio: {
    ceu: CEU_ESTUDIO,
    luz: 'interior',
    render: ({t}) => <Auditorio t={t} />,
    cams: {
      // o estúdio inteiro: câmeras de válvula, palco com o carro de prêmio
      aberto: orb([-0.8, 1.6, -3.4], 14, 16, 10.5, 8.5, 42, 6),
      // fechamento: o Zé de terno e microfone no peito
      ze: orb([ESTUDIO_PALCO[0], ESTUDIO_PALCO[1] + 1.15, ESTUDIO_PALCO[2]], 12, 6, 4.0, 3.0, 40, 8),
    },
  },
  plateia: {
    ceu: CEU_ESTUDIO,
    luz: 'interior',
    render: ({t}) => <Auditorio t={t} agito={1} />,
    cams: {
      // contraplano: de cima do palco, a plateia lotada
      plateia: cam([1.6, 3.4, -4.8], [-0.6, 3.0, -4.4], [0, 1.4, 6.5], 46),
    },
  },
  horario: {
    ceu: CEU_ESCRITORIO,
    luz: 'interior',
    render: ({t, p}) => <Horario t={t} p={p} />,
    cams: {
      mesa: orb([-0.1, 1.1, -0.4], 75, 10, 6.6, 5.8, 42, 5),
    },
  },
  sala: {
    ceu: CEU_SALA,
    luz: 'interior',
    render: ({t}) => <SalaTV t={t} />,
    cams: {
      // por cima do ombro da família: a TV mostra o carnê
      ombro: cam([0.35, 2.35, 2.3], [0.2, 2.2, 1.9], [0, 0.82, -1.9], 32),
    },
  },
  emissora: {
    ceu: CEU_TARDE,
    luz: 'tarde',
    nevoa: [140, 500],
    render: ({t}) => <Emissora t={t} />,
    cams: {
      drone: cam([-14, 9, 122], [-4, 12, 114], [-2, 24, -4], 42, [-1, 25, -4]),
    },
  },
  mapa: {
    ceu: CEU_ESTUDIO,
    luz: 'dia',
    render: ({t, p}) => <Mapa t={t} p={p} />,
    cams: {
      cima: orb([0.0, 0, 0.5], 4, 68, 6.8, 5.9, 42, 6),
    },
  },
  telesena: {
    ceu: CEU_ESCRITORIO,
    luz: 'interior',
    render: ({t, p}) => <TeleSena t={t} p={p} />,
    cams: {
      cartela: orb([0, 1.05, -0.3], 6, 8, 1.3, 1.0, 40, 6),
      divide: orb([0, 0.72, 0.15], 0, 34, 2.1, 1.85, 42, 5),
      premio: orb([0.2, 0.8, 0.12], 32, 26, 1.0, 0.8, 40, 8),
    },
  },
  banco: {
    ceu: CEU_ESCRITORIO,
    luz: 'interior',
    render: ({t, p}) => <Diretoria t={t} p={p} />,
    cams: {
      diretores: orb([0, 1.2, -0.2], 10, 16, 8.4, 7.4, 42, 5),
    },
  },
  cofre: {
    ceu: CEU_ESTUDIO,
    luz: 'interior',
    render: ({t, p}) => <CofreRombo t={t} p={p} />,
    cams: {
      buraco: orb([0, 0.5, -1.4], 4, 40, 7.2, 6.4, 42, 5),
    },
  },
  garantia: {
    ceu: CEU_ESCRITORIO,
    luz: 'interior',
    render: ({t, p}) => <Garantia t={t} p={p} />,
    cams: {
      ze: orb([-3.3, 1.15, 0.3], 72, 10, 4.0, 3.5, 40, 6),
      mesa: orb([-0.3, 1.1, 0], 90, 26, 7.4, 6.4, 42, 6),
    },
  },
  garantiasolta: {
    ceu: CEU_ESCRITORIO,
    luz: 'interior',
    render: ({t, p}) => <Garantia t={t} p={p} solta />,
    cams: {
      solta: orb([-2.6, 1.15, 1.0], 50, 10, 4.2, 3.4, 42, 6),
    },
  },
  escada: {
    ceu: CEU_ESTUDIO,
    luz: 'tarde',
    render: ({t, p}) => <Escada t={t} p={p} />,
    cams: {
      sobe: cam([7.5, 4.0, 6.5], [6.5, 5.8, 3.5], [0, 2.2, -3.5], 42, [0, 3.6, -6]),
    },
  },
  escadatopo: {
    ceu: CEU_ESTUDIO,
    luz: 'tarde',
    render: ({t, p}) => <Escada t={t} p={p} topo />,
    cams: {
      topo: orb([0.05, degY(6) + 0.55, degZ(6)], -8, 12, 6.6, 5.6, 42, 6),
    },
  },
  // v2 do McDonald's: cenários novos em src/rico/mcd.tsx (prefixo "mc")
  ...SETS_MCD,
  // piloto do Seu Tostão (Plano Collor): cenários de 1990 em src/rico/collor.tsx (prefixo "co")
  ...SETS_COLLOR,
};
void THREE;
void [Boneca, Carrinho, Urso, Cartela, Corneta, Sentado, CORES_PELE, CORES_ROUPA, Morro, Poste, Cil];
