import { request } from "./httpClient.js";

const RESOURCE = "/categories";

export const categoryService = {
  getAll(signal) {
    return request(RESOURCE, { signal });
  },

  getById(id, signal) {
    return request(`${RESOURCE}/${encodeURIComponent(id)}`, {
      signal,
    });
  },

  create(category) {
    return request(RESOURCE, {
      method: "POST",
      body: category,
    });
  },

  update(id, category) {
    return request(`${RESOURCE}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: category,
    });
  },

  partialUpdate(id, changes) {
    return request(`${RESOURCE}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: changes,
    });
  },

  remove(id) {
    return request(`${RESOURCE}/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};