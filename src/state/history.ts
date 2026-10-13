// Undo and redo around the plate's reducer. Each change keeps the state before it; undo steps back, redo forward, a
// new change after an undo drops the steps that were undone. Typing a layer's name or unit is one step, not one per
// key; choosing which layer to edit is not a step at all.

import type { Action, PlateState } from "./plate";
import { reduce } from "./plate";

const LIMIT = 200;

export interface History {
  past: PlateState[];
  present: PlateState;
  future: PlateState[];
  last: string | null; // what the last step was, to fold the keys of one name into one step
}

export type HistoryAction = Action | { type: "undo" } | { type: "redo" };

export function start(present: PlateState): History {
  return { past: [], present, future: [], last: null };
}

// Steps that fold into the one before when it was the same field of the same layer.
function foldKey(action: Action): string | null {
  if (action.type === "renameLayer" || action.type === "setUnit") return `${action.type}:${action.id}`;
  return null;
}

export function undoable(history: History, action: HistoryAction): History {
  if (action.type === "undo") {
    const previous = history.past.at(-1);
    if (!previous) return history;
    return { past: history.past.slice(0, -1), present: { ...previous, current: pickCurrent(previous, history.present) }, future: [history.present, ...history.future], last: null };
  }
  if (action.type === "redo") {
    const [next, ...rest] = history.future;
    if (!next) return history;
    return { past: [...history.past, history.present], present: { ...next, current: pickCurrent(next, history.present) }, future: rest, last: null };
  }

  const present = reduce(history.present, action);
  if (present === history.present) return history;
  if (action.type === "selectLayer") return { ...history, present, last: null };

  const key = foldKey(action);
  if (key && key === history.last) return { ...history, present, future: [] };
  return { past: [...history.past, history.present].slice(-LIMIT), present, future: [], last: key };
}

// After undo or redo, stay on the layer being edited if it still exists there.
function pickCurrent(target: PlateState, from: PlateState): number {
  return target.layers.some((l) => l.id === from.current) ? from.current : target.current;
}

export const canUndo = (h: History) => h.past.length > 0;
export const canRedo = (h: History) => h.future.length > 0;
