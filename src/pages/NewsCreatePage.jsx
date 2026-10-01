import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../components/common/PageHeader.jsx";
import {
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";
import NewsForm from "../components/news/NewsForm.jsx";

import { categoryService } from "../services/categoryService.js";
import { newsService } from "../services/newsService.js";
import useAuth from "../hooks/useAuth.js";
import useAccessibility from "../hooks/useAccessibility.js";

function createNewsId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `news-${crypto.randomUUID()}`;
  }

  return `news-${Date.now()}`;
}

function NewsCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useAccessibility();
  const isEnglish = language === "en";

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      setLoading(true);
      setError("");

      try {
        const categoryData = await categoryService.getAll(
          controller.signal
        );

        if (!controller.signal.aborted) {
          setCategories(
            Array.isArray(categoryData) ? categoryData : []
          );
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => controller.abort();
  }, [reloadKey]);

  async function handleCreate(formValues) {
    setSubmitting(true);
    setError("");

    try {
      const currentDate = new Date().toISOString();

      const newNews = {
        id: createNewsId(),
        ...formValues,
        createdBy: user.id,
        updatedBy: user.id,
        createdAt: currentDate,
        updatedAt: currentDate,
        aiAssisted: false,
        isDemo: false,
      };

      await newsService.create(newNews);
      navigate("/news", { replace: true });
    } catch (createError) {
      setError(createError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={isEnglish ? "NEWSROOM" : "MESA EDITORIAL"}
        title={isEnglish ? "Create news item" : "Crear noticia"}
        description={
          isEnglish
            ? "Add a news story and prepare its content for the editorial workflow."
            : "Registra una nueva noticia y prepara su contenido para el flujo editorial."
        }
      />

      <div className="page-actions">
        <Link className="button button-secondary" to="/news">
          {isEnglish ? "Back to news" : "Volver a noticias"}
        </Link>
      </div>

      {loading && (
        <LoadingState
          message={
            isEnglish
              ? "Loading categories..."
              : "Cargando las categorías..."
          }
        />
      )}

      {!loading && error && categories.length === 0 && (
        <ErrorState
          message={error}
          onRetry={() =>
            setReloadKey((currentValue) => currentValue + 1)
          }
        />
      )}

      {!loading && !error && categories.length === 0 && (
        <div className="form-alert" role="alert">
          {isEnglish
            ? "Create at least one category before adding a news item."
            : "Debes crear al menos una categoría antes de registrar una noticia."}
        </div>
      )}

      {!loading && categories.length > 0 && (
        <NewsForm
          categories={categories}
          onSubmit={handleCreate}
          submitLabel={
            isEnglish ? "Create news item" : "Crear noticia"
          }
          submitting={submitting}
          serverError={error}
        />
      )}
    </>
  );
}

export default NewsCreatePage;