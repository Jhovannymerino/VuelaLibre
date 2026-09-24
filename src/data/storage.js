const KEY = "vuelalibre:v1";
const types = ["recommended", "together", "score", "signal"];
export function readStore(storage = localStorage) {
  try {
    const data = JSON.parse(storage.getItem(KEY));
    return {
      saved: data?.saved === true,
      alerts: Array.isArray(data?.alerts)
        ? data.alerts.filter(
            (a) =>
              typeof a.id === "string" &&
              types.includes(a.type) &&
              ["economy", "business"].includes(a.cabin),
          )
        : [],
      preference: ["Ventana", "Pasillo", "Sin preferencia"].includes(
        data?.preference,
      )
        ? data.preference
        : "Ventana",
    };
  } catch {
    return { saved: false, alerts: [], preference: "Ventana" };
  }
}
export function saveStore(data, storage = localStorage) {
  try {
    storage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
