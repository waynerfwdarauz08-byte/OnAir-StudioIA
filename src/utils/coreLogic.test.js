import { describe, expect, test } from "@jest/globals";
import {
  formatDuration,
  getEditorialStatusLabel,
} from "./news.js";
import {
  getDefaultRouteByRole,
  getRoleLabel,
  ROLES,
} from "./roles.js";
import {
  estimateTrip,
  validCoordinates,
} from "./operationalMap.js";
import {
  buildMonthlySnapshot,
  getMonthKey,
} from "./projections.js";

describe("editorial news helpers", () => {
  test("returns a label for each editorial status and a fallback for unknown values", () => {
    expect(getEditorialStatusLabel("review")).toBe("En revisión");
    expect(getEditorialStatusLabel("approved")).toBe("Aprobada");
    expect(getEditorialStatusLabel("unexpected")).toBe("Sin clasificar");
  });

  test("formats durations safely, including negative and non-numeric input", () => {
    expect(formatDuration(125)).toBe("2:05");
    expect(formatDuration(59.6)).toBe("1:00");
    expect(formatDuration(-10)).toBe("0:00");
    expect(formatDuration("not a number")).toBe("0:00");
  });
});

describe("role-based entry points", () => {
  test.each([
    [ROLES.ADMIN, "/dashboard"],
    [ROLES.MODERATOR, "/news"],
    [ROLES.PRESENTER, "/teleprompter"],
  ])("routes %s to its home page", (role, route) => {
    expect(getDefaultRouteByRole(role)).toBe(route);
  });

  test("uses safe fallbacks for an unknown role and language", () => {
    expect(getDefaultRouteByRole("unknown")).toBe("/login");
    expect(getRoleLabel("unknown", "fr")).toBe("Usuario");
  });
});

describe("operational map calculations", () => {
  const sanJose = { latitude: 9.9335, longitude: -84.0767 };

  test("accepts valid coordinates and rejects out-of-range or non-numeric values", () => {
    expect(validCoordinates(sanJose)).toBe(true);
    expect(validCoordinates({ latitude: "", longitude: -84 })).toBe(false);
    expect(validCoordinates({ latitude: 91, longitude: -84 })).toBe(false);
  });

  test("estimates a minimum five-minute trip and rejects invalid speed", () => {
    expect(estimateTrip(sanJose, sanJose, 50)).toEqual({
      straightKm: 0,
      roadKm: 0,
      minutes: 5,
    });
    expect(estimateTrip(sanJose, sanJose, 0)).toBeNull();
  });
});

describe("monthly projection source data", () => {
  test("groups timestamps by Costa Rica month", () => {
    expect(getMonthKey("2026-02-01T05:30:00.000Z")).toBe("2026-01");
    expect(getMonthKey("not a date")).toBe("");
  });

  test("aggregates only the selected month and computes editorial and rundown totals", () => {
    const news = [
      { id: "jan-1", createdAt: "2026-01-04T15:00:00Z", categoryId: "local", editorialStatus: "approved", estimatedDurationSeconds: 30 },
      { id: "jan-2", createdAt: "2026-01-05T15:00:00Z", categoryId: "local", editorialStatus: "review", estimatedDurationSeconds: 45 },
      { id: "jan-3", createdAt: "2026-01-05T18:00:00Z", categoryId: "world", editorialStatus: "unknown", estimatedDurationSeconds: null },
      { id: "dec-1", createdAt: "2025-12-10T15:00:00Z", categoryId: "local", editorialStatus: "approved", estimatedDurationSeconds: 20 },
      { id: "undated", createdAt: "invalid", editorialStatus: "draft" },
    ];
    const snapshot = buildMonthlySnapshot({
      news,
      categories: [
        { id: "local", name: "Local" },
        { id: "world", name: "Mundo" },
      ],
      rundowns: [
        { id: "rd-jan", broadcastDate: "2026-01-20", newsIds: ["jan-1", "dec-1"] },
        { id: "rd-dec", broadcastDate: "2025-12-20", newsIds: ["dec-1"] },
      ],
    }, "2026-01");

    expect(snapshot.news.map((item) => item.id)).toEqual(["jan-1", "jan-2", "jan-3"]);
    expect(snapshot.statistics).toMatchObject({
      totalNews: 3,
      activeDays: 2,
      totalRundowns: 1,
      scheduledNews: 1,
      totalDurationSeconds: 75,
      recordsWithDuration: 2,
    });
    expect(snapshot.statistics.editorialStatuses).toMatchObject({
      approved: 1,
      review: 1,
      unknown: 1,
    });
    expect(snapshot.previousPeriod).toEqual({ month: "2025-12", totalNews: 1 });
    expect(snapshot.excludedUndatedNews).toBe(1);
  });
});
