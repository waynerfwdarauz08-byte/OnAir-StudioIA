import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import useAccessibility from "../hooks/useAccessibility.js";

function ProtectedRoute({ children }) {
  const { language } = useAccessibility();
  const {
    isAuthenticated,
    authLoading,
  } = useAuth();

  const location = useLocation();

  if (authLoading) {
    return (
      <main className="route-loading" role="status">
        <span className="loading-indicator" aria-hidden="true" />
        <p>{language === "en" ? "Restoring session..." : "Restaurando sesión..."}</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
