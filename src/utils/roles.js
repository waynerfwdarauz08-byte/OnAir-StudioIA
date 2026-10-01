export const ROLES = {
  ADMIN: "admin",
  MODERATOR: "moderator",
  PRESENTER: "presenter",
};

const ROLE_LABELS = {
  es: {
    [ROLES.ADMIN]: "Administrador",
    [ROLES.MODERATOR]: "Moderador",
    [ROLES.PRESENTER]: "Presentador",
    unknown: "Usuario",
  },
  en: {
    [ROLES.ADMIN]: "Administrator",
    [ROLES.MODERATOR]: "Moderator",
    [ROLES.PRESENTER]: "Presenter",
    unknown: "User",
  },
};

export function getRoleLabel(role, language = "es") {
  const selectedLanguage =
    language === "en" ? "en" : "es";

  return (
    ROLE_LABELS[selectedLanguage][role] ||
    ROLE_LABELS[selectedLanguage].unknown
  );
}

export function getDefaultRouteByRole(role) {
  const defaultRoutes = {
    [ROLES.ADMIN]: "/dashboard",
    [ROLES.MODERATOR]: "/news",
    [ROLES.PRESENTER]: "/teleprompter",
  };

  return defaultRoutes[role] || "/login";
}