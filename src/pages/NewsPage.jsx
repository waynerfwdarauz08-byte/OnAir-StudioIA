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

function NewsPage() {
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [newsToDelete, setNewsToDelete] =
    useState(null);
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

        setNews(
          Array.isArray(newsData) ? newsData : []
        );

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

    return () => {
      controller.abort();
    };
  }, [reloadKey]);

  const filteredNews = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("es");

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
          .toLocaleLowerCase("es");

        const matchesSearch =
          normalizedSearch === "" ||
          searchableContent.includes(
            normalizedSearch
          );

        const matchesStatus =
          status === "all" ||
          newsItem.editorialStatus === status;

        const matchesCategory =
          category === "all" ||
          newsItem.categoryId === category;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesCategory
        );
      })
      .sort(
        (firstNews, secondNews) =>
          new Date(secondNews.updatedAt).getTime() -
          new Date(firstNews.updatedAt).getTime()
      );
  }, [news, search, status, category]);

  function getCategoryName(categoryId) {
    const selectedCategory = categories.find(
      (categoryItem) =>
        categoryItem.id === categoryId
    );

    return selectedCategory?.name || "Sin categoría";
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
          (newsItem) =>
            newsItem.id !== newsToDelete.id
        )
      );

      setNewsToDelete(null);
    } catch (deleteError) {
      setActionError(
        deleteError.message ||
          "No fue posible eliminar la noticia."
      );
      setNewsToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="MESA EDITORIAL"
        title="Bandeja de noticias"
        description="Consulta, crea y administra el contenido registrado en el flujo editorial."
      />

      <div className="page-actions">
        <Link
          className="button button-secondary"
          to="/news/categories"
        >
          Administrar categorías
        </Link>

        <Link
          className="button button-primary"
          to="/news/new"
        >
          Nueva noticia
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
        <LoadingState message="Cargando las noticias registradas..." />
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

      {!loading && !error && (
        <>
          <div className="news-results-header">
            <p role="status">
              <strong>{filteredNews.length}</strong>{" "}
              {filteredNews.length === 1
                ? "noticia encontrada"
                : "noticias encontradas"}
            </p>

            <span>
              Información almacenada en JSON Server
            </span>
          </div>

          {filteredNews.length > 0 ? (
            <section
              className="news-grid"
              aria-label="Noticias registradas"
            >
              {filteredNews.map((newsItem) => (
                <NewsCard
                  key={newsItem.id}
                  newsItem={newsItem}
                  categoryName={getCategoryName(
                    newsItem.categoryId
                  )}
                  deleting={
                    deleting &&
                    newsToDelete?.id === newsItem.id
                  }
                  onDelete={requestDelete}
                />
              ))}
            </section>
          ) : (
            <EmptyState
              title="No encontramos coincidencias"
              description="Prueba con otra búsqueda, cambia los filtros o registra una nueva noticia."
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(newsToDelete)}
        title="Eliminar noticia"
        message={
          newsToDelete
            ? `¿Deseas eliminar permanentemente “${newsToDelete.title}”? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText="Eliminar noticia"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}

export default NewsPage;