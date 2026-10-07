import assert from "node:assert/strict";
import fs from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { translateInterface } from "../src/utils/translations.js";

// Leaflet requiere un DOM; esta prueba verifica las etiquetas, no el mapa interactivo.
const leafletStub = { name: "interface-map-test", enforce: "pre", resolveId(id) { if (id === "virtual:interface-map-test") return "\0interface-map-test"; }, load(id) { if (id === "\0interface-map-test") return "export default {};"; } };
const server = await createServer({ configFile: false, resolve: { alias: [{ find: /^leaflet$/, replacement: "virtual:interface-map-test" }] }, plugins: [leafletStub, react()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: null }, appType: "custom" });
try {
  const { AccessibilityContext } = await server.ssrLoadModule("/src/context/AccessibilityContext.jsx");
  const { AuthContext } = await server.ssrLoadModule("/src/context/AuthContext.jsx");
  const { ThemeContext } = await server.ssrLoadModule("/src/context/ThemeContext.jsx");
  const { SystemSettingsContext } = await server.ssrLoadModule("/src/context/SystemSettingsContext.jsx");
  const user = { id: "test-user", name: "Editor", role: "admin", active: true };
  function render(Component, props = {}, language = "en") {
    return renderToStaticMarkup(React.createElement(AccessibilityContext.Provider, { value: { language, fontScale: 100, reduceMotion: false, speechRate: 1, colorVision: "standard", updatePreference() {} } },
      React.createElement(AuthContext.Provider, { value: { user, logout() {} } },
        React.createElement(ThemeContext.Provider, { value: { theme: "light", setTheme() {} } },
          React.createElement(SystemSettingsContext.Provider, { value: { channelName: "Test channel", wordsPerMinute: 150, applySettings() {} } },
            React.createElement(MemoryRouter, null, React.createElement(Component, props)))))));
  }
  const pages = [
    ["DashboardPage", "Overview"], ["NewsPage", "News"], ["AiEditorPage", "Assisted writing"],
    ["RundownsPage", "Rundowns"], ["OnAirPage", "On-air content"], ["BroadcastStudioPage", "Studio control"],
    ["TeleprompterPage", "Teleprompter"], ["MessagesPage", "Messaging"],
    ["OperationalMapPage", "Operations map"], ["ProjectionsPage", "Monthly projections"],
    ["ActivityLogsPage", "Activity"], ["UsersPage", "User management"], ["TrashPage", "Recycle bin"], ["SettingsPage", "Settings"],
  ];
  for (const [name, label] of pages) {
    const { default: Component } = await server.ssrLoadModule(`/src/pages/${name}.jsx`);
    const english = render(Component);
    assert.ok(english.toLowerCase().includes(label.toLowerCase()), `${name}: missing English heading ${label}`);
    assert.doesNotThrow(() => render(Component, {}, "es"), `${name}: Spanish render failed`);
  }
  const { default: UserForm } = await server.ssrLoadModule("/src/components/users/UserForm.jsx");
  const form = render(UserForm, { onSubmit() {}, onCancel() {} });
  assert.ok(form.includes("Full name") && form.includes("Password") && form.includes("Administrator"));
  assert.ok(!form.includes("Nombre completo") && !form.includes("Administrador"));
  const { default: RundownConsole } = await server.ssrLoadModule("/src/components/rundowns/RundownConsole.jsx");
  const story = { id: "n1", title: "Título editorial sin traducir", script: "Guion original en español", summary: "Resumen original", editorialStatus: "approved", estimatedDurationSeconds: 60 };
  const rundown = { id: "r1", name: "Edición original", broadcastDate: "2026-10-07", newsIds: ["n1"] };
  const consoleHtml = render(RundownConsole, { rundown, news: [story], categories: [], onUpdate() {} });
  assert.ok(consoleHtml.includes("RUNDOWN CONTROL") && consoleHtml.includes("Save changes"));
  assert.ok(consoleHtml.includes(story.title) && consoleHtml.includes(story.script), "Editorial content must remain unchanged");
  const { default: BroadcastSwitcher } = await server.ssrLoadModule("/src/components/broadcast/BroadcastSwitcher.jsx");
  const studio = render(BroadcastSwitcher, { sources: [{ id: "cam-1", name: "Estudio principal", code: "CAM1", image: "/test.jpg" }, { id: "cam-2", name: "Reportero en exteriores", code: "CAM2", image: "/test2.jpg" }], programSourceId: "cam-1", previewSourceId: "cam-2" });
  assert.ok(studio.includes("Main studio") && studio.includes("Field reporter") && studio.includes("TRANSITION TYPE"));
  const { default: ConfirmDialog } = await server.ssrLoadModule("/src/components/common/ConfirmDialog.jsx");
  const dialog = render(ConfirmDialog, { open: true, title: "Eliminar usuario", message: "¿Deseas eliminar a Ana? Esta acción no se puede deshacer.", confirmText: "Eliminar" });
  assert.ok(dialog.includes("Delete user") && dialog.includes("Delete Ana?"));
  assert.equal(translateInterface("Este usuario tiene un reportaje asignado en Mapa operativo. Reinicia el suceso antes de eliminarlo, desactivarlo o cambiar su función.", "en").includes("assigned report"), true);
  const sheets = ["global.css", "light-surfaces.css", "theme-fixes.css"].map((name) => fs.readFileSync(`src/styles/${name}`, "utf8"));
  assert.ok(sheets[1].includes('.weather-card') && sheets[1].includes('.presenter-recorder') && sheets[1].includes('.news-form .form-field'));
  assert.ok(sheets[2].includes('.teleprompter-workspace:not(.high-contrast)') && sheets[2].includes('--color-primary: #08758c'));
  console.log("PASS: 14 modules render in ES/EN; user roles, rundown content, studio controls and confirmations are localized; editorial content is preserved; light surfaces and teleprompter rules are present.");
} finally {
  await server.close();
}
