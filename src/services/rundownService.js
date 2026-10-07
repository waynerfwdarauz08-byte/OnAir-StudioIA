import { mutateWithActivity } from "./editorialMutationService.js";
import { request } from "./httpClient.js";
import { getActiveRecords, getActiveRecord, trashService } from "./trashService.js";

const RESOURCE = "/rundowns";

export const rundownService = {
  getAll(signal) {
    return getActiveRecords("rundowns", signal);
  },

  getById(id, signal) {
    return getActiveRecord("rundowns", id, signal);
  },

  create(rundown, actor) {
    return mutateWithActivity(RESOURCE, {
      method: "POST",
      body: rundown,
    }, actor, "rundowns", "create");
  },

  update(id, rundown, actor) {
    return mutateWithActivity(
      `${RESOURCE}/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: rundown,
      }
    , actor, "rundowns", "update");
  },

  partialUpdate(id, changes, actor) {
    return mutateWithActivity(
      `${RESOURCE}/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: changes,
      }
    , actor, "rundowns", "update");
  },

  async remove(id, actor) {
    const transmission = await request("/transmissions/current");
    if (String(transmission.rundownId) === String(id)) {
      throw new Error("Esta escaleta está seleccionada en Control al aire. Retírala de la transmisión primero.");
    }
    return trashService.move("rundowns", id, actor);
  },
};
