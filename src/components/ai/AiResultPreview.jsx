import { EDITORIAL_STATUS_LABELS, estimateScriptDuration } from "../../utils/news.js";
import useSystemSettings from "../../hooks/useSystemSettings.js";
import useAccessibility from "../../hooks/useAccessibility.js";

function AiResultPreview({
  result,
  categories,
  saving = false,
  onChange,
  onSave,
  onClear,
}) {
  const { wordsPerMinute } = useSystemSettings();
  const { language } = useAccessibility();
  const isEnglish = language === "en";
  const statusLabels = isEnglish
    ? { draft: "Draft", review: "Under review", correction: "Needs correction", approved: "Approved" }
    : EDITORIAL_STATUS_LABELS;
  function handleChange(event) {
    const { name, value } = event.target;

    onChange({
      ...result,
      [name]:
        name === "estimatedDurationSeconds"
          ? Number(value)
          : value,
      ...(name === "script" ? { estimatedDurationSeconds: estimateScriptDuration(value, wordsPerMinute) } : {}),
    });
  }

  function handleLowerThirdOptions(event) {
    const options = event.target.value
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    const selectedExists = options.includes(
      result.selectedLowerThird
    );

    onChange({
      ...result,
      lowerThirdOptions: options,
      selectedLowerThird: selectedExists
        ? result.selectedLowerThird
        : options[0] || "",
    });
  }

  return (
    <section
      className="ai-result"
      aria-labelledby="ai-result-title"
    >
      <header className="ai-result-heading">
        <div>
          <span>{isEnglish ? "GENERATED PROPOSAL" : "PROPUESTA GENERADA"}</span>

          <h2 id="ai-result-title">
            {isEnglish ? "Artificial intelligence result" : "Resultado de inteligencia artificial"}
          </h2>

          <p>
            {isEnglish ? "Review and correct the information before saving it as a news item." : "Revisa y corrige la información antes de guardarla como noticia."}
          </p>
        </div>

        <span className="ai-result-badge">
          {isEnglish ? "Generated with AI" : "Generado con IA"}
        </span>
      </header>

      <div className="ai-result-grid">
        <div className="form-field form-field-wide">
          <label htmlFor="ai-result-title-input">
            {isEnglish ? "Title" : "Título"}
          </label>

          <input
            id="ai-result-title-input"
            name="title"
            type="text"
            value={result.title || ""}
            disabled={saving}
            onChange={handleChange}
          />
        </div>

        <div className="form-field">
          <label htmlFor="ai-result-category">
            {isEnglish ? "Suggested category" : "Categoría sugerida"}
          </label>

          <select
            id="ai-result-category"
            name="categoryId"
            value={result.categoryId || ""}
            disabled={saving}
            onChange={handleChange}
          >
            <option value="">
              {isEnglish ? "Select a category" : "Selecciona una categoría"}
            </option>

            {categories.map((categoryItem) => (
              <option
                key={categoryItem.id}
                value={categoryItem.id}
              >
                {categoryItem.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="ai-result-status">
            {isEnglish ? "Editorial status" : "Estado editorial"}
          </label>

          <select
            id="ai-result-status"
            name="editorialStatus"
            value={
              result.editorialStatus || "draft"
            }
            disabled={saving}
            onChange={handleChange}
          >
            {Object.entries(
              statusLabels
            ).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field form-field-wide">
          <label htmlFor="ai-result-summary">
            {isEnglish ? "Summary" : "Resumen"}
          </label>

          <textarea
            id="ai-result-summary"
            name="summary"
            rows="4"
            value={result.summary || ""}
            disabled={saving}
            onChange={handleChange}
          />
        </div>

        <div className="form-field form-field-wide">
          <label htmlFor="ai-result-script">
            {isEnglish ? "Presentation script" : "Guion para presentación"}
          </label>

          <textarea
            id="ai-result-script"
            name="script"
            rows="10"
            value={result.script || ""}
            disabled={saving}
            onChange={handleChange}
          />
        </div>

        <div className="form-field form-field-wide">
          <label htmlFor="ai-result-options">
            {isEnglish ? "Lower-third options" : "Opciones de cintillo"}
          </label>

          <textarea
            id="ai-result-options"
            name="lowerThirdOptions"
            rows="4"
            value={
              result.lowerThirdOptions?.join("\n") ||
              ""
            }
            disabled={saving}
            onChange={handleLowerThirdOptions}
          />

          <small className="field-help">
            {isEnglish ? "Enter one option per line." : "Coloca una opción por cada línea."}
          </small>
        </div>

        <div className="form-field">
          <label htmlFor="ai-result-selected">
            {isEnglish ? "Selected lower third" : "Cintillo seleccionado"}
          </label>

          <select
            id="ai-result-selected"
            name="selectedLowerThird"
            value={result.selectedLowerThird || ""}
            disabled={
              saving ||
              !result.lowerThirdOptions?.length
            }
            onChange={handleChange}
          >
            <option value="">{isEnglish ? "No lower third" : "Sin cintillo"}</option>

            {result.lowerThirdOptions?.map(
              (option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              )
            )}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="ai-result-duration">
            {isEnglish ? "Estimated duration" : "Duración estimada"}
          </label>
          <small className="field-help">{isEnglish ? `Calculated at ${wordsPerMinute} words/minute; you can enter a manual duration.` : `Calculada a ${wordsPerMinute} palabras/minuto; puedes indicar una duración manual.`}</small>

          <div className="input-with-suffix">
            <input
              id="ai-result-duration"
              name="estimatedDurationSeconds"
              type="number"
              min="0"
              max="300"
              value={
                result.estimatedDurationSeconds ||
                0
              }
              disabled={saving}
              onChange={handleChange}
            />

            <span>{isEnglish ? "seconds" : "segundos"}</span>
          </div>
        </div>
      </div>

      <div className="ai-result-actions">
        <button
          className="button button-secondary"
          type="button"
          disabled={saving}
          onClick={onClear}
        >
          {isEnglish ? "Discard result" : "Descartar resultado"}
        </button>

        <button
          className="button button-primary"
          type="button"
          disabled={saving}
          onClick={onSave}
        >
          {saving
            ? isEnglish ? "Saving news item..." : "Guardando noticia..."
            : isEnglish ? "Save as news item" : "Guardar como noticia"}
        </button>
      </div>
    </section>
  );
}

export default AiResultPreview;
