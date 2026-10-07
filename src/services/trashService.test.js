import { beforeEach, expect, jest, test } from "@jest/globals";

const request = jest.fn();
jest.unstable_mockModule("./httpClient.js", () => ({ request, ApiError: Error }));
const { newsService } = await import("./newsService.js");
const { rundownService } = await import("./rundownService.js");
const { trashService } = await import("./trashService.js");
beforeEach(() => request.mockReset());

test("blocks deletion of a news item referenced by a rundown, without writes", async () => {
  request.mockResolvedValue([{ id: "r1", newsIds: ["n1"] }]);
  await expect(newsService.remove("n1")).rejects.toMatchObject({ code: "news-in-rundown" });
  expect(request).toHaveBeenCalledTimes(1);
});

test("moves unused news to trash with PATCH, preserving its content", async () => {
  request.mockResolvedValueOnce([{ id: "r1", newsIds: ["n1"], deletedAt: "2026-10-07" }])
    .mockResolvedValueOnce({ newsId: null }).mockResolvedValueOnce({});
  await newsService.remove("n1");
  expect(request).toHaveBeenLastCalledWith("/news/n1", {
    method: "PATCH", body: { deletedAt: expect.any(String) },
  });
});

test("does not delete anything when reference checking fails", async () => {
  request.mockRejectedValueOnce(new Error("offline"));
  await expect(newsService.remove("n1")).rejects.toThrow("offline");
  expect(request).toHaveBeenCalledTimes(1);
});

test("active lists exclude trash", async () => {
  request.mockResolvedValue([{ id: "n1" }, { id: "n2", deletedAt: "2026-10-07" }]);
  await expect(newsService.getAll()).resolves.toEqual([{ id: "n1" }]);
});

test("active rundown cannot be moved to trash", async () => {
  request.mockResolvedValueOnce({ rundownId: "r1" });
  await expect(rundownService.remove("r1")).rejects.toThrow("Control al aire");
  expect(request).toHaveBeenCalledTimes(1);
});

test("restoration preserves the original ID and data", async () => {
  request.mockResolvedValueOnce({ id: "n1", title: "Original", deletedAt: "2026-10-07" }).mockResolvedValueOnce({});
  await trashService.restore("news", "n1");
  expect(request).toHaveBeenLastCalledWith("/news/n1", { method: "PATCH", body: { deletedAt: null } });
});

test("rundown restoration requires all its news to be active", async () => {
  request.mockResolvedValueOnce({ id: "r1", newsIds: ["n1"], deletedAt: "2026-10-07" })
    .mockResolvedValueOnce([{ id: "n1", deletedAt: "2026-10-07" }]);
  await expect(trashService.restore("rundowns", "r1")).rejects.toThrow("Restaura primero");
  expect(request).toHaveBeenCalledTimes(2);
});
