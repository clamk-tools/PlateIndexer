import type { Dispatch } from "react";

import type { Action, Layer } from "../state/plate";
import { hasData } from "../state/plate";

// The layers as tabs (one is edited at a time), the buttons that add one, and the current layer's settings: its
// name, its kind (while it is empty), its unit (a number layer), its place among the others, and removing it.

const UNITS = ["µM", "nM", "mM", "M", "ng/mL", "µg/mL", "%", "cells/well", "µL", "h"];

export function LayerBar({ layers, current, dispatch }: { layers: Layer[]; current: Layer; dispatch: Dispatch<Action> }) {
  const at = layers.indexOf(current);
  const remove = () => {
    if (hasData(current) && !window.confirm(`Remove the layer “${current.name}” and its values?`)) return;
    dispatch({ type: "removeLayer", id: current.id });
  };

  return (
    <section className="layer-bar" aria-label="Layers">
      <div className="layer-tabs">
        <div role="tablist" aria-label="Layers" className="tabs">
          {layers.map((l) => (
            <button key={l.id} type="button" role="tab" aria-selected={l.id === current.id} className="tab" onClick={() => dispatch({ type: "selectLayer", id: l.id })}>
              {l.name || "Untitled"}
              {l.kind === "number" && l.unit ? <span className="tab-unit"> · {l.unit}</span> : null}
            </button>
          ))}
        </div>
        <div className="layer-add">
          <button type="button" className="compact" onClick={() => dispatch({ type: "addLayer", kind: "text" })}>
            + Text layer
          </button>
          <button type="button" className="compact" onClick={() => dispatch({ type: "addLayer", kind: "number" })}>
            + Number layer
          </button>
        </div>
      </div>

      <div className="layer-settings">
        <label className="field">
          <span className="cap">Name</span>
          <input type="text" value={current.name} onChange={(e) => dispatch({ type: "renameLayer", id: current.id, name: e.target.value })} aria-label="Layer name" />
        </label>

        {!hasData(current) && (
          <div className="field">
            <span className="cap" id="kind-label">
              Holds
            </span>
            <div className="segmented" role="radiogroup" aria-labelledby="kind-label">
              {(["text", "number"] as const).map((kind) => (
                <button key={kind} type="button" role="radio" aria-checked={current.kind === kind} onClick={() => dispatch({ type: "setKind", id: current.id, kind })}>
                  {kind === "text" ? "Text" : "Numbers"}
                </button>
              ))}
            </div>
          </div>
        )}

        {current.kind === "number" && (
          <label className="field">
            <span className="cap">Unit</span>
            <input type="text" className="unit-input" list="units" value={current.unit} onChange={(e) => dispatch({ type: "setUnit", id: current.id, unit: e.target.value })} aria-label="Unit" />
            <datalist id="units">
              {UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </label>
        )}

        <div className="layer-actions">
          <button type="button" className="compact quiet" disabled={at <= 0} onClick={() => dispatch({ type: "moveLayer", id: current.id, by: -1 })} aria-label="Move layer left" title="Move left">
            ←
          </button>
          <button type="button" className="compact quiet" disabled={at >= layers.length - 1} onClick={() => dispatch({ type: "moveLayer", id: current.id, by: 1 })} aria-label="Move layer right" title="Move right">
            →
          </button>
          <button type="button" className="compact danger" disabled={layers.length === 1} onClick={remove}>
            Remove layer
          </button>
        </div>
      </div>
    </section>
  );
}
