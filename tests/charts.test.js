import { test } from "node:test";
import assert from "node:assert/strict";
import { heatmapCells, monthStats, avatarSprite, AVATAR_PALETTES } from "../src/charts.js";

test("heatmapCells cuenta check-ins por fecha", () => {
  const cells = heatmapCells({ "2026-10-16": ["a", "b"], "2026-10-17": ["a"] }, 3, "2026-10-17");
  assert.equal(cells.length, 3);
  assert.equal(cells.at(-1).date, "2026-10-17");
  assert.equal(cells.at(-1).count, 1);
  assert.equal(cells.at(-1).level, 1);
  assert.equal(cells.at(-2).level, 2);
  assert.equal(cells.at(-3).level, 0);
});

test("heatmapCells satura el nivel en 4", () => {
  const cells = heatmapCells({ "2026-10-17": ["a", "b", "c", "d", "e"] }, 1, "2026-10-17");
  assert.equal(cells[0].level, 4);
});

test("monthStats calcula total y mejor racha de meses", () => {
  const stats = monthStats({ habits: [{ archived: false, bestStreak: 5 }], checkins: { "2026-10-01": ["a"], "2026-10-02": ["a"] } }, "2026-10-17");
  assert.equal(stats.bestStreak, 5);
  assert.ok(stats.total >= 2);
});

test("monthStats limita completionPct a 0..100", () => {
  const s = { habits: [], checkins: { "2026-10-01": ["a"], "2026-10-02": ["a"] } };
  const r = monthStats(s, "2026-10-17");
  assert.equal(r.completionPct, 12);
  assert.ok(r.completionPct >= 0 && r.completionPct <= 100);
});

test("avatarSprite devuelve SVG y varía por tier", () => {
  const a = avatarSprite(0);
  const b = avatarSprite(4);
  assert.ok(a.startsWith("<svg"));
  assert.ok(b.startsWith("<svg"));
  assert.notEqual(a, b);
  assert.equal(avatarSprite(99), avatarSprite(4));
  assert.equal(avatarSprite(-3), avatarSprite(0));
  assert.equal(AVATAR_PALETTES.length, 5);
});
