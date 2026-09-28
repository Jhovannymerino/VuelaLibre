import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  validateQuery,
  buildMarketResponse,
} from "../server/market-service.js";
import { createRequestHandler } from "../server/app.js";
import { createSnapshotStore } from "../server/snapshot-store.js";
import { createAmadeusClient, AmadeusError } from "../server/amadeus-client.js";
import { parsePublicSchedule } from "../server/public-schedule.js";

function memoryStore() {
  const data = new Map();
  return {
    getHistory: (key) => data.get(key) ?? [],
    appendSnapshot: (key, entry) => {
      const history = [...(data.get(key) ?? []), entry];
      data.set(key, history);
      return history;
    },
  };
}

function tempStorePath() {
  return path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "vuelalibre-snapshots-")),
    "snapshots.json",
  );
}

function amadeusResponseFor({
  number = "1234",
  seats = 7,
  origin = "MAD",
  destination = "PMI",
  date = "2026-10-15",
} = {}) {
  return {
    data: [
      {
        segments: [
          {
            carrierCode: "UX",
            number,
            departure: { iataCode: origin, at: `${date}T12:00:00` },
            arrival: { iataCode: destination, at: `${date}T13:15:00` },
            availabilityClasses: [{ class: "Y", numberOfBookableSeats: seats }],
          },
        ],
      },
    ],
  };
}

// --- validateQuery ---

test("validateQuery accepts a well-formed query and defaults the threshold", () => {
  const { errors, threshold } = validateQuery({
    origin: "MAD",
    destination: "PMI",
    date: "2026-10-15",
  });
  assert.deepEqual(errors, []);
  assert.equal(threshold, 5);
});

test("validateQuery rejects malformed IATA codes, equal endpoints, bad dates and out-of-range thresholds", () => {
  assert.ok(
    validateQuery({ origin: "mad", destination: "PMI", date: "2026-10-15" })
      .errors.length,
  );
  assert.ok(
    validateQuery({ origin: "MAD", destination: "MAD", date: "2026-10-15" })
      .errors.length,
  );
  assert.ok(
    validateQuery({ origin: "MAD", destination: "PMI", date: "15-10-2026" })
      .errors.length,
  );
  assert.ok(
    validateQuery({
      origin: "MAD",
      destination: "PMI",
      date: "2026-10-15",
      threshold: "9",
    }).errors.length,
  );
});

// --- buildMarketResponse: honest "not configured" / no data ---

test("buildMarketResponse never invents flights when Amadeus credentials are missing", async () => {
  const { status, body } = await buildMarketResponse({
    origin: "MAD",
    destination: "PMI",
    date: "2026-10-15",
    threshold: 5,
    amadeusClient: { configured: false },
    store: memoryStore(),
  });
  assert.equal(status, 200);
  assert.equal(body.configured, false);
  assert.equal(body.source, "not_configured");
  assert.deepEqual(body.flights, []);
  assert.match(body.message, /AMADEUS_CLIENT_ID/);
});

test("parsePublicSchedule extracts only UX rows for the requested date", () => {
  const rows = parsePublicSchedule(
    `| Date | Flight | Airline | Departs MAD | Arrives PMI |\n| Tue, Sep 22 | UX 6031 | Air Europa | 08:20 | 09:40 |\n| Tue, Sep 22 | IB 1651 | Iberia Airlines | 07:00 | 08:25 |`,
    { origin: "MAD", destination: "PMI", date: "2026-09-22" },
  );
  assert.deepEqual(
    rows.map((row) => row.flightNumber),
    ["UX6031"],
  );
  assert.equal(rows[0].availabilityKnown, undefined);
});

test("buildMarketResponse reports no coverage instead of zero seats when Amadeus has no match", async () => {
  const amadeusClient = {
    configured: true,
    source: "amadeus-test-cache",
    searchAvailability: async () => ({ data: [] }),
  };
  const { status, body } = await buildMarketResponse({
    origin: "MAD",
    destination: "PMI",
    date: "2026-10-15",
    threshold: 5,
    amadeusClient,
    store: memoryStore(),
  });
  assert.equal(status, 200);
  assert.equal(body.configured, true);
  assert.deepEqual(body.flights, []);
  assert.match(body.message, /sin datos/i);
});

test("buildMarketResponse surfaces upstream Amadeus failures as 502 without fabricating data", async () => {
  const amadeusClient = {
    configured: true,
    source: "amadeus-test-cache",
    searchAvailability: async () => {
      throw new AmadeusError("Amadeus respondió HTTP 500", 500, "");
    },
  };
  const { status, body } = await buildMarketResponse({
    origin: "MAD",
    destination: "PMI",
    date: "2026-10-15",
    threshold: 5,
    amadeusClient,
    store: memoryStore(),
  });
  assert.equal(status, 502);
  assert.deepEqual(body.flights, []);
  assert.equal(body.configured, true);
});

// --- buildMarketResponse: signal + history across repeated observations ---

test("buildMarketResponse computes the commercial signal and accumulates history across calls", async () => {
  const amadeusClient = {
    configured: true,
    source: "amadeus-test-cache",
    searchAvailability: async () => amadeusResponseFor({ seats: 9 }),
  };
  const store = memoryStore();
  const first = await buildMarketResponse({
    origin: "MAD",
    destination: "PMI",
    date: "2026-10-15",
    threshold: 5,
    amadeusClient,
    store,
  });
  assert.equal(first.body.flights.length, 1);
  const [flight1] = first.body.flights;
  assert.equal(flight1.flightNumber, "UX1234");
  assert.equal(flight1.signal.commercialThreshold, "supported");
  assert.equal(flight1.signal.commercialCountCapped, true);
  assert.equal(flight1.history.length, 1);
  assert.equal(flight1.signal.inventoryTrend, null);

  amadeusClient.searchAvailability = async () =>
    amadeusResponseFor({ seats: 4 });
  const second = await buildMarketResponse({
    origin: "MAD",
    destination: "PMI",
    date: "2026-10-15",
    threshold: 5,
    amadeusClient,
    store,
  });
  const [flight2] = second.body.flights;
  assert.equal(flight2.history.length, 2);
  assert.equal(flight2.signal.commercialThreshold, "not_supported");
  assert.equal(flight2.signal.inventoryTrend, -1);
  assert.equal(flight2.id, flight1.id);
});

