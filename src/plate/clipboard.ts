// Copy, paste and the fill handle, with a spreadsheet's rules. A copied block is a grid of cells; pasted at the active
// well it lands with its top-left corner there, and a selected block that is a whole multiple of it in both directions
// is tiled with it, as Excel does. The fill handle repeats a block into the wells it is dragged over. Text copied
// leaves as tab-separated lines, so it pastes into Excel; text pasted in is read the same way. Pure functions.

import type { PlateFormat, Well } from "./plate";
import { wellIndex } from "./plate";
import type { Block, Selection } from "./selection";
import type { Cell } from "./values";
import { cellText, parseNumber, tidy } from "./values";

export interface Clip {
  rows: number;
  columns: number;
  cells: Cell[][]; // [row][column]
}

// One well to write: where, and what.
export interface Write {
  index: number;
  cell: Cell;
}

export function copyBlock(format: PlateFormat, cells: readonly Cell[], block: Block): Clip {
  const grid: Cell[][] = [];
  for (let row = block.top; row <= block.bottom; row++) {
    const line: Cell[] = [];
    for (let column = block.left; column <= block.right; column++) line.push(cells[wellIndex(format, { row, column })]);
    grid.push(line);
  }
  return { rows: grid.length, columns: grid[0].length, cells: grid };
}

// The clip as tab-separated lines (numbers without their unit: the column's header says it in a spreadsheet).
export function toText(clip: Clip): string {
  return clip.cells.map((line) => line.map((c) => cellText(c)).join("\t")).join("\n");
}

// Tab-separated lines (from a spreadsheet, or from here) as a clip of text. A trailing line break, as a spreadsheet
// adds, is not an extra row.
export function fromText(text: string): Clip {
  const lines = text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
  const raw = lines.map((l) => l.split("\t"));
  const columns = Math.max(...raw.map((l) => l.length));
  const cells = raw.map((l) => Array.from({ length: columns }, (_, i) => tidy(l[i] ?? "") || null));
  return { rows: cells.length, columns, cells };
}

export type Converted = { ok: true; clip: Clip } | { ok: false; message: string };

// A clip of text made fit for a number layer: every filled cell read as a number in the layer's unit.
export function asNumbers(clip: Clip, unit: string): Converted {
  const cells: Cell[][] = [];
  for (const line of clip.cells) {
    const out: Cell[] = [];
    for (const c of line) {
      if (c === null || typeof c === "number") {
        out.push(c);
        continue;
      }
      const parsed = parseNumber(c, unit);
      if (!parsed.ok) return { ok: false, message: `Not pasted: ${parsed.message}` };
      out.push(parsed.value);
    }
    cells.push(out);
  }
  return { ok: true, clip: { ...clip, cells } };
}

// The same clip with every number written as text, for a text layer.
export function asText(clip: Clip): Clip {
  return { ...clip, cells: clip.cells.map((line) => line.map((c) => (typeof c === "number" ? cellText(c) : c))) };
}

// The clip repeated over a block, starting at its top-left corner; wells beyond the plate are left out.
export function tile(format: PlateFormat, clip: Clip, target: Block): Write[] {
  const writes: Write[] = [];
  for (let row = target.top; row <= Math.min(target.bottom, format.rows - 1); row++) {
    for (let column = target.left; column <= Math.min(target.right, format.columns - 1); column++) {
      const cell = clip.cells[(row - target.top) % clip.rows][(column - target.left) % clip.columns];
      writes.push({ index: wellIndex(format, { row, column }), cell });
    }
  }
  return writes;
}

// Where a paste lands: tiled over the selection when it is one block a whole multiple of the clip in both directions,
// otherwise the clip's own size from the active well.
export function pasteTarget(clip: Clip, selection: Selection): Block {
  const [b] = selection.blocks;
  if (selection.blocks.length === 1) {
    const rows = b.bottom - b.top + 1;
    const columns = b.right - b.left + 1;
    if (rows % clip.rows === 0 && columns % clip.columns === 0) return b;
  }
  const at: Well = selection.active;
  return { top: at.row, left: at.column, bottom: at.row + clip.rows - 1, right: at.column + clip.columns - 1 };
}

// The block the fill handle covers when dragged from a block to a well: the block stretched down/up or right/left,
// whichever way the pointer went further, as in Excel.
export function fillTarget(source: Block, to: Well): Block {
  const down = to.row > source.bottom ? to.row - source.bottom : to.row < source.top ? to.row - source.top : 0;
  const right = to.column > source.right ? to.column - source.right : to.column < source.left ? to.column - source.left : 0;
  if (down === 0 && right === 0) return source;
  if (Math.abs(down) >= Math.abs(right)) return down > 0 ? { ...source, bottom: to.row } : { ...source, top: to.row };
  return right > 0 ? { ...source, right: to.column } : { ...source, left: to.column };
}

// What the fill handle writes: the source block repeated over the target, lined up on the source (so a fill upwards
// or leftwards keeps the pattern in step).
export function fillWrites(format: PlateFormat, cells: readonly Cell[], source: Block, target: Block): Write[] {
  const clip = copyBlock(format, cells, source);
  const mod = (n: number, m: number) => ((n % m) + m) % m;
  const writes: Write[] = [];
  for (let row = target.top; row <= target.bottom; row++) {
    for (let column = target.left; column <= target.right; column++) {
      const inside = row >= source.top && row <= source.bottom && column >= source.left && column <= source.right;
      if (inside) continue;
      const cell = clip.cells[mod(row - source.top, clip.rows)][mod(column - source.left, clip.columns)];
      writes.push({ index: wellIndex(format, { row, column }), cell });
    }
  }
  return writes;
}
