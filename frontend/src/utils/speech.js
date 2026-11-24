// Browser Web Speech API helper for Voice-to-Task
export const isSpeechSupported = () => {
  return typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
};

export const startVoiceRecognition = ({ onResult, onError, onEnd }) => {
  const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SpeechRecognition) {
    if (onError) onError("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      if (event.results && event.results[0] && event.results[0][0]) {
        const transcript = event.results[0][0].transcript;
        if (onResult) onResult(transcript);
      }
    };

    recognition.onerror = (event) => {
      if (onError) onError(event.error || "Voice capture error");
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    recognition.start();
    return recognition;
  } catch (err) {
    if (onError) onError(err.message);
    return null;
  }
};
