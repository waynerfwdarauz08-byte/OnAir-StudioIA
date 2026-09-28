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
      aria-label="Controles del teleprompter"
    >
      <div className="teleprompter-control-group">
        <span className="teleprompter-control-label">
          Reproducción
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

            {playing ? "Pausar" : "Iniciar"}
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

            Reiniciar
          </button>
        </div>
      </div>

      <div className="teleprompter-control-group">
        <label
          className="teleprompter-control-label"
          htmlFor="teleprompter-speed"
        >
          Velocidad
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
                {option.label}
              </option>
            )
          )}
        </select>
      </div>

      <div className="teleprompter-control-group">
        <span className="teleprompter-control-label">
          Tamaño del texto
        </span>

        <div className="teleprompter-font-controls">
          <button
            type="button"
            className="teleprompter-icon-button"
            disabled={
              disabled ||
              fontSize <= 32
            }
            aria-label="Disminuir tamaño del texto"
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
            aria-label="Aumentar tamaño del texto"
            onClick={increaseFontSize}
          >
            A+
          </button>
        </div>
      </div>

      <div className="teleprompter-control-group">
        <span className="teleprompter-control-label">
          Visualización
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

            Alto contraste
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
              ? "Salir de pantalla completa"
              : "Pantalla completa"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default TeleprompterControls;