import { validateQuery, buildMarketResponse } from "./market-service.js";

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

/** Builds the Node http request listener for the radar API. Deps are injected for testability. */
export function createRequestHandler({ amadeusClient, store, publicSchedule }) {
  return async function handleRequest(req, res) {
    let url;
    try {
      url = new URL(req.url, "http://internal");
    } catch {
      sendJson(res, 400, { message: "URL inválida" });
      return;
    }
    if (req.method !== "GET") {
      sendJson(res, 405, { message: "Método no permitido" });
      return;
    }

    if (url.pathname === "/api/health") {
      sendJson(res, 200, {
        status: "ok",
        configured: amadeusClient.configured,
        source: amadeusClient.configured
          ? amadeusClient.source
          : (publicSchedule?.source ?? "not_configured"),
        time: new Date().toISOString(),
      });
      return;
    }

    if (url.pathname === "/api/market") {
      const origin = (url.searchParams.get("origin") ?? "")
        .trim()
        .toUpperCase();
      const destination = (url.searchParams.get("destination") ?? "")
        .trim()
        .toUpperCase();
      const date = (url.searchParams.get("date") ?? "").trim();
      const rawThreshold = url.searchParams.get("threshold");
      const { errors, threshold } = validateQuery({
        origin,
        destination,
        date,
        threshold: rawThreshold,
      });
      if (errors.length) {
        sendJson(res, 400, {
          configured: amadeusClient.configured,
          source: "validation",
          flights: [],
          message: errors.join("; "),
        });
        return;
      }
      try {
        const { status, body } = await buildMarketResponse({
          origin,
          destination,
          date,
          threshold,
          amadeusClient,
          store,
          publicSchedule,
        });
        sendJson(res, status, body);
      } catch {
        sendJson(res, 500, {
          configured: amadeusClient.configured,
          source: "server-error",
          flights: [],
          message: "Error interno del servidor.",
        });
      }
      return;
    }

    sendJson(res, 404, { message: "No encontrado" });
  };
}
