import { request } from "./httpClient.js";

const RESOURCE = "/messages";

export const messageService = {
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

  create(message) {
    return request(RESOURCE, {
      method: "POST",
      body: message,
    });
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