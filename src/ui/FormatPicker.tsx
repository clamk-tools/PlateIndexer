import { FORMATS } from "../plate/plate";

// The plate format, as a segmented control: one segment per standard format.
export function FormatPicker({ wells, onChange }: { wells: number; onChange: (wells: number) => void }) {
  return (
    <div className="field">
      <span className="cap" id="format-label">
        Plate
      </span>
      <div className="segmented" role="radiogroup" aria-labelledby="format-label">
        {FORMATS.map((f) => (
          <button
            key={f.wells}
            type="button"
            role="radio"
            aria-checked={f.wells === wells}
            title={`${f.rows} rows × ${f.columns} columns`}
            onClick={() => onChange(f.wells)}
          >
            {f.wells}
          </button>
        ))}
      </div>
    </div>
  );
}
