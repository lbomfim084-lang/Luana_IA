// modules/speech/speech.js
// Reconhecimento de voz (Web Speech API) e síntese de fala em PT-BR.
// Se o navegador não suportar, o app continua funcionando por texto.

export const SpeechState = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ERROR: 'error',
};

const SpeechRecognitionImpl =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

export function isRecognitionSupported() {
  return Boolean(SpeechRecognitionImpl);
}

export function isSynthesisSupported() {
  return Boolean(window.speechSynthesis);
}

export function createRecognizer({ onResult, onEnd, onError }) {
  if (!isRecognitionSupported()) return null;

  const recognition = new SpeechRecognitionImpl();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += transcript;
      else interim += transcript;
    }
    onResult({ interim, final });
  };

  recognition.onerror = (event) => {
    onError && onError(event.error);
  };

  recognition.onend = () => {
    onEnd && onEnd();
  };

  return recognition;
}

let voicesCache = [];
if (isSynthesisSupported()) {
  const loadVoices = () => {
    voicesCache = window.speechSynthesis.getVoices();
  };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function pickPtBrVoice() {
  return (
    voicesCache.find((v) => v.lang === 'pt-BR') ||
    voicesCache.find((v) => v.lang && v.lang.startsWith('pt')) ||
    null
  );
}

export function speak(text, { onStart, onEnd } = {}) {
  if (!isSynthesisSupported()) {
    onEnd && onEnd();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = 1.02;
  utterance.pitch = 1.0;

  const voice = pickPtBrVoice();
  if (voice) utterance.voice = voice;

  utterance.onstart = () => onStart && onStart();
  utterance.onend = () => onEnd && onEnd();
  utterance.onerror = () => onEnd && onEnd();

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (isSynthesisSupported()) window.speechSynthesis.cancel();
}
