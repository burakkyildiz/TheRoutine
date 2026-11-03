import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defaultRoutine, localDateKey, millisecondsUntilMidnight, parseRoutine,
  resetForDate, type RoutineData,
} from "../lib/routine.ts";

test("defaults are stable, ordered, and initially incomplete", () => {
  const data = defaultRoutine("2026-11-03");
  assert.deepEqual(data.items.map((item) => item.name), ["pray", "train", "eat", "study", "sleep", "repeat"]);
  assert.equal(new Set(data.items.map((item) => item.id)).size, 6);
  assert.ok(data.items.every((item) => !item.completed));
});

test("same-day reload preserves completions", () => {
  const data = defaultRoutine("2026-11-03");
  data.items[0].completed = true;
  const parsed = parseRoutine(JSON.stringify(data));
  assert.ok(parsed);
  assert.equal(resetForDate(parsed, "2026-11-03").items[0].completed, true);
  assert.equal(resetForDate(data, "2026-11-03"), data);
});

test("next day and several days away reset only completions", () => {
  const data: RoutineData = { version: 1, date: "2026-11-03", items: [
    { id: "custom-2", name: "read 20 pages", completed: true },
    { id: "default-pray", name: "pray & reflect", completed: false },
  ] };
  for (const date of ["2026-11-04", "2026-11-12", "2027-01-01"]) {
    const reset = resetForDate(data, date);
    assert.equal(reset.date, date);
    assert.deepEqual(reset.items, data.items.map((item) => ({ ...item, completed: false })));
    assert.equal(data.items[0].completed, true, "does not mutate the saved state");
  }
});

test("an intentionally empty routine survives saving, reload, and reset", () => {
  const empty: RoutineData = { version: 1, date: "2026-11-03", items: [] };
  const loaded = parseRoutine(JSON.stringify(empty));
  assert.ok(loaded);
  assert.deepEqual(resetForDate(loaded, "2026-11-05").items, []);
});

test("invalid saved data is rejected without throwing", () => {
  for (const raw of ["not json", "null", "[]", "{}", '{"version":2}',
    JSON.stringify({ ...defaultRoutine(), items: [null] }),
    JSON.stringify({ ...defaultRoutine(), items: [{ id: "x", name: " ", completed: false }] }),
    JSON.stringify({ ...defaultRoutine(), items: [{ id: "x", name: "read", completed: "yes" }] }),
    JSON.stringify({ ...defaultRoutine(), items: Array(2).fill({ id: "duplicate", name: "read", completed: false }) }),
  ]) assert.equal(parseRoutine(raw), null, raw);
});

test("local calendar day differs from UTC near midnight in Istanbul", () => {
  const previous = process.env.TZ;
  process.env.TZ = "Europe/Istanbul";
  try {
    assert.equal(localDateKey(new Date("2026-11-03T21:30:00Z")), "2026-11-04");
    assert.equal(millisecondsUntilMidnight(new Date("2026-11-03T20:59:59Z")), 1000);
    assert.equal(localDateKey(new Date("2026-12-31T21:00:00Z")), "2027-01-01");
  } finally { process.env.TZ = previous; }
});

test("midnight scheduling follows daylight-saving calendar days", () => {
  const previous = process.env.TZ;
  process.env.TZ = "America/New_York";
  try {
    assert.equal(millisecondsUntilMidnight(new Date("2026-03-08T00:00:00-05:00")), 23 * 60 * 60 * 1000);
    assert.equal(millisecondsUntilMidnight(new Date("2026-11-01T00:00:00-04:00")), 25 * 60 * 60 * 1000);
  } finally { process.env.TZ = previous; }
});
