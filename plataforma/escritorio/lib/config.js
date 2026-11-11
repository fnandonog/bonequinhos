// Configuração do escritório no Mac. O painel só escuta em 127.0.0.1, então quem abre é o dono.
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
module.exports = {
  ROOT,
  PROD: false,
  ADMIN_EMAILS: [],
  DB_FILE: process.env.ESCRITORIO_DB || path.join(ROOT, 'plataforma', 'dados', 'escritorio.db'),
};
