import { expect, test } from "@jest/globals";
import { getReadingContent } from "./teleprompter.js";

test("detects corrections even if updatedAt is unchanged", () => {
  const original = { title: "Title", script: "Old text", updatedAt: "same" };
  expect(getReadingContent(original)).not.toBe(getReadingContent({ ...original, script: "Corrected text" }));
});

test("ignores metadata and unused summaries but detects fallback and lower third changes", () => {
  const original = { title: "Title", script: "Text", summary: "Summary" };
  expect(getReadingContent(original)).toBe(getReadingContent({ ...original, updatedAt: "new", summary: "Other" }));
  expect(getReadingContent(original)).not.toBe(getReadingContent({ ...original, selectedLowerThird: "Correction" }));
  expect(getReadingContent({ summary: "Old" })).not.toBe(getReadingContent({ summary: "New" }));
});
