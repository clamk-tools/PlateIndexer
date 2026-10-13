import { describe, expect, it } from "vitest";

import { FORMATS, formatOf, rowLabel, wellIndex, wellName, wellsInOrder } from "./plate";

describe("formats", () => {
  it("has rows × columns = wells", () => {
    for (const f of FORMATS) expect(f.rows * f.columns).toBe(f.wells);
    expect(FORMATS.map((f) => `${f.rows}×${f.columns}`)).toEqual(["2×3", "3×4", "4×6", "6×8", "8×12", "16×24", "32×48"]);
  });

  it("refuses a format that does not exist", () => {
    expect(() => formatOf(100)).toThrow();
  });
});

describe("well names", () => {
  it("writes rows A…Z, then AA…AF", () => {
    expect(rowLabel(0)).toBe("A");
    expect(rowLabel(15)).toBe("P");
    expect(rowLabel(25)).toBe("Z");
    expect(rowLabel(26)).toBe("AA");
    expect(rowLabel(31)).toBe("AF");
  });

  it("pads the column for A01, not for A1", () => {
    expect(wellName({ row: 0, column: 0 }, "A1")).toBe("A1");
    expect(wellName({ row: 0, column: 0 }, "A01")).toBe("A01");
    expect(wellName({ row: 15, column: 23 }, "A01")).toBe("P24");
    expect(wellName({ row: 31, column: 47 }, "A1")).toBe("AF48");
  });
});

describe("orders", () => {
  const plate384 = formatOf(384);
  const names = (order: "rows" | "columns") => wellsInOrder(plate384, order).map((w) => wellName(w, "A01"));

  // The reference workbook this tool replaces lists a 384-well plate down the columns: A01, B01 … P01, A02 …
  it("lists down the columns like the reference workbook", () => {
    const list = names("columns");
    expect(list).toHaveLength(384);
    expect(list.slice(0, 3)).toEqual(["A01", "B01", "C01"]);
    expect(list[15]).toBe("P01");
    expect(list[16]).toBe("A02");
    expect(list[383]).toBe("P24");
  });

  it("lists across the rows", () => {
    const list = names("rows");
    expect(list.slice(0, 3)).toEqual(["A01", "A02", "A03"]);
    expect(list[23]).toBe("A24");
    expect(list[24]).toBe("B01");
    expect(list[383]).toBe("P24");
  });

  it("names every well once, in either order", () => {
    for (const f of FORMATS) {
      for (const order of ["rows", "columns"] as const) {
        const indexes = wellsInOrder(f, order).map((w) => wellIndex(f, w));
        expect(new Set(indexes).size).toBe(f.wells);
        expect(Math.min(...indexes)).toBe(0);
        expect(Math.max(...indexes)).toBe(f.wells - 1);
      }
    }
  });
});
