import { test } from "node:test";
import assert from "node:assert/strict";
import { generateQuests, updateQuestProgress } from "../src/quests.js";

test("generateQuests es determinista y devuelve 3 misiones", () => {
  const a = generateQuests("2026-10-17");
  const b = generateQuests("2026-10-17");
  assert.deepEqual(a, b);
  assert.equal(a.items.length, 3);
  assert.equal(a.date, "2026-10-17");
});

test("generateQuests varía según la fecha", () => {
  const a = generateQuests("2026-10-17").items.map((i) => i.id).join(",");
  const b = generateQuests("2026-10-18").items.map((i) => i.id).join(",");
  assert.notEqual(a, b);
});

test("updateQuestProgress marca done al alcanzar el objetivo", () => {
  const q = { date: "2026-10-17", items: [{ id: "q3", type: "complete_n_habits", target: 3, desc: "Completa 3 hábitos", progress: 0, done: false, bonusXp: 15 }] };
  const state = { habits: [{ archived: false }, { archived: false }], checkins: { "2026-10-17": ["a", "b", "c"] } };
  const out = updateQuestProgress(q, state);
  assert.equal(out.items[0].progress, 3);
  assert.equal(out.items[0].done, true);
});
