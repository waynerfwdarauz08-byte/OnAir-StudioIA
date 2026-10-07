import { expect, test } from "@jest/globals";
import { interfaceTranslations, translateInterface } from "./translations.js";

test("interface labels switch in both directions", () => {
  expect(translateInterface("Gestión de usuarios", "en")).toBe("User management");
  expect(translateInterface("User management", "es")).toBe("Gestión de usuarios");
});
test("stored feedback follows the current language", () => {
  const feedback = "La escaleta fue creada correctamente.";
  const english = translateInterface(feedback, "en");
  expect(english).toBe("Rundown created successfully.");
  expect(translateInterface(english, "es")).toBe(feedback);
});
test("dynamic confirmations preserve user names", () => {
  expect(translateInterface("¿Deseas eliminar a María? Esta acción no se puede deshacer.", "en"))
    .toBe("Delete María? This action cannot be undone.");
  expect(translateInterface("Subir {0}", "en", { 0: "Nombre original" })).toBe("Move Nombre original up");
});
test("dynamic service errors translate without changing the news title", () => {
  const message = "No se puede transmitir: Investigación nacional debe estar aprobada y fuera de la papelera.";
  expect(translateInterface(message, "en")).toBe("Cannot broadcast: Investigación nacional must be approved and outside the recycle bin.");
});
test("unknown text and non-string values are preserved", () => {
  expect(translateInterface("Guion original redactado por el usuario", "en")).toBe("Guion original redactado por el usuario");
  expect(translateInterface(null, "en")).toBeNull();
  expect(translateInterface(42, "en")).toBe(42);
});
test("every translated template retains its interpolation keys", () => {
  for (const [es, en] of Object.entries(interfaceTranslations)) {
    const keys = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    expect(keys(en)).toEqual(keys(es));
  }
});
