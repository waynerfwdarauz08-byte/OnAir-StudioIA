export const ROLES = {
  ADMIN: "admin",
  MODERATOR: "moderator",
  PRESENTER: "presenter",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Administrador",
  [ROLES.MODERATOR]: "Moderador",
  [ROLES.PRESENTER]: "Presentador",
};

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || "Usuario";
}

export function getDefaultRouteByRole(role) {
  const defaultRoutes = {
    [ROLES.ADMIN]: "/dashboard",
    [ROLES.MODERATOR]: "/news",
    [ROLES.PRESENTER]: "/teleprompter",
  };

  return defaultRoutes[role] || "/login";
}