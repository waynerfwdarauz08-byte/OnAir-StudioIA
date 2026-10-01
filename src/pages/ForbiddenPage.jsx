import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import useAccessibility from "../hooks/useAccessibility.js";
import {
  getDefaultRouteByRole,
} from "../utils/roles.js";

function ForbiddenPage() {
  const { user } = useAuth();
  const { language } = useAccessibility();
  const isEnglish = language === "en";

  const returnRoute = user
    ? getDefaultRouteByRole(user.role)
    : "/login";

  return (
    <main className="error-page">
      <p className="eyebrow">ERROR 403</p>

      <h1>{isEnglish ? "You don't have permission to enter here." : "No tienes permiso para entrar aquí."}</h1>

      <p>
        {isEnglish ? "Your role is not authorized to access this module." : "Tu rol no tiene autorización para acceder a este módulo."}
      </p>

      <Link
        className="button button-primary"
        to={returnRoute}
      >
        {isEnglish ? "Back to my workspace" : "Volver a mi espacio"}
      </Link>
    </main>
  );
}

export default ForbiddenPage;
