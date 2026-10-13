import type { Layer, LegendItem } from "../state/plate";
import { legendOf } from "../state/plate";

// The colour of each value on the plate. Text values take the categorical palette (plate.css --cat-0…--cat-8: the
// identity's blue, green, coral, amber, then the tool's own violet, teal, pink, olive, grey), cycling past nine.
// Numbers run along one sequential scale, palest for the smallest, by rank so that 0.1, 1 and 10 are evenly spaced.

export const PALETTE_SIZE = 9;

export function colorOf(layer: Layer, item: LegendItem, items: number): string {
  if (layer.kind === "text") return `var(--cat-${item.color % PALETTE_SIZE})`;
  const share = items <= 1 ? 100 : Math.round(30 + (70 * item.color) / (items - 1));
  return `color-mix(in srgb, var(--seq-ink) ${share}%, var(--seq-tint))`;
}

// One colour per well (undefined for an empty well), row by row.
export function wellColors(layer: Layer): (string | undefined)[] {
  const legend = legendOf(layer);
  const byCell = new Map(legend.map((item) => [item.cell, colorOf(layer, item, legend.length)]));
  return layer.cells.map((c) => (c === null ? undefined : byCell.get(c)));
}
