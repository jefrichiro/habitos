import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate, achievementCtx, globalStreak } from "../src/achievements.js";

const base = {
  schemaVersion: 1,
  profile: { totalXp: 0, coins: 0 },
  habits: [{ id: "a", streak: 0, bestStreak: 0, totalDone: 0, archived: false }],
  checkins: {},
  achievements: {},
  settings: { dayCutoffHour: 4, defaultHabitXp: 10 },
};

test("achievementCtx deriva contadores", () => {
  const ctx = achievementCtx({ ...base, checkins: { "2026-10-16": ["a", "b"], "2026-10-17": ["a"] } });
  assert.equal(ctx.totalCheckins, 3);
});

test("globalStreak cuenta días consecutivos hasta la última fecha", () => {
  const ctx = achievementCtx({ ...base, checkins: { "2026-10-15": ["a"], "2026-10-16": ["a"], "2026-10-17": ["a"] } });
  assert.equal(ctx.globalStreak, 3);
});

test("globalStreak se pone a 0 si la última fecha no es hoy ni ayer", () => {
  const checkins = { "2026-10-01": ["a"], "2026-10-02": ["a"] };
  assert.equal(globalStreak(checkins, "2026-10-17"), 0);
  assert.equal(globalStreak(checkins, "2026-10-02"), 2);
  assert.equal(globalStreak(checkins), 2);
});

test("evaluate devuelve logros recién cumplidos y no repite los ya desbloqueados", () => {
  const checkins = {};
  for (let i = 10; i <= 16; i++) checkins[`2026-10-${i}`] = ["a"];
  const state = { ...base, checkins };
  const first = evaluate(state);
  assert.ok(first.includes("global_streak_7"));
  assert.ok(first.includes("first_step"));
  const withUnlocked = { ...state, achievements: Object.fromEntries(first.map((id) => [id, { unlockedAt: "2026-10-17" }])) };
  assert.deepEqual(evaluate(withUnlocked), []);
});

test("evaluate incluye logro de nivel", () => {
  const state = { ...base, profile: { totalXp: 100, coins: 0 } };
  const ids = evaluate(state);
  assert.ok(ids.includes("level_2"));
});
