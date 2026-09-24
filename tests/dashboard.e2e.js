import { test, expect } from "@playwright/test";
const loaded = async (page) => {
  await expect(
    page.getByRole("heading", { name: "Quedan buenas opciones. No muchas." }),
  ).toBeVisible();
};
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await loaded(page);
});
test("map layers, seat details, cabin recalculation and mobile containment", async ({
  page,
}) => {
  await page.getByRole("button", { name: /^6A, Ventana/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Asiento 6A");
  await expect(page.getByRole("dialog")).toContainText("35 €");
  await page.keyboard.press("Escape");
  for (const layer of [
    "Calidad",
    "Parejas / grupos",
    "Precio",
    "Recomendados",
    "Disponibilidad",
  ]) {
    await page.getByRole("button", { name: layer, exact: true }).click();
    await expect(
      page.getByRole("button", { name: layer, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await page
    .getByRole("combobox", { name: "Cabina", exact: true })
    .selectOption("business");
  await expect(
    page.getByRole("heading", { name: "Todavía tienes margen para elegir." }),
  ).toBeVisible();
  await expect(page.locator(".seat")).toHaveCount(12);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
test("watchlist and alerts persist; duplicate rules prevented; removal works", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Guardar vuelo", exact: true })
    .last()
    .click();
  await page.getByRole("link", { name: "Watchlist", exact: true }).click();
  await expect(page.getByRole("heading", { name: "MAD → LIS" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "MAD → LIS" })).toBeVisible();
  await page.getByRole("link", { name: "Alertas", exact: true }).click();
  await page
    .locator("main")
    .getByRole("button", { name: "Crear alerta", exact: true })
    .click();
  await page.getByRole("radio", { name: "Aparecen 2 asientos juntos" }).check();
  await page.getByRole("button", { name: "Guardar alerta local" }).click();
  await expect(page.locator(".alert-card")).toHaveCount(1);
  await page
    .locator("main")
    .getByRole("button", { name: "Crear alerta", exact: true })
    .click();
  await page.getByRole("radio", { name: "Aparecen 2 asientos juntos" }).check();
  await page.getByRole("button", { name: "Guardar alerta local" }).click();
  await expect(page.getByRole("dialog")).toContainText("Ya tienes esta alerta");
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator(".alert-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Todavía no tienes alertas" }),
  ).toBeVisible();
});
test("low confidence, empty and error states recover", async ({ page }) => {
  await page
    .getByRole("combobox", { name: "Escenario demo" })
    .selectOption("low");
  await expect(
    page.getByText("Resultado con confianza baja", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Necesitamos un poco más de contexto." }),
  ).toBeVisible();
  for (const mode of ["empty", "error"]) {
    await page
      .getByRole("combobox", { name: "Escenario demo" })
      .selectOption(mode);
    await page.getByRole("button", { name: "Intentar nuevamente" }).click();
    await loaded(page);
  }
});
test("history, profile and keyboard dialog focus", async ({
  page,
  isMobile,
}) => {
  if (isMobile) {
    await page.getByRole("button", { name: "Historial", exact: true }).click();
    await expect(page.locator("#history-panel")).toBeVisible();
    await page.getByRole("button", { name: "Mapa", exact: true }).click();
  }
  await page.getByRole("button", { name: /^6A, Ventana/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: /^6A, Ventana/ }),
  ).toBeFocused();
  await page.getByRole("link", { name: "Perfil", exact: true }).click();
  await page.getByLabel("Preferencia de asiento").selectOption("Pasillo");
  await page.getByRole("button", { name: "Guardar preferencia" }).click();
  await page.reload();
  await expect(page.getByLabel("Preferencia de asiento")).toHaveValue(
    "Pasillo",
  );
  await page.getByRole("link", { name: "Historial", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(3);
});
