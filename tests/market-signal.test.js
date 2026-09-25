import test from "node:test";
import assert from "node:assert/strict";
import { assessMarketSignal } from "../src/domain/market-signal.js";

test("a capped class supports a commercial threshold below nine without summing classes", () => {
  const result = assessMarketSignal({
    threshold: 5,
    fareClasses: [
      { class: "Y", numberOfBookableSeats: 9 },
      { class: "B", numberOfBookableSeats: 9 },
    ],
  });
  assert.equal(result.commercialCount, 9);
  assert.equal(result.commercialCountCapped, true);
  assert.equal(result.commercialThreshold, "supported");
  assert.equal(result.probability, null);
});

test("a high fare is context, not proof of occupancy", () => {
  const result = assessMarketSignal({
    threshold: 5,
    fareClasses: [{ class: "Y", numberOfBookableSeats: 7 }],
    currentFare: 180,
    comparableFares: [90, 100, 110],
    previousCommercialCount: 8,
  });
  assert.equal(result.commercialThreshold, "supported");
  assert.equal(result.fareRatio, 1.8);
  assert.equal(result.inventoryTrend, -1);
  assert.equal(result.probability, null);
});

test("no GDS result is unknown rather than zero seats", () => {
  const result = assessMarketSignal({ threshold: 2 });
  assert.equal(result.commercialCount, null);
  assert.equal(result.commercialThreshold, "unknown");
});

test("bookable group checks can support the threshold independently", () => {
  const result = assessMarketSignal({
    threshold: 3,
    groupSizesBookable: [1, 2, 4],
  });
  assert.equal(result.commercialCount, 4);
  assert.equal(result.commercialThreshold, "supported");
});
