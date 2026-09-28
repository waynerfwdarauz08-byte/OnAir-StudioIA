import {
  useEffect,
  useState,
} from "react";

import {
  getRoleLabel,
  ROLES,
} from "../../utils/roles.js";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: ROLES.MODERATOR,
  active: true,
};

function validateForm(formData, mode) {
  const errors = {};

  if (formData.name.trim().length < 3) {
    errors.name =
      "El nombre debe tener al menos 3 caracteres.";
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(formData.email.trim())) {
    errors.email =
      "Ingresa un correo electrónico válido.";
  }

  const validRoles = Object.values(ROLES);

  if (!validRoles.includes(formData.role)) {
    errors.role = "Selecciona un rol válido.";
  }

  const passwordIsRequired = mode === "create";
  const passwordWasEntered =
    formData.password.length > 0;

  if (passwordIsRequired || passwordWasEntered) {
    const securePasswordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (
      !securePasswordPattern.test(
        formData.password
      )
    ) {
      errors.password =
        "Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.";
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      errors.confirmPassword =
        "Las contraseñas no coinciden.";
    }
  }

  return errors;
}

function UserForm({
  mode = "create",
  initialValues,
  submitting = false,
  serverError = "",
  lockRole = false,
  lockActive = false,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({
      ...emptyForm,
      ...initialValues,
      password: "",
      confirmPassword: "",
    });
  }, [initialValues]);

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateForm(
      formData,
      mode
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    await onSubmit({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: formData.role,
      active: formData.active,
    });
  }

  return (
    <form
      className="user-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {serverError && (
        <div className="form-error-summary" role="alert">
          <strong>No se pudo guardar el usuario</strong>
          <p>{serverError}</p>
        </div>
      )}

      <div className="form-section">
        <div className="form-section-heading">
          <span>01</span>

          <div>
            <h2>Información personal</h2>
            <p>
              Datos que permitirán identificar al usuario
              dentro de la plataforma.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field form-field-full">
            <label htmlFor="user-name">
              Nombre completo
            </label>

            <input
              id="user-name"
              name="name"
              type="text"
              value={formData.name}
              placeholder="Nombre y apellidos"
              autoComplete="name"
              disabled={submitting}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name
                  ? "user-name-error"
                  : undefined
              }
              onChange={handleChange}
            />

            {errors.name && (
              <span
                id="user-name-error"
                className="field-error"
              >
                {errors.name}
              </span>
            )}
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="user-email">
              Correo electrónico
            </label>

            <input
              id="user-email"
              name="email"
              type="email"
              value={formData.email}
              placeholder="usuario@onair.test"
              autoComplete="email"
              disabled={submitting}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email
                  ? "user-email-error"
                  : undefined
              }
              onChange={handleChange}
            />

            {errors.email && (
              <span
                id="user-email-error"
                className="field-error"
              >
                {errors.email}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-heading">
          <span>02</span>

          <div>
            <h2>Acceso y seguridad</h2>
            <p>
              {mode === "create"
                ? "Define la contraseña inicial de demostración."
                : "Deja estos campos vacíos para conservar la contraseña actual."}
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="user-password">
              {mode === "create"
                ? "Contraseña"
                : "Nueva contraseña"}
            </label>

            <input
              id="user-password"
              name="password"
              type="password"
              value={formData.password}
              placeholder={
                mode === "create"
                  ? "Contraseña inicial"
                  : "Opcional"
              }
              autoComplete="new-password"
              disabled={submitting}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password
                  ? "user-password-error"
                  : undefined
              }
              onChange={handleChange}
            />

            {errors.password && (
              <span
                id="user-password-error"
                className="field-error"
              >
                {errors.password}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="confirm-password">
              Confirmar contraseña
            </label>

            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
              disabled={submitting}
              aria-invalid={Boolean(
                errors.confirmPassword
              )}
              aria-describedby={
                errors.confirmPassword
                  ? "confirm-password-error"
                  : undefined
              }
              onChange={handleChange}
            />

            {errors.confirmPassword && (
              <span
                id="confirm-password-error"
                className="field-error"
              >
                {errors.confirmPassword}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-heading">
          <span>03</span>

          <div>
            <h2>Permisos y estado</h2>
            <p>
              Determina los módulos disponibles para esta
              cuenta.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="user-role">Rol</label>

            <select
              id="user-role"
              name="role"
              value={formData.role}
              disabled={submitting || lockRole}
              aria-invalid={Boolean(errors.role)}
              onChange={handleChange}
            >
              {Object.values(ROLES).map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>

            {lockRole && (
              <span className="field-help">
                No puedes cambiar el rol de tu propia
                sesión.
              </span>
            )}

            {errors.role && (
              <span className="field-error">
                {errors.role}
              </span>
            )}
          </div>

          <div className="form-field">
            <span className="field-label">
              Estado de la cuenta
            </span>

            <label className="checkbox-control">
              <input
                name="active"
                type="checkbox"
                checked={formData.active}
                disabled={submitting || lockActive}
                onChange={handleChange}
              />

              <span>
                <strong>Usuario activo</strong>
                <small>
                  Puede iniciar sesión en la plataforma.
                </small>
              </span>
            </label>

            {lockActive && (
              <span className="field-help">
                No puedes desactivar tu propia sesión.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="button button-secondary"
          disabled={submitting}
          onClick={onCancel}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="button button-primary"
          disabled={submitting}
        >
          {submitting
            ? "Guardando..."
            : mode === "create"
              ? "Registrar usuario"
              : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

export default UserForm;