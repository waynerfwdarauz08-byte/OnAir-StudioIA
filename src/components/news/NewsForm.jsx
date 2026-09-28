import { useEffect, useMemo, useState } from "react";

import { EDITORIAL_STATUS_LABELS } from "../../utils/news.js";

const EMPTY_VALUES = {
  sourceText: "",
  sourceName: "",
  sourceUrl: "",
  title: "",
  summary: "",
  script: "",
  lowerThirdOptions: [],
  selectedLowerThird: "",
  categoryId: "",
  editorialStatus: "draft",
  estimatedDurationSeconds: 0,
};

function validateNews(values) {
  const errors = {};

  if (values.title.trim().length < 8) {
    errors.title = "El título debe tener al menos 8 caracteres.";
  }

  if (values.sourceName.trim().length < 3) {
    errors.sourceName =
      "Indica el nombre de la fuente de información.";
  }

  if (values.sourceText.trim().length < 20) {
    errors.sourceText =
      "El contenido original debe tener al menos 20 caracteres.";
  }

  if (values.summary.trim().length < 20) {
    errors.summary =
      "El resumen debe tener al menos 20 caracteres.";
  }

  if (!values.categoryId) {
    errors.categoryId = "Selecciona una categoría.";
  }

  if (
    values.sourceUrl.trim() &&
    !/^https?:\/\/.+/i.test(values.sourceUrl.trim())
  ) {
    errors.sourceUrl =
      "La dirección debe comenzar con http:// o https://.";
  }

  const duration = Number(values.estimatedDurationSeconds);

  if (!Number.isFinite(duration) || duration < 0) {
    errors.estimatedDurationSeconds =
      "La duración no puede ser negativa.";
  }

  if (
    values.editorialStatus === "approved" &&
    values.script.trim().length < 20
  ) {
    errors.script =
      "Una noticia aprobada debe tener un guion de al menos 20 caracteres.";
  }

  return errors;
}

