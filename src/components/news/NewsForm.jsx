import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { EDITORIAL_STATUS_LABELS } from "../../utils/news.js";
import useAccessibility from "../../hooks/useAccessibility.js";

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

const STATUS_LABELS_EN = {
  draft: "Draft",
  review: "Under review",
  correction: "Needs correction",
  approved: "Approved",
};

function validateNews(values, isEnglish) {
  const errors = {};

  if (values.title.trim().length < 8) {
    errors.title = isEnglish
      ? "The title must have at least 8 characters."
      : "El título debe tener al menos 8 caracteres.";
  }

  if (values.sourceName.trim().length < 3) {
    errors.sourceName = isEnglish
      ? "Enter the information source name."
      : "Indica el nombre de la fuente de información.";
  }

  if (values.sourceText.trim().length < 20) {
    errors.sourceText = isEnglish
      ? "The original content must have at least 20 characters."
      : "El contenido original debe tener al menos 20 caracteres.";
  }

  if (values.summary.trim().length < 20) {
    errors.summary = isEnglish
      ? "The summary must have at least 20 characters."
      : "El resumen debe tener al menos 20 caracteres.";
  }

  if (!values.categoryId) {
    errors.categoryId = isEnglish
      ? "Select a category."
      : "Selecciona una categoría.";
  }

  if (
    values.sourceUrl.trim() &&
    !/^https?:\/\/.+/i.test(values.sourceUrl.trim())
  ) {
    errors.sourceUrl = isEnglish
      ? "The address must start with http:// or https://."
      : "La dirección debe comenzar con http:// o https://.";
  }

  const duration = Number(values.estimatedDurationSeconds);

  if (!Number.isFinite(duration) || duration < 0) {
    errors.estimatedDurationSeconds = isEnglish
      ? "Duration cannot be negative."
      : "La duración no puede ser negativa.";
  }

  if (
    values.editorialStatus === "approved" &&
    values.script.trim().length < 20
  ) {
    errors.script = isEnglish
      ? "Approved news must have a script of at least 20 characters."
      : "Una noticia aprobada debe tener un guion de al menos 20 caracteres.";
  }

  return errors;
}

function NewsForm({
  initialValues = EMPTY_VALUES,
  categories = [],
  onSubmit,
  submitLabel,
  submitting = false,
  serverError = "",
}) {
  const { language } = useAccessibility();
  const isEnglish = language === "en";

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

    const validationErrors = validateNews(
      preparedValues,
      isEnglish
    );

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstInvalidField =
        Object.keys(validationErrors)[0];

      document
        .querySelector(`[name="${firstInvalidField}"]`)
        ?.focus();

      return;
    }

    await onSubmit(preparedValues);
  }

  const resolvedSubmitLabel =
    submitLabel ||
    (isEnglish ? "Save news item" : "Guardar noticia");

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
            <h2>
              {isEnglish
                ? "Main information"
                : "Información principal"}
            </h2>
            <p>
              {isEnglish
                ? "Add the title, summary, and editorial classification."
                : "Registra el título, resumen y clasificación editorial."}
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field form-field-wide">
            <label htmlFor="news-title">
              {isEnglish ? "News title" : "Título de la noticia"}
            </label>

            <input
              id="news-title"
              name="title"
              type="text"
              value={values.title}
              onChange={handleChange}
              aria-invalid={Boolean(errors.title)}
            />

            {errors.title && (
              <small className="field-error">
                {errors.title}
              </small>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="news-category">
              {isEnglish ? "Category" : "Categoría"}
            </label>

            <select
              id="news-category"
              name="categoryId"
              value={values.categoryId}
              onChange={handleChange}
              aria-invalid={Boolean(errors.categoryId)}
            >
              <option value="">
                {isEnglish
                  ? "Select a category"
                  : "Selecciona una categoría"}
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

            {errors.categoryId && (
              <small className="field-error">
                {errors.categoryId}
              </small>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="news-status">
              {isEnglish ? "Editorial status" : "Estado editorial"}
            </label>

            <select
              id="news-status"
              name="editorialStatus"
              value={values.editorialStatus}
              onChange={handleChange}
            >
              {Object.entries(EDITORIAL_STATUS_LABELS).map(
                ([statusValue, statusLabel]) => (
                  <option key={statusValue} value={statusValue}>
                    {isEnglish
                      ? STATUS_LABELS_EN[statusValue] || statusLabel
                      : statusLabel}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="form-field form-field-wide">
            <label htmlFor="news-summary">
              {isEnglish ? "Summary" : "Resumen"}
            </label>

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
            <h2>
              {isEnglish ? "Original source" : "Fuente original"}
            </h2>
            <p>
              {isEnglish
                ? "Keep the source and content used to prepare the news item."
                : "Conserva la procedencia y el contenido utilizado para elaborar la noticia."}
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="news-source-name">
              {isEnglish ? "Source name" : "Nombre de la fuente"}
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
              {isEnglish ? "Source link" : "Enlace de la fuente"}
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
              {isEnglish ? "Original content" : "Contenido original"}
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
            <h2>
              {isEnglish
                ? "Broadcast production"
                : "Producción para transmisión"}
            </h2>
            <p>
              {isEnglish
                ? "Prepare the script, lower third, and estimated duration."
                : "Prepara el guion, cintillo y duración estimada."}
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field form-field-wide">
            <label htmlFor="news-script">
              {isEnglish ? "Presentation script" : "Guion de presentación"}
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
              {isEnglish ? "Lower-third options" : "Opciones de cintillo"}
            </label>

            <textarea
              id="news-lower-thirds"
              name="lowerThirdOptions"
              rows="4"
              value={lowerThirdText}
              placeholder={
                isEnglish
                  ? "Write one option per line\nSecond option"
                  : "Escribe una opción por línea\nSegunda opción"
              }
              onChange={handleLowerThirdChange}
            />

            <small className="field-help">
              {isEnglish
                ? "Write one option on each line."
                : "Escribe una opción por cada línea."}
            </small>
          </div>

          <div className="form-field">
            <label htmlFor="news-selected-lower-third">
              {isEnglish
                ? "Selected lower third"
                : "Cintillo seleccionado"}
            </label>

            <select
              id="news-selected-lower-third"
              name="selectedLowerThird"
              value={values.selectedLowerThird}
              onChange={handleChange}
              disabled={values.lowerThirdOptions.length === 0}
            >
              <option value="">
                {isEnglish ? "No lower third" : "Sin cintillo"}
              </option>

              {values.lowerThirdOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="news-duration">
              {isEnglish
                ? "Estimated duration in seconds"
                : "Duración estimada en segundos"}
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
          {submitting
            ? isEnglish
              ? "Saving..."
              : "Guardando..."
            : resolvedSubmitLabel}
        </button>
      </div>
    </form>
  );
}

export default NewsForm;