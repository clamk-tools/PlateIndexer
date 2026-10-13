import { describe, expect, it } from "vitest";

import type { Action, PlateState } from "./plate";
import { currentLayer, initialState, legendOf, lostOnFormat, reduce } from "./plate";

const run = (actions: Action[], state: PlateState = initialState(96)) => actions.reduce(reduce, state);
const cells = (state: PlateState) => currentLayer(state).cells;

describe("layers", () => {
  it("starts with one empty text layer", () => {
    const s = initialState(96);
    expect(s.layers).toHaveLength(1);
    expect(currentLayer(s).kind).toBe("text");
    expect(cells(s)).toHaveLength(96);
  });

  it("adds a layer and makes it current; removes it and goes back", () => {
    let s = run([{ type: "addLayer", kind: "number" }]);
    expect(s.layers).toHaveLength(2);
    expect(currentLayer(s).kind).toBe("number");
    expect(currentLayer(s).unit).toBe("µM");
    s = reduce(s, { type: "removeLayer", id: s.current });
    expect(s.layers).toHaveLength(1);
    expect(s.current).toBe(1);
  });

  it("never removes the last layer", () => {
    expect(run([{ type: "removeLayer", id: 1 }]).layers).toHaveLength(1);
  });

  it("renames, moves, and changes the kind of an empty layer only", () => {
    let s = run([{ type: "addLayer", kind: "text" }, { type: "renameLayer", id: 2, name: "Treatment" }, { type: "moveLayer", id: 2, by: -1 }]);
    expect(s.layers.map((l) => l.name)).toEqual(["Treatment", "Layer 1"]);
    s = reduce(s, { type: "setKind", id: 2, kind: "number" });
    expect(s.layers[0].kind).toBe("number");
    s = run([{ type: "fill", indexes: [0], cell: 5 }, { type: "setKind", id: 2, kind: "text" }], s);
    expect(s.layers[0].kind).toBe("number");
  });
});

describe("filling wells", () => {
  it("fills the given wells, tidies text and lists the new value", () => {
    const s = run([{ type: "fill", indexes: [0, 1, 12], cell: "  Gene  A KD " }]);
    expect(cells(s).slice(0, 2)).toEqual(["Gene A KD", "Gene A KD"]);
    expect(cells(s)[12]).toBe("Gene A KD");
    expect(currentLayer(s).entries).toEqual([{ label: "Gene A KD", color: 0 }]);
  });

  it("clears wells with null or empty text", () => {
    const s = run([{ type: "fill", indexes: [0, 1], cell: "Vehicle" }, { type: "fill", indexes: [0], cell: null }, { type: "fill", indexes: [1], cell: "  " }]);
    expect(cells(s).slice(0, 2)).toEqual([null, null]);
    expect(currentLayer(s).entries).toHaveLength(1); // the value stays on the list
  });

  it("fills only the current layer", () => {
    const s = run([{ type: "addLayer", kind: "number" }, { type: "fill", indexes: [5], cell: 10 }]);
    expect(s.layers[0].cells[5]).toBeNull();
    expect(s.layers[1].cells[5]).toBe(10);
  });

  it("keeps a value's colour when another value goes", () => {
    let s = run([
      { type: "fill", indexes: [0], cell: "Scramble" },
      { type: "fill", indexes: [1], cell: "Gene A KD" },
      { type: "removeValue", cell: "Scramble" },
      { type: "fill", indexes: [2], cell: "Gene B KD" },
    ]);
    expect(currentLayer(s).entries).toEqual([
      { label: "Gene A KD", color: 1 },
      { label: "Gene B KD", color: 0 },
    ]);
    expect(cells(s)[0]).toBeNull();
    s = reduce(s, { type: "addValue", label: "Untreated" });
    expect(currentLayer(s).entries.at(-1)).toEqual({ label: "Untreated", color: 2 });
  });
});

describe("the value list", () => {
  it("renames a value in every well", () => {
    const s = run([{ type: "fill", indexes: [0, 1], cell: "Gene A kd" }, { type: "renameValue", from: "Gene A kd", to: "Gene A KD" }]);
    expect(cells(s).slice(0, 2)).toEqual(["Gene A KD", "Gene A KD"]);
    expect(currentLayer(s).entries).toEqual([{ label: "Gene A KD", color: 0 }]);
  });

  it("merges two values when one is renamed to the other", () => {
    const s = run([
      { type: "fill", indexes: [0], cell: "Vehicle" },
      { type: "fill", indexes: [1], cell: "vehicle" },
      { type: "renameValue", from: "vehicle", to: "Vehicle" },
    ]);
    expect(cells(s).slice(0, 2)).toEqual(["Vehicle", "Vehicle"]);
    expect(currentLayer(s).entries.map((e) => e.label)).toEqual(["Vehicle"]);
  });

  it("gives the legend with counts: text in list order, numbers smallest first", () => {
    let s = run([{ type: "fill", indexes: [0, 1, 2], cell: "Vehicle" }, { type: "fill", indexes: [3], cell: "Compound X" }]);
    expect(legendOf(currentLayer(s))).toEqual([
      { cell: "Vehicle", color: 0, count: 3 },
      { cell: "Compound X", color: 1, count: 1 },
    ]);
    s = run([{ type: "addLayer", kind: "number" }, { type: "fill", indexes: [0], cell: 10 }, { type: "fill", indexes: [1, 2], cell: 0.1 }], s);
    expect(legendOf(currentLayer(s)).map((i) => [i.cell, i.color, i.count])).toEqual([
      [0.1, 0, 2],
      [10, 1, 1],
    ]);
  });
});

describe("changing the format", () => {
  it("keeps each value in the same well where it exists, and counts what would be lost", () => {
    // 96 wells: H12 is index 95; A1 index 0. 24 wells (A–D × 1–6) keep A1, lose H12.
    let s = run([{ type: "fill", indexes: [0, 95], cell: "Vehicle" }]);
    expect(lostOnFormat(s, 24)).toBe(1);
    s = reduce(s, { type: "format", wells: 24 });
    expect(cells(s)).toHaveLength(24);
    expect(cells(s)[0]).toBe("Vehicle");
    s = reduce(s, { type: "format", wells: 384 });
    expect(cells(s)[0]).toBe("Vehicle"); // A1 stays A1
    expect(cells(s).filter((c) => c !== null)).toHaveLength(1);
  });
});
