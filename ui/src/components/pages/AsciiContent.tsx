import { useState } from "react";

import { getAsciiRows, searchAsciiRows } from "../../lib/ascii";

const HELP_TEXT =
  "Try a character, decimal code, hexadecimal code, or percent encoding. Single Latin letters search common accent families; strokes and some historic forms do not fold.";
const TABLE_CLASSES = "min-w-[38rem] w-full border-collapse text-left text-sm";
const CELL_CLASSES = "border-line border-b px-3 py-2.5 font-mono tabular-nums";
const HEADER_CELL_CLASSES = "border-line border-b px-3 py-2.5 font-semibold";

/** Searchable reference for ASCII and Unicode Latin code points. */
export function AsciiContent() {
  const [query, setQuery] = useState("");
  const rows = searchAsciiRows(query);
  const allRows = getAsciiRows();

  return (
    <div className="min-w-0" data-testid="ascii-content">
      <header className="mb-6 space-y-3">
        <p className="text-muted max-w-prose">
          ASCII covers U+0000–U+007F. The remaining entries are Unicode Latin characters, not one universal extended
          ASCII encoding. Code values identify Unicode code points; URL values show each character encoded as UTF-8.
        </p>
      </header>

      <section aria-label="Search character codes" className="space-y-4">
        <div className="max-w-2xl">
          <label htmlFor="ascii-search" className="text-ink mb-1 block font-semibold">
            Search characters or codes
          </label>
          <div className="flex min-w-0 gap-2">
            <input
              id="ascii-search"
              data-testid="ascii-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              aria-describedby="ascii-search-help"
              placeholder="e.g. 5E, U+005E, %5E, or e"
              className="border-line bg-field text-ink placeholder:text-muted focus-visible:ring-primary rounded-control min-h-11 min-w-0 flex-1 border px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            />
            {query !== "" && (
              <button
                type="button"
                data-testid="ascii-clear-search"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="border-line bg-field text-ink hover:border-primary hover:text-primary focus-visible:ring-primary rounded-control min-h-11 min-w-11 border px-3 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                Clear
              </button>
            )}
          </div>
          <p id="ascii-search-help" className="text-muted mt-2 text-sm">
            {HELP_TEXT} Examples: <code>5E</code>, <code>U+005E</code>, <code>%5E</code>, or <code>é</code>.
          </p>
        </div>

        <p className="text-muted text-sm" role="status" aria-live="polite" data-testid="ascii-result-count">
          {rows.length} {rows.length === 1 ? "result" : "results"} {query.trim() === "" && `of ${allRows.length}`}
        </p>

        {rows.length === 0 ? (
          <div className="border-line bg-panel rounded-surface border p-4" data-testid="ascii-empty-state">
            <p className="text-ink font-semibold">No matches</p>
            <p className="text-muted mt-1 text-sm">{HELP_TEXT}</p>
          </div>
        ) : (
          <div
            data-testid="ascii-table-scroll"
            className="border-line bg-field rounded-surface max-w-full overflow-x-auto border"
            tabIndex={0}
            aria-label="Scrollable character code reference"
          >
            <table data-testid="ascii-table" aria-label="ASCII and Latin character codes" className={TABLE_CLASSES}>
              <thead className="bg-panel text-ink sticky top-0">
                <tr>
                  <th scope="col" className={HEADER_CELL_CLASSES}>
                    Character
                  </th>
                  <th scope="col" className={HEADER_CELL_CLASSES}>
                    Decimal
                  </th>
                  <th scope="col" className={HEADER_CELL_CLASSES}>
                    Hex
                  </th>
                  <th scope="col" className={HEADER_CELL_CLASSES}>
                    URL encoded (UTF-8)
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.codePoint}>
                    <td className={`${CELL_CLASSES} text-ink`}>{row.display}</td>
                    <td className={`${CELL_CLASSES} text-muted`}>{row.decimal}</td>
                    <td className={`${CELL_CLASSES} text-muted`}>{row.hex}</td>
                    <td className={`${CELL_CLASSES} text-muted`}>{row.urlEncoded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
