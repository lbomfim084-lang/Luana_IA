// modules/router/router.js
//
// Camada responsável por interpretar o que o usuário quer e decidir a
// intenção. Não executa nada sozinha — apenas classifica o texto em uma
// intenção + payload. Quem executa é o app.js, chamando sempre funções
// previamente programadas (nunca código gerado dinamicamente).
//
// Intents possíveis:
//   time | date | calculator | search | open_app | open_website
//   memory_save | memory_query | note_save | note_query
//   clear_history | conversation

const INTENTS = {
  TIME: 'time',
  DATE: 'date',
  CALCULATOR: 'calculator',
  SEARCH: 'search',
  OPEN_APP: 'open_app',
  OPEN_WEBSITE: 'open_website',
  MEMORY_SAVE: 'memory_save',
  MEMORY_QUERY: 'memory_query',
  NOTE_SAVE: 'note_save',
  NOTE_QUERY: 'note_query',
  CLEAR_HISTORY: 'clear_history',
  CONVERSATION: 'conversation',
};

export { INTENTS };

function normalize(text) {
  return text.trim().toLowerCase();
}

function stripLeadingLuana(text) {
  return text.replace(/^luana,?\s*/i, '').trim();
}

// Cada regra: intent, regex de detecção, e um extrator opcional de payload.
const RULES = [
  {
    intent: INTENTS.TIME,
    test: /(que horas são|qual (é|e) o horário|horário agora|me diz(?: as)? horas|você sabe.*horas)/i,
  },
  {
    intent: INTENTS.DATE,
    test: /(que dia é hoje|qual (é|e) a data|em que dia estamos|data de hoje)/i,
  },
  {
    intent: INTENTS.CLEAR_HISTORY,
    test: /(limpa|limpar|apaga|apagar)\s+(a\s+)?(conversa|histórico|hist[oó]rico)/i,
  },
  {
    intent: INTENTS.MEMORY_QUERY,
    test: /(o que você (sabe|lembra) sobre mim|o que voce (sabe|lembra) sobre mim|mostr[ae]?\s+(a\s+)?mem[oó]ria)/i,
  },
  {
    intent: INTENTS.MEMORY_SAVE,
    test: /^(lembra|lembre-se|guarda|guarde|memoriza|memorize)\s+(que\s+)?/i,
    extract: (text) =>
      text.replace(/^(lembra|lembre-se|guarda|guarde|memoriza|memorize)\s+(que\s+)?/i, '').trim(),
  },
  {
    intent: INTENTS.NOTE_QUERY,
    test: /(mostr[ae]?\s+(as\s+)?(minhas\s+)?anota[cç][oõ]es|quais.*anota[cç][oõ]es|minhas notas)/i,
  },
  {
    intent: INTENTS.NOTE_SAVE,
    test: /^(anota|anote|anotar|registra|registre|cria uma nota|crie uma nota)\s+(que\s+)?/i,
    extract: (text) =>
      text
        .replace(/^(anota|anote|anotar|registra|registre|cria uma nota|crie uma nota)\s+(que\s+)?/i, '')
        .trim(),
  },
  {
    intent: INTENTS.CALCULATOR,
    test: /(quanto[ée]|quanto é|calcul[ae]|\d+\s*(vezes|dividido|mais|menos|%)|porcento|por cento)/i,
  },
  {
    intent: INTENTS.SEARCH,
    test: /(pesquis[ae]r?|procur[ae]r?|busc[ae]r?)\b/i,
  },
  {
    intent: INTENTS.OPEN_APP,
    // "abre/abra/abrir o instagram|tiktok|discord|..." — apps conhecidos
    // detectados de fato pelo appManager; aqui só sinalizamos a intenção
    // de abertura (open_app cobre tanto app quanto site — ver app.js).
    test: /^(abr[ea]|abrir)\s+(o|a|meu|minha)?\s*/i,
    extract: (text) =>
      text.replace(/^(abr[ea]|abrir)\s+(o|a|meu|minha)?\s*/i, '').trim(),
  },
];

/**
 * Decide a intenção a partir do texto do usuário.
 * Retorna { intent, payload, raw }
 */
export function route(rawText) {
  const raw = stripLeadingLuana(rawText);
  const text = normalize(raw);

  for (const rule of RULES) {
    if (rule.test.test(text)) {
      const payload = rule.extract ? rule.extract(raw.trim()) : raw.trim();
      return { intent: rule.intent, payload, raw };
    }
  }

  return { intent: INTENTS.CONVERSATION, payload: raw, raw };
}
