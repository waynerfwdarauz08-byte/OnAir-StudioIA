import { request } from "./httpClient.js";

const RESOURCE = "/rundowns";

export const rundownService = {
  getAll(signal) {
    return request(RESOURCE, {
      signal,
    });
  },

  getById(id, signal) {
    return request(
      `${RESOURCE}/${encodeURIComponent(id)}`,
      {
        signal,
      }
    );
  },

  create(rundown) {
    return request(RESOURCE, {
      method: "POST",
      body: rundown,
    });
  },

  update(id, rundown) {
    return request(
      `${RESOURCE}/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: rundown,
      }
    );
  },

  partialUpdate(id, changes) {
    return request(
      `${RESOURCE}/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: changes,
      }
    );
  },

  remove(id) {
    return request(
      `${RESOURCE}/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    );
  },
};