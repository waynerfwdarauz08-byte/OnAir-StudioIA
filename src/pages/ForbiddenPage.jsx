import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import {
  getDefaultRouteByRole,
} from "../utils/roles.js";

function ForbiddenPage() {
  const { user } = useAuth();

  const returnRoute = user
    ? getDefaultRouteByRole(user.role)
    : "/login";

  return (
    <main className="error-page">
      <p className="eyebrow">ERROR 403</p>

      <h1>No tienes permiso para entrar aquí.</h1>

      <p>
        Tu rol no tiene autorización para acceder a este módulo.
      </p>

      <Link
        className="button button-primary"
        to={returnRoute}
      >
        Volver a mi espacio
      </Link>
    </main>
  );
}

export default ForbiddenPage;