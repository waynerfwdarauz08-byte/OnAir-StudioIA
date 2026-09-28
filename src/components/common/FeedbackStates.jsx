export function LoadingState({
  message = "Cargando información...",
}) {
  return (
    <div className="feedback-state" role="status">
      <span className="loading-indicator" aria-hidden="true" />

      <div>
        <h2>Un momento</h2>
        <p>{message}</p>
      </div>
    </div>
  );
}

export function ErrorState({
  message = "No fue posible cargar la información.",
  onRetry,
}) {
  return (
    <div className="feedback-state feedback-error" role="alert">
      <div>
        <span className="feedback-code">ERROR DE CONEXIÓN</span>
        <h2>No pudimos completar la solicitud</h2>
        <p>{message}</p>

        {onRetry && (
          <button
            type="button"
            className="button button-secondary"
            onClick={onRetry}
          >
            Intentar nuevamente
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  title = "No hay contenido",
  description = "La información aparecerá aquí cuando esté disponible.",
}) {
  return (
    <div className="feedback-state">
      <div>
        <span className="feedback-code">SIN RESULTADOS</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}