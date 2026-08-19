// modules/browser/browser.js

// Abre sites. Não fica limitado a uma lista fixa:
// 1. Se for uma URL/domínio explícito, abre diretamente.
// 2. Se o appManager conhecer o serviço, tenta abrir o app/site correto.
// 3. Caso contrário, tenta descobrir o domínio.
// 4. Se não encontrar, faz uma pesquisa no Google pelo nome.

import { findAppEntry, openApp } from '../apps/appManager.js';

const COMMON_SUFFIXES = ['.com.br', '.com', '.org', '.net'];

/**
 * Verifica se o texto parece ser um domínio.
 *
 * Exemplos:
 * instagram.com
 * google.com.br
 * https://discord.com
 */
function looksLikeDomain(text) {
  const value = text.trim();

  return /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(value);
}

/**
 * Converte um nome falado em uma possível URL.
 *
 * Exemplo:
 * "mercado livre" -> https://mercadolivre.com
 */
function toDomainGuess(name) {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');

  return `https://${slug}.com`;
}

/**
 * Abre uma URL corretamente tanto dentro do app nativo
 * (Capacitor) quanto em um navegador comum.
 */
async function openInBrowser(url) {
  const Browser = window.Capacitor?.Plugins?.Browser;

  if (Browser) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Faz uma pesquisa no Google usando o nome informado.
 */
async function searchOnGoogle(query) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  await openInBrowser(url);
}

/**
 * Abre um site a partir de um nome falado ou de uma URL/domínio explícito.
 *
 * Retorna:
 * {
 *   ok: boolean,
 *   label: string,
 *   mode: 'app' | 'web' | 'guess' | 'search'
 * }
 */
export async function openWebsite(rawName) {
  if (!rawName || typeof rawName !== 'string') {
    return {
      ok: false,
      label: '',
      mode: 'search'
    };
  }

  const name = rawName.trim();

  if (!name) {
    return {
      ok: false,
      label: '',
      mode: 'search'
    };
  }

  // --------------------------------------------------
  // 1. Já é uma URL/domínio explícito
  // --------------------------------------------------

  if (looksLikeDomain(name)) {
    const url = /^https?:\/\//i.test(name)
      ? name
      : `https://${name}`;

    try {
      await openInBrowser(url);

      return {
        ok: true,
        label: name,
        mode: 'web'
      };
    } catch (error) {
      console.error('Erro ao abrir URL:', error);

      return {
        ok: false,
        label: name,
        mode: 'web'
      };
    }
  }

  // --------------------------------------------------
  // 2. Serviço conhecido pelo appManager
  // --------------------------------------------------

  try {
    const known = findAppEntry(name);

    if (known) {
      const result = await openApp(known);

      return {
        ok: result !== false,
        label: known.name || name,
        mode: 'app'
      };
    }
  } catch (error) {
    console.warn('Não foi possível abrir pelo appManager:', error);
  }

  // --------------------------------------------------
  // 3. Tenta descobrir o domínio automaticamente
  // --------------------------------------------------

  const guessedUrl = toDomainGuess(name);

  try {
    await openInBrowser(guessedUrl);

    return {
      ok: true,
      label: name,
      mode: 'guess'
    };
  } catch (error) {
    console.warn('Não foi possível abrir domínio presumido:', error);
  }

  // --------------------------------------------------
  // 4. Último recurso: pesquisa no Google
  // --------------------------------------------------

  try {
    await searchOnGoogle(name);

    return {
      ok: true,
      label: name,
      mode: 'search'
    };
  } catch (error) {
    console.error('Erro ao pesquisar no Google:', error);

    return {
      ok: false,
      label: name,
      mode: 'search'
    };
  }
}
