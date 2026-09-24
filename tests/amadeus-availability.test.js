import test from "node:test";
import assert from "node:assert/strict";
import { findAirEuropaAvailability } from "../src/data/amadeus-availability.js";

test("finds a direct UX flight and rejects codeshares and connections", () => {
  const direct = {
    carrierCode: "UX",
    number: "1234",
    departure: { iataCode: "MAD", at: "2026-10-15T12:00:00" },
    arrival: { iataCode: "PMI", at: "2026-10-15T13:15:00" },
    availabilityClasses: [{ class: "Y", numberOfBookableSeats: 9 }],
  };
  const query = {
    origin: "MAD",
    destination: "PMI",
    date: "2026-10-15",
    flightNumber: "UX1234",
  };
  const response = {
    data: [
      { segments: [{ ...direct, operating: { carrierCode: "IB" } }] },
      { segments: [direct, direct] },
      { segments: [direct] },
    ],
  };
  assert.deepEqual(findAirEuropaAvailability(response, query)?.fareClasses, [
    { class: "Y", numberOfBookableSeats: 9 },
  ]);
  assert.equal(findAirEuropaAvailability({ data: [] }, query), null);
});
