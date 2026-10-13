// What a layer's wells can hold, and how typed text becomes a value: text is tidied, numbers are read in the layer's
// unit, and a new text that differs from a known one only by case, spaces or punctuation is flagged before it splits
// one condition into two. Pure functions.

export type Kind = "text" | "number";

// One well of one layer: text, a number (in the layer's unit), or nothing.
export type Cell = string | number | null;

// Spaces trimmed at both ends and runs of spaces made one: "  Gene  A KD " → "Gene A KD".
export function tidy(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

// What makes two texts "the same condition" to a reader: case, spaces, hyphens, underscores, dots and slashes aside.
export function sameKey(text: string): string {
  return text.toLowerCase().replace(/[\s\-_./]+/g, "");
}

// The known value that a new text looks like, if any: "gene a-kd" looks like "Gene A KD". An exact match is not a
// near-duplicate; neither are "Gene A KD" and "Gene B KD", which differ in a real character.
export function nearDuplicate(text: string, known: readonly string[]): string | null {
  const key = sameKey(text);
  return known.find((k) => k !== text && sameKey(k) === key) ?? null;
}

// Known values offered while typing: those starting with what is typed first, then those containing it.
export function suggestions(typed: string, known: readonly string[], max = 8): string[] {
  const key = sameKey(typed);
  if (!key) return known.slice(0, max);
  const starts = known.filter((k) => sameKey(k).startsWith(key));
  const contains = known.filter((k) => !starts.includes(k) && sameKey(k).includes(key));
  return [...starts, ...contains].slice(0, max);
}

// "uM", "µM" (micro sign) and "μM" (Greek mu) are the same unit to a reader.
export function unitKey(unit: string): string {
  return unit.trim().replace(/[µμ]/g, "u").toLowerCase();
}

export type Parsed = { ok: true; value: number } | { ok: false; message: string };

// A number typed into a number layer: "10", "0.5", "0,5" (decimal comma), "1e-3", or followed by the layer's unit
// ("10 µM", "10uM"). Another unit is refused rather than guessed.
export function parseNumber(text: string, unit: string): Parsed {
  const t = tidy(text);
  const m = /^([-+]?(?:\d+[.,]?\d*|[.,]\d+)(?:e[-+]?\d+)?)\s*(.*)$/i.exec(t);
  if (!m) return { ok: false, message: `“${t}” is not a number` };
  const value = Number(m[1].replace(",", "."));
  if (!Number.isFinite(value)) return { ok: false, message: `“${t}” is not a number` };
  const typedUnit = m[2];
  if (typedUnit && unitKey(typedUnit) !== unitKey(unit)) {
    return { ok: false, message: unit ? `This layer is in ${unit}: type the number alone, or in ${unit}` : `This layer has no unit: type the number alone, or set its unit first` };
  }
  return { ok: true, value };
}

// A number as the page shows it: up to 6 significant digits, no trailing zeros.
export function formatNumber(value: number): string {
  return String(Number(value.toPrecision(6)));
}

// A cell as text, with the unit for a number when asked: "Gene A KD", "10 µM".
export function cellText(cell: Cell, unit = ""): string {
  if (cell === null) return "";
  if (typeof cell === "number") return unit ? `${formatNumber(cell)} ${unit}` : formatNumber(cell);
  return cell;
}
