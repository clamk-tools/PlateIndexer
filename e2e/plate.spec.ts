import { expect, test } from "@playwright/test";

// The built page, served as on GitHub Pages: it loads, draws a plate, and redraws it in another format.

test("draws a 96-well plate, then a 384-well plate", async ({ page }) => {
  await page.goto("./");
  await expect(page).toHaveTitle("Plate Indexer");
  await expect(page.getByRole("grid", { name: "96-well plate" })).toBeVisible();
  await expect(page.getByRole("gridcell")).toHaveCount(96);

  await page.getByRole("radio", { name: "384" }).click();
  await expect(page.getByRole("grid", { name: "384-well plate" })).toBeVisible();
  await expect(page.getByRole("gridcell")).toHaveCount(384);
  await expect(page.getByRole("gridcell", { name: "P24" })).toBeVisible();
});

test("loads nothing from outside the site", async ({ page }) => {
  const outside: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://localhost:4175/")) outside.push(r.url());
  });
  await page.goto("./");
  await expect(page.getByRole("grid")).toBeVisible();
  expect(outside).toEqual([]);
});
