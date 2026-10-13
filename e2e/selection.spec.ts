import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// Selecting wells like spreadsheet cells, in the built page. The name box (".selection-ref") says what is selected.

const ref = (page: Page) => page.locator(".selection-ref");
const count = (page: Page) => page.locator(".selection-count");
const well = (page: Page, name: string) => page.getByRole("gridcell", { name, exact: true });
const mod = process.platform === "darwin" ? "Meta" : "Control";

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "mouse and keyboard selection; the phone has its own test");
  await page.goto("./");
});

test("click, Shift-click and Ctrl-click", async ({ page }) => {
  await well(page, "B2").click();
  await expect(ref(page)).toHaveText("B2");
  await well(page, "D5").click({ modifiers: ["Shift"] });
  await expect(ref(page)).toHaveText("B2:D5");
  await expect(count(page)).toHaveText("12 wells");
  await well(page, "F7").click({ modifiers: [mod] });
  await expect(ref(page)).toHaveText("B2:D5, F7");
  await expect(page.locator('.well[aria-selected="true"]')).toHaveCount(13);
});

test("drag over a block", async ({ page }) => {
  const from = await well(page, "C3").boundingBox();
  const to = await well(page, "E6").boundingBox();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(ref(page)).toHaveText("C3:E6");
});

test("row letters, column numbers and the corner", async ({ page }) => {
  const grid = page.getByRole("grid");
  await grid.getByRole("rowheader", { name: "C" }).click();
  await expect(ref(page)).toHaveText("C1:C12");
  await grid.getByRole("rowheader", { name: "E" }).click({ modifiers: ["Shift"] });
  await expect(ref(page)).toHaveText("C1:E12");
  await grid.getByRole("columnheader", { name: "12", exact: true }).click();
  await expect(ref(page)).toHaveText("A12:H12");
  await grid.getByRole("columnheader", { name: "Select all" }).click();
  await expect(count(page)).toHaveText("96 wells");
});

test("arrow keys, Shift+arrows, Ctrl+arrows and Ctrl+A", async ({ page }) => {
  await well(page, "B2").click();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await expect(ref(page)).toHaveText("C3");
  await page.keyboard.press("Shift+ArrowDown");
  await page.keyboard.press("Shift+ArrowRight");
  await expect(ref(page)).toHaveText("C3:D4");
  await page.keyboard.press(`${mod}+ArrowRight`);
  await expect(ref(page)).toHaveText("C12");
  await page.keyboard.press(`${mod}+a`);
  await expect(count(page)).toHaveText("96 wells");
});

test("another format starts again at A1", async ({ page }) => {
  await well(page, "H12").click();
  await page.getByRole("radio", { name: "384" }).click();
  await expect(ref(page)).toHaveText("A1");
});
