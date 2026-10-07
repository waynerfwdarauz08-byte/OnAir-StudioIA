export const EDITORIAL_STATUS_LABELS = {
  draft: "Borrador",
  review: "En revisión",
  correction: "En corrección",
  approved: "Aprobada",
};

export function estimateScriptDuration(script, wordsPerMinute = 150) {
  const words = String(script || "").trim().split(/\s+/u).filter(Boolean).length;
  const rate = Number(wordsPerMinute);
  return words ? Math.ceil(words * 60 / (Number.isFinite(rate) && rate > 0 ? rate : 150)) : 0;
}

export function getEditorialStatusLabel(status) {
  return EDITORIAL_STATUS_LABELS[status] || "Sin clasificar";
}

export function formatDate(dateValue, language = "es") {
  if (!dateValue) {
    return language === "en" ? "Date unavailable" : "Fecha no disponible";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "es-CR", {
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
