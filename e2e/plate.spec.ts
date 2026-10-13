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

test("a tap selects a well on a phone", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "touch only");
  await page.goto("./");
  await page.getByRole("gridcell", { name: "C5", exact: true }).tap();
  await expect(page.locator(".selection-ref")).toHaveText("C5");
});

test("on a phone, the row letters stay in view while a wide plate scrolls", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "phone layout");
  await page.goto("./");
  await page.getByRole("radio", { name: "384" }).tap();
  const scroller = page.locator(".plate-scroll");
  await scroller.evaluate((el) => (el.scrollLeft = el.scrollWidth));
  const box = await scroller.boundingBox();
  const letter = await page.getByRole("rowheader", { name: "C", exact: true }).boundingBox();
  expect(letter!.x).toBeGreaterThanOrEqual(box!.x - 1);
  expect(letter!.x + letter!.width).toBeLessThanOrEqual(box!.x + box!.width);
  await page.getByRole("gridcell", { name: "C24", exact: true }).tap();
  await expect(page.locator(".selection-ref")).toHaveText("C24");
});
