import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import PageHeader from "../components/common/PageHeader.jsx";
import {
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";
import NewsForm from "../components/news/NewsForm.jsx";

import { categoryService } from "../services/categoryService.js";
import { newsService } from "../services/newsService.js";
import useAuth from "../hooks/useAuth.js";

function NewsEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [newsItem, setNewsItem] = useState(null);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPageData() {
      setLoading(true);
      setError("");

      try {
        const [newsData, categoryData] =
          await Promise.all([
            newsService.getById(id, controller.signal),
            categoryService.getAll(controller.signal),
          ]);

        if (controller.signal.aborted) {
          return;
        }

        setNewsItem(newsData);
        setCategories(
          Array.isArray(categoryData) ? categoryData : []
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

    loadPageData();

    return () => controller.abort();
  }, [id, reloadKey]);

  async function handleUpdate(formValues) {
    setSubmitting(true);
    setError("");

    try {
      const updatedNews = {
        ...newsItem,
        ...formValues,
        id: newsItem.id,
        createdBy: newsItem.createdBy,
        createdAt: newsItem.createdAt,
        updatedBy: user.id,
        updatedAt: new Date().toISOString(),
        aiAssisted: Boolean(newsItem.aiAssisted),
        isDemo: Boolean(newsItem.isDemo),
      };

      await newsService.update(id, updatedNews);
      navigate("/news", { replace: true });
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="MESA EDITORIAL"
        title="Editar noticia"
        description="Actualiza la información y el estado editorial de la noticia."
      />

      <div className="page-actions">
        <Link className="button button-secondary" to="/news">
          Volver a noticias
        </Link>
      </div>

      {loading && (
        <LoadingState message="Cargando la noticia..." />
      )}

      {!loading && !newsItem && (
        <ErrorState
          message={
            error || "No encontramos la noticia solicitada."
          }
          onRetry={() =>
            setReloadKey((currentValue) => currentValue + 1)
          }
        />
      )}

      {!loading && newsItem && (
        <NewsForm
          initialValues={newsItem}
          categories={categories}
          onSubmit={handleUpdate}
          submitLabel="Guardar cambios"
          submitting={submitting}
          serverError={error}
        />
      )}
    </>
  );
}

export default NewsEditPage;