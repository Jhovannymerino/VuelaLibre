import test from "node:test";
import assert from "node:assert/strict";
import { analyze, groupsOf, recommendations } from "../src/domain/analysis.js";
import { makeSeats } from "../src/data/demo.js";
import { readStore, saveStore } from "../src/data/storage.js";

test("groups never cross an aisle or a row; blocked and occupied break groups", () => {
  const seats = makeSeats();
  const groups = groupsOf(seats, 3);
  assert.ok(groups.some((g) => g.map((s) => s.id).join() === "12A,12B,12C"));
  for (const group of groupsOf(seats)) {
    assert.equal(new Set(group.map((s) => s.row)).size, 1);
    assert.equal(new Set(group.map((s) => s.block)).size, 1);
    assert.ok(group.every((s) => ["available", "premium"].includes(s.status)));
  }
  assert.equal(
    groupsOf(seats.filter((s) => s.id === "6C" || s.id === "7D")).length,
    0,
  );
});
test("apparent load excludes blocked and unknown; no denominator produces no estimate", () => {
  const seats = makeSeats()
    .slice(0, 4)
    .map((s, i) => ({
      ...s,
      status: ["occupied", "available", "blocked", "unknown"][i],
    }));
  assert.equal(analyze(seats).estimatedLoadPct, 50);
  assert.equal(analyze(seats).seatVisibilityRatio, 75);
  assert.equal(analyze([]).estimatedLoadPct, null);
  assert.equal(analyze([]).buyNowSignal, "watch");
  assert.equal(
    analyze(seats.map((s) => ({ ...s, status: "blocked" }))).estimatedLoadPct,
    null,
  );
});
test("signals react to the cabin and low confidence suppresses buying urgency", () => {
  assert.equal(analyze(makeSeats()).buyNowSignal, "buy");
  assert.equal(analyze(makeSeats("business")).buyNowSignal, "wait");
  assert.equal(analyze(makeSeats("economy", true)).buyNowSignal, "watch");
  for (const cabin of ["economy", "business"]) {
    const m = analyze(makeSeats(cabin));
    for (const key of [
      "estimatedLoadPct",
      "seatVisibilityRatio",
      "seatOpportunityScore",
      "seatsTogetherProbability",
      "windowAvailabilityRatio",
      "aisleAvailabilityRatio",
    ])
      assert.ok(m[key] >= 0 && m[key] <= 100, key);
  }
});
test("recommendations contain available seats and honor preference categories", () => {
  const results = recommendations(makeSeats());
  assert.equal(results[1][1].type, "Ventana");
  assert.equal(results[2][1].type, "Pasillo");
  assert.ok(
    results.every(([, s]) => ["available", "premium"].includes(s.status)),
  );
  assert.ok(recommendations([]).every(([, s]) => s === undefined));
});
test("storage recovers from invalid content and reports write failure", () => {
  assert.deepEqual(readStore({ getItem: () => "{bad" }), {
    saved: false,
    alerts: [],
    preference: "Ventana",
  });
  assert.equal(
    readStore({
      getItem: () =>
        JSON.stringify({
          alerts: [{ id: "x", type: "bogus", cabin: "economy" }],
        }),
    }).alerts.length,
    0,
  );
  assert.equal(
    saveStore(
      {},
      {
        setItem: () => {
          throw new Error("quota");
        },
      },
    ),
    false,
  );
});
