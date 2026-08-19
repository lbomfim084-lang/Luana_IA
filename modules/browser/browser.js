// modules/browser/browser.js
// Abre sites. Não fica limitado a uma lista fixa: se o app conhece o
// serviço (appManager), tenta abrir o app/site certo; caso contrário,
// tenta interpretar a fala como um domínio (ex.: "abre o mercado livre"
// -> mercadolivre.com) ou cai para uma pesquisa no Google pelo nome.

import { findAppEntry, openApp } from '../apps/appManager.js';

const COMMON_SUFFIXES = ['.com.br', '.com', '.org', '.net'];

function looksLikeDomain(text) {
  return /\.[a-z]{2,}$/i.test(text.trim());
}

function toDomainGuess(name) {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
  return `https://${slug}.com`;
}

// Abre uma URL corretamente tanto dentro do app nativo (Capacitor)
// quanto num navegador comum. window.open() sozinho não funciona
// dentro do WebView do app instalado — por isso usamos o plugin
// @capacitor/browser quando ele está disponível.
async function openInBrowser(url) {
  const Browser = window.Capacitor?.Plugins?.Browser;
  if (Browser) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener');
  }
}

/**
 * Abre um site a partir de um nome falado ou de uma URL/domínio explícito.
 * Retorna { ok, label, mode } — mode: 'app' | 'web' | 'guess'
 */
export async function openWebsite(rawName) {
  const name = rawName.trim();

  // 1. Já é uma URL/domínio explícito (ex.: "instagram.com")
  if (looksLikeDomain(name)) {
    const url = name.startsWith('http') ? name : `https://${name}`;
    await openInBrowser(url);
    return { ok: true, label: name, mode: 'web' };
  }

  // 2. É um serviço conhecido -> deixa o appManager decidir (app ou web)
  const known = findAppEntry(name
