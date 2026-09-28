import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import PageHeader from "../components/common/PageHeader.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import {
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";
import CategoryForm from "../components/categories/CategoryForm.jsx";

import { categoryService } from "../services/categoryService.js";
import { newsService } from "../services/newsService.js";

function createCategoryId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `category-${crypto.randomUUID()}`;
  }

  return `category-${Date.now()}`;
}

function normalizeText(value) {
  return value.trim().toLocaleLowerCase("es");
}

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [news, setNews] = useState([]);

  const [editingCategory, setEditingCategory] =
    useState(null);
  const [categoryToDelete, setCategoryToDelete] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      setLoading(true);
      setLoadError("");

      try {
        const [categoryData, newsData] =
          await Promise.all([
            categoryService.getAll(controller.signal),
            newsService.getAll(controller.signal),
          ]);

        if (controller.signal.aborted) {
          return;
        }

        setCategories(
          Array.isArray(categoryData)
            ? categoryData
            : []
        );

        setNews(
          Array.isArray(newsData) ? newsData : []
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => controller.abort();
  }, [reloadKey]);

  const categoryUsage = useMemo(() => {
    return news.reduce((usage, newsItem) => {
      const categoryId = newsItem.categoryId;

      if (categoryId) {
        usage[categoryId] =
          (usage[categoryId] || 0) + 1;
      }

      return usage;
    }, {});
  }, [news]);

  const orderedCategories = useMemo(() => {
    return [...categories].sort((first, second) =>
      first.name.localeCompare(second.name, "es")
    );
  }, [categories]);

  function categoryNameExists(name, ignoredId = null) {
    const normalizedName = normalizeText(name);

    return categories.some(
      (categoryItem) =>
        categoryItem.id !== ignoredId &&
        normalizeText(categoryItem.name) ===
          normalizedName
    );
  }

  function clearMessages() {
    setFormError("");
    setActionError("");
    setSuccessMessage("");
  }

  async function handleSubmit(values) {
    clearMessages();

    if (
      categoryNameExists(
        values.name,
        editingCategory?.id
      )
    ) {
      setFormError(
        "Ya existe una categoría con ese nombre."
      );
      return;
    }

    setSubmitting(true);

    try {
      const currentDate = new Date().toISOString();

      if (editingCategory) {
        const updatedCategory = {
          ...editingCategory,
          ...values,
          id: editingCategory.id,
          createdAt: editingCategory.createdAt,
          updatedAt: currentDate,
        };

        const savedCategory =
          await categoryService.update(
            editingCategory.id,
            updatedCategory
          );

        setCategories((currentCategories) =>
          currentCategories.map((categoryItem) =>
            categoryItem.id === editingCategory.id
              ? savedCategory
              : categoryItem
          )
        );

        setEditingCategory(null);
        setSuccessMessage(
          "La categoría fue actualizada correctamente."
        );
      } else {
        const newCategory = {
          id: createCategoryId(),
          ...values,
          createdAt: currentDate,
          updatedAt: currentDate,
        };

        const savedCategory =
          await categoryService.create(newCategory);

        setCategories((currentCategories) => [
          ...currentCategories,
          savedCategory,
        ]);

        setSuccessMessage(
          "La categoría fue creada correctamente."
        );
      }
    } catch (error) {
      setFormError(
        error.message ||
          "No fue posible guardar la categoría."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startEditing(categoryItem) {
    clearMessages();
    setEditingCategory(categoryItem);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    setEditingCategory(null);
    setFormError("");
  }

  function requestDelete(categoryItem) {
    clearMessages();

    const usageCount =
      categoryUsage[categoryItem.id] || 0;

    if (usageCount > 0) {
      setActionError(
        `No puedes eliminar “${categoryItem.name}” porque está utilizada por ${usageCount} ${
          usageCount === 1 ? "noticia" : "noticias"
        }. Cambia primero la categoría de esas noticias.`
      );

      return;
    }

    setCategoryToDelete(categoryItem);
  }

  function cancelDelete() {
    if (!deleting) {
      setCategoryToDelete(null);
    }
  }

  async function confirmDelete() {
    if (!categoryToDelete) {
      return;
    }

    setDeleting(true);
    setActionError("");

    try {
      await categoryService.remove(
        categoryToDelete.id
      );

      setCategories((currentCategories) =>
        currentCategories.filter(
          (categoryItem) =>
            categoryItem.id !== categoryToDelete.id
        )
      );

      if (
        editingCategory?.id ===
        categoryToDelete.id
      ) {
        setEditingCategory(null);
      }

      setCategoryToDelete(null);
      setSuccessMessage(
        "La categoría fue eliminada correctamente."
      );
    } catch (error) {
      setActionError(
        error.message ||
          "No fue posible eliminar la categoría."
      );
      setCategoryToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="CONFIGURACIÓN EDITORIAL"
        title="Categorías de noticias"
        description="Crea y administra las categorías utilizadas para organizar el contenido informativo."
      />

      <div className="page-actions">
        <Link
          className="button button-secondary"
          to="/news"
        >
          Volver a noticias
        </Link>
      </div>

      {loading && (
        <LoadingState message="Cargando las categorías..." />
      )}

      {!loading && loadError && (
        <ErrorState
          message={loadError}
          onRetry={() =>
            setReloadKey(
              (currentValue) => currentValue + 1
            )
          }
        />
      )}

      {!loading && !loadError && (
        <div className="categories-layout">
          <CategoryForm
            key={editingCategory?.id || "new-category"}
            initialValues={
              editingCategory || undefined
            }
            editing={Boolean(editingCategory)}
            submitting={submitting}
            serverError={formError}
            onSubmit={handleSubmit}
            onCancel={cancelEditing}
          />

          <section
            className="categories-panel"
            aria-labelledby="categories-list-title"
          >
            <div className="categories-panel-heading">
              <div>
                <span>CATEGORÍAS REGISTRADAS</span>
                <h2 id="categories-list-title">
                  Lista de categorías
                </h2>
              </div>

              <strong>{categories.length}</strong>
            </div>

            {successMessage && (
              <div
                className="success-alert"
                role="status"
              >
                {successMessage}
              </div>
            )}

            {actionError && (
              <div
                className="form-alert"
                role="alert"
              >
                {actionError}
              </div>
            )}

            {orderedCategories.length === 0 ? (
              <p className="categories-empty">
                Todavía no hay categorías registradas.
              </p>
            ) : (
              <div className="categories-list">
                {orderedCategories.map(
                  (categoryItem) => {
                    const usageCount =
                      categoryUsage[
                        categoryItem.id
                      ] || 0;

                    return (
                      <article
                        className="category-card"
                        key={categoryItem.id}
                      >
                        <div className="category-card-content">
                          <div className="category-card-heading">
                            <h3>
                              {categoryItem.name}
                            </h3>

                            <span>
                              {usageCount}{" "}
                              {usageCount === 1
                                ? "noticia"
                                : "noticias"}
                            </span>
                          </div>

                          <p>
                            {categoryItem.description}
                          </p>
                        </div>

                        <div className="category-card-actions">
                          <button
                            className="button button-secondary"
                            type="button"
                            disabled={
                              submitting || deleting
                            }
                            onClick={() =>
                              startEditing(
                                categoryItem
                              )
                            }
                          >
                            Editar
                          </button>

                          <button
                            className="button button-danger"
                            type="button"
                            disabled={
                              submitting || deleting
                            }
                            onClick={() =>
                              requestDelete(
                                categoryItem
                              )
                            }
                          >
                            Eliminar
                          </button>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        title="Eliminar categoría"
        message={
          categoryToDelete
            ? `¿Deseas eliminar permanentemente la categoría “${categoryToDelete.name}”?`
            : ""
        }
        confirmText="Eliminar categoría"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}

export default CategoriesPage;