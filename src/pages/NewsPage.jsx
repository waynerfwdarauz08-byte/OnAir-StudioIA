import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import PageHeader from "../components/common/PageHeader.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";

import NewsCard from "../components/news/NewsCard.jsx";
import NewsFilters from "../components/news/NewsFilters.jsx";

import { newsService } from "../services/newsService.js";
import { categoryService } from "../services/categoryService.js";
import useAccessibility from "../hooks/useAccessibility.js";

function NewsPage() {
  const { language } = useAccessibility();
  const isEnglish = language === "en";

  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [newsToDelete, setNewsToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadNews() {
      setLoading(true);
      setError("");

      try {
        const [newsData, categoriesData] =
          await Promise.all([
            newsService.getAll(controller.signal),
            categoryService.getAll(controller.signal),
          ]);

        if (controller.signal.aborted) {
          return;
        }

        setNews(Array.isArray(newsData) ? newsData : []);
        setCategories(
          Array.isArray(categoriesData)
            ? categoriesData
            : []
        );
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

    loadNews();

    return () => controller.abort();
  }, [reloadKey]);

  const filteredNews = useMemo(() => {
    const locale = isEnglish ? "en" : "es";
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase(locale);

    return news
      .filter((newsItem) => {
        const searchableContent = [
          newsItem.title,
          newsItem.summary,
          newsItem.sourceText,
          newsItem.sourceName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase(locale);

        const matchesSearch =
          normalizedSearch === "" ||
          searchableContent.includes(normalizedSearch);

        const matchesStatus =
          status === "all" ||
          newsItem.editorialStatus === status;

        const matchesCategory =
          category === "all" ||
          newsItem.categoryId === category;

        return matchesSearch && matchesStatus && matchesCategory;
      })
      .sort(
        (firstNews, secondNews) =>
          new Date(secondNews.updatedAt).getTime() -
          new Date(firstNews.updatedAt).getTime()
      );
  }, [news, search, status, category, isEnglish]);

  function getCategoryName(categoryId) {
    const selectedCategory = categories.find(
      (categoryItem) => categoryItem.id === categoryId
    );

    return (
      selectedCategory?.name ||
      (isEnglish ? "Uncategorized" : "Sin categoría")
    );
  }

  function requestDelete(newsItem) {
    setActionError("");
    setNewsToDelete(newsItem);
  }

  function cancelDelete() {
    if (!deleting) {
      setNewsToDelete(null);
    }
  }

  async function confirmDelete() {
    if (!newsToDelete) {
      return;
    }

    setDeleting(true);
    setActionError("");

    try {
      await newsService.remove(newsToDelete.id);

      setNews((currentNews) =>
        currentNews.filter(
          (newsItem) => newsItem.id !== newsToDelete.id
        )
      );

      setNewsToDelete(null);
    } catch (deleteError) {
      setActionError(
        deleteError.message ||
          (isEnglish
            ? "Could not delete the news item."
            : "No fue posible eliminar la noticia.")
      );
      setNewsToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  const resultCount = filteredNews.length;
  const resultLabel = isEnglish
    ? resultCount === 1
      ? "news item found"
      : "news items found"
    : resultCount === 1
      ? "noticia encontrada"
      : "noticias encontradas";

  return (
    <>
      <PageHeader
        eyebrow={isEnglish ? "NEWSROOM" : "MESA EDITORIAL"}
        title={isEnglish ? "News inbox" : "Bandeja de noticias"}
        description={
          isEnglish
            ? "Browse, create, and manage content in the editorial workflow."
            : "Consulta, crea y administra el contenido registrado en el flujo editorial."
        }
      />

      <div className="page-actions">
        <Link
          className="button button-secondary"
          to="/news/categories"
        >
          {isEnglish ? "Manage categories" : "Administrar categorías"}
        </Link>

        <Link
          className="button button-primary"
          to="/news/new"
        >
          {isEnglish ? "New story" : "Nueva noticia"}
        </Link>
      </div>

      {actionError && (
        <div className="form-alert" role="alert">
          {actionError}
        </div>
      )}

      <NewsFilters
        search={search}
        status={status}
        category={category}
        categories={categories}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onCategoryChange={setCategory}
      />

      {loading && (
        <LoadingState
          message={
            isEnglish
              ? "Loading news..."
              : "Cargando las noticias registradas..."
          }
        />
      )}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={() =>
            setReloadKey((currentValue) => currentValue + 1)
          }
        />
      )}

      {!loading && !error && (
        <>
          <div className="news-results-header">
            <p role="status">
              <strong>{resultCount}</strong> {resultLabel}
            </p>

            <span>
              {isEnglish
                ? "Information stored in JSON Server"
                : "Información almacenada en JSON Server"}
            </span>
          </div>

          {resultCount > 0 ? (
            <section
              className="news-grid"
              aria-label={
                isEnglish ? "Registered news" : "Noticias registradas"
              }
            >
              {filteredNews.map((newsItem) => (
                <NewsCard
                  key={newsItem.id}
                  newsItem={newsItem}
                  categoryName={getCategoryName(newsItem.categoryId)}
                  deleting={
                    deleting && newsToDelete?.id === newsItem.id
                  }
                  onDelete={requestDelete}
                />
              ))}
            </section>
          ) : (
            <EmptyState
              title={
                isEnglish
                  ? "No matching stories"
                  : "No encontramos coincidencias"
              }
              description={
                isEnglish
                  ? "Try another search, change the filters, or create a news item."
                  : "Prueba con otra búsqueda, cambia los filtros o registra una nueva noticia."
              }
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(newsToDelete)}
        title={isEnglish ? "Delete news item" : "Eliminar noticia"}
        message={
          newsToDelete
            ? isEnglish
              ? `Do you want to permanently delete “${newsToDelete.title}”? This action cannot be undone.`
              : `¿Deseas eliminar permanentemente “${newsToDelete.title}”? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText={isEnglish ? "Delete news item" : "Eliminar noticia"}
        cancelText={isEnglish ? "Cancel" : "Cancelar"}
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}

export default NewsPage;