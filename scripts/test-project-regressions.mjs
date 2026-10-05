import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validCoordinates, estimateTrip } from "../src/utils/operationalMap.js";
import { weatherService } from "../src/services/weatherService.js";

const origin = { latitude: 9.93, longitude: -84.08 };
assert.equal(validCoordinates(origin), true);
assert.equal(validCoordinates({ latitude: "0", longitude: "180" }), true);
for (const value of [null, undefined, "", " ", true, false, [], {}, NaN, Infinity]) {
  assert.equal(validCoordinates({ ...origin, latitude: value }), false);
  assert.equal(validCoordinates({ ...origin, longitude: value }), false);
}
assert.equal(validCoordinates({ ...origin, latitude: 91 }), false);
assert.equal(validCoordinates({ ...origin, longitude: -181 }), false);
assert.equal(estimateTrip(origin, origin, 0), null);
assert.ok(Number.isFinite(estimateTrip(
  { latitude: 0, longitude: 0 }, { latitude: 0, longitude: 180 }
).minutes));

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
try {
  globalThis.fetch = async (url) => {
    const params = new URL(url).searchParams;
    assert.ok(params.get("current").split(",").includes("is_day"));
    return new Response(JSON.stringify({ current: { is_day: 0 } }), {
      headers: { "content-type": "application/json" },
    });
  };
  assert.equal((await weatherService.getCurrent()).isDay, 0);

  const source = await readFile(new URL("../src/services/activityService.js", import.meta.url), "utf8");
  const testSource = source
    .replace('import { request } from "./httpClient.js";', 'const request = () => {};')
    .replace('import { getRoleLabel } from "../utils/roles.js";', 'const getRoleLabel = (role) => role;')
    .replace("import.meta.env.VITE_N8N_ACTIVITY_WEBHOOK_URL", '"https://example.test/custom-activity"');
  const { activityService } = await import(`data:text/javascript,${encodeURIComponent(testSource)}`);
  globalThis.window = { setTimeout, clearTimeout };
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://example.test/custom-activity");
    assert.equal(options.method, "POST");
    assert.equal(JSON.parse(options.body).action, "test");
    return new Response('{"ok":true}');
  };
  assert.deepEqual(await activityService.sendToWorkflow({ action: "test" }), { ok: true });

  let loginPayload;
  globalThis.fetch = async (url, options) => {
    loginPayload = JSON.parse(options.body);
    return new Response('{"ok":true}');
  };
  await activityService.registerLogin({
    id: "test-user", name: "Usuario de prueba", role: "admin", password: "never-send",
  }, "Administrador");
  assert.equal(loginPayload.action, "login_success");
  assert.equal(loginPayload.module, "authentication");
  assert.equal(loginPayload.userId, "test-user");
  assert.equal(loginPayload.userEmail, "");
  assert.equal(loginPayload.role, "admin");
  assert.ok(loginPayload.eventId.startsWith("activity-"));
  assert.equal(loginPayload.durationSeconds, null);
  assert.equal(Object.hasOwn(loginPayload, "password"), false);

  let logoutPayload;
  globalThis.fetch = async (url, options) => {
    logoutPayload = JSON.parse(options.body);
    return new Response('{"ok":true}');
  };
  await activityService.registerLogout(
    { id: "test-user", name: "Usuario de prueba", role: "admin" },
    { sessionId: "session-test", sessionStartedAt: "2026-10-05T11:00:00.000Z", sessionEndedAt: "2026-10-05T11:00:32.000Z", durationSeconds: 32 },
  );
  assert.equal(logoutPayload.action, "logout");
  assert.equal(logoutPayload.sessionId, "session-test");
  assert.equal(logoutPayload.durationSeconds, 32);

  const workflow = JSON.parse(await readFile(new URL("../docs/activity-n8n.workflow.json", import.meta.url), "utf8"));
  assert.equal(workflow.nodes.length, 4);
  const webhook = workflow.nodes.find((node) => node.type === "n8n-nodes-base.webhook");
  const normalize = workflow.nodes.find((node) => node.type === "n8n-nodes-base.code");
  const save = workflow.nodes.find((node) => node.type === "n8n-nodes-base.httpRequest");
  const gmail = workflow.nodes.find((node) => node.type === "n8n-nodes-base.gmail");
  assert.equal(webhook.parameters.path, "onair-activity-log");
  assert.equal(webhook.parameters.responseMode, "lastNode");
  assert.match(normalize.parameters.jsCode, /login_success.*logout/s);
  assert.equal(save.parameters.method, "POST");
  assert.equal(save.parameters.url, "http://localhost:3001/activityLogs");
  const normalizedPayload = new Function("$input", normalize.parameters.jsCode)({
    first: () => ({ json: { body: loginPayload } }),
  })[0].json;
  const expression = save.parameters.jsonBody.slice(3, -2).trim();
  const savedPayload = new Function("$json", `return (${expression});`)(normalizedPayload);
  assert.deepEqual(savedPayload, normalizedPayload);
  assert.equal(normalizedPayload.userId, "test-user");
  assert.equal(normalizedPayload.action, "login_success");
  assert.equal(Object.hasOwn(normalizedPayload, "password"), false);
  assert.equal(gmail.parameters.sendTo, "DESTINATARIO@EJEMPLO.COM");
  assert.equal(gmail.parameters.emailType, "text");
  const emailExpression = gmail.parameters.message.slice(3, -2).trim();
  const emailBody = new Function("$", `return (${emailExpression});`)(
    () => ({ item: { json: normalizedPayload } }),
  );
  for (const fieldValue of [
    normalizedPayload.userName,
    normalizedPayload.userId,
    normalizedPayload.sessionId,
    normalizedPayload.sessionStartedAt,
    normalizedPayload.roleLabel,
    normalizedPayload.eventId,
  ].filter(Boolean)) {
    assert.ok(emailBody.includes(fieldValue), `Gmail message should include ${fieldValue}`);
  }
  assert.equal(workflow.connections[webhook.name].main[0][0].node, normalize.name);
  assert.equal(workflow.connections[normalize.name].main[0][0].node, save.name);
  assert.equal(workflow.connections[save.name].main[0][0].node, gmail.name);

  const originalWarn = console.warn;
  try {
    console.warn = () => {};
    globalThis.fetch = async () => { throw new Error("n8n offline"); };
    assert.equal(await activityService.registerLogin({ id: "test-user", name: "Test" }, "Administrador"), null);
  } finally {
    console.warn = originalWarn;
  }
} finally {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
}

console.log("PASS: map, weather, login/logout session events, JSON Server workflow payload, Gmail summary and non-blocking logging.");
