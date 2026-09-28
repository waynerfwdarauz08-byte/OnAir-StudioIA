import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <main className="error-page">
      <p className="eyebrow">ERROR 404</p>
      <h1>Esta página no está disponible.</h1>
      <p>
        Revisa la dirección o vuelve al espacio editorial.
      </p>

      <Link className="button button-primary" to="/dashboard">
        Volver al inicio
      </Link>
    </main>
  );
}

export default NotFoundPage;