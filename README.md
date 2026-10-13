# Plate Indexer

Describe a microplate layer by layer (siRNA, treatment, dose…), then export one row per well.

**Open it:** https://clamk-tools.github.io/PlateIndexer/

Runs in your browser: nothing to install, nothing sent anywhere.

## How to use it

1. **Pick the plate**: 6, 12, 24, 48, 96, 384 or 1536 wells.
2. **Name the first layer** after a variable, e.g. "siRNA". Add more with **+ Text layer** (names of conditions) or
   **+ Number layer** (a dose, a time, a cell count; one unit per layer).
3. **Select wells** as in a spreadsheet: click, drag, Shift-click to extend, Ctrl-click (Cmd on a Mac) to add a
   block, click a row letter or column number for a whole line, arrow keys to move.
4. **Type a value and press Enter**: it goes into every selected well. Known values are suggested (Tab takes the
   first). A value that differs from a known one only by case, spaces or punctuation ("gene a-kd" next to
   "Gene A KD") asks which one you meant, so one condition never becomes two.
5. **Check the plate**: each value has a colour, listed beside the plate with its number of wells. Click a value to
   put it in the selected wells; hover it to see its wells; rename it everywhere at once; remove it.
6. **Edit like in Excel**: copy, cut and paste a block (also to and from Excel), drag the small square at the corner
   of a selection to repeat it, Delete to clear, Ctrl+Z / Ctrl+Y to undo and redo.
7. **Export**: choose the order your instrument or analysis expects (down the columns, A1, B1…, or across the rows,
   A1, A2…), A01 or A1 names, all wells or only those with a value, and the separator. Download the CSV, or copy the
   table and paste it into a spreadsheet.

The table has one row per well: `Well`, `Row`, `Column`, then one column per text layer and two per number layer
(value and unit). If Excel shows everything in one column, choose **Semicolon, decimal comma**: Excel set to French
(German, Spanish…) expects it.

Nothing is saved: the page asks before closing when the plate holds values. Export before closing.

## For developers

```
npm install
npm run dev        # http://localhost:5185
npm test           # rules (Vitest)
npm run lint
npm run build
npm run e2e        # built site in real browsers (Playwright), accessibility included
```

How it is made: [`doc/ARCHITECTURE.md`](doc/ARCHITECTURE.md). Plan and decisions: [`doc/ROADMAP.md`](doc/ROADMAP.md).
Changes: [`doc/CHANGELOG.md`](doc/CHANGELOG.md). Look: [`doc/LLM feed for visual/`](doc/LLM%20feed%20for%20visual/).

## Privacy

This repo is public, so nothing personal may reach it. `.githooks/check-privacy.sh` blocks a commit or push that
carries a personal email address, a private local path, a token or key, or a term listed in `~/.git-privacy-terms` or
`.git/privacy-terms`. Turn the hooks on once per clone: `git config core.hooksPath .githooks`. CI runs the same check.
