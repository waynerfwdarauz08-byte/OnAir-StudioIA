import useTranslation from "../../hooks/useTranslation.js";
import useAccessibility from "../../hooks/useAccessibility.js";

export function LoadingState({ message }) {
  const { translate } = useTranslation();
  const { language } = useAccessibility();
  const isEnglish = language === "en";

  const displayMessage = message || (isEnglish ? "Loading information..." : "Cargando información...");
  return (
    <div className="feedback-state" role="status">
      <span className="loading-indicator" aria-hidden="true" />

      <div>
        <h2>{isEnglish ? "One moment" : "Un momento"}</h2>
        <p>{translate(displayMessage)}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const { translate } = useTranslation();
  const { language } = useAccessibility();
  const isEnglish = language === "en";
  const displayMessage = message || (isEnglish ? "Unable to load the information." : "No fue posible cargar la información.");
  return (
    <div className="feedback-state feedback-error" role="alert">
      <div>
        <span className="feedback-code">{isEnglish ? "CONNECTION ERROR" : "ERROR DE CONEXIÓN"}</span>
        <h2>{isEnglish ? "We couldn't complete the request" : "No pudimos completar la solicitud"}</h2>
        <p>{translate(displayMessage)}</p>

        {onRetry && (
          <button
            type="button"
            className="button button-secondary"
            onClick={onRetry}
          >
            {isEnglish ? "Try again" : "Intentar nuevamente"}
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, description }) {
  const { language } = useAccessibility();
  const isEnglish = language === "en";
  return (
    <div className="feedback-state">
      <div>
        <span className="feedback-code">{isEnglish ? "NO RESULTS" : "SIN RESULTADOS"}</span>
        <h2>{title || (isEnglish ? "No content" : "No hay contenido")}</h2>
        <p>{description || (isEnglish ? "The information will appear here when it is available." : "La información aparecerá aquí cuando esté disponible.")}</p>
      </div>
    </div>
  );
}
