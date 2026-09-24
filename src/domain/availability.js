/** Availability snapshots for one scheduled flight. Counts may change in either direction. */
export function isValidFlight(flight) {
  return (
    !!flight &&
    typeof flight.id === "string" &&
    typeof flight.flightNumber === "string" &&
    flight.flightNumber.trim().length > 0 &&
    /^[A-Z]{3}$/.test(flight.origin) &&
    /^[A-Z]{3}$/.test(flight.destination) &&
    flight.origin !== flight.destination &&
    /^\d{4}-\d{2}-\d{2}$/.test(flight.date) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(flight.departure) &&
    Array.isArray(flight.snapshots) &&
    flight.snapshots.every(
      (s) =>
        Number.isInteger(s.count) &&
        s.count >= 0 &&
        !Number.isNaN(Date.parse(s.at)) &&
        ["demo", "manual"].includes(s.source),
    )
  );
}
export function latestSnapshot(flight) {
  return (
    [...flight.snapshots].sort(
      (a, b) => Date.parse(b.at) - Date.parse(a.at),
    )[0] ?? null
  );
}
export function dailySnapshots(flight) {
  const byDay = new Map();
  for (const snapshot of [...flight.snapshots].sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at),
  ))
    byDay.set(snapshot.at.slice(0, 10), snapshot);
  return [...byDay.values()];
}
export function summarizeFlight(flight) {
  const sorted = [...flight.snapshots].sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at),
  );
  const latest = sorted.at(-1) ?? null;
  const previous = sorted.at(-2) ?? null;
  return {
    ...flight,
    latest,
    previous,
    count: latest?.count ?? null,
    delta: latest && previous ? latest.count - previous.count : null,
    daily: dailySnapshots(flight),
  };
}
export function compareFlights(flights) {
  return flights
    .map(summarizeFlight)
    .sort(
      (a, b) =>
        (b.count ?? -1) - (a.count ?? -1) ||
        a.departure.localeCompare(b.departure),
    );
}
