/** Extract a direct UX service from an Amadeus Flight Availabilities response. */
export function findAirEuropaAvailability(
  response,
  { origin, destination, date, flightNumber },
) {
  const number = flightNumber.replace(/^UX/i, "");
  for (const item of response.data ?? []) {
    if (item.segments?.length !== 1) continue;
    const segment = item.segments[0];
    if (
      segment.carrierCode !== "UX" ||
      (segment.operating?.carrierCode &&
        segment.operating.carrierCode !== "UX") ||
      String(segment.number) !== number ||
      segment.departure?.iataCode !== origin ||
      segment.arrival?.iataCode !== destination ||
      segment.departure?.at?.slice(0, 10) !== date
    )
      continue;
    return {
      operatingCarrier: segment.operating?.carrierCode ?? "UX",
      marketingCarrier: segment.carrierCode,
      flightNumber: `UX${number}`,
      origin,
      destination,
      departureDate: date,
      departureAt: segment.departure.at,
      fareClasses: (segment.availabilityClasses ?? []).map((item) => ({
        class: item.class,
        numberOfBookableSeats: item.numberOfBookableSeats,
      })),
    };
  }
  return null;
}
