// modules/apps/appManager.js
//
// AppManager: identifica o aplicativo pedido, tenta abrir o app nativo do
// Android e, se não conseguir, cai para a versão web.
//
// Fase PWA (navegador): usamos o esquema `intent://` do Chrome/Android, que
// tenta abrir o app instalado e, se não existir, redireciona para a URL de
// fallback (S.browser_fallback_url) — tudo isso sem precisar de nenhum
// plugin nativo.
//
// Fase Capacitor (app instalado): quando o projeto rodar dentro do
// Capacitor, basta trocar `openViaIntent` por chamadas ao plugin
// `@capacitor/app` (App.openUrl) ou a um plugin nativo de "app launcher"
// (ex.: capacitor-community/app-launcher), mantendo o mesmo APP_CATALOG e
// a mesma função `openApp(name)` — nenhuma outra camada precisa mudar.

export const APP_CATALOG = {
  instagram: {
    label: 'Instagram',
    package: 'com.instagram.android',
    webUrl: 'https://www.instagram.com',
  },
  tiktok: {
    label: 'TikTok',
    package: 'com.zhiliaoapp.musically',
    webUrl: 'https://www.tiktok.com',
  },
  discord: {
    label: 'Discord',
    package: 'com.discord',
    webUrl: 'https://discord.com/app',
  },
  youtube: {
    label: 'YouTube',
    package: 'com.google.android.youtube',
    webUrl: 'https://www.youtube.com',
  },
  whatsapp: {
    label: 'WhatsApp',
    package: 'com.whatsapp',
    webUrl: 'https://web.whatsapp.com',
  },
  spotify: {
    label: 'Spotify',
    package: 'com.spotify.music',
    webUrl: 'https://open.spotify.com',
  },
  github: {
    label: 'GitHub',
    package: 'com.github.android',
    webUrl: 'https://github.com',
  },
  twitter: {
    label: 'X (Twitter)',
    package: 'com.twitter.android',
    webUrl: 'https://x.com',
  },
  x: {
    label: 'X (Twitter)',
    package: 'com.twitter.android',
    webUrl: 'https://x.com',
  },
  gmail: {
    label: 'Gmail',
    package: 'com.google.android.gm',
    webUrl: 'https://mail.google.com',
  },
  telegram: {
    label: 'Telegram',
    package: 'org.telegram.messenger',
    webUrl: 'https://web.telegram.org',
  },
  facebook: {
    label: 'Facebook',
    package: 'com.facebook.katana',
    webUrl: 'https://www.facebook.com',
  },
  netflix: {
    label: 'Netflix',
    package: 'com.netflix.mediaclient',
    webUrl: 'https://www.netflix.com',
  },
  google: {
    label: 'Google',
    package: null,
    webUrl: 'https://www.google.com',
  },
};

export function isAndroid() {
  return /android/i.test(navigator.userAgent || '');
}

export function findAppEntry(name) {
  const key = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  return APP_CATALOG[key] || null;
}

// Constrói uma intent:// URL que tenta abrir o app e cai para a web se
// o app não estiver instalado. Funciona no Chrome para Android.
function buildIntentUrl(entry) {
  if (!entry.package) return null;
  const fallback = encodeURIComponent(entry.webUrl);
  return `intent://#Intent;package=${entry.package};scheme=https;S.browser_fallback_url=${fallback};end`;
}

/**
 * Tenta abrir um aplicativo pelo nome.
 * Retorna { ok, label, mode } — mode: 'app' | 'web' | 'not_found'
 */
export function openApp(name) {
  const entry = findAppEntry(name);

  if (!entry) {
    return { ok: false, label: name, mode: 'not_found' };
  }

  if (isAndroid() && entry.package) {
    const intentUrl = buildIntentUrl(entry);
    try {
      window.location.href = intentUrl;
      return { ok: true, label: entry.label, mode: 'app' };
    } catch {
      // segue para o fallback web abaixo
    }
  }

  window.open(entry.webUrl, '_blank', 'noopener');
  return { ok: true, label: entry.label, mode: 'web' };
}
