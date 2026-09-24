export const flight = {
  id: "IB539-2026-10-15",
  airline: "Iberia",
  number: "IB539",
  origin: "MAD",
  destination: "LIS",
  originName: "Madrid",
  destinationName: "Lisboa",
  date: "15 oct 2026",
  departure: "10:45",
  aircraft: "Airbus A320",
  updatedAt: "2026-09-24T10:42:00Z",
};
export const cabins = {
  economy: { name: "Economy", rows: 18, start: 6, blocks: ["ABC", "DEF"] },
  business: { name: "Business", rows: 3, start: 1, blocks: ["AC", "DF"] },
};
export function makeSeats(cabin = "economy", partial = false) {
  const config = cabins[cabin];
  // Illustrative layout, not an airline-certified aircraft plan.
  const open = new Set([
    "6A",
    "6C",
    "7D",
    "8F",
    "10A",
    "12A",
    "12B",
    "12C",
    "14D",
    "14E",
    "16F",
    "18C",
    "20A",
    "20B",
    "22D",
    "23F",
  ]);
  const blocked = new Set(["7B", "9E", "13A", "17D", "21F"]);
  return Array.from({ length: config.rows }, (_, index) =>
    config.blocks.flatMap((letters, block) =>
      [...letters].map((letter, position) => {
        const row = config.start + index;
        const id = `${row}${letter}`;
        const premium = cabin === "business" || row === 6 || row === 12;
        let status =
          cabin === "business"
            ? index === 1
              ? "occupied"
              : "premium"
            : open.has(id)
              ? premium
                ? "premium"
                : "available"
              : blocked.has(id)
                ? "blocked"
                : id === "19E" || id === "23B"
                  ? "unknown"
                  : "occupied";
        if (partial && index % 2 === 0) status = "unknown";
        const type =
          (block === 0 && position === 0) ||
          (block === 1 && position === letters.length - 1)
            ? "Ventana"
            : (block === 0 && position === letters.length - 1) ||
                (block === 1 && position === 0)
              ? "Pasillo"
              : "Central";
        const quality =
          row === 23
            ? 35
            : row === 12
              ? 93
              : type === "Central"
                ? 58
                : index < 5
                  ? 88
                  : 78;
        return {
          id,
          row,
          block,
          position,
          type,
          status,
          quality,
          recommended: quality >= 85,
          price:
            status === "unknown" ? null : premium ? 35 : index < 8 ? 18 : 0,
          note:
            row === 23
              ? "Cerca de los baños; mayor tránsito y reclinación limitada."
              : row === 12
                ? "Espacio extra junto a salida. Requiere cumplir las condiciones de la aerolínea."
                : index < 5
                  ? "Zona delantera: salida más rápida y menos tránsito."
                  : "Una opción equilibrada para esta cabina.",
        };
      }),
    ),
  ).flat();
}
export function snapshots(cabin, seats) {
  return [
    {
      label: "22 sep · 10:42",
      seats: seats.map((s, i) =>
        s.status === "occupied" && i % 7 === 0
          ? { ...s, status: "available" }
          : s,
      ),
    },
    {
      label: "23 sep · 10:42",
      seats: seats.map((s, i) =>
        s.status === "occupied" && i % 13 === 0
          ? { ...s, status: "available" }
          : s,
      ),
    },
    { label: "24 sep · 10:42", seats },
  ];
}
/** Replace this adapter with a normalized, authorized provider response. */
export async function loadFlight(cabin, mode = "ready") {
  await new Promise((resolve) => setTimeout(resolve, 450));
  if (mode === "empty") return { seats: [], history: [] };
  if (mode === "error") throw new Error("No se pudo cargar la demostración.");
  const seats = makeSeats(cabin, mode === "low");
  return { seats, history: snapshots(cabin, seats) };
}
