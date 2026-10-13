# Changelog

## 0.5.0

- Export: one row per well (well, row letter, column number), a column per text layer, a value and a unit column per
  number layer. Choose the order (down columns or across rows), the names (A01 or A1), all wells or only those with
  a value, and the separator (comma; semicolon with decimal comma, for Excel in French and other European settings;
  tab). A preview shows the first rows.
- Download the CSV (it opens in Excel with "µ" intact), or copy the table to paste into a spreadsheet.

## 0.4.0

- Undo and redo (Ctrl/Cmd+Z, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z, and buttons) for every change to the plate.
- Copy, cut and paste a block of wells (Ctrl/Cmd+C, X, V). Pasting over a selection that is a whole multiple of the
  block repeats it, as in Excel. Blocks travel as tab-separated text, so they paste into a spreadsheet, and a block
  copied from a spreadsheet pastes into a layer (numbers read in the layer's unit).
- The fill handle: drag the small square at the corner of a block to repeat it down or across.
- The page asks before closing when the plate holds values (nothing is saved yet).

## 0.3.0

- Layers: add text or number layers, rename, reorder, remove; an empty layer can switch between text and numbers.
- Type on the plate: the value fills every selected well of the current layer (Enter), with suggestions from the
  layer's values (Tab takes the first). Enter, F2 or a double-click edits; Delete clears.
- A new text that differs from a known value only by case, spaces or punctuation asks which one is meant.
- Number layers have a unit; "0,5", "1e-3" and "10 µM" (or "10 uM") are read, another unit is refused.
- Each value has a colour on the plate and in the list beside it, with its number of wells. Click a value to put it
  in the selected wells, hover it to light its wells, rename it everywhere, or remove it.
- Below the plate, the active well's value in every layer; each well's tooltip lists them too.
- Changing the format keeps each value in its well where the new plate has it, and asks before dropping any.

## 0.2.0

- Select wells like spreadsheet cells: click, drag, Shift-click to extend, Ctrl/Cmd-click to add a block, a row
  letter or column number for the whole line, the corner (or Ctrl/Cmd+A) for the whole plate, arrow keys (Shift
  extends, Ctrl/Cmd jumps to the edge).
- The name box above the plate says what is selected ("B2:D5, F7") and how many wells.

## 0.1.0

- The tool's foundation, from the clamk-tools template: React + TypeScript + Vite, tests (Vitest, Playwright), the
  shared look (light and dark), CI that checks privacy and tests every pull request and publishes `main`.
- Plate geometry: 6, 12, 24, 48, 96, 384 and 1536 wells; well names A1 or A01; rows A…Z then AA…AF; lists of wells
  across the rows or down the columns.
- The page: choose a format, see the plate (read-only for now).
