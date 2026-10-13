import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ClipboardEvent } from "react";

import type { Clip } from "./plate/clipboard";
import { asNumbers, asText, copyBlock, fillWrites, fromText, pasteTarget, tile, toText } from "./plate/clipboard";
import { formatOf, wellName } from "./plate/plate";
import type { Selection } from "./plate/selection";
import { selectedCount, selectedMask, selectionLabel, single } from "./plate/selection";
import type { Cell } from "./plate/values";
import { cellText } from "./plate/values";
import { canRedo, canUndo, start, undoable } from "./state/history";
import { currentLayer, hasData, initialState, lostOnFormat } from "./state/plate";
import { wellColors } from "./ui/colors";
import type { EntryHandle } from "./ui/EntryBar";
import { EntryBar } from "./ui/EntryBar";
import { ExportPanel } from "./ui/ExportPanel";
import { FormatPicker } from "./ui/FormatPicker";
import { Help } from "./ui/Help";
import { LayerBar } from "./ui/LayerBar";
import { Legend } from "./ui/Legend";
import { PlateGrid } from "./ui/PlateGrid";
import { ThemeSwitch } from "./ui/ThemeSwitch";

// The page: the frame every Clamk tool has (rail, header with the name and the theme switch, footer) around the
// plate. The plate's state (format, layers, values) is one reducer (state/plate.ts); the selection is kept beside it,
// since selecting wells changes nothing on the plate. Typing goes through the entry bar into every selected well of
// the current layer; the legend beside the plate lists that layer's values. Every change can be undone (state/history.ts).
// Copy, cut and paste use the system clipboard as tab-separated text, so blocks go to and from a spreadsheet too.

const FIRST_WELL = single({ row: 0, column: 0 });

export function App() {
  const [history, dispatch] = useReducer(undoable, undefined, () => start(initialState(96)));
  const plate = history.present;
  const clip = useRef<{ text: string; clip: Clip } | null>(null); // the last copy, typed (text and numbers)
  const [notice, setNotice] = useState("");
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
  const anyData = plate.layers.some(hasData);

  // Undo and redo from anywhere but a text box (which keeps its own undo for the text being typed).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || (e.target as HTMLElement).closest("input, textarea")) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) dispatch({ type: "undo" });
      else if (k === "y" || (k === "z" && e.shiftKey)) dispatch({ type: "redo" });
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Nothing is saved yet (doc/ROADMAP.md, later): leaving a described plate asks first.
  useEffect(() => {
    if (!anyData) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [anyData]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  // The selected block to the clipboard; false when the selection is several blocks (a spreadsheet refuses too).
  const copy = (e: ClipboardEvent<HTMLDivElement>): boolean => {
    e.preventDefault();
    if (selection.blocks.length > 1) {
      setNotice("Copy works on one block of wells: select a single block.");
      return false;
    }
    const c = copyBlock(format, layer.cells, selection.blocks[0]);
    const text = toText(c);
    clip.current = { text, clip: c };
    e.clipboardData.setData("text/plain", text);
    return true;
  };

  const cut = (e: ClipboardEvent<HTMLDivElement>) => {
    if (copy(e)) fill(null);
  };

  const paste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    const raw = clip.current?.text === text ? clip.current.clip : fromText(text);
    let ready = asText(raw);
    if (layer.kind === "number") {
      const converted = asNumbers(raw, layer.unit);
      if (!converted.ok) return setNotice(converted.message);
      ready = converted.clip;
    }
    const target = pasteTarget(ready, selection);
    dispatch({ type: "put", writes: tile(format, ready, target) });
    const bottom = Math.min(target.bottom, format.rows - 1);
    const right = Math.min(target.right, format.columns - 1);
    setSelection({ blocks: [{ ...target, bottom, right }], active: { row: target.top, column: target.left }, focus: { row: bottom, column: right } });
  };
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
        <div className="intro">
          <p className="lede">Describe a microplate layer by layer, then export one row per well.</p>
          <Help />
        </div>
        <div className="toolbar">
          <FormatPicker wells={plate.wells} onChange={changeFormat} />
          <div className="history-buttons">
            <button type="button" className="compact" disabled={!canUndo(history)} onClick={() => dispatch({ type: "undo" })} title="Undo (Ctrl+Z)">
              Undo
            </button>
            <button type="button" className="compact" disabled={!canRedo(history)} onClick={() => dispatch({ type: "redo" })} title="Redo (Ctrl+Y)">
              Redo
            </button>
          </div>
        </div>
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
              onCopy={copy}
              onCut={cut}
              onPaste={paste}
              onFillHandle={(source, target) => dispatch({ type: "put", writes: fillWrites(format, layer.cells, source, target) })}
            />
            {notice && (
              <p className="entry-note error" role="status">
                {notice}
              </p>
            )}
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
        <ExportPanel plate={plate} />
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
