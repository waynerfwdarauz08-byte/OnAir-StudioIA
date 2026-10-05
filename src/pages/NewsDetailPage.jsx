import { useEffect, useState } from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import PageHeader from "../components/common/PageHeader.jsx";
import {
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";
import StatusBadge from "../components/news/StatusBadge.jsx";

import { newsService } from "../services/newsService.js";
import { categoryService } from "../services/categoryService.js";

import {
  formatDate,
  formatDuration,
} from "../utils/news.js";

function NewsDetailPage() {
  const { id } = useParams();

  const [newsItem, setNewsItem] = useState(null);
  const [categoryName, setCategoryName] =
    useState("Sin categoría");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadNewsDetail() {
      setLoading(true);
      setError("");

      try {
        const [newsData, categoriesData] =
          await Promise.all([
            newsService.getById(
              id,
              controller.signal
            ),
            categoryService.getAll(
              controller.signal
            ),
          ]);

        if (controller.signal.aborted) {
          return;
        }

        const categories = Array.isArray(
          categoriesData
        )
          ? categoriesData
          : [];

        const selectedCategory = categories.find(
          (categoryItem) =>
            categoryItem.id === newsData.categoryId
        );

        setNewsItem(newsData);
        setCategoryName(
          selectedCategory?.name || "Sin categoría"
        );
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError.message ||
              "No fue posible cargar la noticia."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadNewsDetail();

    return () => controller.abort();
  }, [id, reloadKey]);

  return (
    <>
      <PageHeader
        eyebrow="DETALLE EDITORIAL"
        title={
          newsItem?.title || "Detalle de noticia"
        }
        description="Consulta toda la información editorial y de producción registrada."
      />

      <div className="page-actions">
        <Link
          className="button button-secondary"
          to="/news"
        >
          Volver a noticias
        </Link>

        {newsItem && (
          <Link
            className="button button-primary"
            to={`/news/${newsItem.id}/edit`}
          >
            Editar noticia
          </Link>
        )}
      </div>

      {loading && (
        <LoadingState message="Cargando el detalle de la noticia..." />
      )}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={() =>
            setReloadKey(
              (currentValue) => currentValue + 1
            )
          }
        />
      )}

      {!loading && !error && newsItem && (
        <article className="news-detail">
          <header className="news-detail-header">
            <div className="news-detail-status">
              <StatusBadge
                status={newsItem.editorialStatus}
              />

              <span className="news-detail-category">
                {categoryName}
              </span>

              {newsItem.aiAssisted && (
                <span className="ai-assisted-badge">
                  Asistida por IA
                </span>
              )}
            </div>

            <h2>{newsItem.title}</h2>

            <p className="news-detail-summary">
              {newsItem.summary ||
                "Esta noticia no tiene resumen."}
            </p>
            {newsItem.imageUrl && (
              <img
                className="news-detail-image"
                src={newsItem.imageUrl}
                alt={newsItem.imageAlt || newsItem.title}
                style={{
                  objectFit: newsItem.imageFit || "cover",
                  objectPosition: `${newsItem.imagePositionX ?? 50}% ${newsItem.imagePositionY ?? 50}%`,
                }}
              />
            )}
          </header>

          <section
            className="news-detail-section"
            aria-labelledby="source-title"
          >
            <div className="news-detail-section-heading">
              <span>01</span>

              <div>
                <h3 id="source-title">
                  Fuente original
                </h3>
                <p>
                  Información utilizada para preparar la
                  noticia.
                </p>
              </div>
            </div>

            <dl className="news-detail-data">
              <div>
                <dt>Nombre de la fuente</dt>
                <dd>
                  {newsItem.sourceName ||
                    "No especificada"}
                </dd>
              </div>

              <div>
                <dt>Enlace</dt>
                <dd>
                  {newsItem.sourceUrl ? (
                    <a
                      href={newsItem.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir fuente original
                    </a>
                  ) : (
                    "No disponible"
                  )}
                </dd>
              </div>
            </dl>

            <div className="news-detail-text">
              <h4>Contenido original</h4>

              <p>
                {newsItem.sourceText ||
                  "No hay contenido original registrado."}
              </p>
            </div>
          </section>

          <section
            className="news-detail-section"
            aria-labelledby="production-title"
          >
            <div className="news-detail-section-heading">
              <span>02</span>

              <div>
                <h3 id="production-title">
                  Producción
                </h3>
                <p>
                  Contenido preparado para la presentación.
                </p>
              </div>
            </div>

            <div className="news-detail-text">
              <h4>Guion</h4>

              <p>
                {newsItem.script ||
                  "Esta noticia todavía no tiene guion."}
              </p>
            </div>

            <div className="news-detail-grid">
              <div className="news-detail-information">
                <span>CINTILLO SELECCIONADO</span>

                <p>
                  {newsItem.selectedLowerThird ||
                    "Sin cintillo seleccionado"}
                </p>
              </div>

              <div className="news-detail-information">
                <span>DURACIÓN ESTIMADA</span>

                <p>
                  {formatDuration(
                    newsItem.estimatedDurationSeconds
                  )}
                </p>
              </div>
            </div>

            {newsItem.lowerThirdOptions?.length >
              0 && (
              <div className="news-detail-options">
                <h4>Opciones de cintillo</h4>

                <ul>
                  {newsItem.lowerThirdOptions.map(
                    (option) => (
                      <li key={option}>{option}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </section>

          <section
            className="news-detail-section"
            aria-labelledby="record-title"
          >
            <div className="news-detail-section-heading">
              <span>03</span>

              <div>
                <h3 id="record-title">
                  Registro del sistema
                </h3>
                <p>
                  Fechas y responsables de la noticia.
                </p>
              </div>
            </div>

            <dl className="news-detail-data">
              <div>
                <dt>Creada</dt>
                <dd>
                  {formatDate(newsItem.createdAt)}
                </dd>
              </div>

              <div>
                <dt>Última actualización</dt>
                <dd>
                  {formatDate(newsItem.updatedAt)}
                </dd>
              </div>

              <div>
                <dt>Creada por</dt>
                <dd>
                  {newsItem.createdBy ||
                    "No disponible"}
                </dd>
              </div>

              <div>
                <dt>Actualizada por</dt>
                <dd>
                  {newsItem.updatedBy ||
                    "No disponible"}
                </dd>
              </div>
            </dl>
          </section>
        </article>
      )}
    </>
  );
}

export default NewsDetailPage;
