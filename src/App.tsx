import { useState } from "react";

import { formatOf } from "./plate/plate";
import { FormatPicker } from "./ui/FormatPicker";
import { PlateGrid } from "./ui/PlateGrid";
import { ThemeSwitch } from "./ui/ThemeSwitch";

// The page: the frame every Clamk tool has (rail, header with the name and the theme switch, footer) around the
// plate. For now the plate is drawn read-only in the chosen format; layers, typing and the export come next
// (doc/ROADMAP.md).

export function App() {
  const [wells, setWells] = useState(96);
  const format = formatOf(wells);

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
        <FormatPicker wells={wells} onChange={setWells} />
        <PlateGrid format={format} />
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
