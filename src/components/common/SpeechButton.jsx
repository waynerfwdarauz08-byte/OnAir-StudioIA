import { useState } from "react";

function SpeechButton({ text }) {
    const [speaking, setSpeaking] = useState(false);
    const [error, setError] = useState("");

    const language =
        document.documentElement.lang?.startsWith("en")
            ? "en"
            : "es";

    const labels =
        language === "en"
            ? {
                listen: "Listen to this heading",
                stop: "Stop reading",
                unavailable: "Speech is not available in this browser.",
            }
            : {
                listen: "Escuchar este encabezado",
                stop: "Detener lectura",
                unavailable: "La lectura en voz alta no está disponible en este navegador.",
            };

    function handleClick() {
        setError("");

        if (!("speechSynthesis" in window)) {
            setError(labels.unavailable);
            return;
        }

        if (speaking) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang =
            language === "en" ? "en-US" : "es-CR";
        const configuredRate = Number(
            document.documentElement.dataset.speechRate
        );

        utterance.rate = Number.isFinite(configuredRate)
            ? configuredRate
            : 1;

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => {
            setSpeaking(false);
            setError(labels.unavailable);
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    return (
        <span className="speech-control">
            <button
                className="speech-button"
                type="button"
                aria-label={speaking ? labels.stop : labels.listen}
                aria-pressed={speaking}
                onClick={handleClick}
            >
                <svg
                    className="speech-button-icon"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {speaking ? (
                        <rect x="7" y="7" width="10" height="10" />
                    ) : (
                        <>
                            <path d="M4 10v4h4l5 4V6L8 10H4Z" />
                            <path d="M16 9a4 4 0 0 1 0 6" />
                            <path d="M19 6a8 8 0 0 1 0 12" />
                        </>
                    )}
                </svg>
            </button>

            {error && (
                <span className="speech-error" role="status">
                    {error}
                </span>
            )}
        </span>
    );
}

export default SpeechButton;
