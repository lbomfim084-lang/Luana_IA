// modules/calculator/calculator.js
// Interpreta expressões em linguagem natural (PT-BR) e calcula localmente,
// sem usar eval() sobre texto do usuário — usa um parser recursivo simples.

const WORD_NUMBERS = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, três: 3, tres: 3, quatro: 4,
  cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
};

function normalize(text) {
  let t = text.toLowerCase();

  // Substitui operadores em português por símbolos
  t = t
    .replace(/\bmais\b/g, '+')
    .replace(/\bmenos\b/g, '-')
    .replace(/\b(vezes|multiplicado por|multiplicad[oa] por|x)\b/g, '*')
    .replace(/\b(dividido por|dividido em|dividid[oa] por|÷)\b/g, '/')
    .replace(/\bpor cento de\b/g, '%de')
    .replace(/\b(\d+([.,]\d+)?)\s*%\s*de\b/g, '$1%de')
    .replace(/,/g, '.');

  // "15% de 800" -> (15/100)*800
  t = t.replace(/(\d+(?:\.\d+)?)\s*%de\s*(\d+(?:\.\d+)?)/g, '(($1/100)*$2)');
  t = t.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)');

  // Números por extenso simples
  for (const [word, num] of Object.entries(WORD_NUMBERS)) {
    t = t.replace(new RegExp(`\\b${word}\\b`, 'g'), String(num));
  }

  return t;
}

// Tokenizer + parser recursivo-descendente (apenas + - * / % ( ) e números)
function tokenize(expr) {
  const tokens = [];
  const re = /\d+(?:\.\d+)?|[+\-*/()]/g;
  let match;
  while ((match = re.exec(expr)) !== null) tokens.push(match[0]);
  return tokens;
}

function parseExpression(tokens) {
  let pos = 0;

  function peek() { return tokens[pos]; }
  function next() { return tokens[pos++]; }

  function parseFactor() {
    const tok = peek();
    if (tok === '(') {
      next();
      const val = parseAddSub();
      if (peek() === ')') next();
      return val;
    }
    if (tok === '-') {
      next();
      return -parseFactor();
    }
    const val = parseFloat(next());
    if (Number.isNaN(val)) throw new Error('Expressão inválida');
    return val;
  }

  function parseMulDiv() {
    let val = parseFactor();
    while (peek() === '*' || peek() === '/') {
      const op = next();
      const rhs = parseFactor();
      val = op === '*' ? val * rhs : val / rhs;
    }
    return val;
  }

  function parseAddSub() {
    let val = parseMulDiv();
    while (peek() === '+' || peek() === '-') {
      const op = next();
      const rhs = parseMulDiv();
      val = op === '+' ? val + rhs : val - rhs;
    }
    return val;
  }

  const result = parseAddSub();
  if (pos < tokens.length) throw new Error('Expressão inválida');
  return result;
}

export function tryCalculate(rawText) {
  try {
    const normalized = normalize(rawText);
    const tokens = tokenize(normalized);
    if (tokens.length === 0) return null;
    const result = parseExpression(tokens);
    if (Number.isNaN(result) || !Number.isFinite(result)) return null;
    return roundSmart(result);
  } catch {
    return null;
  }
}

function roundSmart(n) {
  return Math.round(n * 1e6) / 1e6;
}

export function calculatorReply(rawText) {
  const result = tryCalculate(rawText);
  if (result === null) {
    return 'Não consegui entender essa conta. Pode repetir de outro jeito?';
  }
  return `O resultado é ${result.toLocaleString('pt-BR')}.`;
}
