import { test } from "node:test";
import assert from "node:assert/strict";
import { habitsForToday, xpFloatText, celebrationText } from "../src/ui/today.js";
import { defaultState } from "../src/storage.js";

test("habitsForToday excluye archivados", () => {
  const s = defaultState();
  s.habits[0].archived = true;
  assert.equal(habitsForToday(s).some((h) => h.id === s.habits[0].id), false);
  assert.equal(habitsForToday(s).length, s.habits.filter((h) => !h.archived).length);
});

test("xpFloatText formatea el XP", () => {
  assert.equal(xpFloatText(10), "+10 XP");
});

test("celebrationText combina nivel y logros", () => {
  const lines = celebrationText({ leveledUp: true, newLevel: 5, unlocked: ["first_step"] });
  assert.equal(lines[0], "¡NIVEL 5!");
  assert.ok(lines.some((l) => /Primer paso/.test(l)));
  assert.equal(celebrationText({ leveledUp: false, unlocked: [] }), null);
});
