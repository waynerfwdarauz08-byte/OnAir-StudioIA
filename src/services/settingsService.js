import { request } from "./httpClient.js";

const GLOBAL_SETTINGS = "/settings/global";

export const settingsService = {
  get(signal) {
    return request(GLOBAL_SETTINGS, { signal });
  },

  update(changes) {
    return request(GLOBAL_SETTINGS, {
      method: "PATCH",
      body: {
        ...changes,
        updatedAt: new Date().toISOString(),
      },
    });
  },
};