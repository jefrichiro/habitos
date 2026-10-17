import { test } from "node:test";
import assert from "node:assert/strict";
import { applyCheckIn, applyUncheck, addHabit, archiveHabit, redeemReward, recompute } from "../src/state.js";
import { defaultState } from "../src/storage.js";

const NOW = new Date(2026, 9, 17, 10, 0);

test("check-in otorga XP y monedas y suma racha", () => {
  const s = defaultState();
  const id = s.habits[0].id;
  const { state, events } = applyCheckIn(s, id, NOW);
  assert.equal(events.xpGained, 10);
  assert.equal(events.coinsGained, 2);
  assert.equal(state.profile.totalXp, 10);
  assert.equal(state.profile.coins, 2);
  assert.equal(state.habits[0].streak, 1);
  assert.deepEqual(state.checkins["2026-10-17"], [id]);
});

test("check-in dos veces el mismo día lógico no duplica", () => {
  const s = defaultState();
  const id = s.habits[0].id;
  const once = applyCheckIn(s, id, NOW).state;
  const twice = applyCheckIn(once, id, NOW);
  assert.equal(twice.events.xpGained, 0);
  assert.equal(twice.state.profile.totalXp, 10);
  assert.equal(twice.state.habits[0].streak, 1);
});

test("uncheck revierte exactamente XP y monedas", () => {
  const s = defaultState();
  const id = s.habits[0].id;
  const checked = applyCheckIn(s, id, NOW).state;
  const { state } = applyUncheck(checked, id, NOW);
  assert.equal(state.profile.totalXp, 0);
  assert.equal(state.profile.coins, 0);
  assert.equal(state.habits[0].totalDone, 0);
  assert.deepEqual(state.checkins["2026-10-17"], []);
});

test("racha se reinicia si se salta un día", () => {
  const s = defaultState();
  const id = s.habits[0].id;
  const day1 = applyCheckIn(s, id, new Date(2026, 9, 15, 10, 0)).state;
  const day3 = applyCheckIn(day1, id, new Date(2026, 9, 17, 10, 0)).state;
  assert.equal(day3.habits[0].streak, 1);
  assert.equal(day3.habits[0].bestStreak, 1);
});

test("racha crece en días consecutivos y guarda bestStreak", () => {
  const s = defaultState();
  const id = s.habits[0].id;
  const d1 = applyCheckIn(s, id, new Date(2026, 9, 15, 10, 0)).state;
  const d2 = applyCheckIn(d1, id, new Date(2026, 9, 16, 10, 0)).state;
  assert.equal(d2.habits[0].streak, 2);
  assert.equal(d2.habits[0].bestStreak, 2);
});

test("addHabit y archiveHabit conservan historial", () => {
  const s = addHabit(defaultState(), { name: "Leer", icon: "📚", color: "#f00" });
  const nuevo = s.habits[s.habits.length - 1];
  assert.equal(nuevo.name, "Leer");
  const archived = archiveHabit(s, nuevo.id);
  assert.equal(archived.habits.find((h) => h.id === nuevo.id).archived, true);
});

test("redeemReward resta monedas y falla si no alcanzan", () => {
  let s = defaultState();
  const reward = s.shop.catalog[0];
  assert.equal(redeemReward(s, reward.id, NOW).ok, false);
  s = { ...s, profile: { ...s.profile, coins: 999 } };
  const res = redeemReward(s, reward.id, NOW);
  assert.equal(res.ok, true);
  assert.equal(res.state.profile.coins, 999 - reward.cost);
  assert.equal(res.state.shop.redemptions.length, 1);
});

test("no hay monedas negativas al canjear y luego desmarcar", () => {
  let s = defaultState();
  const id = s.habits[0].id;
  s = applyCheckIn(s, id, NOW).state;
  s = { ...s, profile: { ...s.profile, coins: 999 } };
  s = redeemReward(s, s.shop.catalog[0].id, NOW).state; // spent += cost
  s = applyUncheck(s, id, NOW).state;                   // recompute: earned - spent -> clamp
  assert.ok(s.profile.coins >= 0);
});

test("las monedas no cambian si añades un hábito después", () => {
  let s = defaultState();
  const now = new Date("2026-10-17T12:00:00");
  for (const h of s.habits) s = applyCheckIn(s, h.id, now).state;
  const coins = s.profile.coins; // 3 check-ins + bonus
  s = addHabit(s, { name: "Extra", icon: "📚", color: "#fff" });
  s = recompute(s);
  assert.equal(s.profile.coins, coins);
  assert.equal(s.questCoins["2026-10-17"] > 0, true);
});
