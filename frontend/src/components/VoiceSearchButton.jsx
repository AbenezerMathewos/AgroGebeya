import { useState } from 'react';

export default function VoiceSearchButton({ onResult, lang = 'en-US' }) {
  const [listening, setListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'am' ? 'am-ET' : lang === 'om' ? 'om-ET' : 'en-US';

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && onResult) {
          onResult(transcript);
        }
        setListening(false);
      };

      recognition.onerror = () => {
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    } catch {
      setListening(false);
    }
  };

  return (
    <button
      type="button"
      className={`voice-search-btn ${listening ? 'listening' : ''}`}
      onClick={startListening}
      title={listening ? '🎙️ Listening... Speak now' : '🎙️ Voice Search (Speak Crop or Region)'}
      aria-label="Voice Search"
    >
      <span className="voice-icon">{listening ? '🔴' : '🎙️'}</span>
      {listening && <span className="voice-pulse-ring"></span>}
    </button>
  );
}
