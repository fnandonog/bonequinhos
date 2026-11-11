// Identidade visual da rede do Zé (bonequinhos): laranja do capacete do Zé e amarelo dos destaques.
const COLORS = {
  violet: '#ff7a1a', // cor principal (o nome da chave ficou do modelo original do escritório)
  lime: '#ffd23f',   // acento
  ink: '#1d1b18',
  paper: '#f6f3ee',
  night: '#151412',
};
// Símbolo: o capacete do Zé num quadrado laranja
function markPaths({ j = '#ffffff', accent = COLORS.lime, tile = COLORS.violet } = {}) {
  return `${tile ? `<rect x="2" y="2" width="60" height="60" rx="17" fill="${tile}"/>` : ''}`
    + `<path d="M14 40a18 18 0 0 1 36 0z" fill="${accent}"/><rect x="10" y="39" width="44" height="6" rx="3" fill="${accent}"/>`
    + `<circle cx="32" cy="51" r="5" fill="${j}"/>`;
}
const markSvg = (size = 64, opts) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">${markPaths(opts)}</svg>`;
const faviconDataUri = 'data:image/svg+xml,' + encodeURIComponent(markSvg(64));
module.exports = { COLORS, markPaths, markSvg, faviconDataUri };
