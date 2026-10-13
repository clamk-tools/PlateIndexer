// The plate as a table: one row per well, in the order an instrument expects, one column per text layer and two per
// number layer (value, unit). Written as CSV for a file, or tab-separated for the clipboard. Pure functions.

import type { Naming, Order } from "../plate/plate";
import { columnLabel, formatOf, rowLabel, wellIndex, wellName, wellsInOrder } from "../plate/plate";
import type { PlateState } from "./plate";

export type Separator = "comma" | "semicolon" | "tab";

export interface ExportOptions {
  order: Order;
  naming: Naming;
  wells: "all" | "filled"; // every well, or only those with a value in some layer
  separator: Separator;
}

export const DEFAULT_OPTIONS: ExportOptions = { order: "columns", naming: "A01", wells: "all", separator: "comma" };

// A number for a file: enough digits for any lab value, none of the float noise (0.30000000000000004 → 0.3).
function numberText(value: number, decimalComma: boolean): string {
  const text = String(Number(value.toPrecision(12)));
  return decimalComma ? text.replace(".", ",") : text;
}

// The table, header first. Cells are text; an empty well is an empty cell.
export function exportTable(state: PlateState, options: ExportOptions): string[][] {
  const format = formatOf(state.wells);
  const decimalComma = options.separator === "semicolon";
  const header = ["Well", "Row", "Column"];
  for (const l of state.layers) {
    const name = l.name || "Untitled";
    if (l.kind === "number") header.push(name, `${name} unit`);
    else header.push(name);
  }

  const rows: string[][] = [header];
  for (const well of wellsInOrder(format, options.order)) {
    const i = wellIndex(format, well);
    if (options.wells === "filled" && state.layers.every((l) => l.cells[i] === null)) continue;
    const row = [wellName(well, options.naming), rowLabel(well.row), columnLabel(well.column, "A1")];
    for (const l of state.layers) {
      const cell = l.cells[i];
      if (l.kind === "number") row.push(typeof cell === "number" ? numberText(cell, decimalComma) : "", typeof cell === "number" ? l.unit : "");
      else row.push(cell === null ? "" : String(cell));
    }
    rows.push(row);
  }
  return rows;
}

const SEPARATORS: Record<Separator, string> = { comma: ",", semicolon: ";", tab: "\t" };

// One field, quoted when it holds the separator, a quote or a line break (RFC 4180); quotes inside are doubled.
function field(text: string, separator: string): string {
  return text.includes(separator) || /["\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// The table as a CSV file's text. It starts with a byte-order mark so that Excel reads "µM" as UTF-8, and its lines
// end with CRLF as the CSV standard and Excel expect.
export function toCsv(table: string[][], separator: Separator): string {
  const sep = SEPARATORS[separator];
  return "﻿" + table.map((row) => row.map((t) => field(t, sep)).join(sep)).join("\r\n") + "\r\n";
}

// The table as tab-separated lines, to paste into a spreadsheet.
export function toTabs(table: string[][]): string {
  return table.map((row) => row.map((t) => t.replace(/[\t\r\n]+/g, " ")).join("\t")).join("\n");
}
