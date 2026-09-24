import { cabins } from "../data/demo.js";
import { STATES, groupsOf, isAvailable } from "../domain/analysis.js";
import { escape, icon, sectionHeading, badge } from "./ui.js";
export const layers = {
  availability: "Disponibilidad",
  quality: "Calidad",
  groups: "Parejas / grupos",
  price: "Precio",
  recommended: "Recomendados",
};
export function seatMap(seats, cabin, layer, selected, zoom) {
  const config = cabins[cabin];
  const together = new Set(
    groupsOf(seats)
      .flat()
      .map((s) => s.id),
  );
  const legend =
    layer === "quality"
      ? [
          ["quality-good", "Buena"],
          ["quality-medium", "Regular"],
          ["quality-poor", "Menor calidad"],
          ["muted", "No disponible"],
        ]
      : layer === "groups"
        ? [
            ["grouped", "Contiguos disponibles"],
            ["muted", "Sin grupo disponible"],
          ]
        : layer === "recommended"
          ? [
              ["recommended", "Recomendado disponible"],
              ["muted", "Otras opciones"],
            ]
          : layer === "price"
            ? [
                ["available", "Precio en EUR"],
                ["muted", "— No disponible / sin precio"],
              ]
            : [
                ["available", "Disponible"],
                ["occupied", "Ocupado aparente"],
                ["blocked", "Bloqueado"],
                ["premium", "Premium"],
                ["recommended", "Recomendado"],
                ["unknown", "Desconocido"],
              ];
  const seatButton = (s) => {
    const free = isAvailable(s);
    let style = s.status;
    let symbol =
      s.status === "occupied"
        ? "×"
        : s.status === "blocked"
          ? "—"
          : s.status === "unknown"
            ? "?"
            : s.recommended
              ? "✧"
              : "";
    if (layer === "quality") {
      style = free
        ? s.quality >= 75
          ? "quality-good"
          : s.quality >= 50
            ? "quality-medium"
            : "quality-poor"
        : "muted";
      symbol = free
        ? s.quality >= 75
          ? "●"
          : s.quality >= 50
            ? "◐"
            : "○"
        : "×";
    }
    if (layer === "groups") {
      style = together.has(s.id) ? "grouped" : "muted";
      symbol = together.has(s.id) ? "↔" : "·";
    }
    if (layer === "price") {
      style = free ? s.status : "muted";
      symbol = free && s.price !== null ? `${s.price}€` : "—";
    }
    if (layer === "recommended") {
      style = free && s.recommended ? "recommended" : "muted";
      symbol = free && s.recommended ? "✧" : "·";
    }
    const label = `${s.id}, ${s.type}, ${STATES[s.status]}${free && s.recommended ? ", recomendado" : ""}${free && s.price !== null ? `, ${s.price} euros` : ""}`;
    return `<button class="seat ${style} ${layer === "availability" && free && s.recommended ? "outline" : ""} ${s.id === selected ? "selected" : ""}" data-seat="${s.id}" aria-label="${escape(label)}" aria-pressed="${s.id === selected}" title="${escape(label)}"><span>${escape(symbol)}</span><small>${s.id}</small></button>`;
  };
  const rows = [...new Set(seats.map((s) => s.row))]
    .map(
      (row) =>
        `<div class="seat-row">${seats
          .filter((s) => s.row === row && s.block === 0)
          .map(seatButton)
          .join("")}<span class="row-number">${row}</span>${seats
          .filter((s) => s.row === row && s.block === 1)
          .map(seatButton)
          .join("")}</div>`,
    )
    .map(
      (html, i) =>
        (cabin === "economy" && i === 6
          ? '<div class="exit-line"><span>↖ SALIDA</span><span>SALIDA ↗</span></div>'
          : "") + html,
    )
    .join("");
  return `<section class="card map-card" id="map-panel" aria-label="Mapa de asientos">${sectionHeading("EXPLORA TU CABINA", "Un buen asiento cambia el viaje", badge(`${seats.length} asientos · ${config.name}`))}<div class="layer-switch" role="group" aria-label="Capa del mapa">${Object.entries(
    layers,
  )
    .map(
      ([key, label]) =>
        `<button data-layer="${key}" class="${key === layer ? "active" : ""}" aria-pressed="${key === layer}">${label}</button>`,
    )
    .join(
      "",
    )}</div><div class="map-toolbar"><span>${icon("info")} Selecciona un asiento para ver el detalle</span><button class="text-button" data-action="zoom" aria-pressed="${zoom}">${zoom ? "− Reducir" : "+ Ampliar"}</button></div><div class="map-scroll" tabindex="0" aria-label="Cabina desplazable horizontalmente"><div class="aircraft ${zoom ? "zoomed" : ""}" style="--block-size:${config.blocks[0].length}"><div class="aircraft-nose"><span>FRENTE DEL AVIÓN</span>${icon("plane")}</div><div class="facilities"><span>WC</span><span>Galley · cocina</span><span>WC</span></div><div class="bulkhead">Mampara · inicio de cabina</div><div class="seat-row column-labels">${[...config.blocks[0]].map((l) => `<span>${l}</span>`).join("")}<span></span>${[...config.blocks[1]].map((l) => `<span>${l}</span>`).join("")}</div>${rows}<div class="bulkhead">Fin de cabina${cabin === "economy" ? " · zona de mayor tránsito" : ""}</div><div class="facilities"><span>WC</span><span>Galley · cocina</span><span>WC</span></div>${cabin === "economy" ? '<span class="wing left-wing">ALA</span><span class="wing right-wing">ALA</span>' : ""}</div></div><div class="legend">${legend.map(([key, name]) => `<span><i class="legend-seat ${key}"></i>${name}</span>`).join("")}</div><p class="map-note">Plano ilustrativo. Ocupado aparente no significa billete vendido. Los bloqueos y estados desconocidos no permiten inferir ocupación.</p></section>`;
}
