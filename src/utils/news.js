export const EDITORIAL_STATUS_LABELS = {
  draft: "Borrador",
  review: "En revisión",
  correction: "En corrección",
  approved: "Aprobada",
};

export function getEditorialStatusLabel(status) {
  return EDITORIAL_STATUS_LABELS[status] || "Sin clasificar";
}

export function formatDate(dateValue) {
  if (!dateValue) {
    return "Fecha no disponible";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Costa_Rica",
  }).format(date);
}

export function formatDuration(seconds) {
  const totalSeconds = Math.max(
    0,
    Math.round(Number(seconds) || 0)
  );

  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}