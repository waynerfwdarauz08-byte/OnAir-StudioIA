import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  addMonthsToMonth,
  buildMonthlySnapshot,
  buildProjectionRequest,
  formatMonthLabel,
  getMonthKey,
  getPreviousMonth,
} from "../src/utils/projections.js";

assert.equal(getMonthKey("2026-10-01T03:00:00Z"), "2026-09");
assert.equal(getMonthKey("2026-10-01T06:00:00Z"), "2026-10");
assert.equal(getMonthKey("2026-10-01"), "2026-10");
assert.equal(getMonthKey("2026-02-30"), "");
assert.equal(getMonthKey("not-a-date"), "");
assert.equal(getPreviousMonth("2026-01"), "2025-12");
assert.equal(getPreviousMonth(""), "");
assert.equal(addMonthsToMonth("2026-10", 6), "2027-04");
assert.equal(addMonthsToMonth("2026-10", 36), "2029-10");
assert.equal(formatMonthLabel("2026-09", "en"), "September 2026");
assert.equal(formatMonthLabel("2026-09", "es"), "septiembre de 2026");

const records = {
  news: [
    { id: "previous", title: "Anterior", createdAt: "2026-08-15", editorialStatus: "draft" },
    { id: "one", title: "Noticia sin traducir", summary: "Contenido editorial original.", createdAt: "2026-09-01", updatedAt: "2026-10-01", categoryId: "local", editorialStatus: "approved", estimatedDurationSeconds: 45 },
    { id: "two", title: "Second record", sourceText: "Original source.", createdAt: "2026-09-01T15:00:00Z", categoryId: "local", editorialStatus: "review", estimatedDurationSeconds: 0 },
    { id: "three", title: "Otra noticia", createdAt: "2026-09-02", editorialStatus: "custom-state", estimatedDurationSeconds: null },
    { id: "undated", createdAt: "", updatedAt: "2026-09-10" },
  ],
  categories: [{ id: "local", name: "Nombre de categoría original" }],
  rundowns: [{ id: "rundown", broadcastDate: "2026-09-03", newsIds: ["one", "previous"] }],
  transmission: { onAir: true, rundownId: "rundown", updatedAt: "2026-10-01" },
};
const originalRecords = JSON.stringify(records);
const snapshot = buildMonthlySnapshot(records, "2026-09");
assert.equal(snapshot.statistics.totalNews, 3);
assert.equal(snapshot.statistics.activeDays, 2);
assert.equal(snapshot.statistics.editorialStatuses.approved, 1);
assert.equal(snapshot.statistics.editorialStatuses.unknown, 1);
assert.equal(snapshot.statistics.scheduledNews, 1);
assert.equal(snapshot.statistics.totalRundowns, 1);
assert.equal(snapshot.statistics.totalDurationSeconds, 45);
assert.equal(snapshot.statistics.recordsWithDuration, 1);
assert.equal(snapshot.previousPeriod.totalNews, 1);
assert.equal(snapshot.excludedUndatedNews, 1);
assert.equal(snapshot.limitedEvidence, false);
assert.equal(snapshot.transmission.historical, false);
assert.equal(JSON.stringify(records), originalRecords);

const englishRequest = buildProjectionRequest(snapshot, "en");
const spanishRequest = buildProjectionRequest(snapshot, "es");
const futureRequest = buildProjectionRequest(snapshot, "en", 12, "2026-10");
assert.deepEqual(futureRequest.forecast, { horizonMonths: 12, asOfMonth: "2026-10", targetMonth: "2027-10" });
assert.deepEqual(futureRequest.news, englishRequest.news);
assert.equal(englishRequest.language, "en");
assert.equal(spanishRequest.language, "es");
assert.deepEqual(englishRequest.news, spanishRequest.news);
assert.equal(englishRequest.news[0].title, "Noticia sin traducir");
assert.equal(englishRequest.news[0].editorialStatus, "approved");
assert.equal(englishRequest.statistics.categories[0].name, "Nombre de categoría original");
assert.equal(englishRequest.period.dateBasis, "createdAt");
assert.equal(englishRequest.coverage.currentTransmissionIsNotHistory, true);

const emptySnapshot = buildMonthlySnapshot(records, "2026-10");
assert.equal(emptySnapshot.news.length, 0);
assert.equal(emptySnapshot.limitedEvidence, true);
assert.equal(buildMonthlySnapshot(records, "").news.length, 0);
assert.equal(buildMonthlySnapshot({}, "2026-09").previousPeriod, null);

const largeSample = buildMonthlySnapshot({ news: Array.from({ length: 65 }, (ignored, index) => ({
  id: `record-${String(index).padStart(2, "0")}`,
  title: "T".repeat(300), summary: "S".repeat(1600),
  editorialStatus: "draft", createdAt: "2026-09-10",
})) }, "2026-09");
const boundedRequest = buildProjectionRequest(largeSample, "en");
assert.equal(boundedRequest.statistics.totalNews, 65);
assert.equal(boundedRequest.news.length, 60);
assert.equal(boundedRequest.coverage.omittedNews, 5);
assert.equal(boundedRequest.coverage.truncatedFields, 120);
assert.equal(boundedRequest.news[0].title.length, 240);
assert.equal(boundedRequest.news[0].summary.length, 1500);

const db = JSON.parse(await readFile(new URL("../db.json", import.meta.url), "utf8"));
const months = [...new Set(db.news.map((item) => getMonthKey(item.createdAt)).filter(Boolean))];
for (const month of months) {
  const actual = buildMonthlySnapshot({ ...db, transmission: db.transmissions?.current }, month);
  assert.equal(actual.statistics.totalNews, db.news.filter((item) => getMonthKey(item.createdAt) === month).length);
  assert.equal(actual.statistics.totalRundowns, db.rundowns.filter((item) => getMonthKey(item.broadcastDate) === month).length);
  assert.deepEqual(actual.news.map((item) => item.id).sort(), db.news.filter((item) => getMonthKey(item.createdAt) === month).map((item) => item.id).sort());
}

console.log("PASS: monthly data, empty states, ES/EN, unmodified editorial content, context limits, and current db.json.");
