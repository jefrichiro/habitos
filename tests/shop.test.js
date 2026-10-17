import { test } from "node:test";
import assert from "node:assert/strict";
import { canAfford, validateReward, redemptionHistory, formatShortDate } from "../src/ui/shop.js";
import { defaultState } from "../src/storage.js";

test("canAfford compara monedas con coste", () => {
  const s = defaultState();
  s.profile.coins = 5;
  assert.equal(canAfford(s, { cost: 5 }), true);
  assert.equal(canAfford(s, { cost: 6 }), false);
});

test("validateReward rechaza nombre vacío y coste inválido", () => {
  assert.equal(validateReward({ name: "  ", cost: "10" }).reason, "name_required");
  assert.equal(validateReward({ name: "Cine", cost: "0" }).reason, "cost_invalid");
  assert.equal(validateReward({ name: "Cine", cost: "abc" }).reason, "cost_invalid");
  assert.equal(validateReward({ name: "Cine", cost: "3.6" }).value.cost, 4);
  assert.equal(validateReward({ name: "Cine", cost: "10" }).value.icon.length > 0, true);
});

test("redemptionHistory resuelve y ordena descendente", () => {
  const s = defaultState();
  s.shop.redemptions = [
    { id: "a", date: "2026-10-01", cost: 20 },
    { id: "b", date: "2026-10-03", cost: 30 },
    { id: "missing", date: "2026-10-03", cost: 5 },
  ];
  const h = redemptionHistory(s);
  assert.equal(h.length, 3);
  assert.equal(h[0].date, "2026-10-03");
  assert.equal(h[0].name, "Recompensa");
  assert.equal(h[1].cost, 30);
  assert.equal(h[2].date, "2026-10-01");
});

test("redemptionHistory resuelve name/icon de un id real del catálogo", () => {
  const s = defaultState();
  const reward = s.shop.catalog[0];
  assert.ok(reward, "el catálogo por defecto debe tener al menos una recompensa");
  s.shop.redemptions = [{ id: reward.id, date: "2026-10-05", cost: reward.cost }];
  const h = redemptionHistory(s);
  assert.equal(h.length, 1);
  assert.equal(h[0].id, reward.id);
  assert.equal(h[0].name, reward.name);
  assert.equal(h[0].icon, reward.icon);
  assert.notEqual(h[0].name, "Recompensa");
  assert.notEqual(h[0].icon, "🎁");
});

test("formatShortDate convierte ISO y tolera basura", () => {
  assert.equal(formatShortDate("2026-10-03"), "03/10");
  assert.equal(formatShortDate("nope"), "nope");
});
