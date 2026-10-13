// The plate being described: its format and its layers. Every change is an action given to reduce(), which returns a
// new state and never changes the old one (so undo, Task 5, can keep the old ones). Wells are kept row by row
// (plate/plate.ts wellIndex()).

import type { Well } from "../plate/plate";
import { formatOf, wellIndex } from "../plate/plate";
import type { Cell, Kind } from "../plate/values";
import { tidy } from "../plate/values";

// A known value of a text layer and its colour (an index into the palette, kept when other values go).
export interface Entry {
  label: string;
  color: number;
}

export interface Layer {
  id: number;
  name: string;
  kind: Kind;
  unit: string; // number layers: the unit every well of the layer is in
  entries: Entry[]; // text layers: the value list, in the order values were made
  cells: Cell[]; // one per well, row by row
}

export interface PlateState {
  wells: number;
  layers: Layer[];
  current: number; // the id of the layer being edited
  nextId: number;
}

export type Action =
  | { type: "format"; wells: number }
  | { type: "addLayer"; kind: Kind }
  | { type: "removeLayer"; id: number }
  | { type: "renameLayer"; id: number; name: string }
  | { type: "setUnit"; id: number; unit: string }
  | { type: "setKind"; id: number; kind: Kind }
  | { type: "moveLayer"; id: number; by: -1 | 1 }
  | { type: "selectLayer"; id: number }
  | { type: "fill"; indexes: number[]; cell: Cell }
  | { type: "put"; writes: { index: number; cell: Cell }[] }
  | { type: "addValue"; label: string }
  | { type: "renameValue"; from: string; to: string }
  | { type: "removeValue"; cell: string | number };

function emptyLayer(id: number, kind: Kind, wells: number): Layer {
  return { id, name: kind === "number" ? `Dose ${id}` : `Layer ${id}`, kind, unit: kind === "number" ? "µM" : "", entries: [], cells: Array(wells).fill(null) };
}

export function initialState(wells = 96): PlateState {
  return { wells, layers: [emptyLayer(1, "text", wells)], current: 1, nextId: 2 };
}

export function currentLayer(state: PlateState): Layer {
  return state.layers.find((l) => l.id === state.current) ?? state.layers[0];
}

export function hasData(layer: Layer): boolean {
  return layer.cells.some((c) => c !== null);
}

// A text layer's value list with one more value, given the first colour no value of the layer uses.
function withEntry(layer: Layer, label: string): Layer {
  if (layer.kind !== "text" || layer.entries.some((e) => e.label === label)) return layer;
  const used = new Set(layer.entries.map((e) => e.color));
  let color = 0;
  while (used.has(color)) color++;
  return { ...layer, entries: [...layer.entries, { label, color }] };
}

// How many filled wells a change of format would drop (wells beyond the new plate's rows or columns).
export function lostOnFormat(state: PlateState, wells: number): number {
  const from = formatOf(state.wells);
  const to = formatOf(wells);
  let lost = 0;
  for (const layer of state.layers) {
    layer.cells.forEach((cell, i) => {
      const row = Math.floor(i / from.columns);
      const column = i % from.columns;
      if (cell !== null && (row >= to.rows || column >= to.columns)) lost++;
    });
  }
  return lost;
}

// Each value stays in its well (same row letter, same column number) where the new plate has that well.
function reformat(layer: Layer, fromWells: number, toWells: number): Layer {
  const from = formatOf(fromWells);
  const to = formatOf(toWells);
  const cells: Cell[] = Array(to.wells).fill(null);
  layer.cells.forEach((cell, i) => {
    const well: Well = { row: Math.floor(i / from.columns), column: i % from.columns };
    if (well.row < to.rows && well.column < to.columns) cells[wellIndex(to, well)] = cell;
  });
  return { ...layer, cells };
}

function mapLayer(state: PlateState, id: number, change: (layer: Layer) => Layer): PlateState {
  return { ...state, layers: state.layers.map((l) => (l.id === id ? change(l) : l)) };
}

