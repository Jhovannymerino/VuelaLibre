import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "./env.js";
import { createAmadeusClient } from "./amadeus-client.js";
import { createSnapshotStore } from "./snapshot-store.js";
import { createRequestHandler } from "./app.js";
import { createPublicScheduleClient } from "./public-schedule.js";

loadEnvFile();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;

const amadeusClient = createAmadeusClient();
const publicSchedule = createPublicScheduleClient();
const store = createSnapshotStore(
  path.join(__dirname, "data", "snapshots.json"),
);
const handleRequest = createRequestHandler({
  amadeusClient,
  store,
  publicSchedule,
});

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ message: "Error interno del servidor." }));
    console.error(error);
  });
});

server.listen(PORT, () => {
  console.log(
    `[vuelalibre-backend] escuchando en http://localhost:${PORT} (Amadeus ${amadeusClient.configured ? "configurado" : "sin configurar"})`,
  );
});
