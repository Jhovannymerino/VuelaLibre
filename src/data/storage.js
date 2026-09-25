import { isValidFlight } from "../domain/availability.js";
const KEY = "vuelalibre:availability-pilot:v1";
export function readFlights(storage = localStorage) {
  try {
    const data = JSON.parse(storage.getItem(KEY));
    return Array.isArray(data)
      ? data.filter((f) => f.source === "manual" && isValidFlight(f))
      : [];
  } catch {
    return [];
  }
}
export function saveFlights(flights, storage = localStorage) {
  try {
    storage.setItem(KEY, JSON.stringify(flights));
    return true;
  } catch {
    return false;
  }
}
