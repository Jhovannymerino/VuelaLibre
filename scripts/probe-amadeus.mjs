import { findAirEuropaAvailability } from "../src/data/amadeus-availability.js";
import { assessMarketSignal } from "../src/domain/market-signal.js";

const [flightNumber, date, origin, destination, rawThreshold = "5"] =
  process.argv.slice(2);
const threshold = Number(rawThreshold);
if (
  !/^UX\d{1,4}$/i.test(flightNumber ?? "") ||
  !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ||
  !/^[A-Z]{3}$/.test(origin ?? "") ||
  !/^[A-Z]{3}$/.test(destination ?? "") ||
  !Number.isInteger(threshold) ||
  threshold < 0
) {
  process.stderr.write(
    "Uso: node scripts/probe-amadeus.mjs UX1234 AAAA-MM-DD MAD PMI [X]\n",
  );
  process.exit(2);
}
const clientId = process.env.AMADEUS_CLIENT_ID;
const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  process.stderr.write("Faltan AMADEUS_CLIENT_ID y AMADEUS_CLIENT_SECRET.\n");
  process.exit(2);
}
const base =
  process.env.AMADEUS_ENV === "production"
    ? "https://api.amadeus.com"
    : "https://test.api.amadeus.com";

async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok)
    throw new Error(`Amadeus respondió HTTP ${response.status}`);
  return response.json();
}

try {
  const credentials = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });
  const token = await requestJson(`${base}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: credentials,
  });
  const body = {
    originDestinations: [
      {
        id: "1",
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDateTime: { date },
      },
    ],
    travelers: [{ id: "1", travelerType: "ADULT" }],
    sources: ["GDS"],
  };
  const response = await requestJson(
    `${base}/v1/shopping/availability/flight-availabilities`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const flight = findAirEuropaAvailability(response, {
    origin,
    destination,
    date,
    flightNumber,
  });
  const result = {
    observedAt: new Date().toISOString(),
    source: `amadeus-${process.env.AMADEUS_ENV === "production" ? "production" : "test-cache"}`,
    query: { flightNumber, date, origin, destination },
    flight,
    signal: assessMarketSignal({
      threshold,
      fareClasses: flight?.fareClasses ?? [],
    }),
  };
  process.stdout.write(`${JSON.stringify(result)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
