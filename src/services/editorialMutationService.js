import { request } from "./httpClient.js";

export async function mutateWithActivity(path, options, actor, module, action) {
  const saved = await request(path, options);
  if (!actor?.id) return saved;
  const verbs = { create: "Creó", update: "Actualizó", delete: "Envió a la papelera", restore: "Restauró" };
  try {
    await request("/activityLogs", { method: "POST", body: {
      id: `activity-${crypto.randomUUID()}`, eventId: crypto.randomUUID(),
      userId: actor.id, userName: actor.name, userRole: actor.role,
      action, module, targetId: saved.id,
      description: `${verbs[action]}: ${saved.title || saved.name || saved.id}.`,
      createdAt: new Date().toISOString(),
    } });
  } catch {
    // La operación principal ya se guardó; no inducir al usuario a duplicarla.
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("onair:audit-error"));
  }
  return saved;
}
