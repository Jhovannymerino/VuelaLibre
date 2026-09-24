import {
  analyze,
  SIGNALS,
  recommendations,
  STATES,
} from "../domain/analysis.js";
import {
  escape,
  badge,
  button,
  icon,
  kpiCard,
  sectionHeading,
  sparkline,
} from "./ui.js";
export const alertTypes = {
  recommended: "Se libera un asiento recomendado",
  together: "Aparecen 2 asientos juntos",
  score: "El score cambia al menos 10 puntos",
  signal: "Cambia la recomendación principal",
};
export function hero(metrics) {
  const signal = SIGNALS[metrics.buyNowSignal];
  return `<section class="hero ${signal.tone}"><div class="hero-copy"><p class="eyebrow">TU VUELO, CON CONTEXTO</p><div class="hero-badges">${badge(metrics.fullness, signal.tone)}${badge(signal.label, signal.tone)}</div><h1>${signal.title}</h1><p>${signal.reason}</p><div class="hero-foot">${icon("spark")} Una decisión más informada empieza aquí.</div></div><div class="hero-summary"><span class="orbit">${icon("plane")}</span><strong>${metrics.estimatedLoadPct ?? "—"}<small>${metrics.estimatedLoadPct === null ? "" : "%"}</small></strong><span>ocupación aparente</span><small>Estimación del mapa visible</small></div></section>`;
}
export function kpis(metrics, history) {
  const prev = history.length > 1 ? analyze(history.at(-2).seats) : null;
  const delta = (value, before, unit) =>
    before === undefined || before === null
      ? "Sin comparación anterior"
      : `${value - before > 0 ? "+" : ""}${value - before} ${unit} vs. chequeo anterior`;
  return `<section class="kpi-grid" aria-label="Indicadores del vuelo">${[
    {
      label: "Ocupación aparente",
      value: `${metrics.estimatedLoadPct ?? "—"}${metrics.estimatedLoadPct === null ? "" : "%"}`,
      description: "Sobre asientos interpretables",
      detail: delta(metrics.estimatedLoadPct, prev?.estimatedLoadPct, "pp"),
      tone: SIGNALS[metrics.buyNowSignal].tone,
      trend: history.map((h) => analyze(h.seats).estimatedLoadPct ?? 0),
    },
    {
      label: "Oportunidad de asiento",
      value: `${metrics.seatOpportunityScore}/100`,
      description: `${metrics.good.length} buenas opciones disponibles`,
      detail: delta(
        metrics.seatOpportunityScore,
        prev?.seatOpportunityScore,
        "puntos",
      ),
      tone: "watch",
      trend: history.map((h) => analyze(h.seats).seatOpportunityScore),
    },
    {
      label: "Sentarse juntos",
      value: `${metrics.pairs.length} pares`,
      description: `${metrics.triples.length} bloques de 3 · indicador ${metrics.seatsTogetherProbability}%`,
      detail: "Indicador de contigüidad, no probabilidad real",
      tone: metrics.pairs.length < 4 ? "urgent" : "good",
    },
    {
      label: "Ventana / pasillo",
      value: `${metrics.windowAvailabilityRatio}% / ${metrics.aisleAvailabilityRatio}%`,
      description: "Disponibilidad por preferencia",
      detail: `${metrics.available.length} asientos disponibles en total`,
      tone: "good",
    },
    {
      label: "Tu siguiente paso",
      value: SIGNALS[metrics.buyNowSignal].label,
      description: "Prioriza la elección de asiento",
      detail: "Sin predicción de tarifas",
      tone: SIGNALS[metrics.buyNowSignal].tone,
    },
  ]
    .map(kpiCard)
    .join("")}</section>`;
}
export function recommendationPanel(seats, metrics) {
  const signal = SIGNALS[metrics.buyNowSignal];
  const pair = metrics.pairs[0],
    triple = metrics.triples[0];
  return `<aside class="recommendation-panel" id="recommendations-panel"><section class="card recommendations">${sectionHeading("NUESTRA SELECCIÓN", "Dónde vale la pena sentarse", icon("spark"))}<div class="recommendation-list">${recommendations(
    seats,
  )
    .map(
      ([label, seat]) =>
        `<div class="recommendation-item"><div><span class="eyebrow">${label}</span><h3>${seat ? `${seat.id} <span>· ${seat.type}</span>` : "Sin opciones visibles"}</h3><p>${seat ? escape(seat.note) : "Vuelve a revisar más adelante."}</p></div>${seat ? `<button class="seat-link" data-seat="${seat.id}" aria-label="Ver ${seat.id}, ${label}">${icon("arrow")}</button>` : ""}</div>`,
    )
    .join(
      "",
    )}</div></section><section class="card together-card"><span class="small-icon">${icon("user")}</span><h2>El viaje, mejor juntos</h2><p>${pair ? `Mejor pareja: <strong>${pair.map((s) => s.id).join(" + ")}</strong>` : "No hay parejas contiguas disponibles."}</p><p>${triple ? `Bloque de tres: <strong>${triple.map((s) => s.id).join(" + ")}</strong>` : "No hay bloques de tres visibles."}</p><small>${metrics.pairs.length < 4 ? "Pocas alternativas: podrías perder la opción de ir acompañado." : "Aún hay varias alternativas para compartir fila."} Los grupos nunca cruzan el pasillo.</small>${pair ? `<button class="text-button" data-seat="${pair[0].id}">Ver la mejor pareja ${icon("arrow")}</button>` : ""}</section><section class="action-card ${signal.tone}">${badge(signal.label, signal.tone)}<h2>Decide con una señal clara.</h2><p>${signal.reason}</p>${button("Crear alerta", "alert", "primary", "bell")}<small>Solo se guarda en este navegador. Sin notificaciones automáticas.</small></section></aside>`;
}
export function historyPanel(history, standalone = false) {
  return `<section class="card history-card" id="history-panel">${sectionHeading("LA EVOLUCIÓN IMPORTA", "Tu vuelo, chequeo a chequeo", badge("Snapshots de demostración"))}<p>El mismo vuelo y cabina en tres momentos. Datos simulados; sin cuenta de usuario conectada.</p><div class="history-trends"><div>Ocupación aparente ${sparkline(
    history.map((h) => analyze(h.seats).estimatedLoadPct ?? 0),
    "urgent",
  )}</div><div>Oportunidad ${sparkline(history.map((h) => analyze(h.seats).seatOpportunityScore))}</div></div><div class="table-scroll"><table><caption class="sr-only">Evolución de disponibilidad de la cabina seleccionada</caption><thead><tr><th>Chequeo (UTC)</th><th>Ocupación</th><th>Oportunidad</th><th>Pares juntos</th><th>Señal</th></tr></thead><tbody>${history
    .map((h) => {
      const m = analyze(h.seats);
      return `<tr><th>${h.label}</th><td>${m.estimatedLoadPct ?? "—"}%</td><td>${m.seatOpportunityScore}/100</td><td>${m.pairs.length}</td><td>${badge(SIGNALS[m.buyNowSignal].label, SIGNALS[m.buyNowSignal].tone)}</td></tr>`;
    })
    .join(
      "",
    )}</tbody></table></div>${standalone ? button("Volver al dashboard", "dashboard") : ""}</section>`;
}
export function distribution(seats) {
  const entries = Object.entries(STATES).map(([key, label]) => [
    key,
    label,
    seats.filter((s) => s.status === key).length,
  ]);
  return `<div class="distribution" role="img" aria-label="Distribución: ${entries.map(([, label, count]) => `${label} ${count}`).join(", ")}">${entries
    .filter(([, , count]) => count)
    .map(
      ([key, label, count]) =>
        `<span class="${key}" style="width:${(count / seats.length) * 100}%" title="${label}: ${count}"></span>`,
    )
    .join("")}</div>`;
}
