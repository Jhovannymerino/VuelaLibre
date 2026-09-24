import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "14 plazas libres en el vuelo con más disponibilidad reportada.",
    }),
  ).toBeVisible();
});
test("shows dated count and daily change per flight", async ({ page }) => {
  await expect(page.locator(".flight-card")).toHaveCount(3);
  await expect(page.locator(".flight-card").first()).toContainText("14");
  await expect(page.locator(".flight-card").first()).toContainText(
    "-1 desde la consulta anterior",
  );
  await expect(page.locator("#history-panel tbody tr")).toHaveCount(4);
  await expect(page.locator(".bar-row")).toHaveCount(4);
  await page
    .locator(".flight-card")
    .nth(1)
    .getByRole("button", { name: "Ver evolución" })
    .click();
  await expect(page.locator("#history-panel")).toContainText("Ejemplo B");
  await expect(page.locator("#history-panel tbody tr")).toHaveCount(4);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
test("other dates show no invented data; manual counts persist and can be updated", async ({
  page,
}) => {
  await page.getByLabel("Fecha del vuelo").fill("2026-10-16");
  await page.getByRole("button", { name: "Ver vuelos" }).click();
  await expect(
    page.getByRole("heading", { name: "Sin recuentos para esta búsqueda" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Registrar plazas" }).click();
  await page.getByRole("dialog").getByLabel("Número de vuelo").fill("UX123");
  await page.getByRole("dialog").getByLabel("Hora de salida").fill("13:45");
  await page
    .getByRole("dialog")
    .getByLabel("Plazas libres observadas")
    .fill("9");
  await page.getByRole("button", { name: "Guardar recuento" }).click();
  await expect(page.locator(".flight-card")).toHaveCount(1);
  await expect(page.locator(".flight-card")).toContainText("9");
  await page.reload();
  await page.getByLabel("Fecha del vuelo").fill("2026-10-16");
  await page.getByRole("button", { name: "Ver vuelos" }).click();
  await expect(page.locator(".flight-card")).toContainText("UX123");
  await page.getByRole("button", { name: "Registrar nuevo conteo" }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Plazas libres observadas")
    .fill("7");
  await page.getByRole("button", { name: "Guardar recuento" }).click();
  await expect(page.locator(".flight-card")).toContainText(
    "-2 desde la consulta anterior",
  );
  await expect(page.locator("#history-panel tbody tr")).toHaveCount(2);
});
test("keyboard skip link and dialog close restore focus", async ({ page }) => {
  const add = page.getByRole("button", { name: "Registrar vuelo y plazas" });
  await add.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(add).toBeFocused();
  await page.getByRole("link", { name: "Saltar al contenido" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});
