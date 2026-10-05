import { Link } from "react-router-dom";

import StatusBadge from "./StatusBadge.jsx";
import { formatDuration } from "../../utils/news.js";
import useAccessibility from "../../hooks/useAccessibility.js";

function NewsCard({
  newsItem,
  categoryName,
  onDelete,
  deleting = false,
}) {
  const { language } = useAccessibility();
  const isEnglish = language === "en";

  const formattedDate = newsItem.updatedAt
    ? new Intl.DateTimeFormat(isEnglish ? "en-US" : "es-CR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(newsItem.updatedAt))
    : "";

  return (
    <article className="news-card">
      {newsItem.imageUrl && (
        <img
          className="news-card-image"
          src={newsItem.imageUrl}
          alt={newsItem.imageAlt || newsItem.title}
          loading="lazy"
          style={{
            objectFit: newsItem.imageFit || "cover",
            objectPosition: `${newsItem.imagePositionX ?? 50}% ${newsItem.imagePositionY ?? 50}%`,
          }}
        />
      )}

      <div className="news-card-meta">
        <StatusBadge status={newsItem.editorialStatus} />
        <span>
          {categoryName ||
            (isEnglish ? "Uncategorized" : "Sin categoría")}
        </span>
      </div>

      <h2>{newsItem.title}</h2>

      <p className="news-card-summary">
        {newsItem.summary ||
          (isEnglish
            ? "This story does not have a summary yet."
            : "Esta noticia todavía no tiene un resumen.")}
      </p>

      {newsItem.selectedLowerThird && (
        <div className="lower-third-preview">
          <span>{isEnglish ? "LOWER THIRD" : "CINTILLO"}</span>
          <p>{newsItem.selectedLowerThird}</p>
        </div>
      )}

      <footer className="news-card-footer">
        <time dateTime={newsItem.updatedAt}>
          {formattedDate}
        </time>

        <span className="news-duration">
          {formatDuration(newsItem.estimatedDurationSeconds)}
          <small>{isEnglish ? " estimated" : " estimado"}</small>
        </span>
      </footer>

      <div
        className="news-card-actions"
        aria-label={
          isEnglish
            ? `Actions for ${newsItem.title}`
            : `Acciones para ${newsItem.title}`
        }
      >
        <Link
          className="button button-secondary"
          to={`/news/${newsItem.id}`}
        >
          {isEnglish ? "View details" : "Ver detalle"}
        </Link>

        <Link
          className="button button-secondary"
          to={`/news/${newsItem.id}/edit`}
        >
          {isEnglish ? "Edit" : "Editar"}
        </Link>

        <button
          className="button button-danger"
          type="button"
          disabled={deleting}
          onClick={() => onDelete(newsItem)}
        >
          {deleting
            ? isEnglish
              ? "Deleting..."
              : "Eliminando..."
            : isEnglish
              ? "Delete"
              : "Eliminar"}
        </button>
      </div>
    </article>
  );
}

export default NewsCard;
