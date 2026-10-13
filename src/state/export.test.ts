import { describe, expect, it } from "vitest";

import { formatOf, wellIndex } from "../plate/plate";
import { DEFAULT_OPTIONS, exportTable, toCsv, toTabs } from "./export";
import type { ExportOptions } from "./export";
import type { Action, PlateState } from "./plate";
import { initialState, reduce } from "./plate";

const run = (actions: Action[], state: PlateState) => actions.reduce(reduce, state);
const opts = (o: Partial<ExportOptions> = {}): ExportOptions => ({ ...DEFAULT_OPTIONS, ...o });

// The reference workbook's shape, with invented names: a 384-well plate, a text layer filled by rows, listed down the
// columns with A01 naming; an empty well gives an empty cell.
function referencePlate(): PlateState {
  const plate = formatOf(384);
  const row = (r: number) => Array.from({ length: 8 }, (_, k) => wellIndex(plate, { row: r, column: 16 + k })); // columns 17–24
  let s = initialState(384);
  s = run(
    [
      { type: "renameLayer", id: 1, name: "siRNA" },
      { type: "fill", indexes: [0, 1, 2].flatMap(row), cell: "Untreated" },
      { type: "fill", indexes: [3, 4, 5].flatMap(row), cell: "Scramble" },
      { type: "fill", indexes: [6, 7, 8].flatMap(row), cell: "Gene A KD" },
      { type: "addLayer", kind: "text" },
      { type: "renameLayer", id: 2, name: "Treatment" },
      { type: "fill", indexes: row(0), cell: "Vehicle" },
      { type: "fill", indexes: row(1), cell: "Compound X" },
    ],
    s,
  );
  return s;
}

describe("the table", () => {
  it("lists every well down the columns, A01 first, like the reference workbook", () => {
    const t = exportTable(referencePlate(), opts());
    expect(t[0]).toEqual(["Well", "Row", "Column", "siRNA", "Treatment"]);
    expect(t).toHaveLength(1 + 384);
    expect(t[1]).toEqual(["A01", "A", "1", "", ""]);
    expect(t[2][0]).toBe("B01");
    expect(t[17][0]).toBe("A02");
    // Column 17 starts at row 16 × 16 + 1 of the list: A17, B17, C17…
    expect(t.slice(16 * 16 + 1, 16 * 16 + 4)).toEqual([
      ["A17", "A", "17", "Untreated", "Vehicle"],
      ["B17", "B", "17", "Untreated", "Compound X"],
      ["C17", "C", "17", "Untreated", ""],
    ]);
    expect(t[384][0]).toBe("P24");
  });

  it("lists across the rows with A1 naming when asked", () => {
    const t = exportTable(referencePlate(), opts({ order: "rows", naming: "A1" }));
    expect(t.slice(1, 3).map((r) => r[0])).toEqual(["A1", "A2"]);
    expect(t[17]).toEqual(["A17", "A", "17", "Untreated", "Vehicle"]);
  });

  it("leaves out empty wells when asked", () => {
    const t = exportTable(referencePlate(), opts({ wells: "filled" }));
    expect(t).toHaveLength(1 + 9 * 8);
    expect(t[1][0]).toBe("A17");
  });

  it("gives a number layer a value column and a unit column", () => {
    const s = run(
      [
        { type: "addLayer", kind: "number" },
        { type: "renameLayer", id: 2, name: "Dose" },
        { type: "fill", indexes: [0], cell: 0.1 + 0.2 },
        { type: "fill", indexes: [1], cell: 1e-7 },
      ],
      initialState(6),
    );
    const t = exportTable(s, opts({ order: "rows", naming: "A1" }));
    expect(t[0]).toEqual(["Well", "Row", "Column", "Layer 1", "Dose", "Dose unit"]);
    expect(t[1]).toEqual(["A1", "A", "1", "", "0.3", "µM"]);
    expect(t[2]).toEqual(["A2", "A", "2", "", "1e-7", "µM"]);
    expect(t[3]).toEqual(["A3", "A", "3", "", "", ""]);
    expect(exportTable(s, opts({ order: "rows", separator: "semicolon" }))[1][4]).toBe("0,3");
  });
});

describe("files and clipboard", () => {
  const table = [
    ["Well", "Treatment"],
    ["A01", "Compound X, 1 h"],
    ["A02", 'Vehicle "old"'],
  ];

  it("writes CSV with a byte-order mark, CRLF lines and quoted fields", () => {
    expect(toCsv(table, "comma")).toBe('﻿Well,Treatment\r\nA01,"Compound X, 1 h"\r\nA02,"Vehicle ""old"""\r\n');
  });

  it("quotes for the separator in use", () => {
    expect(toCsv(table, "semicolon")).toContain("A01;Compound X, 1 h\r\n");
    expect(toCsv(table, "tab")).toContain("A01\tCompound X, 1 h\r\n");
  });

  it("writes tab-separated lines for the clipboard", () => {
    expect(toTabs(table)).toBe('Well\tTreatment\nA01\tCompound X, 1 h\nA02\tVehicle "old"');
  });
});
