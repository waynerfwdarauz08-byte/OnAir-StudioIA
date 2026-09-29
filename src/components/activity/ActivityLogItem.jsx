const ACTION_INFORMATION = {
  login_success: {
    label: "Inicio de sesión",
    icon: "↪",
    color: "success",
  },

  logout: {
    label: "Cierre de sesión",
    icon: "↩",
    color: "neutral",
  },

  system_check: {
    label: "Verificación",
    icon: "✓",
    color: "system",
  },

  create: {
    label: "Creación",
    icon: "+",
    color: "success",
  },

  update: {
    label: "Actualización",
    icon: "✎",
    color: "warning",
  },

  delete: {
    label: "Eliminación",
    icon: "×",
    color: "danger",
  },
};

const MODULE_LABELS = {
  authentication: "Autenticación",
  system: "Sistema",
  users: "Usuarios",
  news: "Noticias",
  categories: "Categorías",
  rundowns: "Escaletas",
  transmissions: "Transmisión",
  ai: "Inteligencia artificial",
  messages: "Mensajería",
  settings: "Configuración",
};

function formatActivityDate(dateValue) {
  if (!dateValue) {
    return "Fecha no disponible";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function ActivityLogItem({ activity }) {
  const actionInformation =
    ACTION_INFORMATION[activity.action] || {
      label: "Actividad",
      icon: "•",
      color: "neutral",
    };

  const moduleLabel =
    MODULE_LABELS[activity.module] ||
    activity.module ||
    "Sistema";

  const userInitial =
    activity.userName
      ?.trim()
      .charAt(0)
      .toUpperCase() || "S";

  return (
    <article className="activity-log-item">
      <div
        className={`activity-log-icon activity-log-icon-${actionInformation.color}`}
        aria-hidden="true"
      >
        {actionInformation.icon}
      </div>

      <div className="activity-log-content">
        <div className="activity-log-heading">
          <div>
            <span
              className={`activity-action-badge activity-action-${actionInformation.color}`}
            >
              {actionInformation.label}
            </span>

            <span className="activity-module-badge">
              {moduleLabel}
            </span>
          </div>

          <time dateTime={activity.createdAt}>
            {formatActivityDate(activity.createdAt)}
          </time>
        </div>

        <p className="activity-description">
          {activity.description ||
            "Actividad registrada en el sistema."}
        </p>

        <div className="activity-user">
          <span
            className="activity-user-avatar"
            aria-hidden="true"
          >
            {userInitial}
          </span>

          <div>
            <strong>
              {activity.userName || "Sistema"}
            </strong>

            <span>
              {activity.userId === "system"
                ? "Proceso automatizado"
                : activity.userId}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ActivityLogItem;