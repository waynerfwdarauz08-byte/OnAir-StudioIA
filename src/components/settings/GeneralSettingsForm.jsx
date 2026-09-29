import ThemeSelector from "./ThemeSelector.jsx";

function GeneralSettingsForm({
  settings,
  theme,
  saving = false,
  onSettingsChange,
  onThemeChange,
  onSubmit,
}) {
  function handleChange(event) {
    const { name, value } = event.target;

    onSettingsChange({
      ...settings,
      [name]:
        name === "wordsPerMinute"
          ? Number(value)
          : value,
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      className="general-settings-form"
      onSubmit={handleSubmit}
    >
      <section className="settings-section">
        <header className="settings-section-heading">
          <div>
            <span>IDENTIDAD DEL SISTEMA</span>
            <h2>Configuración general</h2>
            <p>
              Personaliza la identificación y los valores
              generales de la plataforma.
            </p>
          </div>

          <span className="settings-section-number">
            01
          </span>
        </header>

        <div className="settings-fields-grid">
          <div className="form-field">
            <label htmlFor="channel-name">
              Nombre del canal
            </label>

            <input
              id="channel-name"
              name="channelName"
              type="text"
              minLength="3"
              maxLength="60"
              value={settings.channelName || ""}
              placeholder="Ejemplo: OnAir Studio AI"
              disabled={saving}
              required
              onChange={handleChange}
            />

            <small className="field-help">
              Este nombre identificará el espacio de
              producción.
            </small>
          </div>

          <div className="form-field">
            <label htmlFor="words-per-minute">
              Palabras por minuto
            </label>

            <div className="input-with-suffix">
              <input
                id="words-per-minute"
                name="wordsPerMinute"
                type="number"
                min="80"
                max="250"
                step="5"
                value={settings.wordsPerMinute || 150}
                disabled={saving}
                required
                onChange={handleChange}
              />

              <span>PPM</span>
            </div>

            <small className="field-help">
              Se utiliza para calcular la duración estimada
              de los guiones.
            </small>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <header className="settings-section-heading">
          <div>
            <span>APARIENCIA</span>
            <h2>Personalización visual</h2>
            <p>
              Cambia el modo de color de toda la
              aplicación.
            </p>
          </div>

          <span className="settings-section-number">
            02
          </span>
        </header>

        <ThemeSelector
          value={theme}
          disabled={saving}
          onChange={onThemeChange}
        />
      </section>

      <section className="settings-save-panel">
        <div>
          <strong>Guardar configuración</strong>

          <p>
            Los cambios del sistema y el modo visual se
            conservarán para las próximas sesiones.
          </p>
        </div>

        <button
          type="submit"
          className="button button-primary"
          disabled={saving}
        >
          {saving
            ? "Guardando cambios..."
            : "Guardar cambios"}
        </button>
      </section>
    </form>
  );
}

export default GeneralSettingsForm;