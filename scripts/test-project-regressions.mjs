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
  assert.equal(Object.hasOwn(loginPayload, "password"), false);

  const workflow = JSON.parse(await readFile(new URL("../docs/activity-n8n.workflow.json", import.meta.url), "utf8"));
  assert.equal(workflow.nodes.length, 2);
  const webhook = workflow.nodes.find((node) => node.type === "n8n-nodes-base.webhook");
  const save = workflow.nodes.find((node) => node.type === "n8n-nodes-base.httpRequest");
  assert.equal(webhook.parameters.path, "onair-activity-log");
  assert.equal(webhook.parameters.responseMode, "lastNode");
  assert.equal(save.parameters.method, "POST");
  assert.equal(save.parameters.url, "http://localhost:3001/activityLogs");
  const expression = save.parameters.jsonBody.slice(3, -2).trim();
  const savedPayload = new Function("$json", "$now", `return (${expression});`)(
    { body: { ...loginPayload, password: "never-send" } },
    { toISO: () => "2026-10-05T12:00:00.000Z" },
  );
  assert.deepEqual(savedPayload, { ...loginPayload, createdAt: "2026-10-05T12:00:00.000Z" });
  assert.equal(workflow.connections[webhook.name].main[0][0].node, save.name);

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

console.log("PASS: map validation, weather, activity webhook, two-node workflow payload and non-blocking login logging.");
