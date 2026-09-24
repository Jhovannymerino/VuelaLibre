/** Pure, deterministic demo heuristics. Never represents ticket inventory or a price forecast. */
export const isAvailable = (seat) =>
  ["available", "premium"].includes(seat.status);
export const STATES = {
  available: "Disponible",
  occupied: "Ocupado aparente",
  blocked: "Bloqueado",
  premium: "Premium / espacio extra",
  unknown: "Desconocido",
};
export function groupsOf(seats, size = 2) {
  const groups = [];
  for (let i = 0; i <= seats.length - size; i++) {
    const group = seats.slice(i, i + size);
    if (
      group.every(
        (s, j) =>
          isAvailable(s) &&
          s.row === group[0].row &&
          s.block === group[0].block &&
          s.position === group[0].position + j,
      )
    )
      groups.push(group);
  }
  return groups;
}
export function analyze(seats) {
  const total = seats.length;
  const available = seats.filter(isAvailable);
  const occupied = seats.filter((s) => s.status === "occupied").length;
  const known = seats.filter((s) => s.status !== "unknown").length;
  const measurable = available.length + occupied;
  const ratio = (n, d) => (d ? Math.round((n / d) * 100) : 0);
  const estimatedLoadPct = measurable ? ratio(occupied, measurable) : null;
  const seatVisibilityRatio = ratio(known, total);
  const pairs = groupsOf(seats, 2);
  const triples = groupsOf(seats, 3);
  const good = available.filter((s) => s.quality >= 75);
  const seatOpportunityScore = ratio(
    available.reduce((sum, s) => sum + s.quality / 100, 0),
    total,
  );
  const seatsTogetherProbability = ratio(
    new Set(pairs.flat().map((s) => s.id)).size,
    available.length,
  );
  const preference = (type) =>
    ratio(
      available.filter((s) => s.type === type).length,
      seats.filter((s) => s.type === type).length,
    );
  const confidence =
    !total || seatVisibilityRatio < 85 || measurable / total < 0.65
      ? "low"
      : "high";
  const buyNowSignal =
    confidence === "low"
      ? "watch"
      : estimatedLoadPct >= 70 && good.length / total <= 0.15
        ? "buy"
        : "wait";
  const fullness =
    estimatedLoadPct === null
      ? "Sin estimación"
      : estimatedLoadPct >= 85
        ? "Muy lleno"
        : estimatedLoadPct >= 70
          ? "Lleno"
          : estimatedLoadPct >= 40
            ? "Medio"
            : "Vacío";
  return {
    estimatedLoadPct,
    seatVisibilityRatio,
    seatOpportunityScore,
    seatsTogetherProbability,
    windowAvailabilityRatio: preference("Ventana"),
    aisleAvailabilityRatio: preference("Pasillo"),
    buyNowSignal,
    confidence,
    fullness,
    available,
    good,
    pairs,
    triples,
  };
}
export const SIGNALS = {
  buy: {
    label: "Compra hoy",
    title: "Quedan buenas opciones. No muchas.",
    reason:
      "Si priorizas elegir un buen asiento, conviene actuar hoy. La disponibilidad visible es limitada.",
    tone: "urgent",
  },
  wait: {
    label: "Puedes esperar",
    title: "Todavía tienes margen para elegir.",
    reason:
      "Aún hay opciones disponibles. Sigue la evolución del mapa antes de decidir.",
    tone: "good",
  },
  watch: {
    label: "Vigilar",
    title: "Necesitamos un poco más de contexto.",
    reason:
      "La visibilidad del mapa es limitada. Crea una alerta local y vuelve a revisar.",
    tone: "watch",
  },
};
export function recommendations(seats) {
  const ranked = seats
    .filter(isAvailable)
    .sort(
      (a, b) =>
        b.quality - a.quality || (a.price ?? Infinity) - (b.price ?? Infinity),
    );
  const value = ranked
    .filter((s) => s.price !== null)
    .sort((a, b) => b.quality / (b.price + 10) - a.quality / (a.price + 10));
  return [
    ["Mejor individual", ranked[0]],
    ["Mejor ventana", ranked.find((s) => s.type === "Ventana")],
    ["Mejor pasillo", ranked.find((s) => s.type === "Pasillo")],
    ["Calidad / precio", value[0]],
  ];
}
