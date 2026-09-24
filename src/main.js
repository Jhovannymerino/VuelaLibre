import "./styles/tokens.css";
import "./styles/app.css";
import { flight, cabins, loadFlight } from "./data/demo.js";
import { readStore, saveStore } from "./data/storage.js";
import { analyze, STATES, isAvailable } from "./domain/analysis.js";
import {
  escape,
  icon,
  badge,
  button,
  emptyState,
  sectionHeading,
} from "./components/ui.js";
import { seatMap } from "./components/seat-map.js";
import {
  hero,
  kpis,
  recommendationPanel,
  historyPanel,
  distribution,
  alertTypes,
} from "./components/dashboard.js";

const app = document.querySelector("#app");
const state = {
  page: "dashboard",
  cabin: "economy",
  layer: "availability",
  tab: "map",
  selected: null,
  zoom: false,
  mode: "ready",
  loading: true,
  error: false,
  seats: [],
  history: [],
  store: readStore(),
  notice: "",
};
let request = 0;
const navigation = [
  ["dashboard", "Dashboard", "grid"],
  ["history", "Historial", "history"],
  ["watchlist", "Watchlist", "bookmark"],
  ["alerts", "Alertas", "bell"],
  ["profile", "Perfil", "user"],
];
function announce(message) {
  document.querySelector("#announcer").textContent = message;
}
function persist(message) {
  const ok = saveStore(state.store);
  state.notice = ok
    ? message
    : "No se pudo guardar en este navegador. Los cambios solo durarán esta sesión.";
  announce(state.notice);
  return ok;
}
function shell(content) {
  return `<aside class="sidebar"><a href="#dashboard" class="brand" data-nav="dashboard"><span class="brand-mark">${icon("plane")}</span>VuelaLibre<span class="brand-dot">.</span></a><p class="sidebar-label">TU ESPACIO DE VIAJE</p><nav aria-label="Navegación principal">${navigation.map(([id, label, glyph]) => `<a href="#${id}" data-nav="${id}" ${state.page === id ? 'aria-current="page"' : ""}>${icon(glyph)}<span>${label}</span>${id === "alerts" && state.store.alerts.length ? `<span class="nav-count">${state.store.alerts.length}</span>` : ""}</a>`).join("")}</nav><div class="sidebar-bottom"><div class="sidebar-tip">${icon("spark")}<strong>Viaja con más contexto.</strong><p>Las mejores decisiones empiezan antes de despegar.</p></div><button class="profile-button" data-nav="profile"><span class="avatar">V</span><span>Viajero invitado<small>Espacio local · Demo</small></span>${icon("chevron")}</button></div></aside><div class="workspace"><header class="topbar"><div><span class="breadcrumb">Mi espacio <span>/</span></span><strong>${navigation.find((n) => n[0] === state.page)[1]}</strong></div><div class="topbar-right">${badge("DEMO · DATOS SIMULADOS", "demo")}<button class="icon-button" data-nav="alerts" aria-label="Ver alertas">${icon("bell")}</button><button class="avatar" data-nav="profile" aria-label="Ver perfil">V</button></div></header><div class="flight-context"><div class="flight-identity"><span class="airline-logo" aria-label="Iberia">IB</span><div><strong>${flight.airline} <span>${flight.number}</span></strong><small>${flight.aircraft} · plano ilustrativo</small></div></div><div class="flight-route"><strong>${flight.origin} <span>→</span> ${flight.destination}</strong><small>${flight.date} · ${flight.departure} (Madrid)</small></div><label class="cabin-select"><span>Cabina</span><select id="cabin" aria-label="Cabina">${Object.entries(
    cabins,
  )
    .map(
      ([key, c]) =>
        `<option value="${key}" ${key === state.cabin ? "selected" : ""}>${c.name}</option>`,
    )
    .join(
      "",
    )}</select></label><div class="updated">${icon("clock")}<span>Snapshot de ejemplo<small>24 sep 2026 · 10:42 UTC</small></span></div><button class="button secondary save-button" data-action="save" aria-pressed="${state.store.saved}">${icon(state.store.saved ? "check" : "bookmark")}<span>${state.store.saved ? "Vuelo guardado" : "Guardar vuelo"}</span></button></div><main id="main" tabindex="-1">${state.notice ? `<div class="notice" role="status">${escape(state.notice)}<button class="icon-button" data-action="dismiss" aria-label="Cerrar aviso">${icon("close")}</button></div>` : ""}${content}<footer class="footer"><span>VuelaLibre · Compra con contexto.</span><span>Demo local. Sin reservas ni seguimiento en segundo plano.</span></footer></main><div class="mobile-cta">${button("Crear alerta", "alert", "primary", "bell")}${button(state.store.saved ? "Guardado" : "Guardar vuelo", "save", "secondary", "bookmark")}</div></div>`;
}
function dashboard() {
  const controls = `<div class="page-intro"><div><p class="eyebrow">MADRID → LISBOA</p><p>Tu próxima decisión, un poco más clara.</p></div><label class="demo-select">Escenario demo<select id="scenario" aria-label="Escenario demo">${[
    ["ready", "Normal"],
    ["low", "Confianza baja"],
    ["empty", "Sin datos"],
    ["error", "Error de carga"],
  ]
    .map(
      ([value, label]) =>
        `<option value="${value}" ${state.mode === value ? "selected" : ""}>${label}</option>`,
    )
    .join("")}</select></label></div>`;
  if (state.loading)
    return `${controls}<section aria-busy="true" aria-label="Cargando disponibilidad"><p role="status">Analizando disponibilidad visible…</p><div class="skeleton hero-skeleton"></div><div class="kpi-grid">${Array.from({ length: 5 }, () => '<div class="skeleton kpi-skeleton"></div>').join("")}</div><div class="skeleton map-skeleton"></div></section>`;
  if (state.error || !state.seats.length)
    return `${controls}${emptyState(state.error ? "No pudimos cargar el análisis" : "No fue posible obtener el mapa de asientos para este vuelo en este momento", "Algunas aerolíneas o flujos pueden limitar la visualización del mapa. Esta demo permite reintentar con el escenario normal.", button("Intentar nuevamente", "retry", "primary"))}`;
  const metrics = analyze(state.seats);
  return `${controls}${metrics.confidence === "low" ? `<div class="confidence" role="status">${icon("info")}<div><strong>Resultado con confianza baja</strong><p>Mapa parcial o estados ambiguos. Visibilidad: ${metrics.seatVisibilityRatio}%. La estimación no permite confirmar la ocupación real.</p></div>${button("Crear alerta y volver a revisar", "alert")}</div>` : ""}${hero(metrics)}${kpis(metrics, state.history)}<div class="mobile-tabs" role="group" aria-label="Sección del dashboard">${[
    ["map", "Mapa"],
    ["recommendations", "Recomendaciones"],
    ["history", "Historial"],
  ]
    .map(
      ([key, label]) =>
        `<button data-tab="${key}" aria-pressed="${state.tab === key}" class="${state.tab === key ? "active" : ""}">${label}</button>`,
    )
    .join(
      "",
    )}</div><div class="analysis-layout tab-${state.tab}"><div class="map-column">${seatMap(state.seats, state.cabin, state.layer, state.selected, state.zoom)}<div class="distribution-card card"><span class="eyebrow">EL MAPA DE UN VISTAZO</span>${distribution(state.seats)}<p>${metrics.available.length} disponibles · ${metrics.seatVisibilityRatio}% de estados visibles · confianza ${metrics.confidence === "high" ? "alta" : "baja"} en la lectura del mapa</p></div></div>${recommendationPanel(state.seats, metrics)}<div class="history-slot">${historyPanel(state.history)}</div></div><details class="methodology"><summary>Cómo interpretar estas señales</summary><p>La ocupación aparente divide los ocupados entre ocupados y disponibles; excluye bloqueados y desconocidos. El score pondera cantidad y calidad de asientos disponibles. El indicador de contigüidad mide qué proporción de disponibles pertenece a un par; no es una probabilidad estadística. Las recomendaciones usan reglas de demostración, sin predecir precios ni confirmar ventas. Visibilidad alta significa que conocemos el estado mostrado, no la ocupación real.</p></details>`;
}
function pageContent() {
  if (state.page === "dashboard") return dashboard();
  if (state.page === "history")
    return `<h1>Historial del vuelo</h1>${state.loading ? '<p role="status">Cargando historial…</p>' : state.history.length ? historyPanel(state.history, true) : emptyState("Sin snapshots disponibles", "Vuelve al dashboard y prueba el escenario normal.", button("Volver al dashboard", "dashboard"))}`;
  if (state.page === "watchlist")
    return `<h1>Tu watchlist</h1><p class="page-description">Vuelos que quieres volver a mirar. Guardados solo en este navegador.</p>${state.store.saved ? `<article class="card saved-flight"><span class="small-icon">${icon("plane")}</span><div><h2>MAD → LIS</h2><p>Iberia IB539 · ${flight.date}</p><small>Consulta las opciones visibles de tu vuelo de ejemplo.</small></div>${button("Ver dashboard", "dashboard", "primary")}${button("Quitar vuelo", "save")}</article>` : emptyState("Un lugar para tus próximos vuelos", "Guarda el vuelo del dashboard para encontrarlo aquí.", button("Explorar mi vuelo", "dashboard", "primary"))}`;
  if (state.page === "alerts")
    return `<h1>Tus alertas</h1><p class="page-description">Reglas locales de demostración. No se envían correos ni se consulta el vuelo en segundo plano.</p>${button("Crear alerta", "alert", "primary", "bell")}<div class="alert-list">${state.store.alerts.length ? state.store.alerts.map((a) => `<article class="card alert-card"><span class="small-icon">${icon("bell")}</span><div><h2>${alertTypes[a.type]}</h2><p>IB539 · MAD → LIS · ${cabins[a.cabin].name}</p>${badge("Guardada localmente · sin monitoreo", "demo")}</div><button class="button secondary" data-remove-alert="${escape(a.id)}">Eliminar</button></article>`).join("") : emptyState("Todavía no tienes alertas", "Elige qué cambio quieres revisar en tu próximo chequeo.")}</div>`;
  return `<h1>Tu perfil de viaje</h1><p class="page-description">Personaliza tu espacio local. No hay una cuenta ni sincronización entre dispositivos.</p><section class="card profile-card">${sectionHeading("VIAJERO INVITADO", "Tus preferencias")}<form id="profile-form"><label>Preferencia de asiento<select name="preference">${["Ventana", "Pasillo", "Sin preferencia"].map((p) => `<option ${state.store.preference === p ? "selected" : ""}>${p}</option>`).join("")}</select></label><p>Se guarda para tus próximas visitas. El panel muestra siempre todas las categorías de recomendaciones.</p><button class="button primary" type="submit">Guardar preferencia</button></form></section>`;
}
function render() {
  app.innerHTML = shell(pageContent());
}
async function refresh() {
  const current = ++request;
  state.loading = true;
  state.error = false;
  state.selected = null;
  render();
  try {
    const data = await loadFlight(state.cabin, state.mode);
    if (current !== request) return;
    Object.assign(state, data);
  } catch {
    if (current !== request) return;
    state.error = true;
    state.seats = [];
    state.history = [];
  }
  state.loading = false;
  render();
  announce(
    state.error
      ? "Error al cargar el análisis."
      : state.seats.length
        ? "Análisis del vuelo disponible."
        : "Sin datos del vuelo.",
  );
}
function navigate(page) {
  state.page = navigation.some((n) => n[0] === page) ? page : "dashboard";
  history.replaceState(null, "", `#${state.page}`);
  render();
  document.querySelector("#main").focus();
  window.scrollTo(0, 0);
}
function dialog(content, label, onSubmit) {
  const root = document.querySelector("#dialog-root");
  const opener = document.activeElement;
  root.innerHTML = `<dialog aria-labelledby="dialog-title"><div class="dialog-heading"><h2 id="dialog-title">${label}</h2><button class="icon-button" data-close aria-label="Cerrar">${icon("close")}</button></div>${content}</dialog>`;
  const el = root.querySelector("dialog");
  el.querySelector("[data-close]").onclick = () => el.close();
  el.addEventListener("click", (e) => {
    if (e.target === el) {
      const r = el.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        el.close();
    }
  });
  el.addEventListener("close", () => {
    root.innerHTML = "";
    if (opener?.isConnected) opener.focus();
    else document.querySelector("#main").focus();
  });
  if (onSubmit)
    el.querySelector("form").onsubmit = (e) => {
      e.preventDefault();
      onSubmit(new FormData(e.target), el);
    };
  el.showModal();
}
function openAlert() {
  dialog(
    `<p>Elige el cambio que te interesa en ${cabins[state.cabin].name}.</p><form id="alert-form"><fieldset><legend>Condición de la alerta</legend>${Object.entries(
      alertTypes,
    )
      .map(
        ([key, label], i) =>
          `<label class="radio-option"><input type="radio" name="type" value="${key}" ${i === 0 ? "checked" : ""} required><span>${label}</span></label>`,
      )
      .join(
        "",
      )}</fieldset><div class="demo-disclosure">Esta regla se guarda en este navegador. La demo no supervisa cambios ni envía notificaciones.</div><p id="alert-feedback" role="status"></p><button class="button primary" type="submit">Guardar alerta local</button></form>`,
    "Crear alerta",
    (form, el) => {
      const type = form.get("type");
      if (
        state.store.alerts.some(
          (a) => a.type === type && a.cabin === state.cabin,
        )
      ) {
        document.querySelector("#alert-feedback").textContent =
          "Ya tienes esta alerta para esta cabina.";
        return;
      }
      state.store.alerts.push({
        id: crypto.randomUUID(),
        type,
        cabin: state.cabin,
        flightId: flight.id,
        createdAt: new Date().toISOString(),
      });
      persist("Alerta guardada localmente. No hay monitoreo automático.");
      render();
      el.close();
    },
  );
}
function showSeat(id) {
  const seat = state.seats.find((s) => s.id === id);
  if (!seat) return;
  state.selected = id;
  document.querySelectorAll("[data-seat].seat").forEach((el) => {
    el.classList.toggle("selected", el.dataset.seat === id);
    el.setAttribute("aria-pressed", String(el.dataset.seat === id));
  });
  dialog(
    `<div class="seat-detail-badges">${badge(STATES[seat.status], seat.status === "premium" ? "info" : "neutral")}${isAvailable(seat) && seat.recommended ? badge("Recomendado", "good") : ""}</div><dl class="seat-details"><div><dt>Tipo</dt><dd>${seat.type}</dd></div><div><dt>Cabina</dt><dd>${cabins[state.cabin].name}</dd></div><div><dt>Precio de asiento</dt><dd>${isAvailable(seat) && seat.price !== null ? `${seat.price} € · simulado` : "No disponible"}</dd></div><div><dt>Calidad de zona</dt><dd>${seat.quality >= 75 ? "Buena" : seat.quality >= 50 ? "Regular" : "Menor calidad"}</dd></div></dl><p>${seat.note}</p><p class="muted-copy">Consultar el detalle no reserva el asiento. Confirma disponibilidad y condiciones con la aerolínea.</p>`,
    `Asiento ${seat.id}`,
  );
}
app.addEventListener("click", (e) => {
  const target = e.target.closest("button, a");
  if (!target) return;
  if (target.dataset.nav) {
    e.preventDefault();
    navigate(target.dataset.nav);
    return;
  }
  if (target.dataset.seat) {
    showSeat(target.dataset.seat);
    return;
  }
  if (target.dataset.layer) {
    state.layer = target.dataset.layer;
    render();
    document.querySelector(`[data-layer="${state.layer}"]`).focus();
    return;
  }
  if (target.dataset.tab) {
    state.tab = target.dataset.tab;
    render();
    document.querySelector(`[data-tab="${state.tab}"]`).focus();
    return;
  }
  if (target.dataset.removeAlert) {
    state.store.alerts = state.store.alerts.filter(
      (a) => a.id !== target.dataset.removeAlert,
    );
    persist("Alerta eliminada.");
    render();
    document.querySelector('[data-action="alert"]').focus();
    return;
  }
  switch (target.dataset.action) {
    case "save":
      state.store.saved = !state.store.saved;
      persist(
        state.store.saved
          ? "Vuelo guardado en tu watchlist local."
          : "Vuelo eliminado de tu watchlist.",
      );
      render();
      document.querySelector('[data-action="save"]').focus();
      break;
    case "alert":
      openAlert();
      break;
    case "dashboard":
      navigate("dashboard");
      break;
    case "retry":
      state.mode = "ready";
      refresh();
      break;
    case "zoom":
      state.zoom = !state.zoom;
      render();
      document.querySelector('[data-action="zoom"]').focus();
      break;
    case "dismiss":
      state.notice = "";
      render();
      document.querySelector("#main").focus();
      break;
  }
});
app.addEventListener("change", (e) => {
  if (e.target.id === "cabin") {
    state.cabin = e.target.value;
    refresh();
  }
  if (e.target.id === "scenario") {
    state.mode = e.target.value;
    refresh();
  }
});
app.addEventListener("submit", (e) => {
  if (e.target.id === "profile-form") {
    e.preventDefault();
    state.store.preference = new FormData(e.target).get("preference");
    persist("Preferencia guardada en este navegador.");
    render();
    document.querySelector("#profile-form button").focus();
  }
});
document.querySelector(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  document.querySelector("#main").focus();
});
window.addEventListener("hashchange", () => navigate(location.hash.slice(1)));
state.page = navigation.some((n) => n[0] === location.hash.slice(1))
  ? location.hash.slice(1)
  : "dashboard";
refresh();
