# Changelog

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
