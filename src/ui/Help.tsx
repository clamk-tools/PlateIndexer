// How to use the plate, folded under the introduction: the gestures and keys of a spreadsheet, listed once.

const MOD = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "Cmd" : "Ctrl";

const ROWS: [string, string][] = [
  ["Click, drag", "Select a well, or a block of wells"],
  ["Shift-click, Shift + arrows", "Extend the selection from the active well"],
  [`${MOD}-click`, "Add another block"],
  ["Row letter, column number, corner", "Select a row, a column, the whole plate"],
  ["Type, then Enter", "Put the value in every selected well (Tab takes a suggestion)"],
  ["Enter, F2, double-click", "Edit the active well's value"],
  ["Delete", "Clear the selected wells"],
  [`${MOD}+C, ${MOD}+X, ${MOD}+V`, "Copy, cut, paste a block (also to and from Excel)"],
  ["Drag the small square", "Repeat the selection down or across"],
  [`${MOD}+Z, ${MOD}+Y`, "Undo, redo"],
  ["Click a value in the list", "Put it in the selected wells"],
];

export function Help() {
  return (
    <details className="help">
      <summary>How it works</summary>
      <p>
        A plate is described in layers, one per variable: siRNA, treatment, dose… A layer holds text, or numbers in one unit. Select wells as in a spreadsheet, type
        a value, press Enter. Each value gets a colour, listed beside the plate. When the plate is described, export it: one row per well.
      </p>
      <table>
        <tbody>
          {ROWS.map(([keys, what]) => (
            <tr key={keys}>
              <th scope="row">{keys}</th>
              <td>{what}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="help-note">Everything stays in this browser tab: nothing is sent anywhere, and nothing is kept after the tab is closed. Export before closing.</p>
    </details>
  );
}
