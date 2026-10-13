import type { PlateFormat } from "../plate/plate";
import type { Selection } from "../plate/selection";
import { selectedCount, selectionLabel } from "../plate/selection";

// What is selected, as a spreadsheet's name box writes it ("B2:D5, F7"), and how many wells that is. Read aloud when
// it changes, so a keyboard user hears where the arrows went.
export function SelectionBar({ format, selection }: { format: PlateFormat; selection: Selection }) {
  const count = selectedCount(format, selection);
  return (
    <p className="selection-bar" aria-live="polite">
      <span className="selection-ref">{selectionLabel(selection)}</span>
      <span className="selection-count">
        {count} {count === 1 ? "well" : "wells"} selected
      </span>
    </p>
  );
}
