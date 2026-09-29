function ActivityFilters({
  search,
  action,
  module,
  onSearchChange,
  onActionChange,
  onModuleChange,
  onClear,
}) {
  const hasActiveFilters =
    search.trim() !== "" ||
    action !== "all" ||
    module !== "all";

  return (
    <section
      className="activity-filters"
      aria-label="Filtros del historial"
    >
      <div className="activity-filter-field activity-filter-search">
        <label htmlFor="activity-search">
          Buscar actividad
        </label>

        <input
          id="activity-search"
          type="search"
          value={search}
          placeholder="Usuario, descripción o identificación..."
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
        />
      </div>

      <div className="activity-filter-field">
        <label htmlFor="activity-action">
          Tipo de actividad
        </label>

        <select
          id="activity-action"
          value={action}
          onChange={(event) =>
            onActionChange(event.target.value)
          }
        >
          <option value="all">
            Todas las actividades
          </option>

          <option value="login_success">
            Inicio de sesión
          </option>

          <option value="logout">
            Cierre de sesión
          </option>

          <option value="system_check">
            Verificación del sistema
          </option>

          <option value="create">
            Creación
          </option>

          <option value="update">
            Actualización
          </option>

          <option value="delete">
            Eliminación
          </option>
        </select>
      </div>

      <div className="activity-filter-field">
        <label htmlFor="activity-module">
          Módulo
        </label>

        <select
          id="activity-module"
          value={module}
          onChange={(event) =>
            onModuleChange(event.target.value)
          }
        >
          <option value="all">Todos los módulos</option>
          <option value="authentication">
            Autenticación
          </option>
          <option value="system">Sistema</option>
          <option value="users">Usuarios</option>
          <option value="news">Noticias</option>
          <option value="categories">
            Categorías
          </option>
          <option value="rundowns">
            Escaletas
          </option>
          <option value="transmissions">
            Transmisión
          </option>
          <option value="ai">
            Inteligencia artificial
          </option>
          <option value="messages">
            Mensajería
          </option>
          <option value="settings">
            Configuración
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
          Limpiar filtros
        </button>
      </div>
    </section>
  );
}

export default ActivityFilters;