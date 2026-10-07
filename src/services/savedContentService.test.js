import { beforeEach, afterEach, expect, jest, test } from "@jest/globals";
const request = jest.fn();
jest.unstable_mockModule("./httpClient.js", () => ({ request }));
const { savedContentService } = await import("./savedContentService.js");
const originalStorage = globalThis.localStorage;
const values = new Map();
beforeEach(() => {
  request.mockReset(); values.clear();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
});
afterEach(() => {
  if (originalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalStorage;
});
const item = { id: "p1", createdAt: "2026-10-07", result: { summary: "Saved analysis" } };

test("saves generated results in JSON Server and removes the recovery copy", async () => {
  request.mockRejectedValueOnce({ status: 404 }).mockResolvedValueOnce(item);
  await savedContentService.saveProjection(item);
  expect(request).toHaveBeenLastCalledWith("/projectionHistory", { method: "POST", body: item });
  expect(JSON.parse(values.get("onair-pending-projections"))).toEqual([]);
});
test("retains the result after network failure so it can be recovered on return", async () => {
  request.mockRejectedValue(new Error("offline"));
  await expect(savedContentService.saveProjection(item)).rejects.toThrow("offline");
  await expect(savedContentService.projections()).resolves.toEqual([{ ...item, pending: true }]);
});
test("retry does not duplicate a result that was saved before a lost response", async () => {
  request.mockResolvedValueOnce(item);
  await savedContentService.saveProjection(item);
  expect(request).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledWith("/projectionHistory/p1");
});
