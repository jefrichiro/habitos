import { test } from "node:test";
import assert from "node:assert/strict";
import { xpForCheckin, cumulativeXpForLevel, levelFromXp, levelProgress, avatarTier, liveStreak } from "../src/game.js";

test("xpForCheckin añade bonus por racha, tope +15", () => {
  assert.equal(xpForCheckin(0), 10);
  assert.equal(xpForCheckin(6), 10);
  assert.equal(xpForCheckin(7), 15);
  assert.equal(xpForCheckin(14), 20);
  assert.equal(xpForCheckin(100), 25);
});

test("niveles según XP acumulada", () => {
  assert.equal(cumulativeXpForLevel(1), 0);
  assert.equal(cumulativeXpForLevel(2), 100);
  assert.equal(cumulativeXpForLevel(3), 300);
  assert.equal(levelFromXp(0), 1);
  assert.equal(levelFromXp(99), 1);
  assert.equal(levelFromXp(100), 2);
  assert.equal(levelFromXp(299), 2);
  assert.equal(levelFromXp(300), 3);
});

test("levelProgress reporta avance dentro del nivel", () => {
  assert.deepEqual(levelProgress(250), { level: 2, intoLevel: 150, levelSpan: 200, pct: 0.75 });
});

test("avatarTier mapea 5 tiers", () => {
  assert.equal(avatarTier(1), 0);
  assert.equal(avatarTier(5), 0);
  assert.equal(avatarTier(6), 1);
  assert.equal(avatarTier(26), 4);
  assert.equal(avatarTier(999), 4);
});

test("liveStreak caduca si no es hoy ni ayer", () => {
  assert.equal(liveStreak(5, "2026-10-17", "2026-10-17"), 5);
  assert.equal(liveStreak(5, "2026-10-16", "2026-10-17"), 5);
  assert.equal(liveStreak(5, "2026-10-15", "2026-10-17"), 0);
  assert.equal(liveStreak(5, null, "2026-10-17"), 0);
});
