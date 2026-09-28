import { EDITORIAL_STATUS_LABELS } from "../../utils/news.js";

function AiResultPreview({
  result,
  categories,
  saving = false,
  onChange,
  onSave,
  onClear,
}) {
  function handleChange(event) {
    const { name, value } = event.target;

    onChange({
      ...result,
      [name]:
        name === "estimatedDurationSeconds"
          ? Number(value)
          : value,
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
          <span>PROPUESTA GENERADA</span>

          <h2 id="ai-result-title">
            Resultado de inteligencia artificial
          </h2>

          <p>
            Revisa y corrige la información antes de
            guardarla como noticia.
          </p>
        </div>

        <span className="ai-result-badge">
          Generado con IA
        </span>
      </header>

      <div className="ai-result-grid">
        <div className="form-field form-field-wide">
          <label htmlFor="ai-result-title-input">
            Título
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
            Categoría sugerida
          </label>

          <select
            id="ai-result-category"
            name="categoryId"
            value={result.categoryId || ""}
            disabled={saving}
            onChange={handleChange}
          >
            <option value="">
              Selecciona una categoría
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
            Estado editorial
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
              EDITORIAL_STATUS_LABELS
            ).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field form-field-wide">
          <label htmlFor="ai-result-summary">
            Resumen
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
            Guion para presentación
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
            Opciones de cintillo
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
            Coloca una opción por cada línea.
          </small>
        </div>

        <div className="form-field">
          <label htmlFor="ai-result-selected">
            Cintillo seleccionado
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
            <option value="">Sin cintillo</option>

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
            Duración estimada
          </label>

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

            <span>segundos</span>
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
          Descartar resultado
        </button>

        <button
          className="button button-primary"
          type="button"
          disabled={saving}
          onClick={onSave}
        >
          {saving
            ? "Guardando noticia..."
            : "Guardar como noticia"}
        </button>
      </div>
    </section>
  );
}

export default AiResultPreview;