import { request } from "./httpClient.js";

export async function validateTransmission(changes) {
  if (changes.onAir === false) return;
  if (!changes.newsId && !changes.rundownId && changes.onAir !== true) return;
  const current = await request("/transmissions/current");
  const next = { ...current, ...changes };
  if (!next.onAir) return;
  const rundown = await request(`/rundowns/${encodeURIComponent(next.rundownId)}`);
  const news = await request("/news");
  if (!Array.isArray(news) || rundown.deletedAt || !rundown.newsIds?.length ||
      !rundown.newsIds.some((id) => String(id) === String(next.newsId))) {
    throw new Error("La escaleta o la noticia seleccionada ya no está disponible. Actualiza Control al aire.");
  }
  const ids = changes.onAir === true || changes.rundownId ? rundown.newsIds : [next.newsId];
  for (const id of ids) {
    const story = news.find((item) => String(item.id) === String(id) && !item.deletedAt);
    if (!story || story.editorialStatus !== "approved") {
      throw new Error(`No se puede transmitir: ${story?.title || "una noticia de la escaleta"} debe estar aprobada y fuera de la papelera.`);
    }
  }
}

export async function validateNewsStatus(id, changes) {
  if (!changes.editorialStatus || changes.editorialStatus === "approved") return;
  const current = await request("/transmissions/current");
  if (current.onAir && String(current.newsId) === String(id)) {
    throw new Error("Esta noticia está al aire. Cambia de noticia o detén la transmisión antes de quitar su aprobación.");
  }
}

export async function validatePresenterRemoval(id) {
  const incidents = await request("/reportingIncidents");
  if (!Array.isArray(incidents)) throw new Error("No fue posible comprobar las asignaciones del presentador.");
  if (incidents.some((item) => String(item.presenterId) === String(id))) {
    throw new Error("Este usuario tiene un reportaje asignado en Mapa operativo. Reinicia el suceso antes de eliminarlo, desactivarlo o cambiar su función.");
  }
}