// --- createSnapshotStore: real file persistence ---

test("createSnapshotStore persists snapshots to disk and reloads them", () => {
  const filePath = tempStorePath();
  const store = createSnapshotStore(filePath);
  store.appendSnapshot("UX1234:MADPMI:2026-10-15", {
    observedAt: "2026-09-24T10:00:00.000Z",
    commercialCount: 7,
    commercialCountCapped: false,
  });
  assert.ok(fs.existsSync(filePath));
  const reopened = createSnapshotStore(filePath);
  const history = reopened.getHistory("UX1234:MADPMI:2026-10-15");
  assert.equal(history.length, 1);
  assert.equal(history[0].commercialCount, 7);
  assert.deepEqual(reopened.getHistory("missing"), []);
});

// --- createAmadeusClient: OAuth + caching + error mapping ---

test("createAmadeusClient fetches a token once and reuses it across searches", async () => {
  let tokenCalls = 0;
  let searchCalls = 0;
  const fetchImpl = async (url) => {
    if (String(url).includes("/security/oauth2/token")) {
      tokenCalls += 1;
      return {
        ok: true,
        json: async () => ({ access_token: "tok", expires_in: 1799 }),
      };
    }
    searchCalls += 1;
    return { ok: true, json: async () => amadeusResponseFor({ seats: 3 }) };
  };
  const client = createAmadeusClient({
    clientId: "id",
    clientSecret: "secret",
    env: "test",
    fetchImpl,
  });
  assert.equal(client.configured, true);
  assert.equal(client.source, "amadeus-test-cache");
  await client.searchAvailability({
    origin: "MAD",
    destination: "PMI",
    date: "2026-10-15",
  });
  await client.searchAvailability({
    origin: "MAD",
    destination: "PMI",
    date: "2026-10-16",
  });
  assert.equal(tokenCalls, 1);
  assert.equal(searchCalls, 2);
});

test("createAmadeusClient reports as unconfigured without credentials and throws AmadeusError on failure", async () => {
  const unconfigured = createAmadeusClient({ clientId: "", clientSecret: "" });
  assert.equal(unconfigured.configured, false);

  const failingFetch = async () => ({
    ok: false,
    status: 401,
    text: async () => "bad creds",
  });
  const client = createAmadeusClient({
    clientId: "id",
    clientSecret: "secret",
    fetchImpl: failingFetch,
  });
  await assert.rejects(
    () =>
      client.searchAvailability({
        origin: "MAD",
        destination: "PMI",
        date: "2026-10-15",
      }),
    AmadeusError,
  );
});

// --- createRequestHandler: full HTTP contract over a real socket ---

function withServer(handler, fn) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      handler(req, res).catch((error) => {
        res.writeHead(500);
        res.end(String(error));
      });
    });
    server.listen(0, "127.0.0.1", async () => {
      const { port } = server.address();
      try {
        await fn(`http://127.0.0.1:${port}`);
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        server.close();
      }
    });
  });
}

test("GET /api/health reports whether Amadeus is configured", async () => {
  const handler = createRequestHandler({
    amadeusClient: { configured: false, source: "amadeus-test-cache" },
    store: memoryStore(),
  });
  await withServer(handler, async (base) => {
    const response = await fetch(`${base}/api/health`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "ok");
    assert.equal(body.configured, false);
  });
});

test("GET /api/market validates params and returns 400 with an honest message", async () => {
  const handler = createRequestHandler({
    amadeusClient: { configured: false, source: "amadeus-test-cache" },
    store: memoryStore(),
  });
  await withServer(handler, async (base) => {
    const response = await fetch(
      `${base}/api/market?origin=MADX&destination=PMI&date=2026-10-15`,
    );
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.deepEqual(body.flights, []);
    assert.match(body.message, /origin/i);
  });
});

test("GET /api/market end-to-end returns flights with signal and history for a configured client", async () => {
  const amadeusClient = {
    configured: true,
    source: "amadeus-test-cache",
    searchAvailability: async () => amadeusResponseFor({ seats: 6 }),
  };
  const handler = createRequestHandler({ amadeusClient, store: memoryStore() });
  await withServer(handler, async (base) => {
    const response = await fetch(
      `${base}/api/market?origin=MAD&destination=PMI&date=2026-10-15&threshold=5`,
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.configured, true);
    assert.equal(body.flights.length, 1);
    const [flight] = body.flights;
    assert.equal(flight.flightNumber, "UX1234");
    assert.equal(flight.signal.commercialThreshold, "supported");
    assert.equal(flight.history.length, 1);
    assert.equal(flight.history[0].commercialCount, 6);
  });
});

test("GET /api/market returns 404 for unknown routes and 405 for non-GET methods", async () => {
  const handler = createRequestHandler({
    amadeusClient: { configured: false, source: "amadeus-test-cache" },
    store: memoryStore(),
  });
  await withServer(handler, async (base) => {
    const notFound = await fetch(`${base}/api/unknown`);
    assert.equal(notFound.status, 404);
    const wrongMethod = await fetch(`${base}/api/market`, { method: "POST" });
    assert.equal(wrongMethod.status, 405);
  });
});
