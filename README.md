# LUANA — Assistente Pessoal por Voz

Reescrita completa do protótipo J.A.R.V.I.S., mantendo a mesma essência
(PWA modular, 100% desenvolvível e testável a partir de um celular
Android, sem PC) — agora com identidade própria, router de intenções,
abertura de apps do Android e caminho pronto para virar aplicativo nativo
via Capacitor.

## O que já funciona

- **Personalidade própria**: a Luana conversa em PT-BR, de forma natural,
  educada e objetiva — nunca finge ter executado algo que não executou.
- **Router de intenções** (`modules/router/router.js`): interpreta frases
  em linguagem natural e decide o que fazer — hora, data, cálculo,
  pesquisa, abrir site/app, memória, notas ou conversa livre com IA.
- **Contexto de conversa**: mantém as últimas 20 mensagens para a IA
  entender perguntas de seguimento (ex.: "e C#?" depois de "o que é
  Python?").
- **Calculadora local segura** (`modules/calculator/calculator.js`):
  entende linguagem natural ("quanto é 15% de 800") sem usar `eval()`.
- **Pesquisa no Google** (`modules/search/search.js`): extrai o assunto
  da frase e abre a busca — arquitetura pronta para depois virar um
  pipeline real (ler fontes, resumir, citar).
- **Abrir sites e apps do Android** (`modules/apps/appManager.js` e
  `modules/browser/browser.js`): não é uma lista fechada — tenta abrir
  qualquer serviço pedido, com um catálogo de apps conhecidos
  (Instagram, TikTok, Discord, YouTube, WhatsApp, Spotify, GitHub, etc.)
  e fallback automático para a versão web quando o app não existe.
- **Memória** (fatos sobre você, salvos só quando você pede) e **notas**
  (coisas que você quer registrar) — sistemas separados, em
  `localStorage`.
- **Voz**: reconhecimento e síntese em pt-BR via Web Speech API, com
  fallback automático para texto se o navegador não suportar. Estados
  visíveis: ocioso, ouvindo, processando, respondendo.
- **Offline-first**: interface, hora, data, calculadora, memória e notas
  continuam funcionando sem internet. IA, pesquisa e sites externos
  seguem exigindo conexão — e a Luana avisa quando está sem IA.
- **Segurança**: a IA nunca executa código nem decide ações por conta
  própria. Ela só é usada para conversas abertas; todas as ações
  (abrir app, calcular, etc.) passam por funções fixas do próprio
  código, escolhidas pelo router.

## Estrutura

```
LUANA/
├── index.html / style.css / app.js
├── manifest.json / service-worker.js
├── capacitor.config.json / package.json
├── modules/
│   ├── router/      → decide a intenção do usuário
│   ├── ai/           → fala com o endpoint de IA configurável
│   ├── speech/       → reconhecimento e síntese de voz
│   ├── memory/       → fatos sobre o usuário
│   ├── notes/        → anotações
│   ├── calculator/   → cálculo local, sem eval()
│   ├── search/       → extrai termo de busca e abre o Google
│   ├── apps/         → abre apps Android instalados (com fallback web)
│   └── browser/      → abre sites em geral
└── .github/workflows/build-android.yml → build do APK na nuvem
```

## Testar agora, só com o celular (fase PWA)

Igual antes: suba os arquivos para o GitHub Pages ou Netlify Drop (veja
o README anterior do projeto para o passo a passo) e abra pelo Chrome do
Android. "Adicionar à tela inicial" já instala como app.

## Configurar a IA

Em **⚙️ Ajustes**, cole a URL de um backend seu (Cloudflare Worker,
Vercel Function etc.) que recebe:

```json
{ "system": "...", "messages": [{"role":"user","content":"..."}] }
```

e responde:

```json
{ "answer": "..." }
```

A chave da API do provedor de IA fica só nesse backend — nunca no app.

## Virando aplicativo Android de verdade (Capacitor), sem PC

Como você só tem o celular, a forma mais realista de gerar o `.apk` é
deixar o **GitHub Actions** (nuvem) fazer o build — tudo disparado pelo
navegador do celular:

1. Suba este projeto para um repositório no GitHub (pode ser pelo app ou
   pelo navegador, usando "Add file → Upload files").
2. Vá em **Actions** no repositório e rode o workflow **"Build LUANA
   Android APK"** manualmente (ou ele roda sozinho a cada push na
   `main`).
3. Quando terminar, baixe o artefato `luana-debug-apk` — é o `.apk`
   pronto para instalar no seu Android (ative "Instalar de fontes
   desconhecidas" se o Chrome/Android pedir).

Esse workflow já está em `.github/workflows/build-android.yml`: ele
instala o Capacitor, gera o projeto `android/` automaticamente
(`npx cap add android`), sincroniza o frontend e builda o APK debug —
tudo na nuvem, sem exigir Android Studio no seu aparelho.

Quando o projeto já estiver rodando como app nativo via Capacitor, o
próximo passo é trocar a abertura de apps em `modules/apps/appManager.js`
pelo plugin nativo (`@capacitor/app` ou um "app launcher" da comunidade)
— a interface da função `openApp(nome)` não muda, só a implementação por
dentro, então nenhum outro módulo precisa ser tocado.

## Próximos passos (roadmap)

- **0.3**: pesquisa real com leitura de fontes, resumo e citações;
  clima; notícias; calendário; lembretes.
- **0.4**: câmera, análise de imagem, OCR.
- **0.5**: wake word ("Luana"), segundo plano, notificações, mais
  integração nativa com Android.
- **1.0**: memória avançada, automações pessoais, integração entre
  dispositivos, sistema de plugins.

A base modular já foi pensada para isso — nenhuma dessas evoluções exige
reescrever o núcleo.

## Adicionando uma nova habilidade

Crie um novo módulo em `modules/<algo>/`, exporte uma função clara, e
adicione uma regra correspondente em `modules/router/router.js` (um
`test` de regex + um `intent`) e o `case` correspondente em `app.js`.
Nenhum outro arquivo precisa mudar.
