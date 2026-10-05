import { request } from "./httpClient.js";
import { getRoleLabel } from "../utils/roles.js";

const RESOURCE = "/activityLogs";
const WORKFLOW_URL =
  import.meta.env.VITE_N8N_ACTIVITY_WEBHOOK_URL ||
  "/n8n/webhook/onair-activity-log";

function createEventId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `activity-${crypto.randomUUID()}`;
  }

  return `activity-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createSessionEvent(user, action, description, roleLabel, session = {}) {
  return {
    eventId: createEventId(),
    action,
    description,
    userId: user.id,
    userName: user.name,
    userEmail: user.email || "",
    role: user.role || "",
    roleLabel,
    module: "authentication",
    sessionId: session.sessionId || "",
    sessionStartedAt: session.sessionStartedAt || "",
    sessionEndedAt: session.sessionEndedAt || null,
    durationSeconds: Number.isFinite(session.durationSeconds)
      ? session.durationSeconds
      : null,
    userAgent: session.userAgent || "",
    language: session.language || "",
    timeZone: session.timeZone || "",
    occurredAt: new Date().toISOString(),
  };
}

export const activityService = {
  getAll(signal) {
    return request(RESOURCE, { signal });
  },

  getByEventId(eventId, signal) {
    return request(
      `${RESOURCE}?eventId=${encodeURIComponent(eventId)}`,
      { signal }
    );
  },

  create(activity) {
    return request(RESOURCE, {
      method: "POST",
      body: activity,
    });
  },

  async sendToWorkflow(activity) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(WORKFLOW_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activity),
        signal: controller.signal,
      });
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(responseText || `Error ${response.status}`);
      }

      if (!responseText) return null;

      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  },

  async registerLogin(user, roleLabel, session) {
    try {
      return await activityService.sendToWorkflow(
        createSessionEvent(
          user,
          "login_success",
          `${user.name} inici\u00f3 sesi\u00f3n como ${roleLabel}.`,
          roleLabel,
          session
        )
      );
    } catch (error) {
      console.warn("No se pudo registrar el inicio de sesi\u00f3n:", error.message);
      return null;
    }
  },

  async registerLogout(user, session) {
    try {
      return await activityService.sendToWorkflow(
        createSessionEvent(
          user,
          "logout",
          `${user.name} cerr\u00f3 sesi\u00f3n.`,
          getRoleLabel(user.role),
          session
        )
      );
    } catch (error) {
      console.warn("No se pudo registrar el cierre de sesi\u00f3n:", error.message);
      return null;
    }
  },
};
