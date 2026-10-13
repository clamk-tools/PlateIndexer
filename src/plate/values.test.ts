import { describe, expect, it } from "vitest";

import { cellText, formatNumber, nearDuplicate, parseNumber, suggestions, tidy } from "./values";

describe("text", () => {
  it("tidies spaces", () => {
    expect(tidy("  Gene  A KD ")).toBe("Gene A KD");
  });

  it("flags a near-duplicate, not a different condition", () => {
    const known = ["Gene A KD", "Gene B KD", "Vehicle"];
    expect(nearDuplicate("gene a kd", known)).toBe("Gene A KD");
    expect(nearDuplicate("Gene-A_KD", known)).toBe("Gene A KD");
    expect(nearDuplicate("Gene A KD", known)).toBeNull();
    expect(nearDuplicate("Gene C KD", known)).toBeNull();
  });

  it("suggests values starting with the text first, then containing it", () => {
    const known = ["Scramble", "Gene A KD", "Gene B KD", "Untreated"];
    expect(suggestions("gene", known)).toEqual(["Gene A KD", "Gene B KD"]);
    expect(suggestions("kd", known)).toEqual(["Gene A KD", "Gene B KD"]);
    expect(suggestions("a", known)).toEqual(["Scramble", "Gene A KD", "Untreated"]);
    expect(suggestions("", known)).toEqual(known);
  });
});

describe("numbers", () => {
  it("reads plain numbers, a decimal comma and exponents", () => {
    expect(parseNumber("10", "µM")).toEqual({ ok: true, value: 10 });
    expect(parseNumber("0,5", "µM")).toEqual({ ok: true, value: 0.5 });
    expect(parseNumber(".25", "")).toEqual({ ok: true, value: 0.25 });
    expect(parseNumber("1e-3", "")).toEqual({ ok: true, value: 0.001 });
  });

  it("accepts the layer's unit, written any usual way", () => {
    expect(parseNumber("10 µM", "µM")).toEqual({ ok: true, value: 10 });
    expect(parseNumber("10uM", "µM")).toEqual({ ok: true, value: 10 });
    expect(parseNumber("10 UM", "μM")).toEqual({ ok: true, value: 10 });
  });

  it("refuses another unit and text", () => {
    expect(parseNumber("10 nM", "µM").ok).toBe(false);
    expect(parseNumber("10 nM", "").ok).toBe(false);
    expect(parseNumber("ten", "µM").ok).toBe(false);
    expect(parseNumber("", "µM").ok).toBe(false);
  });

  it("shows numbers without float noise", () => {
    expect(formatNumber(0.1 + 0.2)).toBe("0.3");
    expect(formatNumber(1e-9)).toBe("1e-9");
    expect(cellText(2.5, "µM")).toBe("2.5 µM");
    expect(cellText(null)).toBe("");
  });
});
