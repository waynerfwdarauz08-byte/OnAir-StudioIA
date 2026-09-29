import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import BrandLogo from "../components/common/BrandLogo.jsx";

import useAuth from "../hooks/useAuth.js";

import {
  getDefaultRouteByRole,
} from "../utils/roles.js";

function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  const {
    user,
    authLoading,
    login,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && user) {
      navigate(
        getDefaultRouteByRole(user.role),
        {
          replace: true,
        }
      );
    }
  }, [
    user,
    authLoading,
    navigate,
  ]);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !formData.email.trim() ||
      !formData.password
    ) {
      setError(
        "Debes ingresar el correo y la contraseña."
      );

      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const loggedUser = await login(
        formData.email,
        formData.password
      );

      const requestedRoute =
        location.state?.from;

      const destination =
        requestedRoute &&
        requestedRoute !== "/login"
          ? requestedRoute
          : getDefaultRouteByRole(
              loggedUser.role
            );

      navigate(destination, {
        replace: true,
      });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <main
        className="route-loading"
        role="status"
      >
        <span
          className="loading-indicator"
          aria-hidden="true"
        />

        <p>Comprobando sesión...</p>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section
        className="login-card"
        aria-labelledby="login-title"
      >
        <div className="login-brand">
          <BrandLogo className="login-brand-logo" />
        </div>

        <div className="login-heading">
          <p className="eyebrow">
            ACCESO AL SISTEMA
          </p>

          <h1 id="login-title">
            Bienvenido a la redacción.
          </h1>

          <p>
            Inicia sesión para acceder a las
            herramientas correspondientes a tu
            función.
          </p>
        </div>

        {error && (
          <div
            className="login-error"
            role="alert"
          >
            <span aria-hidden="true">!</span>
            <p>{error}</p>
          </div>
        )}

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <div className="form-field">
            <label htmlFor="email">
              Correo electrónico
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              placeholder="usuario@onair.test"
              autoComplete="email"
              disabled={submitting}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">
              Contraseña
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              disabled={submitting}
              onChange={handleChange}
            />
          </div>

          <button
            className="button button-primary button-full"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Verificando..."
              : "Iniciar sesión"}

            {!submitting && (
              <span aria-hidden="true">
                →
              </span>
            )}
          </button>
        </form>

        <div className="demo-credentials">
          <p>CUENTAS DE DEMOSTRACIÓN</p>

          <dl>
            <div>
              <dt>Administrador</dt>
              <dd>admin@onair.test</dd>
            </div>

            <div>
              <dt>Moderador</dt>
              <dd>moderador@onair.test</dd>
            </div>

            <div>
              <dt>Presentador</dt>
              <dd>presentador@onair.test</dd>
            </div>
          </dl>
        </div>

        <p className="login-security-note">
          Autenticación simulada con JSON Server
          para fines académicos.
        </p>

        <Link
          className="login-help-link"
          to="/login"
        >
          ONAIR STUDIO IA · CONTROL DE ACCESO
        </Link>
      </section>
    </main>
  );
}

export default LoginPage;