function NewsForm({
  initialValues = EMPTY_VALUES,
  categories = [],
  onSubmit,
  submitLabel = "Guardar noticia",
  submitting = false,
  serverError = "",
}) {
  const normalizedInitialValues = useMemo(
    () => ({
      ...EMPTY_VALUES,
      ...initialValues,
      lowerThirdOptions: Array.isArray(
        initialValues.lowerThirdOptions
      )
        ? initialValues.lowerThirdOptions
        : [],
    }),
    [initialValues]
  );

  const [values, setValues] = useState(
    normalizedInitialValues
  );
  const [lowerThirdText, setLowerThirdText] = useState(
    normalizedInitialValues.lowerThirdOptions.join("\n")
  );
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(normalizedInitialValues);
    setLowerThirdText(
      normalizedInitialValues.lowerThirdOptions.join("\n")
    );
    setErrors({});
  }, [normalizedInitialValues]);

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

  function handleLowerThirdChange(event) {
    const text = event.target.value;

    setLowerThirdText(text);

    const options = text
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    setValues((currentValues) => {
      const selectedExists = options.includes(
        currentValues.selectedLowerThird
      );

      return {
        ...currentValues,
        lowerThirdOptions: options,
        selectedLowerThird: selectedExists
          ? currentValues.selectedLowerThird
          : options[0] || "",
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const preparedValues = {
      ...values,
      sourceText: values.sourceText.trim(),
      sourceName: values.sourceName.trim(),
      sourceUrl: values.sourceUrl.trim(),
      title: values.title.trim(),
      summary: values.summary.trim(),
      script: values.script.trim(),
      selectedLowerThird:
        values.selectedLowerThird.trim(),
      estimatedDurationSeconds:
        Number(values.estimatedDurationSeconds) || 0,
    };

    const validationErrors =
      validateNews(preparedValues);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstInvalidField = Object.keys(
        validationErrors
      )[0];

      document
        .querySelector(`[name="${firstInvalidField}"]`)
        ?.focus();

      return;
    }

    await onSubmit(preparedValues);
  }

  return (
    <form
      className="news-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {serverError && (
        <div className="form-alert" role="alert">
          {serverError}
        </div>
      )}

      <section className="form-section">
        <div className="form-section-heading">
          <span>01</span>

          <div>
            <h2>Información principal</h2>
            <p>
              Registra el título, resumen y clasificación
              editorial.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field form-field-wide">
            <label htmlFor="news-title">
              Título de la noticia
            </label>

            <input
              id="news-title"
              name="title"
              type="text"
              value={values.title}
              onChange={handleChange}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={
                errors.title ? "news-title-error" : undefined
              }
            />

            {errors.title && (
              <small
                id="news-title-error"
                className="field-error"
              >
                {errors.title}
              </small>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="news-category">
              Categoría
            </label>

            <select
              id="news-category"
              name="categoryId"
              value={values.categoryId}
              onChange={handleChange}
              aria-invalid={Boolean(errors.categoryId)}
            >
              <option value="">Selecciona una categoría</option>

              {categories.map((categoryItem) => (
                <option
                  key={categoryItem.id}
                  value={categoryItem.id}
                >
                  {categoryItem.name}
                </option>
              ))}
            </select>

            {errors.categoryId && (
              <small className="field-error">
                {errors.categoryId}
              </small>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="news-status">
              Estado editorial
            </label>

            <select
              id="news-status"
              name="editorialStatus"
              value={values.editorialStatus}
              onChange={handleChange}
            >
              {Object.entries(
                EDITORIAL_STATUS_LABELS
              ).map(([statusValue, statusLabel]) => (
                <option
                  key={statusValue}
                  value={statusValue}
                >
                  {statusLabel}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field form-field-wide">
            <label htmlFor="news-summary">Resumen</label>

            <textarea
              id="news-summary"
              name="summary"
              rows="4"
              value={values.summary}
              onChange={handleChange}
              aria-invalid={Boolean(errors.summary)}
            />

            {errors.summary && (
              <small className="field-error">
                {errors.summary}
              </small>
            )}
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-heading">
          <span>02</span>

          <div>
            <h2>Fuente original</h2>
            <p>
              Conserva la procedencia y el contenido utilizado
              para elaborar la noticia.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="news-source-name">
              Nombre de la fuente
            </label>

            <input
              id="news-source-name"
              name="sourceName"
              type="text"
              value={values.sourceName}
              onChange={handleChange}
              aria-invalid={Boolean(errors.sourceName)}
            />

            {errors.sourceName && (
              <small className="field-error">
                {errors.sourceName}
              </small>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="news-source-url">
              Enlace de la fuente
            </label>

            <input
              id="news-source-url"
              name="sourceUrl"
              type="url"
              placeholder="https://..."
              value={values.sourceUrl}
              onChange={handleChange}
              aria-invalid={Boolean(errors.sourceUrl)}
            />

            {errors.sourceUrl && (
              <small className="field-error">
                {errors.sourceUrl}
              </small>
            )}
          </div>

          <div className="form-field form-field-wide">
            <label htmlFor="news-source-text">
              Contenido original
            </label>

            <textarea
              id="news-source-text"
              name="sourceText"
              rows="7"
              value={values.sourceText}
              onChange={handleChange}
              aria-invalid={Boolean(errors.sourceText)}
            />

            {errors.sourceText && (
              <small className="field-error">
                {errors.sourceText}
              </small>
            )}
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-heading">
          <span>03</span>

          <div>
            <h2>Producción para transmisión</h2>
            <p>
              Prepara el guion, cintillo y duración estimada.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field form-field-wide">
            <label htmlFor="news-script">
              Guion de presentación
            </label>

            <textarea
              id="news-script"
              name="script"
              rows="8"
              value={values.script}
              onChange={handleChange}
              aria-invalid={Boolean(errors.script)}
            />

            {errors.script && (
              <small className="field-error">
                {errors.script}
              </small>
            )}
          </div>

          <div className="form-field form-field-wide">
            <label htmlFor="news-lower-thirds">
              Opciones de cintillo
            </label>

            <textarea
              id="news-lower-thirds"
              name="lowerThirdOptions"
              rows="4"
              value={lowerThirdText}
              placeholder={
                "Escribe una opción por línea\nSegunda opción"
              }
              onChange={handleLowerThirdChange}
            />

            <small className="field-help">
              Escribe una opción por cada línea.
            </small>
          </div>

          <div className="form-field">
            <label htmlFor="news-selected-lower-third">
              Cintillo seleccionado
            </label>

            <select
              id="news-selected-lower-third"
              name="selectedLowerThird"
              value={values.selectedLowerThird}
              onChange={handleChange}
              disabled={
                values.lowerThirdOptions.length === 0
              }
            >
              <option value="">Sin cintillo</option>

              {values.lowerThirdOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="news-duration">
              Duración estimada en segundos
            </label>

            <input
              id="news-duration"
              name="estimatedDurationSeconds"
              type="number"
              min="0"
              step="1"
              value={values.estimatedDurationSeconds}
              onChange={handleChange}
              aria-invalid={Boolean(
                errors.estimatedDurationSeconds
              )}
            />

            {errors.estimatedDurationSeconds && (
              <small className="field-error">
                {errors.estimatedDurationSeconds}
              </small>
            )}
          </div>
        </div>
      </section>

      <div className="form-actions">
        <button
          className="button button-primary"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default NewsForm;