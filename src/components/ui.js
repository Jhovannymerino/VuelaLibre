export const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export const icon = (name, cls = "") => {
  const paths = {
    plane: '<path d="m21 3-7 18-3-8-8-3 18-7Z"/><path d="m11 13 10-10"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    history: '<path d="M3 11a9 9 0 1 1 3 8M3 4v7h7"/><path d="M12 7v5l3 2"/>',
    bookmark: '<path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4Z"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
  };
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
};
export const badge = (text, tone = "neutral") =>
  `<span class="badge ${tone}">${escape(text)}</span>`;
export const button = (label, action, variant = "secondary", glyph = "") =>
  `<button class="button ${variant}" data-action="${action}">${glyph ? icon(glyph) : ""}${escape(label)}</button>`;
export const kpiCard = ({
  label,
  value,
  description,
  detail,
  tone = "neutral",
  trend,
}) =>
  `<article class="kpi card"><div class="kpi-label">${escape(label)}${icon("info")}</div><div class="kpi-value ${tone}">${escape(value)}</div><p>${escape(description)}</p><div class="kpi-footer">${trend ? sparkline(trend, tone) : icon("check")}<span>${escape(detail)}</span></div></article>`;
export function sparkline(values, tone = "good") {
  return `<svg class="sparkline ${tone}" viewBox="0 0 80 28" role="img" aria-label="Tendencia: ${values.join(", ")}"><polyline points="${values.map((v, i) => `${(i * 80) / (values.length - 1)},${26 - v * 0.24}`).join(" ")}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
export const emptyState = (title, detail, action = "") =>
  `<section class="empty card">${icon("plane")}<h2>${escape(title)}</h2><p>${escape(detail)}</p>${action}</section>`;
export const sectionHeading = (eyebrow, title, trailing = "") =>
  `<div class="section-heading"><div><p class="eyebrow">${escape(eyebrow)}</p><h2>${escape(title)}</h2></div>${trailing}</div>`;
