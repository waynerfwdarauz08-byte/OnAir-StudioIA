import { request } from "./httpClient.js";

const RESOURCE = "/activityLogs";

const WORKFLOW_URL =
  "/n8n/webhook/onair-activity-log";

export const activityService = {
  /*
   * Operaciones directas con JSON Server.
   */

  getAll(signal) {
    return request(RESOURCE, {
      signal,
    });
  },

  getByEventId(
    eventId,
    signal
  ) {
    return request(
      `${RESOURCE}?eventId=${encodeURIComponent(
        eventId
      )}`,
      {
        signal,
      }
    );
  },

  create(activity) {
    return request(RESOURCE, {
      method: "POST",
      body: activity,
    });
  },

  /*
   * Envía una actividad al segundo
   * workflow de n8n.
   */

  async sendToWorkflow(activity) {
    const controller =
      new AbortController();

    const timeoutId =
      window.setTimeout(() => {
        controller.abort();
      }, 4000);

    try {
      const response = await fetch(
        WORKFLOW_URL,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            activity
          ),
          signal: controller.signal,
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          responseText ||
            `Error ${response.status}`
        );
      }

      if (!responseText) {
        return null;
      }

      try {
        return JSON.parse(
          responseText
        );
      } catch {
        return responseText;
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  },

  /*
   * Registra el inicio de sesión.
   * Si n8n falla, no impide entrar.
   */

  async registerLogin(
    user,
    roleLabel
  ) {
    try {
      return await activityService
        .sendToWorkflow({
          action: "login_success",
          description: `${user.name} inició sesión como ${roleLabel}.`,
          userId: user.id,
          userName: user.name,
          module: "authentication",
        });
    } catch (error) {
      console.warn(
        "No se pudo registrar el inicio de sesión:",
        error.message
      );

      return null;
    }
  },
};