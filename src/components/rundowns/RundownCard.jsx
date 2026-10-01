import useAccessibility from "../../hooks/useAccessibility.js";

function formatBroadcastDate(dateValue, language) {
  if (!dateValue) {
    return language === "en" ? "Date not set" : "Fecha no definida";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(
    new Date(`${dateValue}T12:00:00`)
  );
}

function formatTotalDuration(totalSeconds) {
  const safeSeconds = Number(totalSeconds) || 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

function RundownCard({
  rundown,
  news = [],
  selected = false,
  deleting = false,
  onSelect,
  onEdit,
  onDelete,
}) {
  const { language } = useAccessibility();
  const isEnglish = language === "en";
  const newsIds = Array.isArray(rundown.newsIds)
    ? rundown.newsIds
    : [];

  const assignedNews = newsIds
    .map((newsId) =>
      news.find(
        (newsItem) => newsItem.id === newsId
      )
    )
    .filter(Boolean);

  const totalDuration = assignedNews.reduce(
    (total, newsItem) =>
      total +
      (Number(
        newsItem.estimatedDurationSeconds
      ) || 0),
    0
  );

  return (
    <article
      className={`rundown-card ${
        selected ? "is-selected" : ""
      }`}
    >
      <button
        className="rundown-card-main"
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(rundown.id)}
      >
        <div className="rundown-card-heading">
          <span className="rundown-card-code">
            RD
          </span>

          <div>
            <h3>{rundown.name}</h3>

            <time dateTime={rundown.broadcastDate}>
              {formatBroadcastDate(
                rundown.broadcastDate, language
              )}
            </time>
          </div>
        </div>

        <div className="rundown-card-metrics">
          <span>
            <strong>{assignedNews.length}</strong>
            {isEnglish ? "news items" : "noticias"}
          </span>

          <span>
            <strong>
              {formatTotalDuration(totalDuration)}
            </strong>
            {isEnglish ? "duration" : "duración"}
          </span>
        </div>

        <span
          className={`rundown-card-status ${
            assignedNews.length > 0
              ? "is-ready"
              : "is-empty"
          }`}
        >
          {assignedNews.length > 0
            ? isEnglish ? "IN PREPARATION" : "EN PREPARACIÓN"
            : isEnglish ? "NO CONTENT" : "SIN CONTENIDO"}
        </span>
      </button>

      <div className="rundown-card-actions">
        <button
          className="button button-primary"
          type="button"
          onClick={() => onSelect(rundown.id)}
        >
          {isEnglish ? "Open edition" : "Abrir edición"}
        </button>

        <button
          className="button button-secondary"
          type="button"
          disabled={deleting}
          onClick={() => onEdit(rundown)}
        >
          {isEnglish ? "Edit" : "Editar"}
        </button>

        <button
          className="button button-danger"
          type="button"
          disabled={deleting}
          onClick={() => onDelete(rundown)}
        >
          {deleting ? isEnglish ? "Deleting..." : "Eliminando..." : isEnglish ? "Delete" : "Eliminar"}
        </button>
      </div>
    </article>
  );
}

export default RundownCard;
