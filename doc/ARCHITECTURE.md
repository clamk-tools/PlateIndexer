# Architecture

How Plate Indexer is made, for whoever changes it next (a person or an LLM). `README.md` says what the tool does for
its user; `doc/ROADMAP.md` holds the plan and the decisions; `doc/CHANGELOG.md` says what changed.

## 1. In one paragraph

A static page (React + TypeScript, built by Vite, served by GitHub Pages), no backend, nothing sent anywhere. The
plate geometry (formats, well names, orders), the selection and the value rules are pure functions in `src/plate/`;
the plate being described (format, layers, values) is one reducer in `src/state/plate.ts`. Components draw from them
and hold no rule of their own, so the rules are tested once, without a browser.

## 2. The layers

```
 plate/plate.ts        formats (6 to 1536 wells), row letters (A…Z, AA…AF), well names (A1 / A01),
                       the two orders (across rows, down columns), a well's index
 plate/selection.ts    the selection, with a spreadsheet's rules: blocks of wells, the active well, Shift to
                       extend, Ctrl/Cmd to add, whole rows and columns, arrows; its name ("B2:D5, F7")
 plate/values.ts       what a well holds (text, a number in the layer's unit, nothing); tidying text; reading
                       numbers ("0,5", "10 µM"); near-duplicates ("gene a-kd" ~ "Gene A KD"); suggestions
 plate/clipboard.ts    copy, paste and the fill handle: blocks to and from tab-separated text, tiling a paste
                       over a selection, stretching and repeating a block
 state/plate.ts        the plate: format and layers (name, kind, unit, value list with colours, one cell per
                       well); reduce(state, action) for every change; the legend of a layer
 state/history.ts      undo and redo around reduce(): each change keeps the state before it
 state/export.ts       the plate as a table (one row per well, chosen order and names, a column per text layer,
                       value and unit columns per number layer); CSV and tab-separated text
 ui/colors.ts          the colour of each value: categorical palette for text, sequential scale for numbers
 ui/FormatPicker.tsx   the plate format, as a segmented control
 ui/LayerBar.tsx       the layers as tabs, adding one, the current layer's name, kind, unit, order, removal
 ui/EntryBar.tsx       the name box and the formula bar: typing, suggestions, the near-duplicate question
 ui/PlateGrid.tsx      the plate: column numbers, row letters, one cell per well, coloured by value; turns clicks,
                       drags and keys into selection calls, and hands typing to the entry bar
 ui/Legend.tsx         the current layer's values: paint with one, light its wells, rename, remove, add
 ui/ExportPanel.tsx    the export choices, a preview, the CSV download and "Copy table"
 ui/Help.tsx           "How it works": the gestures and keys, folded under the introduction
 ui/ThemeSwitch.tsx    the family's light/dark switch (ui/theme.ts: shared with the hub and the other tools)
 App.tsx               the frame (rail, header, footer) around the plate
 styles/               theme.css: tokens and controls (shared with the other tools); app.css: frame;
                       plate.css: the tool's own parts
```

A layer imports only from the layers above it. No rule about wells lives in a component.

## 3. Conventions

- **A well's position** is `{ row, column }`, both counted from 0. Its name is made only by `wellName()`.
- **A selection** is a list of blocks plus the active well (where typing goes) and the focus (the corner Shift
  moves), as in Excel. A finger drag scrolls the plate; a mouse or pen drag selects.
- **A layer** holds text or numbers, never both. A number layer has one unit; typed numbers are read in it, another
  unit is refused rather than converted. A text layer's value list keeps each value's colour (an index into the
  palette, `--cat-0`…`--cat-8` in plate.css) when other values go.
- **Typing** starts on the plate (a printable key) and finishes in the entry bar: Enter fills every selected well
  of the current layer. A new text that differs from a known one only by case, spaces or punctuation asks first.
- **Undo** keeps whole states (cheap: a state is a few arrays). Typing a layer's name is one step; choosing a layer
  is none. A text box keeps its own undo while it has the focus.
- **The clipboard** carries tab-separated text, the format spreadsheets use, so a block copied here pastes into
  Excel and back. A copy made here is also kept typed (numbers stay numbers) for pasting within the page.
- **The CSV** starts with a byte-order mark (so Excel reads "µ") and ends lines with CRLF; fields holding the
  separator, a quote or a line break are quoted. "Semicolon" also writes decimal commas, as Excel in French expects.
  Numbers keep up to 12 significant digits.
- **Inside the tool, wells are kept row by row** (`wellIndex()`). The order chosen for the export is applied only
  when the list is written (`wellsInOrder()`).
- **Look:** follow `doc/LLM feed for visual/LLMfeed_VISUAL-IDENTITY.md`. Colours come from the tokens in
  `theme.css`, never written in a component.
- **Test data:** invented names only.

## 4. Checks

| Command | What it checks |
|---|---|
| `npm test` | the rules (`src/**/*.test.ts`, Vitest) |
| `npm run lint` | code style (ESLint) |
| `npm run build` | types (TypeScript) and the built site in `dist/` |
| `npm run e2e` | the built site in real browsers (Playwright), served under `/PlateIndexer/` as on GitHub Pages, with an automated accessibility pass (axe, WCAG 2.1 AA) in both themes |

`PLAYWRIGHT_CHROMIUM=<path>` uses a Chromium already on the machine; `PLAYWRIGHT_ONLY_CHROMIUM=1` skips Firefox and
WebKit. CI (`.github/workflows/ci.yml`) runs the privacy check and all of the above on every pull request, and
publishes `main` to GitHub Pages.

## 5. Security

The built page carries a Content-Security-Policy (`vite.config.ts`): it loads its own files only, no CDN, no
analytics, no inline script. The fonts are served with the page.
