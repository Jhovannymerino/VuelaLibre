function directUxSegment(item) {
  if (item.segments?.length !== 1) return null;
  const segment = item.segments[0];
  if (
    segment.carrierCode !== "UX" ||
    (segment.operating?.carrierCode && segment.operating.carrierCode !== "UX")
  )
    return null;
  return segment;
}

function matchesRoute(segment, { origin, destination, date }) {
  return (
    segment.departure?.iataCode === origin &&
    segment.arrival?.iataCode === destination &&
    segment.departure?.at?.slice(0, 10) === date
  );
}

function toFlight(segment) {
  return {
    operatingCarrier: segment.operating?.carrierCode ?? "UX",
    marketingCarrier: segment.carrierCode,
    flightNumber: `UX${segment.number}`,
    origin: segment.departure.iataCode,
    destination: segment.arrival.iataCode,
    departureDate: segment.departure.at?.slice(0, 10),
    departureAt: segment.departure.at,
    fareClasses: (segment.availabilityClasses ?? []).map((item) => ({
      class: item.class,
      numberOfBookableSeats: item.numberOfBookableSeats,
    })),
  };
}

/** Extract a direct UX service from an Amadeus Flight Availabilities response. */
export function findAirEuropaAvailability(
  response,
  { origin, destination, date, flightNumber },
) {
  const number = flightNumber.replace(/^UX/i, "");
  for (const item of response.data ?? []) {
    const segment = directUxSegment(item);
    if (!segment) continue;
    if (String(segment.number) !== number) continue;
    if (!matchesRoute(segment, { origin, destination, date })) continue;
    return toFlight(segment);
  }
  return null;
}

/** Extract every direct UX service on a route/date from an Amadeus Flight Availabilities response. */
export function findAirEuropaFlights(response, { origin, destination, date }) {
  const flights = [];
  for (const item of response.data ?? []) {
    const segment = directUxSegment(item);
    if (!segment) continue;
    if (!matchesRoute(segment, { origin, destination, date })) continue;
    flights.push(toFlight(segment));
  }
  return flights;
}
