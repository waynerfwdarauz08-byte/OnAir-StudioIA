import { request } from "./httpClient.js";
import { validateTransmission } from "./editorialGuards.js";

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

  async updateCurrent(transmission) {
    await validateTransmission(transmission);
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

  async partialUpdateCurrent(changes) {
    await validateTransmission(changes);
    return request(
      `${RESOURCE}/${CURRENT_TRANSMISSION_ID}`,
      {
        method: "PATCH",
        body: changes,
      }
    );
  },
};
