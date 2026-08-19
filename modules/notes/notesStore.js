// modules/notes/notesStore.js
// Notas = coisas que o usuário pede para anotar/registrar (diferente de memória).

const STORAGE_KEY = 'luana.notes.v1';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addNote(text) {
  const items = readAll();
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };
  items.push(entry);
  writeAll(items);
  return entry;
}

export function listNotes() {
  return readAll();
}

export function clearNotes() {
  writeAll([]);
}

export function removeNote(id) {
  const items = readAll().filter((i) => i.id !== id);
  writeAll(items);
}

export function notesSummaryReply() {
  const items = readAll();
  if (items.length === 0) {
    return 'Você ainda não tem nenhuma anotação.';
  }
  const list = items
    .map((i, idx) => `${idx + 1}. ${i.text}`)
    .join('\n');
  return `Suas anotações:\n${list}`;
}
