import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";

import type { PlateFormat, Well } from "../plate/plate";
import { columnLabel, rowLabel, wellIndex, wellName } from "../plate/plate";
import type { Mode, Selection } from "../plate/selection";
import { move, pick, pickColumn, pickRow, selectAll, selectedMask } from "../plate/selection";

// The plate as a grid, selected like a spreadsheet: click, drag, Shift-click, Ctrl/Cmd-click, the row letters and
// column numbers, the corner, the arrow keys (Shift extends, Ctrl/Cmd jumps to the edge), Ctrl/Cmd+A. The rules are in
// plate/selection.ts; this file only turns pointer and key events into them.

type Update = (next: (s: Selection) => Selection) => void;

// What a drag is extending: wells, whole rows or whole columns.
type Drag = "well" | "row" | "column" | null;

const ARROWS: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

const modeOf = (e: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }): Mode => (e.shiftKey ? "extend" : e.ctrlKey || e.metaKey ? "add" : "replace");

export const cellId = (well: Well) => `well-${well.row}-${well.column}`;

// The well, row or column under the pointer, read from the data-* attributes of the element there (the corner has
// neither: it is the whole plate).
function targetAt(x: number, y: number): { row?: number; column?: number } | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-row], [data-column], [data-corner]");
  if (!el) return null;
  const n = (v: string | undefined) => (v === undefined ? undefined : Number(v));
  return { row: n(el.dataset.row), column: n(el.dataset.column) };
}

export function PlateGrid({ format, selection, onSelect }: { format: PlateFormat; selection: Selection; onSelect: Update }) {
  const drag = useRef<Drag>(null);
  const mask = useMemo(() => selectedMask(format, selection), [format, selection]);
  const rows = Array.from({ length: format.rows }, (_, i) => i);
  const columns = Array.from({ length: format.columns }, (_, i) => i);
  const style = { "--columns": format.columns } as CSSProperties;

  // A row or column is lit in its header when one of its wells is selected, as in a spreadsheet.
  const litRows = rows.map((r) => columns.some((c) => mask[wellIndex(format, { row: r, column: c })]));
  const litColumns = columns.map((c) => rows.some((r) => mask[wellIndex(format, { row: r, column: c })]));

  useEffect(() => {
    const stop = () => (drag.current = null);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);

  // The active well stays in view when the arrows move it off the edge of a scrolled plate.
  useEffect(() => {
    document.getElementById(cellId(selection.active))?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [selection.active]);

  function down(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const t = targetAt(e.clientX, e.clientY);
    if (!t) return;
    const mode = modeOf(e);
    if (t.row !== undefined && t.column !== undefined) {
      const well = { row: t.row, column: t.column };
      onSelect((s) => pick(s, well, mode));
      drag.current = "well";
    } else if (t.row !== undefined) {
      const row = t.row;
      onSelect((s) => pickRow(format, s, row, mode));
      drag.current = "row";
    } else if (t.column !== undefined) {
      const column = t.column;
      onSelect((s) => pickColumn(format, s, column, mode));
      drag.current = "column";
    } else {
      onSelect((s) => selectAll(format, s));
    }
    // A finger drag scrolls the plate instead (touch-action in plate.css); a mouse or pen drag selects.
    if (e.pointerType === "touch") drag.current = null;
  }

  function over(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const t = targetAt(e.clientX, e.clientY);
    if (!t) return;
    if (drag.current === "well" && t.row !== undefined && t.column !== undefined) {
      const well = { row: t.row, column: t.column };
      onSelect((s) => (s.focus.row === well.row && s.focus.column === well.column ? s : pick(s, well, "extend")));
    } else if (drag.current === "row" && t.row !== undefined) {
      const row = t.row;
      onSelect((s) => (s.focus.row === row ? s : pickRow(format, s, row, "extend")));
    } else if (drag.current === "column" && t.column !== undefined) {
      const column = t.column;
      onSelect((s) => (s.focus.column === column ? s : pickColumn(format, s, column, "extend")));
    }
  }

  function key(e: KeyboardEvent<HTMLDivElement>) {
    const arrow = ARROWS[e.key];
    const jump = e.ctrlKey || e.metaKey;
    if (arrow) {
      onSelect((s) => move(format, s, arrow[0], arrow[1], e.shiftKey, jump));
    } else if (jump && e.key.toLowerCase() === "a") {
      onSelect((s) => selectAll(format, s));
    } else {
      return;
    }
    e.preventDefault();
  }

  return (
    <div className="plate-scroll">
      <div
        className="plate"
        role="grid"
        tabIndex={0}
        aria-label={`${format.wells}-well plate`}
        aria-multiselectable="true"
        aria-rowcount={format.rows + 1}
        aria-colcount={format.columns + 1}
        aria-activedescendant={cellId(selection.active)}
        style={style}
        data-wells={format.wells}
        onPointerDown={down}
        onPointerMove={over}
        onKeyDown={key}
      >
        <div className="plate-row" role="row">
          <div className="plate-corner" role="columnheader" title="Select all" aria-label="Select all" data-corner="" />
          {columns.map((c) => (
            <div key={c} className="plate-head" role="columnheader" data-column={c} data-lit={litColumns[c] || undefined}>
              {columnLabel(c, "A1")}
            </div>
          ))}
        </div>
        {rows.map((r) => (
          <div key={r} className="plate-row" role="row">
            <div className="plate-head" role="rowheader" data-row={r} data-lit={litRows[r] || undefined}>
              {rowLabel(r)}
            </div>
            {columns.map((c) => {
              const well = { row: r, column: c };
              const active = selection.active.row === r && selection.active.column === c;
              return (
                <div
                  key={c}
                  id={cellId(well)}
                  className="well"
                  role="gridcell"
                  aria-label={wellName(well, "A1")}
                  aria-selected={mask[wellIndex(format, well)] === 1}
                  data-row={r}
                  data-column={c}
                  data-active={active || undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
