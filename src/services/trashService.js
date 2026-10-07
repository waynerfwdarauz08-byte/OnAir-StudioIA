import { mutateWithActivity } from "./editorialMutationService.js";
import { request, ApiError } from "./httpClient.js";

const resources = ["news", "rundowns", "categories"];

function pathFor(resource, id) {
  if (!resources.includes(resource)) throw new Error("Tipo de elemento no válido.");
  return `/${resource}/${encodeURIComponent(id)}`;
}

export async function getActiveRecords(resource, signal) {
  const records = await request(`/${resource}`, { signal });
  if (!Array.isArray(records)) throw new Error("No fue posible consultar los datos.");
  return records.filter((item) => !item.deletedAt);
}

export async function getActiveRecord(resource, id, signal) {
  const item = await request(pathFor(resource, id), { signal });
  if (item.deletedAt) throw new ApiError("Este elemento está en la papelera.", 404);
  return item;
}

export const trashService = {
  async getAll(signal) {
    const groups = await Promise.all(resources.map(async (resource) => {
      const records = await request(`/${resource}`, { signal });
      return records.filter((item) => item.deletedAt).map((item) => ({ resource, item }));
    }));
    return groups.flat().sort((a, b) => new Date(b.item.deletedAt) - new Date(a.item.deletedAt));
  },
  move(resource, id, actor) {
    return mutateWithActivity(pathFor(resource, id), {
      method: "PATCH", body: { deletedAt: new Date().toISOString() },
    }, actor, resource, "delete");
  },
  async restore(resource, id, actor) {
    const path = pathFor(resource, id);
    const item = await request(path);
    if (!item.deletedAt) return item;
    if (resource === "news" && item.categoryId) {
      await getActiveRecord("categories", item.categoryId);
    }
    if (resource === "rundowns") {
      const news = await getActiveRecords("news");
      if (item.newsIds?.some((id) => !news.some((story) => String(story.id) === String(id)))) {
        throw new Error("Restaura primero las noticias de esta escaleta.");
      }
    }
    return mutateWithActivity(path, { method: "PATCH", body: { deletedAt: null } }, actor, resource, "restore");
  },
};
