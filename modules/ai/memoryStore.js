// modules/memory/memoryStore.js
// Memória = fatos sobre o usuário que ele pediu explicitamente para guardar.
// Diferente do histórico de conversa (contexto) e das notas.

const STORAGE_KEY = 'luana.memory.v1';

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

export function addMemory(fact) {
  const items = readAll();
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fact: fact.trim(),
    createdAt: new Date().toISOString(),
  };
  items.push(entry);
  writeAll(items);
  return entry;
}

export function listMemory() {
  return readAll();
}

export function clearMemory() {
  writeAll([]);
}

export function removeMemory(id) {
  const items = readAll().filter((i) => i.id !== id);
  writeAll(items);
}

export function memorySummaryReply() {
  const items = readAll();
  if (items.length === 0) {
    return 'Ainda não guardei nenhuma informação sobre você.';
  }
  const list = items.map((i) => `- ${i.fact}`).join('\n');
  return `Aqui está o que eu sei sobre você:\n${list}`;
}
