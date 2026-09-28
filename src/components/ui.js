export const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export const icon = (name, className = "") => {
  const paths = {
    plane: '<path d="m21 3-7 18-3-8-8-3 18-7Z"/><path d="m11 13 10-10"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    users:
      '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m14-17a4 4 0 0 1 0 8M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    refresh:
      '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5 9a8 8 0 0 1 14-2M19 15a8 8 0 0 1-14 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    shield: '<path d="M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5Z"/>',
  };
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
};
export const formatStamp = (stamp) => {
  const time = Date.parse(stamp);
  return Number.isNaN(time)
    ? "Sin fecha"
    : new Intl.DateTimeFormat("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(time) + " UTC";
};
/**
 * Formats a naive local datetime (e.g. an airport departure with no UTC
 * offset, as returned by GDS availability responses) without reinterpreting
 * it through the browser's own timezone, unlike Date.parse + formatStamp.
 */
export const formatLocalStamp = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(
    String(value ?? ""),
  );
  if (!match) return "Sin fecha";
  const [, y, mo, d, h = "00", mi = "00"] = match;
  const time = Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
  );
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(time);
};
