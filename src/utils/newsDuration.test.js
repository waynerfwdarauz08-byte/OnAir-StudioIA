import { expect, test } from "@jest/globals";
import { estimateScriptDuration } from "./news.js";
test("configured reading speed changes duration", () => {
  const script = Array(150).fill("palabra").join(" ");
  expect(estimateScriptDuration(script, 150)).toBe(60);
  expect(estimateScriptDuration(script, 100)).toBe(90);
});
test("counts line breaks and rounds up seconds", () => {
  expect(estimateScriptDuration(" Nombre\n fecha\t lugar ", 80)).toBe(3);
  expect(estimateScriptDuration(" \n ", 150)).toBe(0);
});
test.each([0, -1, NaN, Infinity])("invalid speed %s uses default", (rate) => {
  expect(estimateScriptDuration("una noticia breve", rate)).toBe(2);
});
