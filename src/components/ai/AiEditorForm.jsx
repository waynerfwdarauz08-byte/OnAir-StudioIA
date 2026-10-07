import useTranslation from "../../hooks/useTranslation.js";
import { useState } from "react";
import useAccessibility from "../../hooks/useAccessibility.js";

const INITIAL_VALUES = {
  sourceName: "",
  sourceUrl: "",
  sourceText: "",
  tone: "informative",
  targetDurationSeconds: 30,
};

function validateValues(values, isEnglish) {
  const errors = {};

  if (values.sourceName.trim().length < 3) {
    errors.sourceName =
      isEnglish ? "Enter the source name." : "Indica el nombre de la fuente.";
  }

  if (values.sourceText.trim().length < 50) {
    errors.sourceText =
      isEnglish ? "The original content must have at least 50 characters." : "El contenido original debe tener al menos 50 caracteres.";
  }

  if (
    values.sourceUrl.trim() &&
    !/^https?:\/\/.+/i.test(values.sourceUrl.trim())
  ) {
    errors.sourceUrl =
      isEnglish ? "The URL must begin with http:// or https://." : "El enlace debe comenzar con http:// o https://.";
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
      isEnglish ? "The duration must be between 10 and 300 seconds." : "La duración debe estar entre 10 y 300 segundos.";
  }

  return errors;
}

function AiEditorForm({
  generating = false,
  error = "",
  onGenerate,
}) {
  const { translate } = useTranslation();
  const { language } = useAccessibility();
  const isEnglish = language === "en";
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
      validateValues(preparedValues, isEnglish);

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
        <span>{isEnglish ? "INFORMATION INPUT" : "ENTRADA DE INFORMACIÓN"}</span>

        <h2>{isEnglish ? "Original content" : "Contenido original"}</h2>

        <p>
          {isEnglish ? "AI will use this information to prepare a television editorial proposal." : "La IA utilizará esta información para preparar una propuesta editorial para televisión."}
        </p>
      </header>

      {error && (
        <div className="form-alert" role="alert">
          {translate(error)}
        </div>
      )}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="ai-source-name">
            {isEnglish ? "Source name" : "Nombre de la fuente"}
          </label>

          <input
            id="ai-source-name"
            name="sourceName"
            type="text"
            value={values.sourceName}
            placeholder={isEnglish ? "Example: Institutional statement" : "Ejemplo: Comunicado institucional"}
            disabled={generating}
            aria-invalid={Boolean(errors.sourceName)}
            onChange={handleChange}
          />

          {errors.sourceName && (
            <small className="field-error">
              {translate(errors.sourceName)}
            </small>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="ai-source-url">
            {isEnglish ? "Source URL" : "Enlace de la fuente"}
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
              {translate(errors.sourceUrl)}
            </small>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="ai-tone">
            {isEnglish ? "Editorial tone" : "Tono editorial"}
          </label>

          <select
            id="ai-tone"
            name="tone"
            value={values.tone}
            disabled={generating}
            onChange={handleChange}
          >
            <option value="informative">
              {isEnglish ? "Informative" : "Informativo"}
            </option>

            <option value="formal">Formal</option>

            <option value="direct">
              {isEnglish ? "Direct and concise" : "Directo y conciso"}
            </option>

            <option value="human">
              {isEnglish ? "Warm and human" : "Cercano y humano"}
            </option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="ai-duration">
            {isEnglish ? "Approximate duration" : "Duración aproximada"}
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

            <span>{isEnglish ? "seconds" : "segundos"}</span>
          </div>

          {errors.targetDurationSeconds && (
            <small className="field-error">
              {translate(errors.targetDurationSeconds)}
            </small>
          )}
        </div>

        <div className="form-field form-field-wide">
          <label htmlFor="ai-source-text">
            {isEnglish ? "Original information" : "Información original"}
          </label>

          <textarea
            id="ai-source-text"
            name="sourceText"
            rows="13"
            value={values.sourceText}
            placeholder={isEnglish ? "Paste the statement, information, notes, or original text here..." : "Pega aquí el comunicado, información, apuntes o texto original..."}
            disabled={generating}
            aria-invalid={Boolean(errors.sourceText)}
            onChange={handleChange}
          />

          <div className="field-counter">
            <small>
              {isEnglish ? "Recommended minimum: 50 characters" : "Mínimo recomendado: 50 caracteres"}
            </small>

            <small>
              {values.sourceText.length} {isEnglish ? "characters" : "caracteres"}
            </small>
          </div>

          {errors.sourceText && (
            <small className="field-error">
              {translate(errors.sourceText)}
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
            ? isEnglish ? "Generating proposal..." : "Generando propuesta..."
            : isEnglish ? "Generate with artificial intelligence" : "Generar con inteligencia artificial"}
        </button>
      </div>
    </form>
  );
}

export default AiEditorForm;
