import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// The export in the built page (with its Content-Security-Policy): the preview follows the choices, and the CSV file
// downloads with them. Invented names only.

const well = (page: Page, name: string) => page.getByRole("gridcell", { name, exact: true });

async function download(page: Page): Promise<string> {
  const [file] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download CSV" }).click()]);
  expect(file.suggestedFilename()).toBe("plate-layout.csv");
  return readFile((await file.path())!, "utf8");
}

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "keyboard typing");
  await page.goto("./");
  await page.getByLabel("Layer name").fill("siRNA");
  await well(page, "B1").click();
  await page.keyboard.type("Gene A KD");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "+ Number layer" }).click();
  await page.getByLabel("Layer name").fill("Dose");
  await well(page, "B1").click();
  await page.keyboard.type("0,5");
  await page.keyboard.press("Enter");
});

test("the preview lists wells down the columns with A01 names", async ({ page }) => {
  const preview = page.locator(".export-preview");
  await expect(preview.locator("th")).toHaveText(["Well", "Row", "Column", "siRNA", "Dose", "Dose unit"]);
  await expect(preview.locator("tbody tr").nth(1)).toHaveText(/B01\s*B\s*1\s*Gene A KD\s*0\.5\s*µM/);
  await expect(page.locator(".export-count")).toContainText("96 rows");
});

test("downloads the CSV with the chosen options", async ({ page }) => {
  let csv = await download(page);
  expect(csv.startsWith("﻿Well,Row,Column,siRNA,Dose,Dose unit\r\nA01,A,1,,,\r\nB01,B,1,Gene A KD,0.5,µM\r\n")).toBe(true);
  expect(csv.trim().split("\r\n")).toHaveLength(97);

  await page.getByRole("radio", { name: "Across rows (A1, A2…)" }).click();
  await page.getByRole("radio", { name: "A1", exact: true }).click();
  await page.getByRole("radio", { name: "With a value" }).click();
  await page.getByRole("radio", { name: "Semicolon, decimal comma" }).click();
  csv = await download(page);
  expect(csv).toBe("﻿Well;Row;Column;siRNA;Dose;Dose unit\r\nB1;B;1;Gene A KD;0,5;µM\r\n");
});
