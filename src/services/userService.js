import { request } from "./httpClient.js";

const RESOURCE = "/users";

export const userService = {
  getAll(signal) {
    return request(RESOURCE, { signal });
  },

  getById(id, signal) {
    return request(`${RESOURCE}/${encodeURIComponent(id)}`, {
      signal,
    });
  },

  getByEmail(email, signal) {
    const normalizedEmail = email.trim().toLowerCase();

    return request(
      `${RESOURCE}?email=${encodeURIComponent(normalizedEmail)}`,
      { signal }
    );
  },

  create(user) {
    return request(RESOURCE, {
      method: "POST",
      body: user,
    });
  },

  update(id, user) {
    return request(`${RESOURCE}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: user,
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