import {
  useEffect,
  useRef,
  useState,
} from "react";

function RundownEditDialog({
  open,
  rundown,
  saving = false,
  error = "",
  onSubmit,
  onCancel,
}) {
  const nameInputRef = useRef(null);

  const [values, setValues] = useState({
    name: "",
    broadcastDate: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open || !rundown) {
      return;
    }

    setValues({
      name: rundown.name || "",
      broadcastDate:
        rundown.broadcastDate || "",
    });

    setErrors({});

    window.setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 0);
  }, [open, rundown]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function closeWithEscape(event) {
      if (event.key === "Escape" && !saving) {
        onCancel();
      }
    }

    document.addEventListener(
      "keydown",
      closeWithEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        closeWithEscape
      );
    };
  }, [open, saving, onCancel]);

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

    await onSubmit(preparedValues);
  }

  if (!open || !rundown) {
    return null;
  }

  return (
    <div
      className="dialog-backdrop rundown-edit-backdrop"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onCancel();
        }
      }}
    >
      <form
        className="rundown-edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rundown-edit-title"
        onSubmit={handleSubmit}
        noValidate
      >
        <header className="rundown-edit-heading">
          <span>CONFIGURACIÓN DE EDICIÓN</span>

          <h2 id="rundown-edit-title">
            Editar escaleta
          </h2>

          <p>
            Modifica el nombre y la fecha programada para
            esta edición informativa.
          </p>
        </header>

        {error && (
          <div className="form-alert" role="alert">
            {error}
          </div>
        )}

        <div className="rundown-edit-fields">
          <div className="form-field">
            <label htmlFor="edit-rundown-name">
              Nombre de la edición
            </label>

            <input
              ref={nameInputRef}
              id="edit-rundown-name"
              name="name"
              type="text"
              value={values.name}
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
            <label htmlFor="edit-rundown-date">
              Fecha de transmisión
            </label>

            <input
              id="edit-rundown-date"
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

        <div className="rundown-edit-actions">
          <button
            className="button button-secondary"
            type="button"
            disabled={saving}
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            className="button button-primary"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Guardando cambios..."
              : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RundownEditDialog;