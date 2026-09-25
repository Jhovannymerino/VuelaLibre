const ROUTE = (origin, destination) =>
  `https://2lnr.com/routes/${origin.toLowerCase()}-${destination.toLowerCase()}.md`;

function strip(value) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .trim();
}

/**
 * Reads the public, human-readable schedule published by 2LNR. It contains
 * scheduled UX services, but deliberately does not turn schedule rows into
 * availability. This is a no-account fallback for route/date discovery.
 */
export function parsePublicSchedule(markdown, { origin, destination, date }) {
  const rows = [];
  const htmlRows = markdown.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  for (const row of htmlRows) {
    const time = row.match(/<time[^>]+datetime="(\d{4}-\d{2}-\d{2})"[^>]*>/i);
    if (!time || time[1] !== date || !/Air Europa/i.test(row)) continue;
    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(
      (m) => strip(m[1]),
    );
    const flight = cells.find((cell) => /^UX\s*\d+$/i.test(cell));
    if (!flight) continue;
    const flightNumber = flight.replace(/\s+/g, "").toUpperCase();
    const departure = cells.find(
      (cell, index) => index > 1 && /^\d{2}:\d{2}$/.test(cell),
    );
    rows.push({
      flightNumber,
      origin,
      destination,
      date,
      departure: departure ? `${date}T${departure}:00` : null,
      sourceUrl: `https://2lnr.com/routes/${origin.toLowerCase()}-${destination.toLowerCase()}`,
    });
  }
  if (rows.length) return rows;
  const target = new Date(`${date}T00:00:00Z`);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const targetLabel = `${months[target.getUTCMonth()]} ${target.getUTCDate()}`;
  for (const line of markdown.split(/\r?\n/)) {
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 5 || !cells[0].includes(targetLabel)) continue;
    const flight = cells[1].replace(/\s+/g, "").toUpperCase();
    if (!/^UX\d+$/.test(flight) || !/^Air Europa$/i.test(cells[2])) continue;
    rows.push({
      flightNumber: flight,
      origin,
      destination,
      date,
      departure: /^\d{2}:\d{2}$/.test(cells[3])
        ? `${date}T${cells[3]}:00`
        : null,
      sourceUrl: `https://2lnr.com/routes/${origin.toLowerCase()}-${destination.toLowerCase()}`,
    });
  }
  return rows;
}

export function createPublicScheduleClient({ fetchImpl = fetch } = {}) {
  return {
    source: "public-2lnr-schedule",
    async findFlights({ origin, destination, date }) {
      const response = await fetchImpl(ROUTE(origin, destination), {
        headers: { accept: "text/markdown,text/html;q=0.9" },
      });
      if (!response.ok) return [];
      return parsePublicSchedule(await response.text(), {
        origin,
        destination,
        date,
      });
    },
  };
}
