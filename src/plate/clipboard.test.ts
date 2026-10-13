import { describe, expect, it } from "vitest";

import { asNumbers, asText, copyBlock, fillTarget, fillWrites, fromText, pasteTarget, tile, toText } from "./clipboard";
import { formatOf, wellIndex } from "./plate";
import { blockOf, pick, single } from "./selection";
import type { Cell } from "./values";

const plate = formatOf(96); // 8 × 12
const at = (row: number, column: number) => ({ row, column });
const idx = (row: number, column: number) => wellIndex(plate, at(row, column));

function cellsWith(entries: [number, number, Cell][]): Cell[] {
  const cells: Cell[] = Array(96).fill(null);
  for (const [r, c, v] of entries) cells[idx(r, c)] = v;
  return cells;
}

describe("copy and text", () => {
  const cells = cellsWith([
    [0, 0, "Gene A KD"],
    [0, 1, "Scramble"],
    [1, 0, 10],
  ]);
  const clip = copyBlock(plate, cells, blockOf(at(0, 0), at(1, 1)));

  it("copies a block as rows of cells", () => {
    expect(clip).toEqual({
      rows: 2,
      columns: 2,
      cells: [
        ["Gene A KD", "Scramble"],
        [10, null],
      ],
    });
  });

  it("writes tab-separated lines and reads them back", () => {
    expect(toText(clip)).toBe("Gene A KD\tScramble\n10\t");
    expect(fromText("Gene A KD\tScramble\r\n10\t\r\n")).toEqual(asText(clip));
  });

  it("reads ragged lines from a spreadsheet as a full grid", () => {
    expect(fromText("a\tb\tc\nd")).toEqual({ rows: 2, columns: 3, cells: [["a", "b", "c"], ["d", null, null]] });
  });

  it("turns text into numbers for a number layer, or says why not", () => {
    expect(asNumbers(fromText("0,5\t10 uM\n\t1"), "µM")).toEqual({ ok: true, clip: { rows: 2, columns: 2, cells: [[0.5, 10], [null, 1]] } });
    expect(asNumbers(fromText("Vehicle"), "µM").ok).toBe(false);
  });
});

describe("paste", () => {
  const clip = fromText("x\ty"); // 1 × 2

  it("lands at the active well with the clip's size", () => {
    expect(pasteTarget(clip, single(at(2, 3)))).toEqual({ top: 2, left: 3, bottom: 2, right: 4 });
  });

  it("tiles a selected block that is a multiple of the clip", () => {
    const s = pick(single(at(0, 0)), at(1, 3), "extend"); // 2 × 4
    const target = pasteTarget(clip, s);
    expect(target).toEqual({ top: 0, left: 0, bottom: 1, right: 3 });
    const writes = tile(plate, clip, target);
    expect(writes.map((w) => w.cell)).toEqual(["x", "y", "x", "y", "x", "y", "x", "y"]);
  });

  it("does not tile a block that is not a multiple", () => {
    const s = pick(single(at(0, 0)), at(0, 2), "extend"); // 1 × 3
    expect(pasteTarget(clip, s)).toEqual({ top: 0, left: 0, bottom: 0, right: 1 });
  });

  it("leaves out what falls beyond the plate", () => {
    expect(tile(plate, clip, pasteTarget(clip, single(at(7, 11))))).toEqual([{ index: 95, cell: "x" }]);
  });
});

describe("fill handle", () => {
  it("stretches the block the way the pointer went further", () => {
    const source = blockOf(at(1, 1), at(2, 2));
    expect(fillTarget(source, at(6, 3))).toEqual({ top: 1, left: 1, bottom: 6, right: 2 });
    expect(fillTarget(source, at(2, 9))).toEqual({ top: 1, left: 1, bottom: 2, right: 9 });
    expect(fillTarget(source, at(0, 1))).toEqual({ top: 0, left: 1, bottom: 2, right: 2 });
    expect(fillTarget(source, at(2, 2))).toEqual(source);
  });

  it("repeats the pattern into the new wells only, in step with the source", () => {
    const cells = cellsWith([
      [0, 0, "Vehicle"],
      [1, 0, "Compound X"],
    ]);
    const source = blockOf(at(0, 0), at(1, 0));
    const down = fillWrites(plate, cells, source, fillTarget(source, at(4, 0)));
    expect(down.map((w) => w.cell)).toEqual(["Vehicle", "Compound X", "Vehicle"]);
    expect(down.map((w) => w.index)).toEqual([idx(2, 0), idx(3, 0), idx(4, 0)]);

    const lower = blockOf(at(3, 0), at(4, 0));
    const shifted = cellsWith([
      [3, 0, "Vehicle"],
      [4, 0, "Compound X"],
    ]);
    const up = fillWrites(plate, shifted, lower, fillTarget(lower, at(1, 0)));
    expect(up.map((w) => [w.index, w.cell])).toEqual([
      [idx(1, 0), "Vehicle"],
      [idx(2, 0), "Compound X"],
    ]);
  });
});
