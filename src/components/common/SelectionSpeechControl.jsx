import {
  useEffect,
  useState,
} from "react";

import useAccessibility from "../../hooks/useAccessibility.js";

function SelectionSpeechControl() {
  const {
    language,
    speechRate,
  } = useAccessibility();

  const [selectedText, setSelectedText] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");

  const isEnglish = language === "en";

  useEffect(() => {
    function updateSelection() {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || "";

      setSelectedText(text);
      setError("");
    }

    document.addEventListener(
      "selectionchange",
      updateSelection
    );

    return () => {
      document.removeEventListener(
        "selectionchange",
        updateSelection
      );

      window.speechSynthesis?.cancel();
    };
  }, []);

  function handleListen() {
    if (!selectedText) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      setError(
        isEnglish
          ? "Speech is not available in this browser."
          : "La lectura en voz alta no está disponible en este navegador."
      );
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(selectedText);

    utterance.lang = isEnglish ? "en-US" : "es-CR";
    utterance.rate = speechRate;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      setError(
        isEnglish
          ? "The selected text could not be read."
          : "No fue posible leer el texto seleccionado."
      );
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  if (!selectedText && !error) {
    return null;
  }

  return (
    <div
      className="selection-speech-control"
      role="region"
      aria-label={
        isEnglish
          ? "Selected text reader"
          : "Lector del texto seleccionado"
      }
    >
      {error && (
        <p className="selection-speech-error" role="status">
          {error}
        </p>
      )}

      {selectedText && (
        <>
          <span className="selection-speech-preview">
            {selectedText.length > 90
              ? `${selectedText.slice(0, 90)}…`
              : selectedText}
          </span>

          <button
            type="button"
            className="button button-primary"
            aria-pressed={speaking}
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleListen}
          >
            {speaking
              ? isEnglish
                ? "Stop reading"
                : "Detener lectura"
              : isEnglish
                ? "Read selection"
                : "Escuchar selección"}
          </button>
        </>
      )}
    </div>
  );
}

export default SelectionSpeechControl;