import { useState } from "react";
import useAccessibility from "../../hooks/useAccessibility.js";

function getTodayValue() {
  const currentDate = new Date();

  const year = currentDate.getFullYear();
  const month = String(
    currentDate.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    currentDate.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const INITIAL_VALUES = {
  name: "",
  broadcastDate: getTodayValue(),
};

function RundownForm({
  saving = false,
  error = "",
  onSubmit,
}) {
  const { language } = useAccessibility();
  const isEnglish = language === "en";
  const [values, setValues] = useState(INITIAL_VALUES);
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
      name: values.name.trim(),
      broadcastDate: values.broadcastDate,
    };

    const validationErrors = {};

    if (preparedValues.name.length < 3) {
      validationErrors.name =
        isEnglish ? "The name must have at least 3 characters." : "El nombre debe tener al menos 3 caracteres.";
    }

    if (!preparedValues.broadcastDate) {
      validationErrors.broadcastDate =
        isEnglish ? "Select the transmission date." : "Selecciona la fecha de transmisión.";
    }

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

    const created = await onSubmit(preparedValues);

    if (created) {
      setValues({
        name: "",
        broadcastDate: getTodayValue(),
      });

      setErrors({});
    }
  }

  return (
    <form
      className="rundown-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <header className="rundown-form-heading">
        <span>{isEnglish ? "NEW EDITION" : "NUEVA EDICIÓN"}</span>

        <h2>{isEnglish ? "Create rundown" : "Crear escaleta"}</h2>

        <p>
          {isEnglish ? "Register a news edition and then add the news items to be presented." : "Registra una edición informativa y posteriormente agrega las noticias que serán presentadas."}
        </p>
      </header>

      {error && (
        <div className="form-alert" role="alert">
          {error}
        </div>
      )}

      <div className="rundown-form-grid">
        <div className="form-field">
          <label htmlFor="rundown-name">
            {isEnglish ? "Edition name" : "Nombre de la edición"}
          </label>

          <input
            id="rundown-name"
            name="name"
            type="text"
            value={values.name}
            placeholder={isEnglish ? "Example: Evening news edition" : "Ejemplo: Edición informativa de la noche"}
            disabled={saving}
            aria-invalid={Boolean(errors.name)}
            onChange={handleChange}
          />

          {errors.name && (
            <small className="field-error">
              {errors.name}
            </small>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="rundown-date">
            {isEnglish ? "Transmission date" : "Fecha de transmisión"}
          </label>

          <input
            id="rundown-date"
            name="broadcastDate"
            type="date"
            value={values.broadcastDate}
            disabled={saving}
            aria-invalid={Boolean(
              errors.broadcastDate
            )}
            onChange={handleChange}
          />

          {errors.broadcastDate && (
            <small className="field-error">
              {errors.broadcastDate}
            </small>
          )}
        </div>
      </div>

      <div className="rundown-form-actions">
        <button
          className="button button-primary"
          type="submit"
          disabled={saving}
        >
          {saving
            ? isEnglish ? "Creating rundown..." : "Creando escaleta..."
            : isEnglish ? "Create rundown" : "Crear escaleta"}
        </button>
      </div>
    </form>
  );
}

export default RundownForm;
