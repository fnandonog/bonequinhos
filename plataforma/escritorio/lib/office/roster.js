// Elenco da agência: os agentes (Claude Code, .claude/agents/<id>.md) que trabalham no escritório /admin/escritorio.
// A cor, o cabelo e a mesa são só visuais; o id é o mesmo nome do arquivo do agente e do --agent do executor (tools/agencia/run.mjs).
//
// Organograma (ver tools/agencia/LEIA-ME.md, "Organograma"):
//   Dono → Diretor (estratégia e resumo do dia) e Gerente Geral (aprovação final, id `gerente`)
//        → gerentes de área (coordenam a equipe e pré-aprovam; nunca dão a aprovação final) → agentes.
//   O Chefe do Estúdio é o gerente de área do Estúdio de vídeo (da pauta ao QA); o Ger. Redes cuida de legenda e postagem.
// `team` é a área de cada um; o gerente de área tem `leads` (a equipe dele). As regras de quem pode o quê ficam em gerente.js.
const TEAMS = {
  direcao: { name: 'Direção', color: '#ff7a1a' },
  // Estúdio de vídeo: Pauta → Pesquisa → Roteiro → Direção de cena → Cenografia → Edição → QA (linha de docs/PIPELINE.md)
  estudio: { name: 'Estúdio de vídeo', short: 'Estúdio', color: '#a855f7', manager: 'showrunner' },
  redes: { name: 'Redes sociais', short: 'Redes', color: '#ff4f9a', manager: 'gerente-marketing' },
  crescimento: { name: 'Crescimento e Monetização', short: 'Crescimento', color: '#18b26b', manager: 'gerente-crescimento' },
};

const ROSTER = [
  // Direção
  { id: 'gerente', name: 'Gerente Geral', role: 'Aprovação final pelo dono (dentro dos limites)', team: 'direcao', color: '#1f1a33', hair: '#8a8a8a', skin: '#d9a47c', style: 'side', desk: 'gerente' },
  { id: 'diretor', name: 'Diretor', role: 'Prioridades entre os 6 perfis e resumo do dia', team: 'direcao', color: '#ff7a1a', hair: '#2b2233', skin: '#e0ac7e', style: 'short' },
  // Gerentes de área
  { id: 'showrunner', name: 'Chefe do Estúdio', role: 'Toca a linha de vídeo e barra o que está fraco antes de chegar ao dono', team: 'estudio', manager: true, leads: ['pauteiro', 'pesquisador', 'roteirista', 'diretor-cena', 'cenografo', 'editor', 'qa'], color: '#a855f7', hair: '#2a1a3a', skin: '#d9a47c', style: 'cap' },
  { id: 'gerente-marketing', name: 'Ger. Redes', role: 'Calendário de postagem dos 6 perfis, legendas e funil de afiliado', team: 'redes', manager: true, leads: ['legendista', 'social-media', 'comunidade'], color: '#ff4f9a', hair: '#1b1b1b', skin: '#c68a5e', style: 'bun' },
  // Estúdio
  { id: 'pauteiro', name: 'Pauteiro', role: 'Escolhe o tema com mais chance de viralizar', team: 'estudio', color: '#f472b6', hair: '#1b1b1b', skin: '#f1c9a5', style: 'pony' },
  { id: 'pesquisador', name: 'Pesquisador', role: 'Números e fatos com fonte', team: 'estudio', color: '#22c55e', hair: '#6b3a1e', skin: '#8d5a3b', style: 'short' },
  { id: 'roteirista', name: 'Roteirista', role: 'Narração: gancho em 3 s, 1 número por frase', team: 'estudio', color: '#38bdf8', hair: '#6b3a1e', skin: '#f1c9a5', style: 'curly' },
  { id: 'diretor-cena', name: 'Diretor de cena', role: 'Storyboard plano a plano', team: 'estudio', color: '#f59e0b', hair: '#3c2416', skin: '#e8b48f', style: 'side' },
  { id: 'cenografo', name: 'Cenógrafo 3D', role: 'Cenários low-poly em escala real', team: 'estudio', color: '#14b8a6', hair: '#4a4a4a', skin: '#c68a5e', style: 'bald' },
  { id: 'editor', name: 'Editor', role: 'Legendas na tela, cards, ritmo, som e narração', team: 'estudio', color: '#ff6b3d', hair: '#111111', skin: '#8d5a3b', style: 'cap' },
  { id: 'qa', name: 'QA', role: 'Folha de stills: reprova bug visual antes do render', team: 'estudio', color: '#b0b8c8', hair: '#e2c26b', skin: '#f2cfb0', style: 'spiky' },
  // Redes
  { id: 'legendista', name: 'Legendista', role: 'Legenda, hashtags e título do Shorts', team: 'redes', color: '#dd2a7b', hair: '#d8a24a', skin: '#f3d2b5', style: 'long' },
  { id: 'gerente-crescimento', name: 'Ger. Crescimento', role: 'Metas de seguidores e receita, testes de crescimento', team: 'crescimento', manager: true, leads: ['analista', 'afiliados'], color: '#18b26b', hair: '#6b3a1e', skin: '#f1c9a5', style: 'curly' },
  { id: 'comunidade', name: 'Comunidade', role: 'Rascunhos de resposta aos comentários', team: 'redes', color: '#25b8d9', hair: '#7a1f1f', skin: '#f6d7bd', style: 'short' },
  { id: 'analista', name: 'Analista', role: 'Métricas de todos os canais viram pautas', team: 'crescimento', color: '#0f9d8a', hair: '#9b9b9b', skin: '#dba27a', style: 'side' },
  { id: 'afiliados', name: 'Afiliados', role: 'Produtos e links de afiliado de cada vídeo, ofertas do grupo', team: 'crescimento', color: '#f0a43a', hair: '#1d1d2b', skin: '#a8714c', style: 'long' },
  { id: 'social-media', name: 'Postador', role: 'Publica no horário de cada perfil (Instagram e Facebook)', team: 'redes', color: '#25b8d9', hair: '#3c2416', skin: '#ecc19c', style: 'pony' },
];
const IDS = ROSTER.map((a) => a.id);
const byId = Object.fromEntries(ROSTER.map((a) => [a.id, a]));
const AREA_MANAGERS = ROSTER.filter((a) => a.manager).map((a) => a.id);
const isAreaManager = (id) => AREA_MANAGERS.includes(id);
// Equipe de um gerente de área (sem ele mesmo); [] para quem não é gerente de área
const teamOf = (managerId) => (isAreaManager(managerId) ? byId[managerId].leads.slice() : []);
// Gerente de área responsável por um agente (ou null)
const managerOf = (id) => AREA_MANAGERS.find((m) => byId[m].leads.includes(id)) || null;
const teamName = (team) => (TEAMS[team] ? TEAMS[team].short || TEAMS[team].name : team);

module.exports = { ROSTER, IDS, byId, TEAMS, AREA_MANAGERS, isAreaManager, teamOf, managerOf, teamName };
