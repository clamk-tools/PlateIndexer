import { describe, expect, it } from "vitest";

import { formatOf } from "./plate";
import { move, pick, pickColumn, pickRow, selectAll, selectedCount, selectedMask, selectionLabel, single } from "./selection";

const plate = formatOf(96); // 8 rows (A–H) × 12 columns
const at = (row: number, column: number) => ({ row, column });

describe("clicking wells", () => {
  it("picks one well", () => {
    const s = pick(single(at(0, 0)), at(2, 3), "replace");
    expect(selectionLabel(s)).toBe("C4");
    expect(s.active).toEqual(at(2, 3));
  });

  it("extends from the active well with Shift, keeping the active well", () => {
    const s = pick(single(at(1, 1)), at(3, 4), "extend");
    expect(selectionLabel(s)).toBe("B2:D5");
    expect(s.active).toEqual(at(1, 1));
    expect(selectedCount(plate, s)).toBe(12);
  });

  it("extends backwards just as well", () => {
    expect(selectionLabel(pick(single(at(3, 4)), at(1, 1), "extend"))).toBe("B2:D5");
  });

  it("adds a block with Ctrl, then Shift extends that block only", () => {
    let s = pick(single(at(0, 0)), at(1, 1), "extend"); // A1:B2
    s = pick(s, at(5, 5), "add"); // + F6
    s = pick(s, at(6, 7), "extend"); // F6:G8
    expect(selectionLabel(s)).toBe("A1:B2, F6:G8");
    expect(s.active).toEqual(at(5, 5));
    expect(selectedCount(plate, s)).toBe(4 + 6);
  });

  it("counts a well selected twice once", () => {
    const s = pick(pick(single(at(0, 0)), at(1, 1), "extend"), at(1, 1), "add");
    expect(selectedCount(plate, s)).toBe(4);
  });
});

describe("row letters and column numbers", () => {
  it("picks a whole row", () => {
    const s = pickRow(plate, single(at(0, 0)), 2, "replace");
    expect(selectionLabel(s)).toBe("C1:C12");
    expect(s.active).toEqual(at(2, 0));
  });

  it("extends rows with Shift from the active well's row", () => {
    const s = pickRow(plate, pickRow(plate, single(at(0, 0)), 1, "replace"), 3, "extend");
    expect(selectionLabel(s)).toBe("B1:D12");
  });

  it("picks a whole column, and adds another with Ctrl", () => {
    const s = pickColumn(plate, pickColumn(plate, single(at(0, 0)), 0, "replace"), 11, "add");
    expect(selectionLabel(s)).toBe("A1:H1, A12:H12");
    expect(selectedCount(plate, s)).toBe(16);
  });

  it("selects every well from the corner, keeping the active well", () => {
    const s = selectAll(plate, single(at(4, 4)));
    expect(selectedCount(plate, s)).toBe(96);
    expect(s.active).toEqual(at(4, 4));
  });
});

describe("arrow keys", () => {
  it("moves the active well and stops at the edge", () => {
    let s = single(at(0, 0));
    s = move(plate, s, 0, 1, false, false);
    expect(selectionLabel(s)).toBe("A2");
    s = move(plate, s, -1, 0, false, false);
    expect(selectionLabel(s)).toBe("A2");
  });

  it("extends with Shift, and shrinks back", () => {
    let s = single(at(1, 1));
    s = move(plate, s, 1, 0, true, false);
    s = move(plate, s, 0, 2, true, false);
    expect(selectionLabel(s)).toBe("B2:C4");
    s = move(plate, s, 0, -1, true, false);
    expect(selectionLabel(s)).toBe("B2:C3");
    expect(s.active).toEqual(at(1, 1));
  });

  it("jumps to the edge with Ctrl, and Ctrl+Shift selects up to it", () => {
    expect(selectionLabel(move(plate, single(at(2, 3)), 0, 1, false, true))).toBe("C12");
    expect(selectionLabel(move(plate, single(at(2, 3)), 1, 0, true, true))).toBe("C4:H4");
  });
});

describe("mask", () => {
  it("flags the selected wells row by row", () => {
    const mask = selectedMask(plate, pick(single(at(0, 10)), at(1, 11), "extend"));
    expect([...mask].flatMap((f, i) => (f ? [i] : []))).toEqual([10, 11, 22, 23]);
  });
});
