// modules/system/system.js
// Funções previamente programadas para hora e data.
// A IA nunca é consultada para isso — sempre o relógio do próprio celular.

export function getTimeString() {
  const now = new Date();
  return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function getTimeReply() {
  return `Agora são ${getTimeString()}.`;
}

export function getDateString() {
  const now = new Date();
  return now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function getDateReply() {
  return `Hoje é ${getDateString()}.`;
}
