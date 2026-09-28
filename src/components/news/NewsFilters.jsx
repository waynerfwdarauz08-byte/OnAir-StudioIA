import { EDITORIAL_STATUS_LABELS } from "../../utils/news.js";

function NewsFilters({
  search,
  status,
  category,
  categories,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
}) {
  return (
    <section
      className="news-filters"
      aria-label="Filtros de noticias"
    >
      <div className="filter-field filter-search">
        <label htmlFor="news-search">Buscar noticia</label>

        <input
          id="news-search"
          type="search"
          value={search}
          placeholder="Título, resumen o contenido..."
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
        />
      </div>

      <div className="filter-field">
        <label htmlFor="status-filter">Estado editorial</label>

        <select
          id="status-filter"
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value)
          }
        >
          <option value="all">Todos los estados</option>

          {Object.entries(EDITORIAL_STATUS_LABELS).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="category-filter">Categoría</label>

        <select
          id="category-filter"
          value={category}
          onChange={(event) =>
            onCategoryChange(event.target.value)
          }
        >
          <option value="all">Todas las categorías</option>

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