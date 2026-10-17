import { test } from "node:test";
import assert from "node:assert/strict";
import { logicalDate, addDays, daysBetween, isNextDay } from "../src/dates.js";

test("logicalDate usa el corte de las 4:00", () => {
  assert.equal(logicalDate(new Date(2026, 9, 17, 1, 30), 4), "2026-10-16");
  assert.equal(logicalDate(new Date(2026, 9, 17, 4, 0), 4), "2026-10-17");
  assert.equal(logicalDate(new Date(2026, 9, 17, 23, 0), 4), "2026-10-17");
});

test("addDays cruza meses y años", () => {
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("daysBetween e isNextDay", () => {
  assert.equal(daysBetween("2026-10-16", "2026-10-17"), 1);
  assert.equal(daysBetween("2026-10-16", "2026-10-18"), 2);
  assert.equal(isNextDay("2026-10-16", "2026-10-17"), true);
  assert.equal(isNextDay("2026-10-16", "2026-10-18"), false);
});
