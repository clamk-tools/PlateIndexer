import { useMemo, useReducer, useRef, useState } from "react";

import { formatOf, wellName } from "./plate/plate";
import type { Selection } from "./plate/selection";
import { selectedCount, selectedMask, selectionLabel, single } from "./plate/selection";
import type { Cell } from "./plate/values";
import { cellText } from "./plate/values";
import { currentLayer, initialState, lostOnFormat, reduce } from "./state/plate";
import { wellColors } from "./ui/colors";
import type { EntryHandle } from "./ui/EntryBar";
import { EntryBar } from "./ui/EntryBar";
import { FormatPicker } from "./ui/FormatPicker";
import { LayerBar } from "./ui/LayerBar";
import { Legend } from "./ui/Legend";
import { PlateGrid } from "./ui/PlateGrid";
import { ThemeSwitch } from "./ui/ThemeSwitch";

// The page: the frame every Clamk tool has (rail, header with the name and the theme switch, footer) around the
// plate. The plate's state (format, layers, values) is one reducer (state/plate.ts); the selection is kept beside it,
// since selecting wells changes nothing on the plate. Typing goes through the entry bar into every selected well of
// the current layer; the legend beside the plate lists that layer's values.

const FIRST_WELL = single({ row: 0, column: 0 });

export function App() {
  const [plate, dispatch] = useReducer(reduce, undefined, () => initialState(96));
  const [selection, setSelection] = useState<Selection>(FIRST_WELL);
  const [lit, setLit] = useState<string | number | null>(null); // a legend value hovered: its wells stand out
  const entry = useRef<EntryHandle>(null);
  const grid = useRef<HTMLDivElement>(null);

  const format = formatOf(plate.wells);
  const layer = currentLayer(plate);
  const mask = useMemo(() => selectedMask(format, selection), [format, selection]);
  const indexes = useMemo(() => {
    const all: number[] = [];
    mask.forEach((flag, i) => flag && all.push(i));
    return all;
  }, [mask]);
  const colors = useMemo(() => wellColors(layer), [layer]);

  // Each well's tooltip: its name and its value in every layer.
  const titles = useMemo(
    () =>
      Array.from({ length: format.wells }, (_, i) => {
        const name = wellName({ row: Math.floor(i / format.columns), column: i % format.columns }, "A1");
        const values = plate.layers.filter((l) => l.cells[i] !== null).map((l) => `${l.name}: ${cellText(l.cells[i], l.unit)}`);
        return [name, ...values].join("\n");
      }),
    [format, plate.layers],
  );

  const activeIndex = selection.active.row * format.columns + selection.active.column;
  const fill = (cell: Cell) => dispatch({ type: "fill", indexes, cell });
  const backToPlate = () => grid.current?.focus();

  // Another format: values stay in their wells where the new plate has them; the selection starts again at A1.
  const changeFormat = (wells: number) => {
    const lost = lostOnFormat(plate, wells);
    if (lost > 0 && !window.confirm(`A ${wells}-well plate has no room for ${lost} filled ${lost === 1 ? "well" : "wells"}. Change the format and drop ${lost === 1 ? "it" : "them"}?`)) return;
    dispatch({ type: "format", wells });
    setSelection(FIRST_WELL);
  };

  return (
    <div className="frame">
      <div className="rail" />
      <header className="wrap top">
        <h1 className="brand">
          <a href="./">Plate Indexer</a>
        </h1>
        <div className="top-actions">
          <a className="quiet" href="https://clamk-tools.github.io/">
            ← All tools
          </a>
          <ThemeSwitch />
        </div>
      </header>

      <main className="wrap page">
        <p className="lede">Describe a microplate layer by layer, then export one row per well.</p>
        <FormatPicker wells={plate.wells} onChange={changeFormat} />
        <LayerBar layers={plate.layers} current={layer} dispatch={dispatch} />
        <EntryBar
          ref={entry}
          key={layer.id}
          name={selectionLabel(selection)}
          count={selectedCount(format, selection)}
          layer={layer}
          activeCell={layer.cells[activeIndex] ?? null}
          onFill={fill}
          onDone={backToPlate}
        />
        <div className="workspace">
          <div className="plate-column">
            <PlateGrid
              ref={grid}
              format={format}
              selection={selection}
              onSelect={setSelection}
              colors={colors}
              titles={titles}
              dimmed={lit === null ? undefined : (i) => layer.cells[i] !== lit}
              onType={(text) => entry.current?.start(text)}
              onEdit={() => entry.current?.edit()}
              onClear={() => fill(null)}
            />
            <p className="inspector">
              <span className="inspector-well">{wellName(selection.active, "A1")}</span>
              {plate.layers.map((l) => (
                <span key={l.id} className="inspector-item">
                  <span className="cap">{l.name || "Untitled"}</span> {cellText(l.cells[activeIndex] ?? null, l.unit) || "—"}
                </span>
              ))}
            </p>
          </div>
          <Legend layer={layer} selected={indexes.length} dispatch={dispatch} onApply={(cell) => fill(cell)} onHighlight={setLit} />
        </div>
      </main>

      <footer className="wrap foot">
        <p>
          One of the{" "}
          <a className="quiet" href="https://clamk-tools.github.io/">
            Clamk Tools
          </a>{" "}
          ·{" "}
          <a className="quiet" href="https://github.com/clamk-tools/PlateIndexer">
            Source
          </a>
        </p>
      </footer>
    </div>
  );
}
