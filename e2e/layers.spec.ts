import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// Layers and values in the built page: typing fills the selection, the value list and its colours, near-duplicates,
// number layers. Invented names only.

const well = (page: Page, name: string) => page.getByRole("gridcell", { name, exact: true });
const filled = (page: Page) => page.locator(".well[data-filled]");
const legend = (page: Page) => page.locator(".legend-item");

async function select(page: Page, from: string, to: string) {
  await well(page, from).click();
  await well(page, to).click({ modifiers: ["Shift"] });
}

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "keyboard typing; the phone layout is checked in Task 7");
  await page.goto("./");
});

test("typing fills every selected well, and the value joins the list", async ({ page }) => {
  await select(page, "A1", "B3");
  await page.keyboard.type("Gene A KD");
  await page.keyboard.press("Enter");
  await expect(filled(page)).toHaveCount(6);
  await expect(legend(page)).toHaveCount(1);
  await expect(legend(page).first()).toContainText("Gene A KD");
  await expect(legend(page).first()).toContainText("6");
  await expect(page.locator(".inspector")).toContainText("Gene A KD");
});

test("a near-duplicate asks which value is meant", async ({ page }) => {
  await select(page, "A1", "A3");
  await page.keyboard.type("Vehicle");
  await page.keyboard.press("Enter");
  await select(page, "B1", "B3");
  await page.keyboard.type("vehicle ");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alert")).toContainText("looks like “Vehicle”");
  await page.getByRole("button", { name: "Use “Vehicle”" }).click();
  await expect(legend(page)).toHaveCount(1);
  await expect(legend(page).first()).toContainText("6");
});

test("Tab takes a suggestion; the legend paints, renames and removes", async ({ page }) => {
  await select(page, "A1", "A2");
  await page.keyboard.type("Compound X");
  await page.keyboard.press("Enter");
  await well(page, "C1").click();
  await page.keyboard.type("comp");
  await expect(page.getByRole("option", { name: "Compound X" })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(legend(page).first()).toContainText("3");

  await well(page, "D1").click();
  await page.getByRole("button", { name: /Compound X/ }).first().click();
  await expect(legend(page).first()).toContainText("4");

  await page.getByRole("button", { name: "Rename Compound X" }).click();
  await page.getByRole("textbox", { name: "New name for Compound X" }).fill("Compound Y");
  await page.keyboard.press("Enter");
  await expect(legend(page).first()).toContainText("Compound Y");

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Remove Compound Y" }).click();
  await expect(filled(page)).toHaveCount(0);
});

test("Delete clears the selected wells", async ({ page }) => {
  await select(page, "A1", "A4");
  await page.keyboard.type("Untreated");
  await page.keyboard.press("Enter");
  await select(page, "A1", "A2");
  await page.keyboard.press("Delete");
  await expect(filled(page)).toHaveCount(2);
});

test("a number layer reads numbers in its unit and refuses another unit", async ({ page }) => {
  await page.getByRole("button", { name: "+ Number layer" }).click();
  await expect(page.getByRole("tab", { selected: true })).toContainText("µM");
  await page.getByRole("columnheader", { name: "1", exact: true }).click();
  await page.keyboard.type("0,5");
  await page.keyboard.press("Enter");
  await page.getByRole("columnheader", { name: "2", exact: true }).click();
  await page.keyboard.type("10 uM");
  await page.keyboard.press("Enter");
  await expect(legend(page)).toHaveText([/0\.5 µM\s*8/, /10 µM\s*8/]);
  await page.getByRole("columnheader", { name: "3", exact: true }).click();
  await page.keyboard.type("10 nM");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alert")).toContainText("This layer is in µM");
  await expect(filled(page)).toHaveCount(16);
});

test("layers keep their own values; the inspector shows them all", async ({ page }) => {
  await page.getByLabel("Layer name").fill("siRNA");
  await well(page, "C3").click();
  await page.keyboard.type("Scramble");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "+ Text layer" }).click();
  await page.getByLabel("Layer name").fill("Treatment");
  await expect(filled(page)).toHaveCount(0);
  await well(page, "C3").click();
  await page.keyboard.type("Vehicle");
  await page.keyboard.press("Enter");
  await expect(page.locator(".inspector")).toContainText("Scramble");
  await expect(page.locator(".inspector")).toContainText("Vehicle");
  await page.getByRole("tab", { name: "siRNA" }).click();
  await expect(legend(page).first()).toContainText("Scramble");
});
