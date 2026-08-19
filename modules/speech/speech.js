// modules/speech/speech.js
// Reconhecimento de voz e síntese de fala em PT-BR.
//
// Dentro do app instalado (Capacitor), a Web Speech API do navegador não
// existe — por isso usamos o plugin nativo @capacitor-community/speech-recognition
// quando o app está rodando como app nativo. No navegador comum (ex.: testando
// pelo GitHub Pages), continua usando a Web Speech API normalmente.

export const SpeechState = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ERROR: 'error',
};

const SpeechRecognitionImpl =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

const NativeSpeechRecognition = window.Capacitor?.Plugins?.SpeechRecognition || null;
const isNativeApp = Boolean(window.Capacitor?.isNativePlatform?.());

export function isRecognitionSupported() {
  if (isNativeApp) return Boolean(NativeSpeechRecognition);
  return Boolean(SpeechRecognitionImpl);
}

export function isSynthesisSupported() {
  return Boolean(window.speechSynthesis);
}

export function createRecognizer({ onResult, onEnd, onError }) {
  if (!isRecognitionSupported()) return null;

  // ---------- Caminho nativo (app instalado) ----------
  if (isNativeApp && NativeSpeechRecognition) {
    let listeners = [];
    let lastMatch = '';

    return {
      async start() {
        try {
          const { available } = await NativeSpeechRecognition.available();
          if (!available) {
            onError && onError('not-available');
            return;
          }

          let perm = await NativeSpeechRecognition.checkPermissions();
          if (perm.speechRecognition !== 'granted') {
            perm = await NativeSpeechRecognition.requestPermissions();
          }
          if (perm.speechRecognition !== 'granted') {
            onError && onError('permission-denied');
            return;
          }

          lastMatch = '';

          const partialListener = await NativeSpeechRecognition.addListener(
            'partialResults',
            (data) => {
              lastMatch = data.matches && data.matches[0] ? data.matches[0] : lastMatch;
              onResult({ interim: lastMatch, final: '' });
            }
          );
          listeners.push(partialListener);

          const stateListener = await NativeSpeechRecognition.addListener(
            'listeningState',
            (data) => {
              if (data.status === 'stopped') {
                if (lastMatch) onResult({ interim: '', final: lastMatch });
                onEnd && onEnd();
              }
            }
          );
          listeners.push(stateListener);

          await NativeSpeechRecognition.start({
            language: 'pt-BR',
            maxResults: 1,
            partialResults: true,
            popup: false,
          });
        } catch (err) {
          onError && onError(err?.message || 'recognition-error');
        }
      },

      async stop() {
        try {
          await NativeSpeechRecognition.stop();
        } catch {
          // já parado
        }
        for (const listener of listeners) {
          try { await listener.remove(); } catch {}
        }
        listeners = [];
      },
    };
  }

  // ---------- Caminho navegador (Web Speech API) ----------
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
