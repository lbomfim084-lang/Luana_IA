// app.js — orquestrador principal da Luana
//
// Fluxo: usuário (voz ou texto) -> router (intenção) -> função previamente
// programada OU IA (só para conversation) -> resposta em texto + voz.

import { route, INTENTS } from './modules/router/router.js';
import { getTimeReply, getDateReply } from './modules/system/system.js';
import { calculatorReply } from './modules/calculator/calculator.js';
import { runSearch } from './modules/search/search.js';
import { openApp } from './modules/apps/appManager.js';
import { openWebsite } from './modules/browser/browser.js';
import {
  addMemory,
  memorySummaryReply,
} from './modules/memory/memoryStore.js';
import { addNote, notesSummaryReply } from './modules/notes/notesStore.js';
import {
  askAI,
  getEndpoint,
  setEndpoint,
  clearContext,
} from './modules/ai/aiClient.js';
import {
  SpeechState,
  createRecognizer,
  isRecognitionSupported,
  speak,
  stopSpeaking,
} from './modules/speech/speech.js';

// ---------- Elementos ----------
const conversationEl = document.getElementById('conversation');
const greetingEl = document.getElementById('greeting');
const liveTranscriptEl = document.getElementById('live-transcript');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const micBtn = document.getElementById('btn-mic');
const micIcon = document.getElementById('mic-icon');
const micLabel = document.getElementById('mic-label');
const textForm = document.getElementById('text-form');
const textInput = document.getElementById('text-input');
const btnClear = document.getElementById('btn-clear');
const btnSettings = document.getElementById('btn-settings');
const settingsDialog = document.getElementById('settings-dialog');
const settingsForm = document.getElementById('settings-form');
const inputEndpoint = document.getElementById('input-endpoint');
const inputVoiceEnabled = document.getElementById('input-voice-enabled');
const btnCloseSettings = document.getElementById('btn-close-settings');

// ---------- Estado local (preferências simples) ----------
const VOICE_PREF_KEY = 'luana.pref.voiceReplies';
let voiceRepliesEnabled = localStorage.getItem(VOICE_PREF_KEY) !== 'off';

// ---------- Estado de voz ----------
let currentState = SpeechState.IDLE;
let recognizer = null;

function setState(state) {
  currentState = state;
  micBtn.classList.toggle('listening', state === SpeechState.LISTENING);
  micBtn.classList.toggle('speaking', state === SpeechState.SPEAKING);

  const labels = {
    [SpeechState.IDLE]: 'Toque para falar',
    [SpeechState.LISTENING]: 'Ouvindo...',
    [SpeechState.PROCESSING]: 'Processando...',
    [SpeechState.SPEAKING]: 'Respondendo...',
    [SpeechState.ERROR]: 'Não entendi, tente de novo',
  };
  micLabel.textContent = labels[state] || '';

  statusDot.className = 'status-dot';
  if (state === SpeechState.PROCESSING || state === SpeechState.SPEAKING) {
    statusDot.classList.add('busy');
    statusText.textContent = state === SpeechState.SPEAKING ? 'falando' : 'pensando';
  } else if (!navigator.onLine) {
    statusDot.classList.add('offline');
    statusText.textContent = 'offline';
  } else {
    statusText.textContent = 'online';
  }
}

// ---------- UI: bolhas de conversa ----------
function addBubble(text, who) {
  if (greetingEl) greetingEl.remove();

  const bubble = document.createElement('div');
  bubble.className = `bubble ${who}`;

  if (who === 'luana') {
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = 'Luana';
    bubble.appendChild(label);
  }

  const content = document.createElement('span');
  content.textContent = text;
  bubble.appendChild(content);

  conversationEl.appendChild(bubble);
  conversationEl.scrollTop = conversationEl.scrollHeight;
}

function reply(text) {
  addBubble(text, 'luana');
  if (voiceRepliesEnabled) {
    setState(SpeechState.SPEAKING);
    speak(text, { onEnd: () => setState(SpeechState.IDLE) });
  } else {
    setState(SpeechState.IDLE);
  }
}

