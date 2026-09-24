import "./styles/tokens.css";
import "./styles/app.css";
import { loadFlights } from "./data/demo.js";
import { readFlights, saveFlights } from "./data/storage.js";
import { compareFlights, isValidFlight } from "./domain/availability.js";
import { escape, icon, formatStamp } from "./components/ui.js";

const app = document.querySelector("#app");
const state = {
  origin: "MAD",
  destination: "PMI",
  date: "2026-10-15",
  manual: readFlights(),
  demo: [],
  loading: true,
  notice: "",
  selected: null,
};
const route = () => `${state.origin} → ${state.destination}`;
const button = (label, action, variant = "secondary", glyph = "") =>
  `<button class="button ${variant}" data-action="${action}">${glyph ? icon(glyph) : ""}${escape(label)}</button>`;
const visibleFlights = () =>
  [...state.demo, ...state.manual].filter(
    (f) =>
      f.origin === state.origin &&
      f.destination === state.destination &&
      f.date === state.date,
  );
function trend(flight) {
  const snapshots = flight.daily;
  if (snapshots.length < 2)
    return `<span class="no-trend">Primera observación</span>`;
  const max = Math.max(...snapshots.map((s) => s.count), 1),
    min = Math.min(...snapshots.map((s) => s.count), 0);
  const points = snapshots
    .map(
      (s, i) =>
        `${(i * 100) / (snapshots.length - 1)},${35 - ((s.count - min) / Math.max(1, max - min)) * 28}`,
    )
    .join(" ");
  return `<svg class="sparkline" viewBox="0 0 100 40" role="img" aria-label="Evolución diaria: ${snapshots.map((s) => `${s.at.slice(0, 10)}, ${s.count} plazas`).join("; ")}"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function flightCard(flight, index) {
  const direction =
    flight.delta === null
      ? "Sin comparación"
      : flight.delta > 0
        ? `+${flight.delta} desde la consulta anterior`
        : flight.delta < 0
          ? `${flight.delta} desde la consulta anterior`
          : "Sin cambio desde la consulta anterior";
  return `<article class="flight-card ${index === 0 ? "leading" : ""}" aria-label="${escape(flight.flightNumber)}"><div class="flight-head"><div class="flight-brand"><span class="airline-mark">UX</span><div><h3>${escape(flight.flightNumber)}</h3><small>${flight.source === "demo" ? "Datos ilustrativos" : "Registro manual"}</small></div></div>${index === 0 && flight.count !== null ? '<span class="leader-label">MÁS PLAZAS REPORTADAS</span>' : ""}</div><div class="flight-time"><strong>${escape(flight.departure)}</strong><span>Air Europa · ${escape(route())}</span></div><div class="flight-count"><strong>${flight.count ?? "—"}</strong><span>plazas libres reportadas</span></div><div class="flight-trend"><div>${trend(flight)}</div><span>${direction}</span></div><div class="flight-foot"><span>${icon("clock")} ${flight.latest ? formatStamp(flight.latest.at) : "Sin observación"}</span><button class="text-button" data-open="${escape(flight.id)}">Ver evolución ${icon("arrow")}</button></div></article>`;
}
function historyDetail(flight) {
  if (!flight) return "";
  return `<section class="history-panel" id="history-panel" aria-label="Evolución de ${escape(flight.flightNumber)}"><div class="section-heading"><div><p class="eyebrow">SEGUIMIENTO DEL VUELO</p><h2>${escape(flight.flightNumber)} · ${escape(flight.departure)}</h2><p>Plazas reportadas en cada consulta. La fecha del vuelo es ${escape(flight.date)}.</p></div>${flight.source === "manual" ? button("Registrar nuevo conteo", "update", "primary", "plus") : '<span class="demo-tag">HISTORIAL DE EJEMPLO</span>'}</div><div class="history-body"><div class="history-chart">${flight.daily.map((s) => `<div class="bar-row"><time datetime="${s.at}">${s.at.slice(0, 10)}</time><div class="bar-track"><span style="width:${Math.max(3, (s.count / Math.max(...flight.daily.map((x) => x.count), 1)) * 100)}%"></span></div><strong>${s.count}</strong></div>`).join("")}</div><div class="history-table-wrap"><table><caption>Registro de plazas libres</caption><thead><tr><th>Consulta (UTC)</th><th>Plazas</th><th>Origen del dato</th></tr></thead><tbody>${[
    ...flight.snapshots,
  ]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .map(
      (s) =>
        `<tr><td>${formatStamp(s.at)}</td><td><strong>${s.count}</strong></td><td>${s.source === "demo" ? "Ejemplo" : "Manual"}</td></tr>`,
    )
    .join("")}</tbody></table></div></div></section>`;
}
function render() {
  const flights = compareFlights(visibleFlights());
  const selected =
    flights.find((f) => f.id === state.selected) ?? flights[0] ?? null;
  if (selected) state.selected = selected.id;
  const most = flights[0];
  app.innerHTML = `<a class="skip-link" href="#main">Saltar al contenido</a><header class="site-header"><a class="brand" href="#main"><span class="brand-icon">${icon("plane")}</span>VuelaLibre<span class="brand-period">.</span></a><div class="header-meta"><span class="pilot-label">PILOTO AIR EUROPA</span></div></header><main id="main" tabindex="-1"><section class="intro"><div><p class="eyebrow">DISPONIBILIDAD PARA STAFF</p><h1>Conoce cómo cambian las plazas libres.</h1><p>Consulta un vuelo de Air Europa para una fecha y compara sus recuentos día a día antes de decidir si compras.</p></div><div class="pilot-mark"><span class="airline-mark">UX</span><span>Air Europa · piloto</span></div></section><form class="search-panel" id="search-form"><div class="form-grid"><label>Origen<input name="origin" value="${escape(state.origin)}" maxlength="3" pattern="[A-Za-z]{3}" required aria-label="Origen, código de tres letras"></label><span class="swap" aria-hidden="true">→</span><label>Destino<input name="destination" value="${escape(state.destination)}" maxlength="3" pattern="[A-Za-z]{3}" required aria-label="Destino, código de tres letras"></label><label>Fecha del vuelo<input name="date" type="date" value="${escape(state.date)}" required></label><button class="button primary" type="submit">${icon("arrow")} Ver vuelos</button></div></form>${state.notice ? `<p class="notice" role="status">${escape(state.notice)}</p>` : ""}<section class="summary"><div><span class="pill">UNA CIFRA, SEGUIDA EN EL TIEMPO</span><h2>${most ? `${most.count} plazas libres en el vuelo con más disponibilidad reportada.` : "Busca los datos de tu vuelo."}</h2><p>${most ? `${escape(most.flightNumber)} · ${escape(most.departure)} · ${escape(route())} · ${escape(state.date)}. La cifra puede cambiar antes de volar.` : "Los ejemplos solo corresponden a MAD → PMI el 15 de octubre de 2026. Para otras búsquedas hace falta una fuente de plazas."}</p></div><div class="summary-visual" aria-hidden="true"><strong>${most?.count ?? "—"}</strong><span>plazas reportadas</span></div></section><div class="disclosure" role="note">${icon("info")}<p>Este piloto muestra <strong>datos de ejemplo o registros manuales</strong>; todavía no recibe plazas reales automáticamente. Las plazas libres no garantizan embarque staff y no equivalen a una probabilidad calculada. <a href="https://stafftraveler.com/en" target="_blank" rel="noopener noreferrer">Consultar StaffTraveler ↗</a> (servicio externo; disponibilidad según sus usuarios).</p></div><section class="results" aria-label="Vuelos disponibles"><div class="section-heading"><div><p class="eyebrow">VUELOS Y DISPONIBILIDAD</p><h2>${escape(route())} <span>· ${escape(state.date)}</span></h2><p>${flights.length} ${flights.length === 1 ? "vuelo observado" : "vuelos observados"} · ordenados por el último recuento</p></div>${button("Registrar vuelo y plazas", "add", "secondary", "plus")}</div>${state.loading ? '<div class="empty" role="status">Cargando ejemplos…</div>' : flights.length ? `<div class="cards">${flights.map(flightCard).join("")}</div>` : `<div class="empty">${icon("plane")}<h3>Sin recuentos para esta búsqueda</h3><p>No hay una conexión pública confirmada que entregue las plazas libres reales para este vuelo. Puedes registrar una cifra obtenida de una fuente autorizada.</p>${button("Registrar plazas", "add", "primary", "plus")}</div>`}</section>${selected ? historyDetail(selected) : ""}<section class="how-it-works"><div><p class="eyebrow">CÓMO LEER LA EVOLUCIÓN</p><h2>Revisa la cifra antes de comprar.</h2></div><div class="steps"><div><span>01</span><strong>Elige vuelo y fecha</strong><p>Cada vuelo tiene su propio historial de consultas.</p></div><div><span>02</span><strong>Mira la tendencia</strong><p>Compara el recuento actual con el de días anteriores.</p></div><div><span>03</span><strong>Confirma de nuevo</strong><p>La disponibilidad puede cambiar incluso el día del vuelo.</p></div></div></section><footer><span>VuelaLibre · Piloto Air Europa</span><span>Sin actualización automática de plazas reales.</span></footer></main><div id="dialog-root"></div><div id="announcer" class="sr-only" role="status" aria-live="polite"></div>`;
}
function announce(message) {
  document.querySelector("#announcer").textContent = message;
}
function openDialog(mode) {
  const opener = document.activeElement;
  const root = document.querySelector("#dialog-root");
  const current = state.manual.find((f) => f.id === state.selected);
  root.innerHTML = `<dialog aria-labelledby="dialog-title"><div class="dialog-heading"><div><p class="eyebrow">REGISTRO MANUAL</p><h2 id="dialog-title">${mode === "update" ? "Nuevo recuento de plazas" : "Registrar vuelo y plazas"}</h2></div><button class="close-button" type="button" aria-label="Cerrar">${icon("close")}</button></div><p>Introduce la cifra observada y VuelaLibre guardará una nueva consulta en este navegador.</p><form id="record-form">${mode === "add" ? '<label>Número de vuelo<input name="flightNumber" placeholder="UX1234" maxlength="20" required></label><label>Hora de salida<input name="departure" type="time" required></label>' : `<p class="dialog-context">${escape(current?.flightNumber ?? "")} · ${route()} · ${state.date}</p>`}<label>Plazas libres observadas<input name="count" type="number" min="0" max="999" required></label><p id="form-error" class="form-error" role="alert"></p><button class="button primary" type="submit">Guardar recuento</button></form></dialog>`;
  const dialog = root.querySelector("dialog");
  dialog.querySelector(".close-button").onclick = () => dialog.close();
  dialog.addEventListener("close", () => {
    root.innerHTML = "";
    if (opener?.isConnected) opener.focus();
    else document.querySelector("#main").focus();
  });
  dialog.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target),
      snapshot = {
        at: new Date().toISOString(),
        count: Number(data.get("count")),
        source: "manual",
      };
    if (mode === "update") {
      if (!current) return;
      current.snapshots.push(snapshot);
    } else {
      const flight = {
        id: crypto.randomUUID(),
        source: "manual",
        airline: "Air Europa",
        origin: state.origin,
        destination: state.destination,
        date: state.date,
        flightNumber: String(data.get("flightNumber")).trim().toUpperCase(),
        departure: data.get("departure"),
        snapshots: [snapshot],
      };
      if (!isValidFlight(flight)) {
        dialog.querySelector("#form-error").textContent =
          "Revisa los datos del vuelo.";
        return;
      }
      state.manual.push(flight);
      state.selected = flight.id;
    }
    state.notice = saveFlights(state.manual)
      ? "Recuento guardado localmente."
      : "El navegador no pudo guardar el recuento; durará solo esta sesión.";
    dialog.close();
    render();
    announce(state.notice);
  };
  dialog.showModal();
}
app.addEventListener("submit", (e) => {
  if (e.target.id !== "search-form") return;
  e.preventDefault();
  const data = new FormData(e.target);
  const origin = String(data.get("origin")).trim().toUpperCase(),
    destination = String(data.get("destination")).trim().toUpperCase();
  if (origin === destination) {
    state.notice = "Origen y destino deben ser distintos.";
    render();
    announce(state.notice);
    return;
  }
  Object.assign(state, {
    origin,
    destination,
    date: data.get("date"),
    selected: null,
    notice: "",
  });
  render();
});
app.addEventListener("click", (e) => {
  if (e.target.closest('[data-action="add"]')) {
    openDialog("add");
    return;
  }
  if (e.target.closest('[data-action="update"]')) {
    openDialog("update");
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
loadFlights().then((flights) => {
  state.demo = flights;
  state.loading = false;
  render();
});
