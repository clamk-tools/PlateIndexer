import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// An automated accessibility pass (axe, WCAG 2.1 A and AA) on the built page, empty and described, in both themes.

for (const scheme of ["light", "dark"] as const) {
  test(`no accessibility violations, ${scheme} theme`, async ({ page }, info) => {
    test.skip(info.project.name !== "chromium", "one browser is enough for the rules");
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("./");
    const check = async () => {
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`)).toEqual([]);
    };
    await check();
    await page.getByRole("rowheader", { name: "A", exact: true }).click();
    await page.keyboard.type("Vehicle");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "+ Number layer" }).click();
    await page.getByText("How it works").click();
    await check();
  });
}
