# Architecture

How Plate Indexer is made, for whoever changes it next (a person or an LLM). `README.md` says what the tool does for
its user; `doc/ROADMAP.md` holds the plan and the decisions; `doc/CHANGELOG.md` says what changed.

## 1. In one paragraph

A static page (React + TypeScript, built by Vite, served by GitHub Pages), no backend, nothing sent anywhere. The
plate geometry (formats, well names, orders) is pure functions in `src/plate/`. Components draw from it and hold no
rule of their own, so the rules are tested once, without a browser.

## 2. The layers

```
 plate/plate.ts        formats (6 to 1536 wells), row letters (A…Z, AA…AF), well names (A1 / A01),
                       the two orders (across rows, down columns), a well's index
 plate/selection.ts    the selection, with a spreadsheet's rules: blocks of wells, the active well, Shift to
                       extend, Ctrl/Cmd to add, whole rows and columns, arrows; its name ("B2:D5, F7")
 ui/FormatPicker.tsx   the plate format, as a segmented control
 ui/PlateGrid.tsx      the plate: column numbers, row letters, one cell per well; turns clicks, drags and keys
                       into plate/selection.ts calls
 ui/SelectionBar.tsx   the name box: what is selected and how many wells
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
| `npm run e2e` | the built site in real browsers (Playwright), served under `/PlateIndexer/` as on GitHub Pages |

`PLAYWRIGHT_CHROMIUM=<path>` uses a Chromium already on the machine; `PLAYWRIGHT_ONLY_CHROMIUM=1` skips Firefox and
WebKit. CI (`.github/workflows/ci.yml`) runs the privacy check and all of the above on every pull request, and
publishes `main` to GitHub Pages.

## 5. Security

The built page carries a Content-Security-Policy (`vite.config.ts`): it loads its own files only, no CDN, no
analytics, no inline script. The fonts are served with the page.
