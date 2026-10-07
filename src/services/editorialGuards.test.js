import { beforeEach, expect, jest, test } from "@jest/globals";
const request = jest.fn();
jest.unstable_mockModule("./httpClient.js", () => ({ request, ApiError: Error }));
const { transmissionService } = await import("./transmissionService.js");
const { userService } = await import("./userService.js");
const { newsService } = await import("./newsService.js");
const { mutateWithActivity } = await import("./editorialMutationService.js");
beforeEach(() => request.mockReset());
function broadcastData(editorialStatus = "approved", deletedAt = null) {
  request.mockResolvedValueOnce({ onAir: true, rundownId: "r1", newsId: "n1" })
    .mockResolvedValueOnce({ id: "r1", newsIds: ["n1"] })
    .mockResolvedValueOnce([{ id: "n1", title: "Noticia", editorialStatus, deletedAt }]);
}
test.each(["draft", "review", "correction"])("blocks transmission of %s without writing", async (editorialStatus) => {
  broadcastData(editorialStatus);
  await expect(transmissionService.partialUpdateCurrent({ newsId: "n1" })).rejects.toThrow("aprobada");
  expect(request.mock.calls.every(([, options]) => !options?.method)).toBe(true);
});
test("blocks deleted news even if approved", async () => {
  broadcastData("approved", "2026-10-07");
  await expect(transmissionService.partialUpdateCurrent({ onAir: true })).rejects.toThrow("aprobada");
});
test("valid start writes after checking current records", async () => {
  broadcastData(); request.mockResolvedValueOnce({ onAir: true });
  await transmissionService.partialUpdateCurrent({ onAir: true });
  expect(request).toHaveBeenLastCalledWith("/transmissions/current", { method: "PATCH", body: { onAir: true } });
});
test("checks every story when starting, including later draft", async () => {
  request.mockResolvedValueOnce({}).mockResolvedValueOnce({ newsIds: ["n1", "n2"] })
    .mockResolvedValueOnce([{ id: "n1", editorialStatus: "approved" }, { id: "n2", editorialStatus: "draft" }]);
  await expect(transmissionService.partialUpdateCurrent({ onAir: true, rundownId: "r1", newsId: "n1" })).rejects.toThrow("aprobada");
});
test("stop remains available without editorial lookups", async () => {
  request.mockResolvedValue({ onAir: false });
  await transmissionService.partialUpdateCurrent({ onAir: false });
  expect(request).toHaveBeenCalledTimes(1);
});
test("cannot remove approval from current live news", async () => {
  request.mockResolvedValueOnce({ onAir: true, newsId: "n1" });
  await expect(newsService.partialUpdate("n1", { editorialStatus: "draft" })).rejects.toThrow("está al aire");
  expect(request).toHaveBeenCalledTimes(1);
});
test.each(["remove", "update", "partialUpdate"])("%s blocks an assigned presenter", async (method) => {
  request.mockResolvedValueOnce([{ presenterId: "u1" }]);
  await expect(userService[method]("u1", { active: false, role: "moderator" })).rejects.toThrow("reportaje asignado");
  expect(request).toHaveBeenCalledTimes(1);
});
test("free presenter can be deleted", async () => {
  request.mockResolvedValueOnce([]).mockResolvedValueOnce({});
  await userService.remove("u1");
  expect(request).toHaveBeenLastCalledWith("/users/u1", { method: "DELETE" });
});
test("failed assignment lookup cannot permit deletion", async () => {
  request.mockRejectedValueOnce(new Error("offline"));
  await expect(userService.remove("u1")).rejects.toThrow("offline");
  expect(request).toHaveBeenCalledTimes(1);
});
test("successful mutation records actor and target without storing content", async () => {
  request.mockResolvedValueOnce({ id: "n1", title: "Noticia", script: "privado" }).mockResolvedValueOnce({});
  await mutateWithActivity("/news", { method: "POST", body: {} }, { id: "u1", name: "Editor" }, "news", "create");
  expect(request).toHaveBeenLastCalledWith("/activityLogs", { method: "POST", body: expect.objectContaining({ userId: "u1", targetId: "n1", module: "news", action: "create" }) });
  expect(request.mock.calls[1][1].body.script).toBeUndefined();
});
test("audit failure does not report the completed save as failed", async () => {
  request.mockResolvedValueOnce({ id: "n1" }).mockRejectedValueOnce(new Error("offline"));
  await expect(mutateWithActivity("/news", {}, { id: "u1" }, "news", "create")).resolves.toEqual({ id: "n1" });
});
test("failed mutation creates no misleading history", async () => {
  request.mockRejectedValueOnce(new Error("offline"));
  await expect(mutateWithActivity("/news", {}, { id: "u1" }, "news", "create")).rejects.toThrow("offline");
  expect(request).toHaveBeenCalledTimes(1);
});
