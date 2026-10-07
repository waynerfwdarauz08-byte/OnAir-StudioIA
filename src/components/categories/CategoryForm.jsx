import useTranslation from "../../hooks/useTranslation.js";
import { useEffect, useState } from "react";
import useAccessibility from "../../hooks/useAccessibility.js";

const EMPTY_VALUES = {
  name: "",
  description: "",
};

function validateCategory(values, isEnglish) {
  const errors = {};

  if (values.name.trim().length < 3) {
    errors.name =
      isEnglish ? "The name must have at least 3 characters." : "El nombre debe tener al menos 3 caracteres.";
  }

  if (values.description.trim().length < 10) {
    errors.description =
      isEnglish ? "The description must have at least 10 characters." : "La descripción debe tener al menos 10 caracteres.";
  }

  return errors;
}

function CategoryForm({
  initialValues = EMPTY_VALUES,
  editing = false,
  submitting = false,
  serverError = "",
  onSubmit,
  onCancel,
}) {
  const { translate } = useTranslation();
  const { language } = useAccessibility();
  const isEnglish = language === "en";
  const [values, setValues] = useState({
    ...EMPTY_VALUES,
    ...initialValues,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues({
      ...EMPTY_VALUES,
      ...initialValues,
    });

    setErrors({});
  }, [initialValues]);

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
      description: values.description.trim(),
    };

    const validationErrors =
      validateCategory(preparedValues, isEnglish);

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

  return (
    <form
      className="category-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="category-form-heading">
        <span>
          {editing
            ? isEnglish ? "EDIT CATEGORY" : "EDITAR CATEGORÍA"
            : isEnglish ? "NEW CATEGORY" : "NUEVA CATEGORÍA"}
        </span>

        <h2>
          {editing
            ? isEnglish ? "Update category" : "Actualizar categoría"
            : isEnglish ? "Register category" : "Registrar categoría"}
        </h2>

        <p>
          {isEnglish ? "Categories allow you to organize and filter the system news." : "Las categorías permiten organizar y filtrar las noticias del sistema."}
        </p>
      </div>

      {serverError && (
        <div className="form-alert" role="alert">
          {translate(serverError)}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="category-name">
          {isEnglish ? "Category name" : "Nombre de la categoría"}
        </label>

        <input
          id="category-name"
          name="name"
          type="text"
          value={values.name}
          placeholder={isEnglish ? "Example: Sports" : "Ejemplo: Deportes"}
          disabled={submitting}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={
            errors.name
              ? "category-name-error"
              : undefined
          }
          onChange={handleChange}
        />

        {errors.name && (
          <small
            id="category-name-error"
            className="field-error"
          >
            {translate(errors.name)}
          </small>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="category-description">
          {isEnglish ? "Description" : "Descripción"}
        </label>

        <textarea
          id="category-description"
          name="description"
          rows="4"
          value={values.description}
          placeholder={isEnglish ? "Describe this category's content..." : "Describe el contenido de esta categoría..."}
          disabled={submitting}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={
            errors.description
              ? "category-description-error"
              : undefined
          }
          onChange={handleChange}
        />

        {errors.description && (
          <small
            id="category-description-error"
            className="field-error"
          >
            {translate(errors.description)}
          </small>
        )}
      </div>

      <div className="form-actions">
        {editing && (
          <button
            className="button button-secondary"
            type="button"
            disabled={submitting}
            onClick={onCancel}
          >
            {isEnglish ? "Cancel editing" : "Cancelar edición"}
          </button>
        )}

        <button
          className="button button-primary"
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? isEnglish ? "Saving..." : "Guardando..."
            : editing
              ? isEnglish ? "Save changes" : "Guardar cambios"
              : isEnglish ? "Create category" : "Crear categoría"}
        </button>
      </div>
    </form>
  );
}

export default CategoryForm;
