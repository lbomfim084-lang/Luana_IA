// modules/search/search.js
//
// Transforma uma frase natural de pesquisa em um termo de busca limpo e
// abre o Google. A arquitetura fica preparada para, no futuro, evoluir
// para um pipeline real (buscar fontes, ler, comparar, resumir, citar) —
// por ora, `runSearch` apenas abre a busca; `extractQuery` é a peça que
// pode ser reaproveitada quando isso evoluir.

const TRIGGER_PATTERNS = [
  /^luana,?\s*/i,
  /^(você pode|voce pode|pode)\s*/i,
  /^(por favor,?\s*)/i,
  /^(pesquisa|pesquise|pesquisar|procura|procure|procurar|busca|busque|buscar)\s*(para mim)?\s*(sobre|por|no google)?\s*/i,
  /^(me\s+)?(diz|fala|conta)\s+(sobre|o que é)\s*/i,
];

export function extractQuery(rawText) {
  let text = rawText.trim();
  let changed = true;

  // Aplica os padrões repetidamente até não sobrar nada de "casca" no início
  while (changed) {
    changed = false;
    for (const pattern of TRIGGER_PATTERNS) {
      const stripped = text.replace(pattern, '');
      if (stripped !== text) {
        text = stripped.trim();
        changed = true;
      }
    }
  }

  return text.replace(/[.?!]+$/, '').trim();
}

export function buildSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function runSearch(rawText) {
  const query = extractQuery(rawText);
  if (!query) return { ok: false, query: '' };

  window.open(buildSearchUrl(query), '_blank', 'noopener');
  return { ok: true, query };
}
