import { useImperativeHandle, useRef, useState } from "react";
import type { KeyboardEvent, Ref } from "react";

import type { Layer } from "../state/plate";
import { legendOf } from "../state/plate";
import type { Cell } from "../plate/values";
import { cellText, nearDuplicate, parseNumber, suggestions, tidy } from "../plate/values";

// Excel's name box and formula bar: what is selected, and the box a value is typed in. Typing on the plate starts
// here (PlateGrid hands over the first key); Enter fills every selected well; Escape gives up; Tab takes the first
// suggestion. A new text that looks like a known value ("gene a kd" beside "Gene A KD") asks which one is meant.

export interface EntryHandle {
  start: (text: string) => void; // begin typing, the box holding `text`
  edit: () => void; // begin editing the active well's value
}

interface Props {
  ref: Ref<EntryHandle>;
  name: string; // the selection, as "B2:D5"
  count: number; // how many wells are selected
  layer: Layer;
  activeCell: Cell; // the active well's value in this layer
  onFill: (cell: Cell) => void;
  onDone: () => void; // typing over: back to the plate
}

type Prompt = { typed: string; known: string } | null;

export function EntryBar({ ref, name, count, layer, activeCell, onFill, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null); // null: not typing, the box shows the active well
  const [pick, setPick] = useState(-1); // the suggestion highlighted with the arrows
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState<Prompt>(null);

  const known = layer.kind === "text" ? layer.entries.map((e) => e.label) : legendOf(layer).map((i) => cellText(i.cell));
  const shown = draft ?? cellText(activeCell);
  const offers = draft !== null && !prompt ? suggestions(draft, known).filter((k) => k !== tidy(draft)) : [];

  const begin = (text: string) => {
    setDraft(text);
    setPick(-1);
    setError("");
    setPrompt(null);
    input.current?.focus();
  };

  useImperativeHandle(ref, () => ({ start: (text) => begin(text), edit: () => begin(cellText(activeCell)) }));

  const finish = () => {
    setDraft(null);
    setPick(-1);
    setError("");
    setPrompt(null);
    onDone();
  };

  const fill = (cell: Cell) => {
    onFill(cell);
    finish();
  };

  // The typed text, checked for the layer: a number in its unit, or a text (new, known, or near a known one).
  const commit = (text: string) => {
    const t = tidy(text);
    if (!t) return fill(null);
    if (layer.kind === "number") {
      const parsed = parseNumber(t, layer.unit);
      if (!parsed.ok) return setError(parsed.message);
      return fill(parsed.value);
    }
    if (known.includes(t)) return fill(t);
    const near = nearDuplicate(t, known);
    if (near) return setPrompt({ typed: t, known: near });
    fill(t);
  };

  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      finish();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (prompt) fill(prompt.known);
      else commit(pick >= 0 ? offers[pick] : (draft ?? shown));
    } else if (e.key === "Tab" && offers.length > 0) {
      e.preventDefault();
      commit(offers[Math.max(0, pick)]);
    } else if (e.key === "ArrowDown" && offers.length > 0) {
      e.preventDefault();
      setPick((p) => Math.min(offers.length - 1, p + 1));
    } else if (e.key === "ArrowUp" && offers.length > 0) {
      e.preventDefault();
      setPick((p) => Math.max(-1, p - 1));
    }
  };

  const listId = "entry-suggestions";
  return (
    <div className="entry" ref={root}>
      <div className="entry-row">
        <div className="name-box" aria-live="polite">
          <span className="selection-ref">{name}</span>
          <span className="selection-count">
            {count} {count === 1 ? "well" : "wells"}
          </span>
        </div>
        <div className="entry-field">
          <input
            ref={input}
            type="text"
            className="entry-input"
            value={shown}
            placeholder={layer.kind === "number" ? `Type a number${layer.unit ? ` in ${layer.unit}` : ""}, then Enter` : "Type a value, then Enter"}
            aria-label={`Value for ${layer.name || "the layer"} in the selected wells`}
            aria-autocomplete="list"
            aria-controls={offers.length ? listId : undefined}
            aria-activedescendant={pick >= 0 ? `${listId}-${pick}` : undefined}
            aria-invalid={error ? true : undefined}
            onChange={(e) => begin(e.target.value)}
            onKeyDown={key}
            onBlur={(e) => {
              // leaving the box for anything but its own suggestions or prompt drops the draft
              if (!root.current?.contains(e.relatedTarget as Node | null)) {
                setDraft(null);
                setPick(-1);
                setError("");
                setPrompt(null);
              }
            }}
          />
          {layer.kind === "number" && layer.unit && <span className="entry-unit">{layer.unit}</span>}
          {offers.length > 0 && (
            <ul className="suggestions" role="listbox" id={listId} aria-label="Known values">
              {offers.map((o, i) => (
                <li
                  key={o}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === pick}
                  onPointerDown={(e) => {
                    e.preventDefault(); // keep the focus in the box
                    commit(o);
                  }}
                >
                  {o}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {error && (
        <p className="entry-note error" role="alert">
          {error}
        </p>
      )}
      {prompt && (
        <div className="entry-note warn" role="alert">
          <span>
            “{prompt.typed}” looks like “{prompt.known}”, already in this layer.
          </span>
          <button type="button" className="compact primary" onClick={() => fill(prompt.known)}>
            Use “{prompt.known}”
          </button>
          <button type="button" className="compact" onClick={() => fill(prompt.typed)}>
            Keep “{prompt.typed}” as a new value
          </button>
        </div>
      )}
    </div>
  );
}
