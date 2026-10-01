import { Link } from "react-router-dom";
import useAccessibility from "../hooks/useAccessibility.js";

function NotFoundPage() {
  const { language } = useAccessibility();
  const isEnglish = language === "en";
  return (
    <main className="error-page">
      <p className="eyebrow">ERROR 404</p>
      <h1>{isEnglish ? "This page is not available." : "Esta página no está disponible."}</h1>
      <p>
        {isEnglish ? "Check the address or return to the editorial workspace." : "Revisa la dirección o vuelve al espacio editorial."}
      </p>

      <Link className="button button-primary" to="/dashboard">
        {isEnglish ? "Back to home" : "Volver al inicio"}
      </Link>
    </main>
  );
}

export default NotFoundPage;
