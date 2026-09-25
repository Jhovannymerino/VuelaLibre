import { findAirEuropaFlights } from "../src/data/amadeus-availability.js";
import { assessMarketSignal } from "../src/domain/market-signal.js";
import { AmadeusError } from "./amadeus-client.js";

const IATA = /^[A-Z]{3}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_THRESHOLD = 5;

/** Validates GET /api/market query params. Returns {errors, threshold}. */
export function validateQuery({ origin, destination, date, threshold }) {
  const errors = [];
  if (!IATA.test(origin ?? ""))
    errors.push("origin debe ser un código IATA de 3 letras");
  if (!IATA.test(destination ?? ""))
    errors.push("destination debe ser un código IATA de 3 letras");
  if (origin && destination && origin === destination)
    errors.push("origin y destination deben ser distintos");
  if (!DATE.test(date ?? "")) errors.push("date debe tener formato AAAA-MM-DD");
  const parsedThreshold =
    threshold === undefined || threshold === null || threshold === ""
      ? DEFAULT_THRESHOLD
      : Number(threshold);
  if (
    !Number.isInteger(parsedThreshold) ||
    parsedThreshold < 0 ||
    parsedThreshold > 8
  )
    errors.push(
      "threshold debe ser un entero entre 0 y 8 (9 ya representa '9 o más' en Amadeus)",
    );
  return { errors, threshold: parsedThreshold };
}

function flightKey({ flightNumber, origin, destination, date }) {
  return `${flightNumber}:${origin}${destination}:${date}`;
}

/**
 * Orchestrates one /api/market request: calls Amadeus (if configured),
 * derives the commercial signal per flight, and persists/reads history.
 * Never invents flights: no credentials or no Amadeus match both return
 * an explicit, honest empty result.
 */
export async function buildMarketResponse({
  origin,
  destination,
  date,
  threshold,
  amadeusClient,
  store,
  publicSchedule,
}) {
  if (!amadeusClient.configured) {
    if (publicSchedule) {
      const scheduled = await publicSchedule.findFlights({
        origin,
        destination,
        date,
      });
      const flights = scheduled.map((flight) => {
        const key = flightKey({
          flightNumber: flight.flightNumber,
          origin,
          destination,
          date,
        });
        return {
          id: key,
          flightNumber: flight.flightNumber,
          origin,
          destination,
          date,
          departure: flight.departure,
          observedAt: new Date().toISOString(),
          fareClasses: [],
          signal: assessMarketSignal({ threshold, fareClasses: [] }),
          history: [],
          sourceUrl: flight.sourceUrl,
          availabilityKnown: false,
        };
      });
      return {
        status: 200,
        body: {
          configured: true,
          source: publicSchedule.source,
          flights,
          message: flights.length
            ? "Horarios públicos encontrados. Esta fuente no publica plazas libres ni cupos staff."
            : "No hay un horario UX publicado para esa ruta y fecha en la fuente pública consultada.",
        },
      };
    }
    return {
      status: 200,
      body: {
        configured: false,
        source: "not_configured",
        flights: [],
        message:
          "Faltan AMADEUS_CLIENT_ID/AMADEUS_CLIENT_SECRET en el servidor; no se consulta ninguna API ni se inventan vuelos.",
      },
    };
  }

  let response;
  try {
    response = await amadeusClient.searchAvailability({
      origin,
      destination,
      date,
    });
  } catch (error) {
    const status =
      error instanceof AmadeusError && error.status === 429 ? 429 : 502;
    return {
      status,
      body: {
        configured: true,
        source: amadeusClient.source,
        flights: [],
        message: `No se pudo consultar Amadeus: ${error.message}`,
      },
    };
  }

  const matches = findAirEuropaFlights(response, { origin, destination, date });
  const observedAt = new Date().toISOString();
  const flights = matches.map((flight) => {
    const key = flightKey({
      flightNumber: flight.flightNumber,
      origin,
      destination,
      date,
    });
    const priorHistory = store.getHistory(key);
    const previousCommercialCount = priorHistory.length
      ? priorHistory[priorHistory.length - 1].commercialCount
      : null;
    const signal = assessMarketSignal({
      threshold,
      fareClasses: flight.fareClasses,
      previousCommercialCount,
    });
    const history = store.appendSnapshot(key, {
      observedAt,
      commercialCount: signal.commercialCount,
      commercialCountCapped: signal.commercialCountCapped,
    });
    return {
      id: key,
      flightNumber: flight.flightNumber,
      origin,
      destination,
      date,
      departure: flight.departureAt,
      observedAt,
      fareClasses: flight.fareClasses,
      signal,
      history,
    };
  });

  return {
    status: 200,
    body: {
      configured: true,
      source: amadeusClient.source,
      flights,
      message: flights.length
        ? `${flights.length} ${flights.length === 1 ? "vuelo directo UX encontrado" : "vuelos directos UX encontrados"}.`
        : "Sin datos de este vuelo: Amadeus no devolvió vuelos directos UX para esa ruta y fecha.",
    },
  };
}
