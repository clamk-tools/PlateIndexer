// The geometry of a microplate: its formats, the names of its wells, and the two orders in which a list of wells can
// be written. Pure functions, no state: everything else (the grid, the export) asks here.

export interface PlateFormat {
  wells: number;
  rows: number;
  columns: number;
}

// The standard formats, rows × columns (6 to 1536 wells are 2:3, except 12 and 48 wells, which are 3:4).
export const FORMATS: readonly PlateFormat[] = [
  { wells: 6, rows: 2, columns: 3 },
  { wells: 12, rows: 3, columns: 4 },
  { wells: 24, rows: 4, columns: 6 },
  { wells: 48, rows: 6, columns: 8 },
  { wells: 96, rows: 8, columns: 12 },
  { wells: 384, rows: 16, columns: 24 },
  { wells: 1536, rows: 32, columns: 48 },
];

export function formatOf(wells: number): PlateFormat {
  const format = FORMATS.find((f) => f.wells === wells);
  if (!format) throw new Error(`No ${wells}-well format`);
  return format;
}

// How a well is named: "A1" or "A01" (the column padded to two digits, as many instruments write it).
export type Naming = "A1" | "A01";

// The order of a list of wells: across the rows (A1, A2, A3…, then B1…) or down the columns (A1, B1, C1…, then A2…).
export type Order = "rows" | "columns";

// A well's position, counted from 0: row 0 is A, column 0 is 1.
export interface Well {
  row: number;
  column: number;
}

// Row letters: A…Z, then AA, AB… (a 1536-well plate has 32 rows, A…AF).
export function rowLabel(row: number): string {
  const letter = (i: number) => String.fromCharCode(65 + i);
  return row < 26 ? letter(row) : letter(Math.floor(row / 26) - 1) + letter(row % 26);
}

export function columnLabel(column: number, naming: Naming): string {
  const n = String(column + 1);
  return naming === "A01" ? n.padStart(2, "0") : n;
}

export function wellName(well: Well, naming: Naming): string {
  return rowLabel(well.row) + columnLabel(well.column, naming);
}

// Where a well is kept in a layer's list of values: row by row, whatever the export order.
export function wellIndex(format: PlateFormat, well: Well): number {
  return well.row * format.columns + well.column;
}

// Every well of the plate, in the order asked for.
export function wellsInOrder(format: PlateFormat, order: Order): Well[] {
  const wells: Well[] = [];
  if (order === "rows") {
    for (let row = 0; row < format.rows; row++) for (let column = 0; column < format.columns; column++) wells.push({ row, column });
  } else {
    for (let column = 0; column < format.columns; column++) for (let row = 0; row < format.rows; row++) wells.push({ row, column });
  }
  return wells;
}
