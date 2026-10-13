import { useMemo, useState } from "react";

import type { ExportOptions, Separator } from "../state/export";
import { DEFAULT_OPTIONS, exportTable, toCsv, toTabs } from "../state/export";
import type { PlateState } from "../state/plate";

// The export: the choices an instrument or an analysis cares about (order, well names, empty wells, separator), a
// preview of the first rows, and the table as a CSV file or copied for pasting into a spreadsheet.

const PREVIEW_ROWS = 6;

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  const id = `export-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className="field">
      <span className="cap" id={id}>
        {label}
      </span>
      <div className="segmented" role="radiogroup" aria-labelledby={id}>
        {options.map(([v, text]) => (
          <button key={v} type="button" role="radio" aria-checked={v === value} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ExportPanel({ plate }: { plate: PlateState }) {
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_OPTIONS);
  const [name, setName] = useState("plate-layout");
  const [copied, setCopied] = useState("");
  const table = useMemo(() => exportTable(plate, options), [plate, options]);
  const set = <K extends keyof ExportOptions>(key: K) => (value: ExportOptions[K]) => setOptions((o) => ({ ...o, [key]: value }));

  const download = () => {
    const blob = new Blob([toCsv(table, options.separator)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.trim().replace(/\.csv$/i, "") || "plate-layout"}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toTabs(table));
      setCopied("Copied: paste it into a spreadsheet.");
    } catch {
      setCopied("The browser did not allow copying. Use the CSV file instead.");
    }
    setTimeout(() => setCopied(""), 5000);
  };

  return (
    <section className="export" aria-labelledby="export-title">
      <h2 className="section-label" id="export-title">
        <span className="cap">Export</span>
        <span className="rule" />
      </h2>
      <div className="export-options">
        <Choice
          label="Order"
          value={options.order}
          options={[
            ["columns", "Down columns (A1, B1…)"],
            ["rows", "Across rows (A1, A2…)"],
          ]}
          onChange={set("order")}
        />
        <Choice
          label="Names"
          value={options.naming}
          options={[
            ["A01", "A01"],
            ["A1", "A1"],
          ]}
          onChange={set("naming")}
        />
        <Choice
          label="Wells"
          value={options.wells}
          options={[
            ["all", "All"],
            ["filled", "With a value"],
          ]}
          onChange={set("wells")}
        />
        <Choice<Separator>
          label="Separator"
          value={options.separator}
          options={[
            ["comma", "Comma"],
            ["semicolon", "Semicolon, decimal comma"],
            ["tab", "Tab"],
          ]}
          onChange={set("separator")}
        />
      </div>
      <p className="export-hint">Excel set to French (or German, Spanish…) expects “Semicolon, decimal comma”.</p>

      <div className="export-preview">
        <table>
          <thead>
            <tr>
              {table[0].map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.slice(1, 1 + PREVIEW_ROWS).map((row, r) => (
              <tr key={r}>
                {row.map((c, i) => (
                  <td key={i}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="export-count">
          {table.length - 1} {table.length === 2 ? "row" : "rows"}
          {table.length - 1 > PREVIEW_ROWS ? `, first ${PREVIEW_ROWS} shown` : ""}
        </p>
      </div>

      <div className="export-actions">
        <label className="field">
          <span className="cap">File</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} aria-label="File name" />
          <span className="export-ext">.csv</span>
        </label>
        <button type="button" className="primary" onClick={download}>
          Download CSV
        </button>
        <button type="button" onClick={copy}>
          Copy table
        </button>
        {copied && (
          <span className="export-copied" role="status">
            {copied}
          </span>
        )}
      </div>
    </section>
  );
}
