const common = {
  airline: "Air Europa",
  origin: "MAD",
  destination: "PMI",
  date: "2026-10-15",
  source: "demo",
};
const snapshots = (counts) =>
  counts.map((count, i) => ({
    at: `2026-09-${String(21 + i).padStart(2, "0")}T10:42:00Z`,
    count,
    source: "demo",
  }));
export const demoFlights = [
  {
    ...common,
    id: "demo-a",
    flightNumber: "Ejemplo A",
    departure: "07:20",
    snapshots: snapshots([18, 16, 15, 14]),
  },
  {
    ...common,
    id: "demo-b",
    flightNumber: "Ejemplo B",
    departure: "12:35",
    snapshots: snapshots([8, 7, 6, 6]),
  },
  {
    ...common,
    id: "demo-c",
    flightNumber: "Ejemplo C",
    departure: "19:10",
    snapshots: snapshots([5, 4, 4, 2]),
  },
];
/** Replace this adapter only when a licensed provider supplies flight-level open-seat counts. */
export async function loadFlights() {
  return demoFlights.map((f) => ({
    ...f,
    snapshots: f.snapshots.map((s) => ({ ...s })),
  }));
}
