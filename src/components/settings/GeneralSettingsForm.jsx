import ThemeSelector from "./ThemeSelector.jsx";

function GeneralSettingsForm({
  settings,
  theme,
  language = "es",
  accessibility,
  saving = false,
  onSettingsChange,
  onThemeChange,
  onAccessibilityChange,
  onSubmit,
}) {
  const isEnglish = language === "en";

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
            <span>
              {isEnglish ? "SYSTEM IDENTITY" : "IDENTIDAD DEL SISTEMA"}
            </span>

            <h2>
              {isEnglish ? "General settings" : "Configuración general"}
            </h2>

            <p>
              {isEnglish
                ? "Customize the platform name and general values."
                : "Personaliza la identificación y los valores generales de la plataforma."}
            </p>
          </div>

          <span className="settings-section-number">01</span>
        </header>

        <div className="settings-fields-grid">
          <div className="form-field">
            <label htmlFor="channel-name">
              {isEnglish ? "Channel name" : "Nombre del canal"}
            </label>

            <input
              id="channel-name"
              name="channelName"
              type="text"
              minLength="3"
              maxLength="60"
              value={settings.channelName || ""}
              placeholder="OnAir Studio AI"
              disabled={saving}
              required
              onChange={handleChange}
            />

            <small className="field-help">
              {isEnglish
                ? "This name identifies the production workspace."
                : "Este nombre identificará el espacio de producción."}
            </small>
          </div>

          <div className="form-field">
            <label htmlFor="words-per-minute">
              {isEnglish ? "Words per minute" : "Palabras por minuto"}
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
              {isEnglish
                ? "Used to estimate the duration of scripts."
                : "Se utiliza para calcular la duración estimada de los guiones."}
            </small>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <header className="settings-section-heading">
          <div>
            <span>{isEnglish ? "APPEARANCE" : "APARIENCIA"}</span>

            <h2>
              {isEnglish ? "Visual settings" : "Personalización visual"}
            </h2>

            <p>
              {isEnglish
                ? "Choose the application's color theme."
                : "Cambia el modo de color de toda la aplicación."}
            </p>
          </div>

          <span className="settings-section-number">02</span>
        </header>

        <ThemeSelector
          value={theme}
          language={language}
          disabled={saving}
          onChange={onThemeChange}
        />
      </section>

      <section className="settings-section">
        <header className="settings-section-heading">
          <div>
            <span>{isEnglish ? "ACCESSIBILITY" : "ACCESIBILIDAD"}</span>

            <h2>
              {isEnglish
                ? "Reading and display"
                : "Lectura y visualización"}
            </h2>

            <p>
              {isEnglish
                ? "These preferences are saved automatically in this browser."
                : "Estas preferencias se guardan automáticamente en este navegador."}
            </p>
          </div>

          <span className="settings-section-number">03</span>
        </header>

        <div className="settings-fields-grid">
          <div className="form-field">
            <label htmlFor="accessibility-language">
              {isEnglish ? "Interface language" : "Idioma de la interfaz"}
            </label>

            <select
              id="accessibility-language"
              value={accessibility.language}
              onChange={(event) =>
                onAccessibilityChange("language", event.target.value)
              }
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="accessibility-font-scale">
              {isEnglish ? "Text size" : "Tamaño del texto"}
            </label>

            <select
              id="accessibility-font-scale"
              value={accessibility.fontScale}
              onChange={(event) =>
                onAccessibilityChange(
                  "fontScale",
                  Number(event.target.value)
                )
              }
            >
              {[100, 125, 150, 175, 200].map((scale) => (
                <option key={scale} value={scale}>
                  {scale}%
                </option>
              ))}
            </select>

            <small className="field-help">
              {isEnglish
                ? "Enlarges the interface text."
                : "Aumenta el tamaño del texto de la interfaz."}
            </small>
          </div>

          <div className="form-field">
            <label htmlFor="accessibility-color-vision">
              {isEnglish ? "Color palette" : "Paleta de colores"}
            </label>

            <select
              id="accessibility-color-vision"
              value={accessibility.colorVision}
              onChange={(event) =>
                onAccessibilityChange(
                  "colorVision",
                  event.target.value
                )
              }
            >
              <option value="standard">
                {isEnglish ? "Standard" : "Estándar"}
              </option>
              <option value="colorblind">
                {isEnglish
                  ? "Color-blind friendly"
                  : "Apta para daltonismo"}
              </option>
            </select>

            <small className="field-help">
              {isEnglish
                ? "Status labels remain visible in addition to their colors."
                : "Los estados también se identifican con texto, no solo con color."}
            </small>
          </div>

          <div className="form-field">
            <label htmlFor="accessibility-speech-rate">
              {isEnglish ? "Reading voice speed" : "Velocidad de lectura en voz alta"}
            </label>

            <select
              id="accessibility-speech-rate"
              value={accessibility.speechRate}
              onChange={(event) =>
                onAccessibilityChange(
                  "speechRate",
                  Number(event.target.value)
                )
              }
            >
              <option value="0.75">
                {isEnglish ? "Slow" : "Lenta"}
              </option>
              <option value="1">
                {isEnglish ? "Normal" : "Normal"}
              </option>
              <option value="1.25">
                {isEnglish ? "Fast" : "Rápida"}
              </option>
              <option value="1.5">
                {isEnglish ? "Very fast" : "Muy rápida"}
              </option>
            </select>
          </div>

          <label className="settings-toggle-field">
            <input
              type="checkbox"
              checked={accessibility.reduceMotion}
              disabled={saving}
              onChange={(event) =>
                onAccessibilityChange(
                  "reduceMotion",
                  event.target.checked
                )
              }
            />

            <span>
              <strong>
                {isEnglish ? "Reduce animations" : "Reducir animaciones"}
              </strong>

              <small>
                {isEnglish
                  ? "Minimizes interface movement and transitions."
                  : "Disminuye el movimiento y las transiciones de la interfaz."}
              </small>
            </span>
          </label>
        </div>
      </section>

      <section className="settings-save-panel">
        <div>
          <strong>
            {isEnglish ? "Save system settings" : "Guardar configuración"}
          </strong>

          <p>
            {isEnglish
              ? "The channel name, script speed, and color theme are saved when you press the button. Accessibility preferences save automatically in this browser."
              : "El nombre del canal, las palabras por minuto y el tema se guardan al presionar el botón. Las preferencias de accesibilidad se guardan automáticamente en este navegador."}
          </p>
        </div>

        <button
          type="submit"
          className="button button-primary"
          disabled={saving}
        >
          {saving
            ? isEnglish
              ? "Saving..."
              : "Guardando cambios..."
            : isEnglish
              ? "Save changes"
              : "Guardar cambios"}
        </button>
      </section>
    </form>
  );
}

export default GeneralSettingsForm;
