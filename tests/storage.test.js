import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultState, migrate, loadState, saveState, exportJson, importJson } from "../src/storage.js";

function memoryStore(seed) {
  const map = new Map(seed ? [["habitApp", seed]] : []);
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, v), _map: map };
}

test("defaultState tiene la forma esperada", () => {
  const s = defaultState();
  assert.equal(s.schemaVersion, 1);
  assert.ok(Array.isArray(s.habits) && s.habits.length >= 2);
  assert.deepEqual(s.checkins, {});
  assert.equal(s.settings.dayCutoffHour, 4);
});

test("loadState con store vacío devuelve defaults", () => {
  assert.equal(loadState(memoryStore()).schemaVersion, 1);
});

test("loadState con JSON inválido no lanza y devuelve defaults", () => {
  assert.equal(loadState(memoryStore("{ no json")).habits.length >= 2, true);
});

test("migrate con schemaVersion desconocido devuelve defaults", () => {
  assert.equal(migrate({ schemaVersion: 999 }).schemaVersion, 1);
});

test("round-trip export/import conserva el estado", () => {
  const s = defaultState();
  s.profile.totalXp = 123;
  const back = importJson(exportJson(s));
  assert.deepEqual(back, s);
});

test("saveState + loadState persisten", () => {
  const store = memoryStore();
  const s = defaultState();
  s.profile.coins = 7;
  saveState(store, s);
  assert.equal(loadState(store).profile.coins, 7);
});

test("importJson rechaza formas inválidas", () => {
  assert.throws(() => importJson('{"foo":1}'));
});

test("importJson rechaza una versión de esquema futura", () => {
  assert.throws(() =>
    importJson(JSON.stringify({ schemaVersion: 999, profile: {}, habits: [], checkins: {} })),
  );
});

test("loadState normaliza un v1 incompleto rellenando secciones desde defaults", () => {
  const raw = JSON.stringify({ schemaVersion: 1, profile: {}, habits: [], checkins: {} });
  const state = loadState(memoryStore(raw));
  assert.equal(Array.isArray(state.shop.catalog), true);
  assert.equal(Array.isArray(state.shop.redemptions), true);
  assert.equal(state.settings.dayCutoffHour, 4);
  assert.equal(typeof state.achievements, "object");
  assert.equal("quests" in state, true);
});
