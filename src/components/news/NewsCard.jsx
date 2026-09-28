import { Link } from "react-router-dom";

import StatusBadge from "./StatusBadge.jsx";
import {
  formatDate,
  formatDuration,
} from "../../utils/news.js";

function NewsCard({
  newsItem,
  categoryName = "Sin categoría",
  onDelete,
  deleting = false,
}) {
  return (
    <article className="news-card">
      <div className="news-card-meta">
        <StatusBadge status={newsItem.editorialStatus} />
        <span>{categoryName}</span>
      </div>

      <h2>{newsItem.title}</h2>

      <p className="news-card-summary">
        {newsItem.summary ||
          "Esta noticia todavía no tiene un resumen."}
      </p>

      {newsItem.selectedLowerThird && (
        <div className="lower-third-preview">
          <span>CINTILLO</span>
          <p>{newsItem.selectedLowerThird}</p>
        </div>
      )}

      <footer className="news-card-footer">
        <time dateTime={newsItem.updatedAt}>
          {formatDate(newsItem.updatedAt)}
        </time>

        <span className="news-duration">
          {formatDuration(
            newsItem.estimatedDurationSeconds
          )}
          <small> estimado</small>
        </span>
      </footer>

      <div
        className="news-card-actions"
        aria-label={`Acciones para ${newsItem.title}`}
      >
        <Link
          className="button button-secondary"
          to={`/news/${newsItem.id}`}
        >
          Ver detalle
        </Link>

        <Link
          className="button button-secondary"
          to={`/news/${newsItem.id}/edit`}
        >
          Editar
        </Link>

        <button
          className="button button-danger"
          type="button"
          disabled={deleting}
          onClick={() => onDelete(newsItem)}
        >
          {deleting ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </article>
  );
}

export default NewsCard;