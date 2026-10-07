import { request } from "./httpClient.js";
import { validatePresenterRemoval } from "./editorialGuards.js";

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

  async update(id, user) {
    if (!user.active || user.role !== "presenter") await validatePresenterRemoval(id);
    return request(`${RESOURCE}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: user,
    });
  },

  async partialUpdate(id, changes) {
    if (changes.active === false || (changes.role && changes.role !== "presenter")) await validatePresenterRemoval(id);
    return request(`${RESOURCE}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: changes,
    });
  },

  async remove(id) {
    await validatePresenterRemoval(id);
    return request(`${RESOURCE}/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};
