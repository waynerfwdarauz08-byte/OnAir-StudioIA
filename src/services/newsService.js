import { request } from "./httpClient.js";

const RESOURCE = "/news";

export const newsService = {
  getAll(signal) {
    return request(RESOURCE, { signal });
  },

  getById(id, signal) {
    return request(`${RESOURCE}/${encodeURIComponent(id)}`, {
      signal,
    });
  },

  create(newsItem) {
    return request(RESOURCE, {
      method: "POST",
      body: newsItem,
    });
  },

  update(id, newsItem) {
    return request(`${RESOURCE}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: newsItem,
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