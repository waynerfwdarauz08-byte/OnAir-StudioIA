import { useState } from "react";

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
        "El nombre debe tener al menos 3 caracteres.";
    }

    if (!preparedValues.broadcastDate) {
      validationErrors.broadcastDate =
        "Selecciona la fecha de transmisión.";
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
        <span>NUEVA EDICIÓN</span>

        <h2>Crear escaleta</h2>

        <p>
          Registra una edición informativa y posteriormente
          agrega las noticias que serán presentadas.
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
            Nombre de la edición
          </label>

          <input
            id="rundown-name"
            name="name"
            type="text"
            value={values.name}
            placeholder="Ejemplo: Edición informativa de la noche"
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
            Fecha de transmisión
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
            ? "Creando escaleta..."
            : "Crear escaleta"}
        </button>
      </div>
    </form>
  );
}

export default RundownForm;