// modules/ai/aiClient.js
// Camada de IA isolada e substituível. Nenhuma chave de API fica no frontend.
// Fala com um endpoint HTTP configurado em Ajustes -> Endpoint de IA.
//
// Contrato esperado do backend:
//   POST { "messages": [{role, content}, ...], "system": "..." }
//   -> { "answer": "..." }
//
// A IA NUNCA executa código nem decide ações do sistema aqui — essa camada
// só serve para conversas abertas. Ações (abrir app, calcular, etc.) são
// sempre feitas por funções previamente programadas, escolhidas pelo router.

const ENDPOINT_KEY = 'luana.ai.endpoint';
const CONTEXT_KEY = 'luana.ai.context.v1';
const MAX_CONTEXT_MESSAGES = 20;

export const LUANA_SYSTEM_PROMPT = `
Você é a Luana, uma assistente pessoal de IA em português do Brasil.
Personalidade: natural, inteligente, educada, amigável, objetiva e
levemente descontraída. Não parece um chatbot genérico.
Para perguntas simples, responda de forma curta. Para perguntas
complexas, pode explicar com mais detalhes. Nunca finja ter executado
uma ação (abrir app, pesquisar, etc.) — você só conversa; ações do
sistema são feitas por outra camada. Mantenha o fio da conversa
considerando as mensagens anteriores.
`.trim();

export function getEndpoint() {
  return localStorage.getItem(ENDPOINT_KEY) || '';
}

export function setEndpoint(url) {
  localStorage.setItem(ENDPOINT_KEY, url.trim());
}

export function hasEndpoint() {
  return Boolean(getEndpoint());
}

// --- Contexto de conversa (curto, limitado) ---

export function getContext() {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveContext(messages) {
  const trimmed = messages.slice(-MAX_CONTEXT_MESSAGES);
  localStorage.setItem(CONTEXT_KEY, JSON.stringify(trimmed));
}

export function pushToContext(role, content) {
  const messages = getContext();
  messages.push({ role, content });
  saveContext(messages);
}

export function clearContext() {
  localStorage.removeItem(CONTEXT_KEY);
}

// --- Chamada ao endpoint configurado ---

export async function askAI(userText) {
  const endpoint = getEndpoint();

  if (!endpoint) {
    return {
      ok: false,
      answer:
        'Ainda não tenho um endpoint de IA configurado. Configure em Ajustes → Endpoint de IA para eu poder responder perguntas abertas.',
    };
  }

  pushToContext('user', userText);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: LUANA_SYSTEM_PROMPT,
        messages: getContext(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Endpoint respondeu ${response.status}`);
    }

    const data = await response.json();
    const answer = (data && data.answer) || null;

    if (!answer) {
      throw new Error('Resposta sem campo "answer"');
    }

    pushToContext('assistant', answer);
    return { ok: true, answer };
  } catch (err) {
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    const message = offline
      ? 'Estou sem conexão com a internet no momento, por isso não consigo falar com a IA.'
      : 'Estou sem conexão com a IA no momento. Tente novamente daqui a pouco.';
    return { ok: false, answer: message, error: String(err) };
  }
}
