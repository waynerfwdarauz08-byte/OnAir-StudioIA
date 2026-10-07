import useAccessibility from "../../hooks/useAccessibility.js";

const ACTION_INFORMATION = {
  restore: { label: "Restauración", icon: "↩", color: "success" },
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

function formatActivityDate(dateValue, language) {
  if (!dateValue) {
    return language === "en" ? "Date unavailable" : "Fecha no disponible";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return language === "en" ? "Date unavailable" : "Fecha no disponible";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function ActivityLogItem({ activity }) {
  const { language } = useAccessibility();
  const isEnglish = language === "en";
  const spanishActionInformation =
    ACTION_INFORMATION[activity.action] || {
      label: isEnglish ? "Activity" : "Actividad",
      icon: "•",
      color: "neutral",
    };
  const actionInformation = isEnglish
    ? {
        ...spanishActionInformation,
        label: ({ restore: "Restoration", login_success: "Sign-in", logout: "Sign-out", system_check: "Check", create: "Creation", update: "Update", delete: "Deletion" }[activity.action] || "Activity"),
      }
    : spanishActionInformation;

  const moduleLabel = isEnglish
    ? ({ authentication: "Authentication", system: "System", users: "Users", news: "News", categories: "Categories", rundowns: "Rundowns", transmissions: "Transmission", ai: "Artificial intelligence", messages: "Messaging", settings: "Settings" }[activity.module] || activity.module || "System")
    : MODULE_LABELS[activity.module] ||
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
            {formatActivityDate(activity.createdAt, language)}
          </time>
        </div>

        <p className="activity-description">
          {activity.description ||
            (isEnglish ? "Activity recorded in the system." : "Actividad registrada en el sistema.")}
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
              {activity.userName || (isEnglish ? "System" : "Sistema")}
            </strong>

            <span>
              {activity.userId === "system"
                ? isEnglish ? "Automated process" : "Proceso automatizado"
                : activity.userId}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ActivityLogItem;
