import { validateNewsStatus } from "./editorialGuards.js";
import { mutateWithActivity } from "./editorialMutationService.js";
import { request } from "./httpClient.js";
import { getActiveRecords, getActiveRecord, trashService } from "./trashService.js";

const RESOURCE = "/news";

export const newsService = {
  getAll(signal) {
    return getActiveRecords("news", signal);
  },

  getById(id, signal) {
    return getActiveRecord("news", id, signal);
  },

  create(newsItem, actor) {
    return mutateWithActivity(RESOURCE, {
      method: "POST",
      body: newsItem,
    }, actor, "news", "create");
  },

  async update(id, newsItem, actor) {
    await validateNewsStatus(id, newsItem);
    return mutateWithActivity(`${RESOURCE}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: newsItem,
    }, actor, "news", "update");
  },

  async partialUpdate(id, changes, actor) {
    await validateNewsStatus(id, changes);
    return mutateWithActivity(`${RESOURCE}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: changes,
    }, actor, "news", "update");
  },

  async remove(id, actor) {
    // Consultar de nuevo al confirmar, no confiar en los datos de la pantalla.
    const rundowns = await getActiveRecords("rundowns");
    if (!Array.isArray(rundowns)) {
      throw new Error("No fue posible comprobar si la noticia está en una escaleta. Inténtalo nuevamente.");
    }
    if (rundowns.some((rundown) =>
      rundown.newsIds?.some((newsId) => String(newsId) === String(id))
    )) {
      const error = new Error("Esta noticia está en una escaleta. Quítala de ahí primero.");
      error.code = "news-in-rundown";
      throw error;
    }
    const transmission = await request("/transmissions/current");
    if (String(transmission.newsId) === String(id)) {
      throw new Error("Esta noticia está seleccionada en Control al aire. Retírala de la transmisión primero.");
    }
    return trashService.move("news", id, actor);
  },
};
