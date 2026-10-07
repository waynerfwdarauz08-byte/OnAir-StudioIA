import { request } from "./httpClient.js";

const PENDING_KEY = "onair-pending-projections";
function readPending() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); }
  catch { return []; }
}
async function saveUnique(resource, item) {
  try {
    const existing = await request(`/${resource}/${encodeURIComponent(item.id)}`);
    return existing;
  } catch (error) {
    if (error.status !== 404) throw error;
    return request(`/${resource}`, { method: "POST", body: item });
  }
}

export const savedContentService = {
  async projections(signal) {
    const pending = readPending().map((item) => ({ ...item, pending: true }));
    let saved;
    try { saved = await request("/projectionHistory", { signal }); }
    catch (error) {
      if (error.name === "AbortError" || !pending.length) throw error;
      return pending;
    }
    return [...saved, ...pending.filter((item) => !saved.some((entry) => entry.id === item.id))];
  },
  async saveProjection(item) {
    const pending = readPending().filter((entry) => entry.id !== item.id);
    // Copia de recuperación antes de esperar a JSON Server.
    localStorage.setItem(PENDING_KEY, JSON.stringify([...pending, item]));
    const saved = await saveUnique("projectionHistory", item);
    localStorage.setItem(PENDING_KEY, JSON.stringify(readPending().filter((entry) => entry.id !== item.id)));
    return saved;
  },
};
