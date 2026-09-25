import "./styles/tokens.css";
import "./styles/app.css";
import {
  escape,
  icon,
  formatStamp,
  formatLocalStamp,
} from "./components/ui.js";

const app = document.querySelector("#app");

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const state = {
  origin: "MAD",
  destination: "PMI",
  date: todayISO(),
  threshold: 5,
  status: "loading", // loading | ready | error
  response: null, // {configured, source, flights, message}
  errorMessage: "",
  selected: null,
};

const route = () => `${state.origin} → ${state.destination}`;
const button = (label, action, variant = "secondary", glyph = "") =>
  `<button class="button ${variant}" data-action="${action}">${glyph ? icon(glyph) : ""}${escape(label)}</button>`;

function countLabel(signal) {
  if (!signal || signal.commercialCount === null) return "—";
  return signal.commercialCountCapped
    ? `${signal.commercialCount}+`
    : `${signal.commercialCount}`;
}
function headline(signal, threshold) {
  if (!signal || signal.commercialThreshold === "unknown")
    return "Sin datos de disponibilidad comercial para este vuelo";
  return signal.commercialThreshold === "supported"
    ? `Señal comercial favorable para más de ${threshold}`
    : `No hay evidencia comercial de más de ${threshold}`;
}
function badgeClass(signal) {
  if (!signal || signal.commercialThreshold === "unknown") return "unknown";
  return signal.commercialThreshold === "supported"
    ? "supported"
    : "not-supported";
}
function badgeText(signal) {
  const cls = badgeClass(signal);
  return cls === "supported"
    ? "Favorable"
    : cls === "not-supported"
      ? "Sin evidencia"
      : "Sin datos";
}
function trendText(signal) {
  if (!signal || signal.inventoryTrend === null)
    return "Sin lectura previa para comparar";
  if (signal.inventoryTrend > 0) return "↑ Sube desde la lectura anterior";
  if (signal.inventoryTrend < 0) return "↓ Baja desde la lectura anterior";
  return "→ Sin cambio desde la lectura anterior";
}
function fareContext(signal) {
  if (!signal || !Number.isFinite(signal.fareRatio)) return "";
  const pct = Math.round((signal.fareRatio - 1) * 100);
  if (pct === 0)
    return "Tarifa en línea con vuelos comparables (contexto, no indica ocupación).";
  const direction = pct > 0 ? "por encima" : "por debajo";
  return `Tarifa ${Math.abs(pct)}% ${direction} de vuelos comparables (contexto, no indica ocupación).`;
}
function historyPoints(flight) {
  const points = new Map();
  for (const h of flight.history ?? []) {
    if (h?.observedAt)
      points.set(h.observedAt, {
        observedAt: h.observedAt,
        count: h.commercialCount,
        capped: h.commercialCountCapped,
      });
  }
  if (flight.observedAt)
    points.set(flight.observedAt, {
      observedAt: flight.observedAt,
      count: flight.signal?.commercialCount ?? null,
      capped: flight.signal?.commercialCountCapped ?? false,
    });
  return [...points.values()].sort(
    (a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt),
  );
}
function sparkline(points) {
  const valid = points.filter((p) => Number.isInteger(p.count));
  if (valid.length < 2)
    return `<span class="no-trend">${valid.length === 1 ? "Primera lectura registrada" : "Sin lecturas registradas"}</span>`;
  const coords = valid
    .map(
      (p, i) =>
        `${(i * 100) / (valid.length - 1)},${35 - (Math.min(p.count, 9) / 9) * 28}`,
    )
    .join(" ");
  const label = valid
    .map(
      (p) =>
        `${formatStamp(p.observedAt)}, ${p.capped ? `${p.count}+` : p.count} cupos`,
    )
    .join("; ");
  return `<svg class="sparkline" viewBox="0 0 100 40" role="img" aria-label="Evolución del cupo vendible: ${escape(label)}"><polyline points="${coords}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function flightCard(flight) {
  const signal = flight.signal ?? {};
  const context = fareContext(signal);
  const sourceLink = flight.sourceUrl
    ? ` <a class="text-button" href="${escape(flight.sourceUrl)}" target="_blank" rel="noopener noreferrer">Abrir horario ↗</a>`
    : "";
  return `<article class="flight-card ${badgeClass(signal) === "supported" ? "leading" : ""}" aria-label="${escape(flight.flightNumber)}"><div class="flight-head"><div class="flight-brand"><span class="airline-mark">UX</span><div><h3>${escape(flight.flightNumber)}</h3><small>${escape(flight.origin)} → ${escape(flight.destination)} · ${escape(flight.date)}</small></div></div><span class="signal-badge ${badgeClass(signal)}">${badgeText(signal)}</span></div><div class="flight-time"><strong>${flight.departure ? formatLocalStamp(flight.departure) : "Hora sin confirmar"}</strong><span>Salida programada</span></div><p class="signal-headline">${escape(headline(signal, state.threshold))}</p><div class="flight-count"><strong>${countLabel(signal)}</strong><span>${flight.availabilityKnown === false ? "horario público; no publica plazas libres" : "cupo vendible detectado, no plazas físicas confirmadas"}</span></div>${context ? `<p class="fare-context">${escape(context)}</p>` : ""}<div class="flight-trend"><div>${sparkline(historyPoints(flight))}</div><span>${escape(trendText(signal))}</span></div><div class="flight-foot"><span>${icon("clock")} Lectura: ${flight.observedAt ? formatStamp(flight.observedAt) : "Sin fecha"}</span><button class="text-button" data-open="${escape(flight.id)}">Ver evolución ${icon("arrow")}</button>${sourceLink}</span></div></article>`;
}
function historyDetail(flight) {
  if (!flight) return "";
  const signal = flight.signal ?? {};
  const points = historyPoints(flight);
  return `<section class="history-panel" id="history-panel" aria-label="Evolución de ${escape(flight.flightNumber)}"><div class="section-heading"><div><p class="eyebrow">EVOLUCIÓN DEL CUPO VENDIBLE</p><h2>${escape(flight.flightNumber)} · ${flight.departure ? formatLocalStamp(flight.departure) : ""}</h2><p>${escape(headline(signal, state.threshold))}. La fecha del vuelo es ${escape(flight.date)}. El cupo vendible es un indicio comercial: no equivale a plazas físicas libres ni a una probabilidad calculada de embarque.</p></div></div><div class="history-body"><div class="history-chart">${
    points.length
      ? points
          .map(
            (p) =>
              `<div class="bar-row"><time datetime="${escape(p.observedAt)}">${formatStamp(p.observedAt)}</time><div class="bar-track"><span style="width:${Number.isInteger(p.count) ? Math.max(3, (Math.min(p.count, 9) / 9) * 100) : 0}%"></span></div><strong>${Number.isInteger(p.count) ? (p.capped ? `${p.count}+` : p.count) : "—"}</strong></div>`,
          )
          .join("")
      : `<p class="no-trend">Sin lecturas registradas todavía.</p>`
  }</div><div class="history-table-wrap"><table><caption>Registro de cupo vendible detectado</caption><thead><tr><th>Lectura (UTC)</th><th>Cupo vendible</th></tr></thead><tbody>${[
    ...points,
  ]
    .reverse()
    .map(
      (p) =>
        `<tr><td>${formatStamp(p.observedAt)}</td><td><strong>${Number.isInteger(p.count) ? (p.capped ? `${p.count}+` : p.count) : "—"}</strong></td></tr>`,
    )
    .join("")}</tbody></table></div></div></section>`;
}
function resultsSection() {
  if (state.status === "loading") {
    return `<div class="empty" role="status">${icon("plane")}<h3>Consultando disponibilidad…</h3><p>Revisando el cupo vendible de Air Europa para ${escape(route())} · ${escape(state.date)}.</p></div>`;
  }
  if (state.status === "error") {
    return `<div class="empty" role="alert">${icon("info")}<h3>No se pudo completar la consulta</h3><p>${escape(state.errorMessage)}</p>${button("Reintentar", "retry", "primary", "refresh")}</div>`;
  }
  const data = state.response;
  if (!data?.configured) {
    return `<div class="empty" role="status">${icon("shield")}<h3>El radar todavía no está configurado</h3><p>${escape(data?.message || "El servidor no tiene credenciales de una cuenta Amadeus configuradas; no puede consultar el inventario vendible.")}</p></div>`;
  }
  const flights = data.flights ?? [];
  if (!flights.length) {
    return `<div class="empty">${icon("plane")}<h3>Sin cobertura para esta búsqueda</h3><p>${escape(data.message || "No hay datos de inventario vendible para este vuelo, ruta o fecha.")}</p></div>`;
  }
  return `<div class="cards">${flights.map(flightCard).join("")}</div>`;
}
function summarySection() {
  const data = state.response;
  if (state.status !== "ready" || !data?.configured || !data.flights?.length) {
    return `<section class="summary"><div><span class="pill">RADAR COMERCIAL, NO OCUPACIÓN CONFIRMADA</span><h2>Busca un vuelo Air Europa para ver la señal comercial.</h2><p>El resultado se basa en cupo vendible por clase tarifaria o en horarios públicos; no confirma asientos físicos libres ni calcula una probabilidad de embarque.</p></div></section>`;
  }
  const flights = data.flights;
  const publicOnly = data.source === "public-2lnr-schedule";
  const supported = flights.filter(
    (f) => f.signal?.commercialThreshold === "supported",
  ).length;
  const title = publicOnly
    ? `${flights.length} ${flights.length === 1 ? "vuelo programado" : "vuelos programados"} para revisar.`
    : `${supported} de ${flights.length} ${flights.length === 1 ? "vuelo muestra" : "vuelos muestran"} señal favorable para más de ${state.threshold} plazas.`;
  const detail = publicOnly
    ? "La fuente gratuita solo confirma el horario; no publica plazas libres ni permite calcular una probabilidad de embarque."
    : "Basado en cupo vendible por clase tarifaria (Amadeus); no confirma asientos físicos libres ni calcula una probabilidad de embarque.";
  return `<section class="summary"><div><span class="pill">${publicOnly ? "HORARIO PÚBLICO, SIN CUPOS" : "RADAR COMERCIAL, NO OCUPACIÓN CONFIRMADA"}</span><h2>${title}</h2><p>${escape(route())} · ${escape(state.date)}. ${detail}</p></div><div class="summary-visual" aria-hidden="true"><strong>${publicOnly ? flights.length : supported}</strong><span>${publicOnly ? "horarios encontrados" : flights.length === 1 ? "vuelo con señal favorable" : "vuelos con señal favorable"}</span></div></section>`;
}
function render() {
  const flights =
    state.status === "ready" && state.response?.configured
      ? (state.response.flights ?? [])
      : [];
  const selected =
    flights.find((f) => f.id === state.selected) ?? flights[0] ?? null;
  if (selected) state.selected = selected.id;
  app.innerHTML = `<a class="skip-link" href="#main">Saltar al contenido</a><header class="site-header"><a class="brand" href="#main"><span class="brand-icon">${icon("plane")}</span>VuelaLibre<span class="brand-period">.</span></a><div class="header-meta"><span class="pilot-label">RADAR AIR EUROPA</span></div></header><main id="main" tabindex="-1"><section class="intro"><div><p class="eyebrow">SEÑAL COMERCIAL ESTIMADA</p><h1>¿Hay indicios de más de X plazas vendibles?</h1><p>Busca un vuelo de Air Europa por ruta y fecha, elige un umbral X y consulta la señal disponible. Sin cuenta, el radar muestra horarios públicos; con una fuente de inventario comercial opcional, muestra cupo vendible. Ninguna confirma plazas staff.</p></div><div class="pilot-mark"><span class="airline-mark">UX</span><span>Air Europa · radar estimado</span></div></section><form class="search-panel" id="search-form"><div class="form-grid"><label>Origen<input name="origin" value="${escape(state.origin)}" maxlength="3" pattern="[A-Za-z]{3}" required aria-label="Origen, código de tres letras"></label><span class="swap" aria-hidden="true">→</span><label>Destino<input name="destination" value="${escape(state.destination)}" maxlength="3" pattern="[A-Za-z]{3}" required aria-label="Destino, código de tres letras"></label><label>Fecha del vuelo<input name="date" type="date" value="${escape(state.date)}" required></label><label>Umbral X (plazas)<input name="threshold" type="number" min="0" max="8" step="1" value="${state.threshold}" required aria-describedby="threshold-hint"></label><button class="button primary" type="submit">${icon("arrow")} Buscar</button></div><p id="threshold-hint" class="field-hint">Entre 0 y 8. Se comprueba si el cupo vendible indica más de X asientos a la venta.</p></form>${summarySection()}<div class="disclosure" role="note">${icon("info")}<p>Este radar usa horarios públicos cuando no hay una cuenta conectada, y <strong>cupo vendible por clase tarifaria</strong> de Amadeus cuando existe una fuente comercial opcional. No confirma plazas físicas libres, no calcula una probabilidad calibrada de embarque y no garantiza viajar como staff. El precio, cuando aparece, es solo contexto comparativo. <a href="https://stafftraveler.com/en" target="_blank" rel="noopener noreferrer">Consultar StaffTraveler ↗</a> (servicio externo con cargas reportadas por personal; no es la fuente de este radar).</p></div><section class="results" aria-label="Vuelos y señal comercial"><div class="section-heading"><div><p class="eyebrow">VUELOS Y SEÑAL COMERCIAL</p><h2>${escape(route())} <span>· ${escape(state.date)}</span></h2><p>${state.status === "ready" && state.response?.configured ? `${(state.response.flights ?? []).length} ${(state.response.flights ?? []).length === 1 ? "vuelo con datos" : "vuelos con datos"} · umbral X = ${state.threshold}` : `Umbral X = ${state.threshold}`}</p></div>${state.status === "ready" && state.response?.configured && state.response?.source ? `<span class="source-tag">Fuente: ${escape(state.response.source)}</span>` : ""}</div>${resultsSection()}</section>${selected ? historyDetail(selected) : ""}<section class="how-it-works"><div><p class="eyebrow">CÓMO LEER LA SEÑAL</p><h2>Interpreta el cupo vendible antes de decidir.</h2></div><div class="steps"><div><span>01</span><strong>Elige vuelo, fecha y umbral</strong><p>El umbral X define qué cifra de plazas quieres comprobar.</p></div><div><span>02</span><strong>Lee la señal, no una cifra exacta</strong><p>«9+» significa que la clase está truncada en 9 o más, no un total del avión.</p></div><div><span>03</span><strong>Confirma de nuevo</strong><p>El inventario vendible puede cambiar incluso el día del vuelo.</p></div></div></section><footer><span>VuelaLibre · Radar comercial Air Europa</span><span>Señal indirecta; no sustituye una carga staff confirmada.</span></footer></main><div id="announcer" class="sr-only" role="status" aria-live="polite"></div>`;
}
function announce(message) {
  document.querySelector("#announcer").textContent = message;
}
async function search() {
  state.status = "loading";
  state.selected = null;
  render();
  const params = new URLSearchParams({
    origin: state.origin,
    destination: state.destination,
    date: state.date,
    threshold: String(state.threshold),
  });
  try {
    const res = await fetch(`/api/market?${params.toString()}`);
    const body = await res.json().catch(() => null);
    if (!res.ok || !body) {
      state.status = "error";
      state.errorMessage =
        body?.message || `No se pudo consultar el radar (HTTP ${res.status}).`;
      render();
      announce(state.errorMessage);
      return;
    }
    state.response = body;
    state.selected = body.flights?.[0]?.id ?? null;
    state.status = "ready";
    render();
    announce(
      !body.configured
        ? "El radar todavía no está configurado en el servidor."
        : `${(body.flights ?? []).length} ${(body.flights ?? []).length === 1 ? "vuelo encontrado" : "vuelos encontrados"} para ${route()}.`,
    );
  } catch {
    state.status = "error";
    state.errorMessage =
      "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
    render();
    announce(state.errorMessage);
  }
}
app.addEventListener("submit", (e) => {
  if (e.target.id !== "search-form") return;
  e.preventDefault();
  const data = new FormData(e.target);
  const origin = String(data.get("origin")).trim().toUpperCase(),
    destination = String(data.get("destination")).trim().toUpperCase(),
    threshold = Number(data.get("threshold"));
  if (origin === destination) {
    state.status = "error";
    state.errorMessage = "Origen y destino deben ser distintos.";
    render();
    announce(state.errorMessage);
    return;
  }
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > 8) {
    state.status = "error";
    state.errorMessage = "El umbral X debe ser un entero entre 0 y 8.";
    render();
    announce(state.errorMessage);
    return;
  }
  Object.assign(state, {
    origin,
    destination,
    date: data.get("date"),
    threshold,
  });
  search();
});
app.addEventListener("click", (e) => {
  if (e.target.closest('[data-action="retry"]')) {
    search();
    return;
  }
  const open = e.target.closest("[data-open]");
  if (open) {
    state.selected = open.dataset.open;
    render();
    document
      .querySelector("#history-panel")
      .scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (e.target.closest(".skip-link")) {
    e.preventDefault();
    document.querySelector("#main").focus();
  }
});
render();
search();
