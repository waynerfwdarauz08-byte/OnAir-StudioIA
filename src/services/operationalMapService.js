import { request } from "./httpClient.js";

export const operationalMapService = {
  getSettings(signal) { return request("/operationalMapSettings", { signal }); },
  getIncidents(signal) { return request("/reportingIncidents", { signal }); },
  updateSettings(id, changes) { return request(`/operationalMapSettings/${encodeURIComponent(id)}`, { method: "PATCH", body: changes }); },
  createIncident(incident) { return request("/reportingIncidents", { method: "POST", body: incident }); },
  updateIncident(id, changes) { return request(`/reportingIncidents/${encodeURIComponent(id)}`, { method: "PATCH", body: changes }); },
};