// ---------- Processamento central de intenções ----------
async function handleUserText(rawText) {
  const text = rawText.trim();
  if (!text) return;

  addBubble(text, 'user');
  setState(SpeechState.PROCESSING);

  const { intent, payload } = route(text);

  switch (intent) {
    case INTENTS.TIME:
      reply(getTimeReply());
      break;

    case INTENTS.DATE:
      reply(getDateReply());
      break;

    case INTENTS.CALCULATOR:
      reply(calculatorReply(text));
      break;

    case INTENTS.SEARCH: {
      const result = runSearch(text);
      reply(
        result.ok
          ? `Certo. Pesquisando "${result.query}" no Google.`
          : 'Não entendi o que você quer que eu pesquise.'
      );
      break;
    }

    case INTENTS.OPEN_APP: {
      if (!payload) {
        reply('O que você quer que eu abra?');
        break;
      }
      // Se parecer um site explícito (tem ponto, ex.: "github.com"),
      // usa o browser; senão tenta app conhecido primeiro.
      const result = /\.[a-z]{2,}$/i.test(payload)
        ? openWebsite(payload)
        : openApp(payload);

      if (result.mode === 'not_found') {
        const fallback = openWebsite(payload);
        reply(
          `Não encontrei o aplicativo ${payload} instalado. Vou tentar abrir a versão web.`
        );
      } else if (result.mode === 'app') {
        reply(`Claro. Abrindo o ${result.label}.`);
      } else {
        reply(`Abrindo ${result.label} pelo navegador.`);
      }
      break;
    }

    case INTENTS.MEMORY_SAVE:
      if (!payload) {
        reply('O que você quer que eu lembre?');
        break;
      }
      addMemory(payload);
      reply('Combinado, vou lembrar disso.');
      break;

    case INTENTS.MEMORY_QUERY:
      reply(memorySummaryReply());
      break;

    case INTENTS.NOTE_SAVE:
      if (!payload) {
        reply('O que você quer anotar?');
        break;
      }
      addNote(payload);
      reply('Anotado.');
      break;

    case INTENTS.NOTE_QUERY:
      reply(notesSummaryReply());
      break;

    case INTENTS.CLEAR_HISTORY:
      clearConversationUI();
      clearContext();
      reply('Pronto, limpei nosso histórico de conversa.');
      break;

    case INTENTS.CONVERSATION:
    default: {
      const result = await askAI(payload || text);
      reply(result.answer);
      break;
    }
  }
}

function clearConversationUI() {
  conversationEl.innerHTML = '';
}

// ---------- Entrada por texto ----------
textForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = textInput.value;
  textInput.value = '';
  handleUserText(value);
});

// ---------- Entrada por voz ----------
function initRecognizer() {
  if (!isRecognitionSupported()) return null;

  return createRecognizer({
    onResult: ({ interim, final }) => {
      if (interim) {
        liveTranscriptEl.hidden = false;
        liveTranscriptEl.textContent = interim;
      }
      if (final) {
        liveTranscriptEl.hidden = true;
        liveTranscriptEl.textContent = '';
        handleUserText(final);
      }
    },
    onEnd: () => {
      liveTranscriptEl.hidden = true;
      if (currentState === SpeechState.LISTENING) setState(SpeechState.IDLE);
    },
    onError: (error) => {
      liveTranscriptEl.hidden = true;
      if (error === 'no-speech') {
        setState(SpeechState.IDLE);
        return;
      }
      setState(SpeechState.ERROR);
      setTimeout(() => setState(SpeechState.IDLE), 1800);
    },
  });
}

micBtn.addEventListener('click', () => {
  if (!isRecognitionSupported()) {
    reply(
      'Seu navegador não tem suporte a reconhecimento de voz aqui. Pode digitar normalmente.'
    );
    textInput.focus();
    return;
  }

  if (currentState === SpeechState.SPEAKING) {
    stopSpeaking();
    setState(SpeechState.IDLE);
    return;
  }

  if (currentState === SpeechState.LISTENING) {
    recognizer && recognizer.stop();
    return;
  }

  if (!recognizer) recognizer = initRecognizer();
  if (!recognizer) return;

  try {
    recognizer.start();
    setState(SpeechState.LISTENING);
  } catch {
    // já estava rodando; ignora
  }
});

// ---------- Limpar conversa (botão da topbar) ----------
btnClear.addEventListener('click', () => {
  clearConversationUI();
  clearContext();
  greetingEl?.remove();
  addBubble('Como posso ajudar?', 'luana');
  setState(SpeechState.IDLE);
});

// ---------- Ajustes ----------
btnSettings.addEventListener('click', () => {
  inputEndpoint.value = getEndpoint();
  inputVoiceEnabled.checked = voiceRepliesEnabled;
  settingsDialog.showModal();
});

btnCloseSettings.addEventListener('click', () => settingsDialog.close());

settingsForm.addEventListener('submit', () => {
  setEndpoint(inputEndpoint.value);
  voiceRepliesEnabled = inputVoiceEnabled.checked;
  localStorage.setItem(VOICE_PREF_KEY, voiceRepliesEnabled ? 'on' : 'off');
});

// ---------- Status online/offline ----------
window.addEventListener('online', () => setState(currentState));
window.addEventListener('offline', () => setState(currentState));

// ---------- Service worker (PWA) ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

// ---------- Estado inicial ----------
setState(SpeechState.IDLE);
