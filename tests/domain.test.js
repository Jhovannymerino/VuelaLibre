import test from "node:test";
import assert from "node:assert/strict";
import {
  compareFlights,
  dailySnapshots,
  isValidFlight,
  summarizeFlight,
} from "../src/domain/availability.js";
import { demoFlights } from "../src/data/demo.js";
import { readFlights, saveFlights } from "../src/data/storage.js";
test("sorts by latest reported count and keeps flight dates separate", () => {
  const sorted = compareFlights(demoFlights);
  assert.deepEqual(
    sorted.map((f) => f.count),
    [14, 6, 2],
  );
  assert.deepEqual(
    sorted.map((f) => f.id),
    ["demo-a", "demo-b", "demo-c"],
  );
  assert.equal(sorted[0].delta, -1);
});
test("daily view keeps the last observation of each UTC day", () => {
  const flight = {
    ...demoFlights[0],
    snapshots: [
      { at: "2026-09-21T09:00:00Z", count: 8, source: "manual" },
      { at: "2026-09-21T18:00:00Z", count: 7, source: "manual" },
      { at: "2026-09-22T08:00:00Z", count: 10, source: "manual" },
    ],
  };
  assert.deepEqual(
    dailySnapshots(flight).map((s) => s.count),
    [7, 10],
  );
  assert.equal(summarizeFlight(flight).delta, 3);
});
test("zero and growing availability remain valid; no observation remains unknown", () => {
  assert.equal(
    isValidFlight({
      ...demoFlights[0],
      snapshots: [{ at: "2026-09-24T10:00:00Z", count: 0, source: "manual" }],
    }),
    true,
  );
  assert.equal(
    summarizeFlight({ ...demoFlights[0], snapshots: [] }).count,
    null,
  );
  assert.equal(
    isValidFlight({
      ...demoFlights[0],
      snapshots: [{ at: "bad", count: -1, source: "manual" }],
    }),
    false,
  );
});
test("storage filters malformed records and handles browser errors", () => {
  const valid = { ...demoFlights[0], source: "manual" };
  assert.equal(
    readFlights({ getItem: () => JSON.stringify([valid, { id: "bad" }]) })
      .length,
    1,
  );
  assert.deepEqual(readFlights({ getItem: () => "{bad" }), []);
  assert.equal(
    saveFlights([valid], {
      setItem: () => {
        throw new Error("quota");
      },
    }),
    false,
  );
});
