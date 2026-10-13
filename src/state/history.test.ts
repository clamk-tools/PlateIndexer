import { describe, expect, it } from "vitest";

import { canRedo, canUndo, start, undoable } from "./history";
import type { HistoryAction } from "./history";
import { currentLayer, initialState } from "./plate";

const run = (actions: HistoryAction[]) => actions.reduce(undoable, start(initialState(96)));

describe("undo and redo", () => {
  it("steps back and forward through changes", () => {
    let h = run([
      { type: "fill", indexes: [0], cell: "Vehicle" },
      { type: "fill", indexes: [1], cell: "Compound X" },
    ]);
    h = undoable(h, { type: "undo" });
    expect(currentLayer(h.present).cells.slice(0, 2)).toEqual(["Vehicle", null]);
    h = undoable(h, { type: "undo" });
    expect(currentLayer(h.present).cells[0]).toBeNull();
    expect(canUndo(h)).toBe(false);
    h = undoable(h, { type: "redo" });
    expect(currentLayer(h.present).cells[0]).toBe("Vehicle");
    expect(canRedo(h)).toBe(true);
  });

  it("drops the undone steps when a new change comes", () => {
    let h = run([{ type: "fill", indexes: [0], cell: "Vehicle" }, { type: "undo" }, { type: "fill", indexes: [5], cell: "Mock" }]);
    expect(canRedo(h)).toBe(false);
    h = undoable(h, { type: "undo" });
    expect(currentLayer(h.present).cells.every((c) => c === null)).toBe(true);
  });

  it("folds the keys of one name into one step", () => {
    const h = run([
      { type: "renameLayer", id: 1, name: "s" },
      { type: "renameLayer", id: 1, name: "si" },
      { type: "renameLayer", id: 1, name: "siRNA" },
    ]);
    expect(h.past).toHaveLength(1);
    expect(undoable(h, { type: "undo" }).present.layers[0].name).toBe("Layer 1");
  });

  it("does not count choosing a layer, nor a change that changes nothing", () => {
    const h = run([{ type: "addLayer", kind: "text" }, { type: "selectLayer", id: 1 }, { type: "moveLayer", id: 1, by: -1 }]);
    expect(h.past).toHaveLength(1);
  });

  it("undoes a removed layer, and stays on the layer being edited", () => {
    let h = run([{ type: "addLayer", kind: "number" }, { type: "fill", indexes: [0], cell: 10 }, { type: "selectLayer", id: 1 }, { type: "removeLayer", id: 2 }]);
    expect(h.present.layers).toHaveLength(1);
    h = undoable(h, { type: "undo" });
    expect(h.present.layers).toHaveLength(2);
    expect(h.present.current).toBe(1);
    expect(h.present.layers[1].cells[0]).toBe(10);
  });

  it("puts different values in different wells as one step", () => {
    let h = run([
      {
        type: "put",
        writes: [
          { index: 0, cell: "Vehicle" },
          { index: 1, cell: "Compound X" },
        ],
      },
    ]);
    expect(currentLayer(h.present).entries.map((e) => e.label)).toEqual(["Vehicle", "Compound X"]);
    h = undoable(h, { type: "undo" });
    expect(currentLayer(h.present).cells.slice(0, 2)).toEqual([null, null]);
  });
});
