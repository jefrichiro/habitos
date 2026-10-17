import { test } from "node:test";
import assert from "node:assert/strict";
import { validateHabit, groupHabits, ICON_CHOICES, COLOR_CHOICES } from "../src/ui/habits.js";
import { defaultState } from "../src/storage.js";

test("validateHabit rechaza nombre vacío o solo espacios", () => {
  assert.equal(validateHabit({ name: "   ", icon: "📚", color: "#fff" }).ok, false);
  assert.equal(validateHabit({ name: "" }).reason, "name_required");
});

test("validateHabit recorta y rellena defaults", () => {
  const r = validateHabit({ name: "  Leer  " });
  assert.equal(r.ok, true);
  assert.equal(r.value.name, "Leer");
  assert.equal(r.value.icon, ICON_CHOICES[0]);
  assert.equal(r.value.color, COLOR_CHOICES[0]);
});

test("validateHabit trunca nombres largos y normaliza", () => {
  const r = validateHabit({ name: "x".repeat(80), icon: "  ", color: "" });
  assert.equal(r.value.name.length, 40);
  assert.equal(r.value.icon, ICON_CHOICES[0]);
});

test("groupHabits separa activos de archivados", () => {
  const s = defaultState();
  s.habits[0].archived = true;
  const g = groupHabits(s);
  assert.equal(g.archived.length, 1);
  assert.equal(g.active.every((h) => !h.archived), true);
  assert.equal(g.active.length + g.archived.length, s.habits.length);
});
