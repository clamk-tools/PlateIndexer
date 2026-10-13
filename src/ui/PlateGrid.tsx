import type { CSSProperties } from "react";

import type { PlateFormat } from "../plate/plate";
import { columnLabel, rowLabel, wellName } from "../plate/plate";

// The plate as a grid: column numbers along the top, row letters down the side, one cell per well. The wells scale
// with the space available (plate.css), so a 1536-well plate fits a laptop and scrolls sideways on a phone.
export function PlateGrid({ format }: { format: PlateFormat }) {
  const rows = Array.from({ length: format.rows }, (_, i) => i);
  const columns = Array.from({ length: format.columns }, (_, i) => i);
  const style = { "--columns": format.columns } as CSSProperties;

  return (
    <div className="plate-scroll">
      <div className="plate" role="grid" aria-label={`${format.wells}-well plate`} aria-rowcount={format.rows} aria-colcount={format.columns} style={style} data-wells={format.wells}>
        <div className="plate-corner" aria-hidden="true" />
        {columns.map((c) => (
          <div key={`c${c}`} className="plate-head" aria-hidden="true">
            {columnLabel(c, "A1")}
          </div>
        ))}
        {rows.map((r) => (
          <div key={`r${r}`} className="plate-row" role="row">
            <div className="plate-head" role="rowheader">
              {rowLabel(r)}
            </div>
            {columns.map((c) => (
              <div key={c} className="well" role="gridcell" aria-label={wellName({ row: r, column: c }, "A1")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
