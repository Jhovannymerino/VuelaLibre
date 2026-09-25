import { test, expect } from "@playwright/test";

const noCredentials = {
  configured: false,
  source: "not_configured",
  flights: [],
  message: "No hay fuente configurada para esta consulta.",
};

function flight(id, count, trend = 0) {
  return {
    id,
    flightNumber: id,
    origin: "MAD",
    destination: "PMI",
    date: "2026-10-15",
    departure: "2026-10-15T12:35:00",
    observedAt: "2026-09-24T10:00:00Z",
    fareClasses: [{ class: "Y", numberOfBookableSeats: count }],
    signal: {
      threshold: 5,
      commercialCount: count,
      commercialCountCapped: count === 9,
      commercialThreshold: count > 5 ? "supported" : "not_supported",
      inventoryTrend: trend,
      fareRatio: null,
      probability: null,
    },
    history: [
      {
        observedAt: "2026-09-23T10:00:00Z",
        commercialCount: count === 9 ? 7 : 3,
        commercialCountCapped: false,
      },
      {
        observedAt: "2026-09-24T10:00:00Z",
        commercialCount: count,
        commercialCountCapped: count === 9,
      },
    ],
  };
}

test("without credentials the dashboard shows no invented flights", async ({
  page,
}) => {
  await page.route("**/api/market?*", (route) =>
    route.fulfill({ json: noCredentials }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "El radar todavía no está configurado" }),
  ).toBeVisible();
  await expect(page.locator(".flight-card")).toHaveCount(0);
  await expect(page.getByLabel("Umbral X (plazas)")).toHaveValue("5");
  await expect(page.locator("main")).toContainText(
    /no confirma plazas físicas libres/i,
  );
});

test("shows threshold evidence, capped counts and daily history", async ({
  page,
}) => {
  await page.route("**/api/market?*", (route) =>
    route.fulfill({
      json: {
        configured: true,
        source: "amadeus-test-cache",
        flights: [flight("UX1234", 9, 1), flight("UX4321", 2, -1)],
        message: "2 vuelos directos UX encontrados.",
      },
    }),
  );
  await page.goto("/");
  await expect(page.locator(".flight-card")).toHaveCount(2);
  await expect(page.locator(".flight-card").first()).toContainText("9+");
  await expect(page.locator(".flight-card").first()).toContainText(
    "Señal comercial favorable para más de 5",
  );
  await expect(page.locator(".flight-card").nth(1)).toContainText(
    "No hay evidencia comercial de más de 5",
  );
  await page
    .locator(".flight-card")
    .nth(1)
    .getByRole("button", { name: "Ver evolución" })
    .click();
  await expect(page.locator("#history-panel")).toContainText("UX4321");
  await expect(page.locator("#history-panel tbody tr")).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("search submits route, date and X to the backend", async ({ page }) => {
  const queries = [];
  await page.route("**/api/market?*", (route) => {
    queries.push(new URL(route.request().url()).searchParams);
    return route.fulfill({ json: noCredentials });
  });
  await page.goto("/");
  await page.getByLabel("Origen, código de tres letras").fill("BCN");
  await page.getByLabel("Destino, código de tres letras").fill("MAD");
  await page.getByLabel("Fecha del vuelo").fill("2026-10-15");
  await page.getByLabel("Umbral X (plazas)").fill("3");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect.poll(() => queries.length).toBe(2);
  expect(Object.fromEntries(queries[1])).toEqual({
    origin: "BCN",
    destination: "MAD",
    date: "2026-10-15",
    threshold: "3",
  });
});

test("server errors can be retried without claiming a full flight", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/market?*", (route) => {
    calls += 1;
    return calls === 1
      ? route.fulfill({
          status: 502,
          json: { message: "Proveedor temporalmente indisponible" },
        })
      : route.fulfill({ json: noCredentials });
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "No se pudo completar la consulta" }),
  ).toBeVisible();
  await expect(page.locator(".results")).toContainText(
    "Proveedor temporalmente indisponible",
  );
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(
    page.getByRole("heading", { name: "El radar todavía no está configurado" }),
  ).toBeVisible();
});

test("skip link restores keyboard access to the main content", async ({
  page,
}) => {
  await page.route("**/api/market?*", (route) =>
    route.fulfill({ json: noCredentials }),
  );
  await page.goto("/");
  await page.getByRole("link", { name: "Saltar al contenido" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});
