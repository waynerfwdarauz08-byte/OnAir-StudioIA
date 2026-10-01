const THEME_OPTIONS = {
  es: [
    {
      id: "dark",
      name: "Modo oscuro",
      description:
        "Interfaz oscura diseñada para salas de redacción y espacios con poca iluminación.",
      previewClass: "theme-preview-dark",
    },
    {
      id: "light",
      name: "Modo claro",
      description:
        "Interfaz luminosa con mayor claridad para trabajar durante el día.",
      previewClass: "theme-preview-light",
    },
    {
      id: "contrast",
      name: "Alto contraste",
      description:
        "Colores intensos y bordes definidos para mejorar la accesibilidad.",
      previewClass: "theme-preview-contrast",
    },
  ],
  en: [
    {
      id: "dark",
      name: "Dark mode",
      description:
        "A dark interface designed for newsrooms and low-light spaces.",
      previewClass: "theme-preview-dark",
    },
    {
      id: "light",
      name: "Light mode",
      description:
        "A bright interface for clearer daytime use.",
      previewClass: "theme-preview-light",
    },
    {
      id: "contrast",
      name: "High contrast",
      description:
        "Strong colors and defined borders to improve accessibility.",
      previewClass: "theme-preview-contrast",
    },
  ],
};

function ThemeSelector({
  value,
  language = "es",
  disabled = false,
  onChange,
}) {
  const isEnglish = language === "en";
  const options = THEME_OPTIONS[isEnglish ? "en" : "es"];

  return (
    <fieldset
      className="theme-selector"
      disabled={disabled}
    >
      <legend>{isEnglish ? "Color theme" : "Modo de color"}</legend>

      <p className="theme-selector-description">
        {isEnglish
          ? "Choose the overall appearance of OnAir Studio AI."
          : "Selecciona la apariencia general de OnAir Studio AI."}
      </p>

      <div className="theme-options">
        {options.map((option) => {
          const selected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              className={`theme-option ${
                selected ? "theme-option-selected" : ""
              }`}
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
            >
              <span
                className={`theme-preview ${option.previewClass}`}
                aria-hidden="true"
              >
                <span className="theme-preview-sidebar" />
                <span className="theme-preview-content">
                  <span />
                  <span />
                  <span />
                </span>
              </span>

              <span className="theme-option-information">
                <strong>{option.name}</strong>
                <small>{option.description}</small>
              </span>

              <span
                className="theme-selection-indicator"
                aria-hidden="true"
              >
                {selected ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default ThemeSelector;