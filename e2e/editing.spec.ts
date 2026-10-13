import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// Editing like a spreadsheet in the built page: undo and redo, copy, cut and paste (also from a spreadsheet's
// tab-separated text), the fill handle. Clipboard events are sent the way the browser sends them, so the tests do not
// depend on the system clipboard. Invented names only.

const well = (page: Page, name: string) => page.getByRole("gridcell", { name, exact: true });
const filled = (page: Page) => page.locator(".well[data-filled]");
const legend = (page: Page) => page.locator(".legend-item");

async function select(page: Page, from: string, to: string) {
  await well(page, from).click();
  await well(page, to).click({ modifiers: ["Shift"] });
}

async function type(page: Page, text: string) {
  await page.keyboard.type(text);
  await page.keyboard.press("Enter");
}

// A copy or cut event on the plate; returns what it put on the clipboard.
const clipboard = (page: Page, kind: "copy" | "cut") =>
  page.getByRole("grid").evaluate((grid, kind) => {
    const data = new DataTransfer();
    grid.dispatchEvent(new ClipboardEvent(kind, { clipboardData: data, bubbles: true, cancelable: true }));
    return data.getData("text/plain");
  }, kind);

const paste = (page: Page, text: string) =>
  page.getByRole("grid").evaluate((grid, text) => {
    const data = new DataTransfer();
    data.setData("text/plain", text);
    grid.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
  }, text);

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "keyboard and mouse editing");
  await page.goto("./");
});

test("undo and redo, by keys and by buttons", async ({ page }) => {
  await select(page, "A1", "A3");
  await type(page, "Vehicle");
  await select(page, "B1", "B3");
  await type(page, "Compound X");
  await expect(filled(page)).toHaveCount(6);
  await page.keyboard.press("ControlOrMeta+z");
  await expect(filled(page)).toHaveCount(3);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(filled(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(filled(page)).toHaveCount(3);
});

test("copy a block and paste it elsewhere, tiled over a larger selection", async ({ page }) => {
  await well(page, "A1").click();
  await type(page, "Vehicle");
  await well(page, "A2").click();
  await type(page, "Compound X");
  await select(page, "A1", "A2");
  expect(await clipboard(page, "copy")).toBe("Vehicle\tCompound X");
  await select(page, "C1", "D4"); // 2 × 4: two copies across, two down
  await paste(page, "Vehicle\tCompound X");
  await expect(filled(page)).toHaveCount(10);
  await expect(page.locator(".selection-ref")).toHaveText("C1:D4");
  await expect(legend(page)).toHaveText([/Vehicle\s*5/, /Compound X\s*5/]);
});

test("cut moves values", async ({ page }) => {
  await select(page, "A1", "A2");
  await type(page, "Mock");
  await select(page, "A1", "A2");
  const text = await clipboard(page, "cut");
  await expect(filled(page)).toHaveCount(0);
  await well(page, "H11").click();
  await paste(page, text);
  await expect(filled(page)).toHaveCount(2);
});

test("paste a block from a spreadsheet into a number layer", async ({ page }) => {
  await page.getByRole("button", { name: "+ Number layer" }).click();
  await well(page, "A1").click();
  await paste(page, "0,1\t1\t10\r\n0,1\t1\t10\r\n");
  await expect(filled(page)).toHaveCount(6);
  await expect(legend(page)).toHaveText([/0\.1 µM\s*2/, /1 µM\s*2/, /10 µM\s*2/]);
  await paste(page, "Vehicle");
  await expect(page.getByRole("status")).toContainText("Not pasted");
});

test("the fill handle repeats the selection", async ({ page }) => {
  await well(page, "A1").click();
  await type(page, "Gene A KD");
  await well(page, "B1").click();
  await type(page, "Gene B KD");
  await select(page, "A1", "B1");
  const handle = await page.locator(".fill-handle").boundingBox();
  const to = await well(page, "F1").boundingBox();
  await page.mouse.move(handle!.x + handle!.width / 2, handle!.y + handle!.height / 2);
  await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(filled(page)).toHaveCount(6);
  await expect(legend(page)).toHaveText([/Gene A KD\s*3/, /Gene B KD\s*3/]);
  await page.keyboard.press("ControlOrMeta+z");
  await expect(filled(page)).toHaveCount(2);
});
