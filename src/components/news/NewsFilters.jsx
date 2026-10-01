import { EDITORIAL_STATUS_LABELS } from "../../utils/news.js";
import useAccessibility from "../../hooks/useAccessibility.js";

const STATUS_LABELS_EN = {
  draft: "Draft",
  review: "Under review",
  correction: "Needs correction",
  approved: "Approved",
};

function NewsFilters({
  search,
  status,
  category,
  categories,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
}) {
  const { language } = useAccessibility();
  const isEnglish = language === "en";

  return (
    <section
      className="news-filters"
      aria-label={isEnglish ? "News filters" : "Filtros de noticias"}
    >
      <div className="filter-field filter-search">
        <label htmlFor="news-search">
          {isEnglish ? "Search news" : "Buscar noticia"}
        </label>

        <input
          id="news-search"
          type="search"
          value={search}
          placeholder={
            isEnglish
              ? "Title, summary, or content..."
              : "Título, resumen o contenido..."
          }
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
        />
      </div>

      <div className="filter-field">
        <label htmlFor="status-filter">
          {isEnglish ? "Editorial status" : "Estado editorial"}
        </label>

        <select
          id="status-filter"
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value)
          }
        >
          <option value="all">
            {isEnglish ? "All statuses" : "Todos los estados"}
          </option>

          {Object.entries(EDITORIAL_STATUS_LABELS).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {isEnglish
                  ? STATUS_LABELS_EN[value] || label
                  : label}
              </option>
            )
          )}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="category-filter">
          {isEnglish ? "Category" : "Categoría"}
        </label>

        <select
          id="category-filter"
          value={category}
          onChange={(event) =>
            onCategoryChange(event.target.value)
          }
        >
          <option value="all">
            {isEnglish ? "All categories" : "Todas las categorías"}
          </option>

          {categories.map((categoryItem) => (
            <option
              key={categoryItem.id}
              value={categoryItem.id}
            >
              {categoryItem.name}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

export default NewsFilters;