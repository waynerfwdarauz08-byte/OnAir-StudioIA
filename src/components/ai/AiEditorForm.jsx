import { useState } from "react";

const INITIAL_VALUES = {
  sourceName: "",
  sourceUrl: "",
  sourceText: "",
  tone: "informative",
  targetDurationSeconds: 30,
};

function validateValues(values) {
  const errors = {};

  if (values.sourceName.trim().length < 3) {
    errors.sourceName =
      "Indica el nombre de la fuente.";
  }

  if (values.sourceText.trim().length < 50) {
    errors.sourceText =
      "El contenido original debe tener al menos 50 caracteres.";
  }

  if (
    values.sourceUrl.trim() &&
    !/^https?:\/\/.+/i.test(values.sourceUrl.trim())
  ) {
    errors.sourceUrl =
      "El enlace debe comenzar con http:// o https://.";
  }

  const duration = Number(
    values.targetDurationSeconds
  );

  if (
    !Number.isFinite(duration) ||
    duration < 10 ||
    duration > 300
  ) {
    errors.targetDurationSeconds =
      "La duración debe estar entre 10 y 300 segundos.";
  }

  return errors;
}

function AiEditorForm({
  generating = false,
  error = "",
  onGenerate,
}) {
  const [values, setValues] =
    useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;

    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const preparedValues = {
      sourceName: values.sourceName.trim(),
      sourceUrl: values.sourceUrl.trim(),
      sourceText: values.sourceText.trim(),
      tone: values.tone,
      targetDurationSeconds:
        Number(values.targetDurationSeconds),
    };

    const validationErrors =
      validateValues(preparedValues);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstInvalidField =
        Object.keys(validationErrors)[0];

      document
        .querySelector(
          `[name="${firstInvalidField}"]`
        )
        ?.focus();

      return;
    }

    await onGenerate(preparedValues);
  }

  return (
    <form
      className="ai-editor-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <header className="ai-editor-form-heading">
        <span>ENTRADA DE INFORMACIÓN</span>

        <h2>Contenido original</h2>

        <p>
          La IA utilizará esta información para preparar una
          propuesta editorial para televisión.
        </p>
      </header>

      {error && (
        <div className="form-alert" role="alert">
          {error}
        </div>
      )}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="ai-source-name">
            Nombre de la fuente
          </label>

          <input
            id="ai-source-name"
            name="sourceName"
            type="text"
            value={values.sourceName}
            placeholder="Ejemplo: Comunicado institucional"
            disabled={generating}
            aria-invalid={Boolean(errors.sourceName)}
            onChange={handleChange}
          />

          {errors.sourceName && (
            <small className="field-error">
              {errors.sourceName}
            </small>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="ai-source-url">
            Enlace de la fuente
          </label>

          <input
            id="ai-source-url"
            name="sourceUrl"
            type="url"
            value={values.sourceUrl}
            placeholder="https://..."
            disabled={generating}
            aria-invalid={Boolean(errors.sourceUrl)}
            onChange={handleChange}
          />

          {errors.sourceUrl && (
            <small className="field-error">
              {errors.sourceUrl}
            </small>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="ai-tone">
            Tono editorial
          </label>

          <select
            id="ai-tone"
            name="tone"
            value={values.tone}
            disabled={generating}
            onChange={handleChange}
          >
            <option value="informative">
              Informativo
            </option>

            <option value="formal">Formal</option>

            <option value="direct">
              Directo y conciso
            </option>

            <option value="human">
              Cercano y humano
            </option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="ai-duration">
            Duración aproximada
          </label>

          <div className="input-with-suffix">
            <input
              id="ai-duration"
              name="targetDurationSeconds"
              type="number"
              min="10"
              max="300"
              step="5"
              value={values.targetDurationSeconds}
              disabled={generating}
              aria-invalid={Boolean(
                errors.targetDurationSeconds
              )}
              onChange={handleChange}
            />

            <span>segundos</span>
          </div>

          {errors.targetDurationSeconds && (
            <small className="field-error">
              {errors.targetDurationSeconds}
            </small>
          )}
        </div>

        <div className="form-field form-field-wide">
          <label htmlFor="ai-source-text">
            Información original
          </label>

          <textarea
            id="ai-source-text"
            name="sourceText"
            rows="13"
            value={values.sourceText}
            placeholder="Pega aquí el comunicado, información, apuntes o texto original..."
            disabled={generating}
            aria-invalid={Boolean(errors.sourceText)}
            onChange={handleChange}
          />

          <div className="field-counter">
            <small>
              Mínimo recomendado: 50 caracteres
            </small>

            <small>
              {values.sourceText.length} caracteres
            </small>
          </div>

          {errors.sourceText && (
            <small className="field-error">
              {errors.sourceText}
            </small>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button
          className="button button-primary"
          type="submit"
          disabled={generating}
        >
          {generating
            ? "Generando propuesta..."
            : "Generar con inteligencia artificial"}
        </button>
      </div>
    </form>
  );
}

export default AiEditorForm;