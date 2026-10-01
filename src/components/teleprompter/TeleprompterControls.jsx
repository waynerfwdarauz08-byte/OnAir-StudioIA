import useAccessibility from "../../hooks/useAccessibility.js";

const SPEED_OPTIONS = [
  {
    value: 15,
    label: "Muy lenta",
  },
  {
    value: 25,
    label: "Lenta",
  },
  {
    value: 40,
    label: "Normal",
  },
  {
    value: 60,
    label: "Rápida",
  },
  {
    value: 80,
    label: "Muy rápida",
  },
];

function TeleprompterControls({
  playing = false,
  speed = 40,
  fontSize = 56,
  highContrast = false,
  fullscreen = false,
  disabled = false,
  onPlayPause,
  onRestart,
  onSpeedChange,
  onFontSizeChange,
  onContrastToggle,
  onFullscreenToggle,
}) {
  const { language } = useAccessibility();
  const isEnglish = language === "en";
  const speedLabels = isEnglish
    ? ["Very slow", "Slow", "Normal", "Fast", "Very fast"]
    : SPEED_OPTIONS.map((option) => option.label);
  function decreaseFontSize() {
    onFontSizeChange(
      Math.max(32, fontSize - 4)
    );
  }

  function increaseFontSize() {
    onFontSizeChange(
      Math.min(100, fontSize + 4)
    );
  }

  return (
    <section
      className="teleprompter-controls"
      aria-label={isEnglish ? "Teleprompter controls" : "Controles del teleprompter"}
    >
      <div className="teleprompter-control-group">
        <span className="teleprompter-control-label">
          {isEnglish ? "Playback" : "Reproducción"}
        </span>

        <div className="teleprompter-button-group">
          <button
            type="button"
            className="button button-primary"
            disabled={disabled}
            aria-pressed={playing}
            onClick={onPlayPause}
          >
            <span aria-hidden="true">
              {playing ? "Ⅱ" : "▶"}
            </span>

            {playing ? isEnglish ? "Pause" : "Pausar" : isEnglish ? "Start" : "Iniciar"}
          </button>

          <button
            type="button"
            className="button button-secondary"
            disabled={disabled}
            onClick={onRestart}
          >
            <span aria-hidden="true">
              ↺
            </span>

            {isEnglish ? "Restart" : "Reiniciar"}
          </button>
        </div>
      </div>

      <div className="teleprompter-control-group">
        <label
          className="teleprompter-control-label"
          htmlFor="teleprompter-speed"
        >
          {isEnglish ? "Speed" : "Velocidad"}
        </label>

        <select
          id="teleprompter-speed"
          className="teleprompter-control-select"
          value={speed}
          disabled={disabled}
          onChange={(event) =>
            onSpeedChange(
              Number(event.target.value)
            )
          }
        >
          {SPEED_OPTIONS.map(
            (option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {speedLabels[SPEED_OPTIONS.indexOf(option)]}
              </option>
            )
          )}
        </select>
      </div>

      <div className="teleprompter-control-group">
        <span className="teleprompter-control-label">
          {isEnglish ? "Text size" : "Tamaño del texto"}
        </span>

        <div className="teleprompter-font-controls">
          <button
            type="button"
            className="teleprompter-icon-button"
            disabled={
              disabled ||
              fontSize <= 32
            }
            aria-label={isEnglish ? "Decrease text size" : "Disminuir tamaño del texto"}
            onClick={decreaseFontSize}
          >
            A−
          </button>

          <output
            className="teleprompter-font-value"
            aria-live="polite"
          >
            {fontSize}px
          </output>

          <button
            type="button"
            className="teleprompter-icon-button"
            disabled={
              disabled ||
              fontSize >= 100
            }
            aria-label={isEnglish ? "Increase text size" : "Aumentar tamaño del texto"}
            onClick={increaseFontSize}
          >
            A+
          </button>
        </div>
      </div>

      <div className="teleprompter-control-group">
        <span className="teleprompter-control-label">
          {isEnglish ? "Display" : "Visualización"}
        </span>

        <div className="teleprompter-button-group">
          <button
            type="button"
            className={`button button-secondary ${
              highContrast
                ? "active"
                : ""
            }`}
            aria-pressed={highContrast}
            onClick={onContrastToggle}
          >
            <span aria-hidden="true">
              ◐
            </span>

            {isEnglish ? "High contrast" : "Alto contraste"}
          </button>

          <button
            type="button"
            className="button button-secondary"
            disabled={disabled}
            aria-pressed={fullscreen}
            onClick={onFullscreenToggle}
          >
            <span aria-hidden="true">
              {fullscreen ? "⊙" : "⛶"}
            </span>

            {fullscreen
              ? isEnglish ? "Exit full screen" : "Salir de pantalla completa"
              : isEnglish ? "Full screen" : "Pantalla completa"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default TeleprompterControls;
