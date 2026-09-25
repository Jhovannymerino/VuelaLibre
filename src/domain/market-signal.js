/**
 * Interprets commercial inventory, not physical seats or staff boarding rights.
 * An Amadeus class counter of 9 means 9 or more. Fare classes are never added.
 */
export function assessMarketSignal({
  threshold,
  fareClasses = [],
  groupSizesBookable = [],
  currentFare = null,
  comparableFares = [],
  previousCommercialCount = null,
}) {
  if (!Number.isInteger(threshold) || threshold < 0) {
    throw new RangeError("threshold must be a non-negative integer");
  }
  const counts = fareClasses
    .map((item) => item.numberOfBookableSeats)
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 9);
  const groups = groupSizesBookable.filter(
    (value) => Number.isInteger(value) && value > 0 && value <= 9,
  );
  const commercialCount = Math.max(...counts, ...groups, 0);
  const hasInventory = counts.length > 0 || groups.length > 0;
  const commercialThreshold = !hasInventory
    ? "unknown"
    : commercialCount > threshold
      ? "supported"
      : "not_supported";
  const validPeers = comparableFares
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
  const median = validPeers.length
    ? (validPeers[Math.floor((validPeers.length - 1) / 2)] +
        validPeers[Math.floor(validPeers.length / 2)]) /
      2
    : null;
  const fareRatio =
    median && Number.isFinite(currentFare) && currentFare > 0
      ? currentFare / median
      : null;
  const inventoryTrend =
    Number.isInteger(previousCommercialCount) && hasInventory
      ? Math.sign(commercialCount - previousCommercialCount)
      : null;
  return {
    threshold,
    commercialCount: hasInventory ? commercialCount : null,
    commercialCountCapped: hasInventory && commercialCount === 9,
    commercialThreshold,
    fareRatio,
    inventoryTrend,
    // No calibrated P(physical open seats > X) can be computed from these inputs.
    probability: null,
  };
}
