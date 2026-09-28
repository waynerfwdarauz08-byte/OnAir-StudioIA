import { request } from "./httpClient.js";

const RESOURCE = "/transmissions";
const CURRENT_TRANSMISSION_ID = "current";

export const transmissionService = {
  getCurrent(signal) {
    return request(
      `${RESOURCE}/${CURRENT_TRANSMISSION_ID}`,
      {
        signal,
      }
    );
  },

  updateCurrent(transmission) {
    return request(
      `${RESOURCE}/${CURRENT_TRANSMISSION_ID}`,
      {
        method: "PUT",
        body: {
          ...transmission,
          id: CURRENT_TRANSMISSION_ID,
        },
      }
    );
  },

  partialUpdateCurrent(changes) {
    return request(
      `${RESOURCE}/${CURRENT_TRANSMISSION_ID}`,
      {
        method: "PATCH",
        body: changes,
      }
    );
  },
};