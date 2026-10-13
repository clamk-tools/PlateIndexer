import { useState } from "react";
import type { Dispatch } from "react";

import type { Action, Layer } from "../state/plate";
import { legendOf } from "../state/plate";
import { cellText } from "../plate/values";
import { colorOf } from "./colors";

// The current layer's values, each with its colour and how many wells hold it. A click puts the value in the selected
// wells (a palette to paint with); hovering one lights its wells on the plate; a text value can be renamed in every
// well at once, or removed from the wells that hold it. A text value can be listed before it is used.

interface Props {
  layer: Layer;
  selected: number;
  dispatch: Dispatch<Action>;
  onApply: (cell: string | number) => void;
  onHighlight: (cell: string | number | null) => void;
}

export function Legend({ layer, selected, dispatch, onApply, onHighlight }: Props) {
  const items = legendOf(layer);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState("");

  const remove = (cell: string | number, count: number) => {
    const label = cellText(cell, layer.unit);
    if (count > 0 && !window.confirm(`Clear “${label}” from ${count} ${count === 1 ? "well" : "wells"}?`)) return;
    dispatch({ type: "removeValue", cell });
    onHighlight(null);
  };

  const rename = (from: string) => {
    dispatch({ type: "renameValue", from, to: draft });
    setRenaming(null);
  };

  return (
    <section className="legend" aria-label={`Values of ${layer.name || "the layer"}`}>
      <h2 className="section-label">
        <span className="cap">Values</span>
        <span className="rule" />
      </h2>
      {items.length === 0 && <p className="legend-empty">{layer.kind === "text" ? "No values yet. Select wells and type one." : "No numbers yet. Select wells and type one."}</p>}
      <ul className="legend-list">
        {items.map((item) => {
          const label = cellText(item.cell, layer.unit);
          const color = colorOf(layer, item, items.length);
          if (renaming === item.cell) {
            return (
              <li key={label} className="legend-item">
                <span className="dot" style={{ background: color }} />
                <input
                  type="text"
                  value={draft}
                  autoFocus
                  aria-label={`New name for ${label}`}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") rename(item.cell as string);
                    if (e.key === "Escape") setRenaming(null);
                  }}
                  onBlur={() => setRenaming(null)}
                />
              </li>
            );
          }
          return (
            <li key={label} className="legend-item" onPointerEnter={() => onHighlight(item.cell)} onPointerLeave={() => onHighlight(null)}>
              <button
                type="button"
                className="legend-apply"
                title={`Put “${label}” in the ${selected} selected ${selected === 1 ? "well" : "wells"}`}
                onClick={() => onApply(item.cell)}
                onFocus={() => onHighlight(item.cell)}
                onBlur={() => onHighlight(null)}
              >
                <span className="dot" style={{ background: color }} />
                <span className="legend-label">{label}</span>
                <span className="legend-count">{item.count}</span>
              </button>
              {layer.kind === "text" && (
                <button
                  type="button"
                  className="icon quiet"
                  aria-label={`Rename ${label}`}
                  title="Rename in every well"
                  onClick={() => {
                    setRenaming(item.cell as string);
                    setDraft(label);
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                  </svg>
                </button>
              )}
              <button type="button" className="icon quiet" aria-label={`Remove ${label}`} title="Remove from every well" onClick={() => remove(item.cell, item.count)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
      {layer.kind === "text" && (
        <form
          className="legend-add"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({ type: "addValue", label: adding });
            setAdding("");
          }}
        >
          <input type="text" value={adding} placeholder="Add a value to the list" aria-label="Add a value to the list" onChange={(e) => setAdding(e.target.value)} />
          <button type="submit" className="compact" disabled={!adding.trim()}>
            Add
          </button>
        </form>
      )}
    </section>
  );
}
