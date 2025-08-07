// services/session.js
const sessions = new Map();

// Gestión de sede
function setSede(userId, sede) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {});
  }
  sessions.get(userId).sede = sede;
}

function getSede(userId) {
  return sessions.get(userId)?.sede;
}

// Gestión de idioma
function setLanguage(userId, language) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {});
  }
  sessions.get(userId).language = language;
}

function getLanguage(userId) {
  return sessions.get(userId)?.language;
}

// Limpiar sesión completa
function clearSession(userId) {
  sessions.delete(userId);
}

// Obtener toda la información de la sesión
function getSession(userId) {
  return sessions.get(userId) || {};
}

module.exports = { 
  setSede, 
  getSede, 
  setLanguage, 
  getLanguage,
  clearSession,
  getSession
};