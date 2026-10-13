import { useState } from "react";

import { formatOf } from "./plate/plate";
import type { Selection } from "./plate/selection";
import { single } from "./plate/selection";
import { FormatPicker } from "./ui/FormatPicker";
import { PlateGrid } from "./ui/PlateGrid";
import { SelectionBar } from "./ui/SelectionBar";
import { ThemeSwitch } from "./ui/ThemeSwitch";

// The page: the frame every Clamk tool has (rail, header with the name and the theme switch, footer) around the
// plate. Wells are selected like spreadsheet cells; layers, typing and the export come next (doc/ROADMAP.md).

const FIRST_WELL = single({ row: 0, column: 0 });

export function App() {
  const [wells, setWells] = useState(96);
  const [selection, setSelection] = useState<Selection>(FIRST_WELL);
  const format = formatOf(wells);

  // Another format: the selection would point outside the plate, so it starts again at A1.
  const changeFormat = (next: number) => {
    setWells(next);
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
        <FormatPicker wells={wells} onChange={changeFormat} />
        <SelectionBar format={format} selection={selection} />
        <PlateGrid format={format} selection={selection} onSelect={setSelection} />
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
