import { mutateWithActivity } from "./editorialMutationService.js";
import { getActiveRecords, getActiveRecord, trashService } from "./trashService.js";

const RESOURCE = "/categories";

export const categoryService = {
  getAll(signal) {
    return getActiveRecords("categories", signal);
  },

  getById(id, signal) {
    return getActiveRecord("categories", id, signal);
  },

  create(category, actor) {
    return mutateWithActivity(RESOURCE, {
      method: "POST",
      body: category,
    }, actor, "categories", "create");
  },

  update(id, category, actor) {
    return mutateWithActivity(`${RESOURCE}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: category,
    }, actor, "categories", "update");
  },

  partialUpdate(id, changes, actor) {
    return mutateWithActivity(`${RESOURCE}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: changes,
    }, actor, "categories", "update");
  },

  async remove(id, actor) {
    const news = await getActiveRecords("news");
    if (news.some((item) => String(item.categoryId) === String(id))) {
      throw new Error("Esta categoría está en uso. Cambia primero la categoría de sus noticias.");
    }
    return trashService.move("categories", id, actor);
  },
};
