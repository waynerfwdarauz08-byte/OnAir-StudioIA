import useAccessibility from "../../hooks/useAccessibility.js";

function ActivityFilters({
  search,
  action,
  module,
  onSearchChange,
  onActionChange,
  onModuleChange,
  onClear,
}) {
  const { language } = useAccessibility();
  const isEnglish = language === "en";
  const hasActiveFilters =
    search.trim() !== "" ||
    action !== "all" ||
    module !== "all";

  return (
    <section
      className="activity-filters"
      aria-label={isEnglish ? "Activity log filters" : "Filtros del historial"}
    >
      <div className="activity-filter-field activity-filter-search">
        <label htmlFor="activity-search">
          {isEnglish ? "Search activity" : "Buscar actividad"}
        </label>

        <input
          id="activity-search"
          type="search"
          value={search}
          placeholder={isEnglish ? "User, description, or ID..." : "Usuario, descripción o identificación..."}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
        />
      </div>

      <div className="activity-filter-field">
        <label htmlFor="activity-action">
          {isEnglish ? "Activity type" : "Tipo de actividad"}
        </label>

        <select
          id="activity-action"
          value={action}
          onChange={(event) =>
            onActionChange(event.target.value)
          }
        >
          <option value="all">
            {isEnglish ? "All activities" : "Todas las actividades"}
          </option>

          <option value="login_success">
            {isEnglish ? "Sign-in" : "Inicio de sesión"}
          </option>

          <option value="logout">
            {isEnglish ? "Sign-out" : "Cierre de sesión"}
          </option>

          <option value="system_check">
            {isEnglish ? "System check" : "Verificación del sistema"}
          </option>

          <option value="create">
            {isEnglish ? "Creation" : "Creación"}
          </option>

          <option value="update">
            {isEnglish ? "Update" : "Actualización"}
          </option>

          <option value="restore">{isEnglish ? "Restoration" : "Restauración"}</option>
          <option value="delete">
            {isEnglish ? "Deletion" : "Eliminación"}
          </option>
        </select>
      </div>

      <div className="activity-filter-field">
        <label htmlFor="activity-module">
          {isEnglish ? "Module" : "Módulo"}
        </label>

        <select
          id="activity-module"
          value={module}
          onChange={(event) =>
            onModuleChange(event.target.value)
          }
        >
          <option value="all">{isEnglish ? "All modules" : "Todos los módulos"}</option>
          <option value="authentication">
            {isEnglish ? "Authentication" : "Autenticación"}
          </option>
          <option value="system">{isEnglish ? "System" : "Sistema"}</option>
          <option value="users">{isEnglish ? "Users" : "Usuarios"}</option>
          <option value="news">{isEnglish ? "News" : "Noticias"}</option>
          <option value="categories">
            {isEnglish ? "Categories" : "Categorías"}
          </option>
          <option value="rundowns">
            {isEnglish ? "Rundowns" : "Escaletas"}
          </option>
          <option value="transmissions">
            {isEnglish ? "Transmission" : "Transmisión"}
          </option>
          <option value="ai">
            {isEnglish ? "Artificial intelligence" : "Inteligencia artificial"}
          </option>
          <option value="messages">
            {isEnglish ? "Messaging" : "Mensajería"}
          </option>
          <option value="settings">
            {isEnglish ? "Settings" : "Configuración"}
          </option>
        </select>
      </div>

      <div className="activity-filter-actions">
        <button
          type="button"
          className="button button-secondary"
          disabled={!hasActiveFilters}
          onClick={onClear}
        >
          {isEnglish ? "Clear filters" : "Limpiar filtros"}
        </button>
      </div>
    </section>
  );
}

export default ActivityFilters;
