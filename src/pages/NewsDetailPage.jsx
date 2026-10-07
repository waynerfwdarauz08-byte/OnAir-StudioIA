import useTranslation from "../hooks/useTranslation.js";
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
  const { translate, language } = useTranslation();
  const { id } = useParams();

  const [newsItem, setNewsItem] = useState(null);
  const [categoryName, setCategoryName] =
    useState("");

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
          selectedCategory?.name || ""
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
        eyebrow={translate("DETALLE EDITORIAL")}
        title={
          newsItem?.title || translate("Detalle de noticia")
        }
        description={translate("Consulta toda la información editorial y de producción registrada.")}
      />

      <div className="page-actions">
        <Link
          className="button button-secondary"
          to="/news"
        >{translate("Volver a noticias")}</Link>

        {newsItem && (
          <Link
            className="button button-primary"
            to={`/news/${newsItem.id}/edit`}
          >{translate("Editar noticia")}</Link>
        )}
      </div>

      {loading && (
        <LoadingState message={translate("Cargando el detalle de la noticia...")} />
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
                {categoryName || translate("Sin categoría")}
              </span>

              {newsItem.aiAssisted && (
                <span className="ai-assisted-badge">{translate("Asistida por IA")}</span>
              )}
            </div>

            <h2>{newsItem.title}</h2>

            <p className="news-detail-summary">
              {newsItem.summary ||
                translate("Esta noticia no tiene resumen.")}
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
                <h3 id="source-title">{translate("Fuente original")}</h3>
                <p>{translate("Información utilizada para preparar la noticia.")}</p>
              </div>
            </div>

            <dl className="news-detail-data">
              <div>
                <dt>{translate("Nombre de la fuente")}</dt>
                <dd>
                  {newsItem.sourceName ||
                    translate("No especificada")}
                </dd>
              </div>

              <div>
                <dt>{translate("Enlace")}</dt>
                <dd>
                  {newsItem.sourceUrl ? (
                    <a
                      href={newsItem.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >{translate("Abrir fuente original")}</a>
                  ) : (
                    translate("No disponible")
                  )}
                </dd>
              </div>
            </dl>

            <div className="news-detail-text">
              <h4>{translate("Contenido original")}</h4>

              <p>
                {newsItem.sourceText ||
                  translate("No hay contenido original registrado.")}
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
                <h3 id="production-title">{translate("Producción")}</h3>
                <p>{translate("Contenido preparado para la presentación.")}</p>
              </div>
            </div>

            <div className="news-detail-text">
              <h4>{translate("Guion")}</h4>

              <p>
                {newsItem.script ||
                  translate("Esta noticia todavía no tiene guion.")}
              </p>
            </div>

            <div className="news-detail-grid">
              <div className="news-detail-information">
                <span>{translate("CINTILLO SELECCIONADO")}</span>

                <p>
                  {newsItem.selectedLowerThird ||
                    translate("Sin cintillo seleccionado")}
                </p>
              </div>

              <div className="news-detail-information">
                <span>{translate("DURACIÓN ESTIMADA")}</span>

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
                <h4>{translate("Opciones de cintillo")}</h4>

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
                <h3 id="record-title">{translate("Registro del sistema")}</h3>
                <p>{translate("Fechas y responsables de la noticia.")}</p>
              </div>
            </div>

            <dl className="news-detail-data">
              <div>
                <dt>{translate("Creada")}</dt>
                <dd>
                  {formatDate(newsItem.createdAt, language)}
                </dd>
              </div>

              <div>
                <dt>{translate("Última actualización")}</dt>
                <dd>
                  {formatDate(newsItem.updatedAt, language)}
                </dd>
              </div>

              <div>
                <dt>{translate("Creada por")}</dt>
                <dd>
                  {newsItem.createdBy ||
                    translate("No disponible")}
                </dd>
              </div>

              <div>
                <dt>{translate("Actualizada por")}</dt>
                <dd>
                  {newsItem.updatedBy ||
                    translate("No disponible")}
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
