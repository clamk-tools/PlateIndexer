// Which wells are selected, with the rules of a spreadsheet: a click picks one well, Shift extends from the active
// well, Ctrl (Cmd on a Mac) adds a block, a row letter or a column number picks a whole line, the arrows move.
// Pure functions: each takes a selection and returns the next one.

import type { PlateFormat, Well } from "./plate";
import { columnLabel, rowLabel, wellIndex } from "./plate";

// A block of wells, edges included.
export interface Block {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

// The blocks selected, in the order they were made. `active` is the well a typed value goes to first (Excel's active
// cell) and the anchor Shift extends from; `focus` is the far corner of the last block, the one Shift+arrows moves.
export interface Selection {
  blocks: Block[];
  active: Well;
  focus: Well;
}

// How a click combines with what is already selected.
export type Mode = "replace" | "extend" | "add";

export function blockOf(a: Well, b: Well): Block {
  return {
    top: Math.min(a.row, b.row),
    left: Math.min(a.column, b.column),
    bottom: Math.max(a.row, b.row),
    right: Math.max(a.column, b.column),
  };
}

export function single(well: Well): Selection {
  return { blocks: [blockOf(well, well)], active: well, focus: well };
}

// A well clicked (or reached while dragging).
export function pick(selection: Selection, well: Well, mode: Mode): Selection {
  if (mode === "replace") return single(well);
  if (mode === "add") return { blocks: [...selection.blocks, blockOf(well, well)], active: well, focus: well };
  return { blocks: [...selection.blocks.slice(0, -1), blockOf(selection.active, well)], active: selection.active, focus: well };
}

// A row letter clicked: the whole row, or the rows from the active well's row with Shift.
export function pickRow(format: PlateFormat, selection: Selection, row: number, mode: Mode): Selection {
  const last = format.columns - 1;
  if (mode === "extend") {
    const block = blockOf({ row: selection.active.row, column: 0 }, { row, column: last });
    return { blocks: [...selection.blocks.slice(0, -1), block], active: selection.active, focus: { row, column: last } };
  }
  const block = blockOf({ row, column: 0 }, { row, column: last });
  const blocks = mode === "add" ? [...selection.blocks, block] : [block];
  return { blocks, active: { row, column: 0 }, focus: { row, column: last } };
}

// A column number clicked: the whole column, or the columns from the active well's column with Shift.
export function pickColumn(format: PlateFormat, selection: Selection, column: number, mode: Mode): Selection {
  const last = format.rows - 1;
  if (mode === "extend") {
    const block = blockOf({ row: 0, column: selection.active.column }, { row: last, column });
    return { blocks: [...selection.blocks.slice(0, -1), block], active: selection.active, focus: { row: last, column } };
  }
  const block = blockOf({ row: 0, column }, { row: last, column });
  const blocks = mode === "add" ? [...selection.blocks, block] : [block];
  return { blocks, active: { row: 0, column }, focus: { row: last, column } };
}

// The corner, or Ctrl+A: every well. The active well stays where it was.
export function selectAll(format: PlateFormat, selection: Selection): Selection {
  const corner = { row: format.rows - 1, column: format.columns - 1 };
  return { blocks: [blockOf({ row: 0, column: 0 }, corner)], active: selection.active, focus: corner };
}

// An arrow key. `extend` (Shift) moves the far corner of the last block instead of the active well; `jump` (Ctrl or
// Cmd) goes straight to the edge of the plate.
export function move(format: PlateFormat, selection: Selection, rows: number, columns: number, extend: boolean, jump: boolean): Selection {
  const from = extend ? selection.focus : selection.active;
  const clamp = (n: number, size: number) => Math.min(size - 1, Math.max(0, n));
  const edge = (n: number, step: number, size: number) => (step === 0 ? n : step < 0 ? 0 : size - 1);
  const to = jump
    ? { row: edge(from.row, rows, format.rows), column: edge(from.column, columns, format.columns) }
    : { row: clamp(from.row + rows, format.rows), column: clamp(from.column + columns, format.columns) };
  return extend ? pick(selection, to, "extend") : single(to);
}

// One flag per well (kept row by row, as wellIndex()): 1 if selected.
export function selectedMask(format: PlateFormat, selection: Selection): Uint8Array {
  const mask = new Uint8Array(format.wells);
  for (const b of selection.blocks) {
    for (let row = b.top; row <= b.bottom; row++) for (let column = b.left; column <= b.right; column++) mask[wellIndex(format, { row, column })] = 1;
  }
  return mask;
}

export function selectedCount(format: PlateFormat, selection: Selection): number {
  return selectedMask(format, selection).reduce((n, flag) => n + flag, 0);
}

// The selection as a spreadsheet writes it: "B2:D5, F7".
export function selectionLabel(selection: Selection): string {
  const name = (row: number, column: number) => rowLabel(row) + columnLabel(column, "A1");
  return selection.blocks
    .map((b) => (b.top === b.bottom && b.left === b.right ? name(b.top, b.left) : `${name(b.top, b.left)}:${name(b.bottom, b.right)}`))
    .join(", ");
}
