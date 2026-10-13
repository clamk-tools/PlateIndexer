# Roadmap

The plan for Plate Indexer, task by task. Each task ends with the checks green (`npm test`, `npm run lint`,
`npm run build`, `npm run e2e`) and a line in `CHANGELOG.md`. Mark a task done here when it is merged.

All examples, tests and screenshots use invented names only ("Gene A KD", "Compound X", "Vehicle"…), never the
names of a real experiment.

## The tool in one paragraph

A plate is described as **layers** (siRNA, treatment, dose…). Each layer holds, for every well, a **text** value or a
**number with a unit**. The plate behaves like a small spreadsheet: select wells as in Excel, type to fill them all,
copy and paste, drag to fill, undo. Each layer keeps a **list of its values**, each with a colour, so the same
condition is always spelled the same way. The result is exported as a CSV: one row per well, one column per layer,
in the order and well naming the instrument expects.

## Decisions

| Question | Decision |
|---|---|
| Plate formats | 6, 12, 24, 48, 96, 384, 1536, chosen on the page |
| Export order | Chosen at export: across rows (A1, A2…) or down columns (A1, B1…) |
| Well naming | Chosen at export: A1 or A01 |
| What a layer holds | Text, or a number with a unit (exported as two columns: value, unit) |
| Freedom | Close to Excel: free typing, with suggestions from the layer's list and a warning on near-duplicates |
| Export format | CSV (opens in Excel). Native .xlsx later |
| Where it runs | In the browser only. Nothing is sent anywhere |

## Tasks

| # | Task | Needs | Status |
|---|---|---|---|
| 1 | Repo set up from the template, shared look, CI, empty page published | — | done |
| 2 | Plate geometry: formats, well names (A1/A01), both orders, tests; format choice and the plate drawn read-only | 1 | done |
| 3 | Selection like Excel: click, drag, Shift-click, Ctrl/Cmd-click, row and column headers, select all, arrow keys | 2 | to do |
| 4 | Layers: add, rename, delete, reorder; text or number + unit; type into the selected wells; the value list with colours and a legend; suggestions while typing; warning on near-duplicates; hover shows a well's values in every layer | 3 | to do |
| 5 | Editing like Excel: Delete clears, copy and paste within the plate, fill handle, undo and redo; warning before leaving with unsaved work | 4 | to do |
| 6 | CSV export: order, naming, empty wells in or out; checked against a rebuilt copy of the reference workbook (invented names) | 4 | to do |
| 7 | Polish: phone and tablet layout, keyboard and screen reader pass, full browser tests, README, listing on the hub | 5, 6 | to do |

## Later (deferred on purpose)

- Paste a plate grid from Excel into a layer.
- Save a layout to a file and open it again; keep the work across a page refresh.
- Native .xlsx export.
- Helpers for replicates and dilution series; a printable bench sheet; templates.