export function reduce(state: PlateState, action: Action): PlateState {
  switch (action.type) {
    case "format":
      if (action.wells === state.wells) return state;
      return { ...state, wells: action.wells, layers: state.layers.map((l) => reformat(l, state.wells, action.wells)) };

    case "addLayer": {
      const layer = emptyLayer(state.nextId, action.kind, state.wells);
      return { ...state, layers: [...state.layers, layer], current: layer.id, nextId: state.nextId + 1 };
    }

    case "removeLayer": {
      if (state.layers.length === 1) return state; // a plate always has a layer to type into
      const at = state.layers.findIndex((l) => l.id === action.id);
      const layers = state.layers.filter((l) => l.id !== action.id);
      const current = state.current === action.id ? layers[Math.max(0, at - 1)].id : state.current;
      return { ...state, layers, current };
    }

    case "renameLayer":
      return mapLayer(state, action.id, (l) => ({ ...l, name: action.name }));

    case "setUnit":
      return mapLayer(state, action.id, (l) => ({ ...l, unit: tidy(action.unit) }));

    case "setKind":
      // Only an empty layer changes kind: its wells would otherwise hold values of the other kind.
      return mapLayer(state, action.id, (l) => (hasData(l) || l.kind === action.kind ? l : { ...l, kind: action.kind, unit: action.kind === "number" ? "µM" : "", entries: [] }));

    case "moveLayer": {
      const at = state.layers.findIndex((l) => l.id === action.id);
      const to = at + action.by;
      if (at < 0 || to < 0 || to >= state.layers.length) return state;
      const layers = [...state.layers];
      [layers[at], layers[to]] = [layers[to], layers[at]];
      return { ...state, layers };
    }

    case "selectLayer":
      return state.layers.some((l) => l.id === action.id) ? { ...state, current: action.id } : state;

    case "fill":
      return mapLayer(state, state.current, (l) => {
        const cell = typeof action.cell === "string" ? tidy(action.cell) || null : action.cell;
        const cells = [...l.cells];
        for (const i of action.indexes) cells[i] = cell;
        return typeof cell === "string" ? withEntry({ ...l, cells }, cell) : { ...l, cells };
      });

    // Different values in different wells (a paste, the fill handle): text values join the list in order.
    case "put":
      return mapLayer(state, state.current, (l) => {
        const cells = [...l.cells];
        let next = l;
        for (const w of action.writes) {
          const cell = typeof w.cell === "string" ? tidy(w.cell) || null : w.cell;
          cells[w.index] = cell;
          if (typeof cell === "string") next = withEntry(next, cell);
        }
        return { ...next, cells };
      });

    case "addValue": {
      const label = tidy(action.label);
      return label ? mapLayer(state, state.current, (l) => withEntry(l, label)) : state;
    }

    // A value renamed in every well of the layer; renamed to a value that exists, the two become one.
    case "renameValue": {
      const to = tidy(action.to);
      if (!to || to === action.from) return state;
      return mapLayer(state, state.current, (l) => {
        if (l.kind !== "text") return l;
        const merging = l.entries.some((e) => e.label === to);
        const entries = merging ? l.entries.filter((e) => e.label !== action.from) : l.entries.map((e) => (e.label === action.from ? { ...e, label: to } : e));
        return { ...l, entries, cells: l.cells.map((c) => (c === action.from ? to : c)) };
      });
    }

    // A value taken off the list, and out of every well that held it.
    case "removeValue":
      return mapLayer(state, state.current, (l) => ({
        ...l,
        entries: l.entries.filter((e) => e.label !== action.cell),
        cells: l.cells.map((c) => (c === action.cell ? null : c)),
      }));
  }
}

// The values a layer holds, for its legend: text in list order, numbers smallest first; with how many wells.
export interface LegendItem {
  cell: string | number;
  color: number; // text: palette index; number: rank among the layer's numbers
  count: number;
}

export function legendOf(layer: Layer): LegendItem[] {
  const counts = new Map<string | number, number>();
  for (const c of layer.cells) if (c !== null) counts.set(c, (counts.get(c) ?? 0) + 1);
  if (layer.kind === "text") return layer.entries.map((e) => ({ cell: e.label, color: e.color, count: counts.get(e.label) ?? 0 }));
  const numbers = [...counts.keys()].filter((c): c is number => typeof c === "number").sort((a, b) => a - b);
  return numbers.map((n, i) => ({ cell: n, color: i, count: counts.get(n) ?? 0 }));
}
