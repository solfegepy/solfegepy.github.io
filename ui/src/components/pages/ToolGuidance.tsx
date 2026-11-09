import type { ToolId } from "../../lib/tools";

interface ToolGuidanceProps {
  toolId: ToolId;
}

const ARTICLE_CLASSES = "border-line bg-panel mt-8 min-w-0 rounded-surface border p-5 shadow-sm md:p-8";
const GUIDANCE_GRID_CLASSES = "grid gap-8 md:grid-cols-2";
const GUIDANCE_CARD_CLASSES = "border-line bg-field min-w-0 rounded-control border p-5";
const HEADING_CLASSES = "font-display text-ink text-2xl font-bold";
const STEPS_CLASSES = "text-muted mt-4 list-decimal space-y-2 pl-5 leading-7";
const PROSE_CLASSES = "text-muted mt-4 max-w-prose leading-7";
const NOTE_CLASSES = "text-muted mt-5 max-w-prose leading-7";
const TABLE_FRAME_CLASSES = "border-line rounded-control mt-5 max-w-full overflow-x-auto border";
const TABLE_HEAD_CLASSES = "bg-field text-ink";
const TABLE_BODY_CLASSES = "text-muted divide-line divide-y";
const COLUMN_HEADER_CLASSES = "px-4 py-3 font-semibold";
const ROW_HEADER_CLASSES = "text-ink px-4 py-3 font-semibold";
const CELL_CLASSES = "px-4 py-3";

/** Render the static reference content that follows each converter. */
export function ToolGuidance({ toolId }: ToolGuidanceProps) {
  return (
    <>
      {toolId === "base64" && (
        <article data-testid="base64-guidance" className={ARTICLE_CLASSES}>
          <div className={GUIDANCE_GRID_CLASSES}>
            <section data-testid="base64-how-to" className={GUIDANCE_CARD_CLASSES}>
              <>
                <h2 className={HEADING_CLASSES}>How to use</h2>
                <ol className={STEPS_CLASSES}>
                  <>
                    <li>Enter plain text to encode, or Base64 data to decode.</li>
                    <li>Choose Plain text, Base64 encoded, or Base64url encoded.</li>
                    <li>Select channel formats, then convert and copy result.</li>
                  </>
                </ol>
              </>
            </section>
            <section data-testid="base64-about" className={GUIDANCE_CARD_CLASSES}>
              <>
                <h2 className={HEADING_CLASSES}>What is Base64?</h2>
                <p className={PROSE_CLASSES}>
                  Base64 represents binary data as readable ASCII text. It helps move data through text-based systems,
                  but it is encoding—not encryption—and does not protect secrets.
                </p>
              </>
            </section>
          </div>
        </article>
      )}
      {toolId === "url" && (
        <article data-testid="url-guidance" className={ARTICLE_CLASSES}>
          <div className={GUIDANCE_GRID_CLASSES}>
            <section data-testid="url-how-to" className={GUIDANCE_CARD_CLASSES}>
              <h2 className={HEADING_CLASSES}>How to use</h2>
              <ol className={STEPS_CLASSES}>
                <li>Enter plain text or percent-encoded data.</li>
                <li>Choose Plain text and one explicit URL encoding mode.</li>
                <li>Select Convert, then copy result.</li>
              </ol>
            </section>
            <section data-testid="url-mode-guide" className={GUIDANCE_CARD_CLASSES}>
              <h2 className={HEADING_CLASSES}>Choose URL encoding mode</h2>
              <p className={PROSE_CLASSES}>
                Use RFC 3986 component for one value, Full URI for complete URI syntax, or Form URL encoded for one form
                value. Selection matters because <code>+</code> means space only in form decoding.
              </p>
            </section>
          </div>
          <section data-testid="url-mode-comparison-section" className={`${GUIDANCE_CARD_CLASSES} mt-8`}>
            <h2 className={HEADING_CLASSES}>URL encoding comparison</h2>
            <div className={TABLE_FRAME_CLASSES}>
              <table data-testid="url-mode-comparison" className="w-full text-left text-sm">
                <caption className="sr-only">URL encoding mode behavior</caption>
                <thead className={TABLE_HEAD_CLASSES}>
                  <tr>
                    <th className={COLUMN_HEADER_CLASSES} scope="col">
                      Mode
                    </th>
                    <th className={COLUMN_HEADER_CLASSES} scope="col">
                      Space
                    </th>
                    <th className={COLUMN_HEADER_CLASSES} scope="col">
                      Use
                    </th>
                  </tr>
                </thead>
                <tbody className={TABLE_BODY_CLASSES}>
                  <tr>
                    <th className={ROW_HEADER_CLASSES} scope="row">
                      RFC 3986 component
                    </th>
                    <td className={CELL_CLASSES}>
                      <code>%20</code>
                    </td>
                    <td className={CELL_CLASSES}>One component value; reserved delimiters encoded.</td>
                  </tr>
                  <tr>
                    <th className={ROW_HEADER_CLASSES} scope="row">
                      Full URI
                    </th>
                    <td className={CELL_CLASSES}>
                      <code>%20</code>
                    </td>
                    <td className={CELL_CLASSES}>Complete URI; syntax delimiters preserved.</td>
                  </tr>
                  <tr>
                    <th className={ROW_HEADER_CLASSES} scope="row">
                      Form URL encoded
                    </th>
                    <td className={CELL_CLASSES}>
                      <code>+</code>
                    </td>
                    <td className={CELL_CLASSES}>
                      One form value; literal plus becomes <code>%2B</code>.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className={NOTE_CLASSES}>
              Form example: <code className="break-all">a+b / c~d</code> →{" "}
              <code className="break-all">a%2Bb+%2F+c%7Ed</code>. For structured{" "}
              <code className="break-all">name=value&amp;name=value</code> data, use Query Params.
            </p>
          </section>
        </article>
      )}
      {toolId === "jwt" && (
        <article data-testid="jwt-static-guidance" className={ARTICLE_CLASSES}>
          <div className={GUIDANCE_GRID_CLASSES}>
            <section data-testid="jwt-how-to" className={GUIDANCE_CARD_CLASSES}>
              <h2 className={HEADING_CLASSES}>How to decode</h2>
              <ol className={STEPS_CLASSES}>
                <li>Paste compact JWT containing header, payload, and signature segments.</li>
                <li>Select Decode to inspect formatted JSON and encoded signature.</li>
                <li>Copy only output needed.</li>
              </ol>
            </section>
            <section data-testid="jwt-verification" className={GUIDANCE_CARD_CLASSES}>
              <h2 className={HEADING_CLASSES}>Decoding vs verification</h2>
              <p className={PROSE_CLASSES}>
                Decoding reveals token contents. It does not verify signature, issuer, claims, or authenticity.
              </p>
            </section>
          </div>
        </article>
      )}
      {toolId === "timestamp" && (
        <article className={ARTICLE_CLASSES} data-testid="timestamp-guidance">
          <div className={GUIDANCE_GRID_CLASSES}>
            <section data-testid="timestamp-how-to" className={GUIDANCE_CARD_CLASSES}>
              <h2 className={HEADING_CLASSES}>How to convert timestamps</h2>
              <ol className={STEPS_CLASSES}>
                <li>Choose Z time, Unix seconds, or Unix milliseconds as source.</li>
                <li>Enter value and choose distinct target format.</li>
                <li>Select Convert, then copy result.</li>
              </ol>
            </section>
            <section data-testid="timestamp-range" className={GUIDANCE_CARD_CLASSES}>
              <h2 className={HEADING_CLASSES}>Supported Z time range</h2>
              <p className={PROSE_CLASSES}>Z time accepts strict UTC ISO 8601 from 1970 through 9999.</p>
            </section>
          </div>
          <section data-testid="timestamp-formats" className={`${GUIDANCE_CARD_CLASSES} mt-8`}>
            <h2 className={HEADING_CLASSES}>Timestamp format semantics</h2>
            <div className={TABLE_FRAME_CLASSES}>
              <table data-testid="timestamp-format-table" className="w-full table-fixed text-left text-sm">
                <caption className="sr-only">Supported timestamp formats</caption>
                <thead className={TABLE_HEAD_CLASSES}>
                  <tr>
                    <th className={COLUMN_HEADER_CLASSES} scope="col">
                      Format
                    </th>
                    <th className={COLUMN_HEADER_CLASSES} scope="col">
                      Output
                    </th>
                  </tr>
                </thead>
                <tbody className={TABLE_BODY_CLASSES}>
                  <tr>
                    <th className={ROW_HEADER_CLASSES} scope="row">
                      Z time
                    </th>
                    <td className={CELL_CLASSES}>
                      <code className="break-all">YYYY-MM-DDTHH:mm:ss.sssZ</code>
                    </td>
                  </tr>
                  <tr>
                    <th className={ROW_HEADER_CLASSES} scope="row">
                      Unix seconds
                    </th>
                    <td className={CELL_CLASSES}>Whole seconds since UTC epoch</td>
                  </tr>
                  <tr>
                    <th className={ROW_HEADER_CLASSES} scope="row">
                      Unix milliseconds
                    </th>
                    <td className={CELL_CLASSES}>Whole milliseconds since UTC epoch</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className={NOTE_CLASSES}>
              Decimal timestamp input is accepted. Precision below one millisecond is truncated; Unix output is always
              an integer.
            </p>
          </section>
        </article>
      )}
      {toolId === "query" && (
        <article data-testid="query-guidance" className={ARTICLE_CLASSES}>
          <div className={GUIDANCE_GRID_CLASSES}>
            <section data-testid="query-how-to" className={GUIDANCE_CARD_CLASSES}>
              <h2 className={HEADING_CLASSES}>How to parse and build query strings</h2>
              <ol className={STEPS_CLASSES}>
                <li>Paste a full URL, a query beginning with ?, or the query text alone.</li>
                <li>Choose Query string as source and JSON as target, or swap them to build a query.</li>
                <li>Select Convert, then copy result.</li>
              </ol>
            </section>
            <section data-testid="query-rules" className={GUIDANCE_CARD_CLASSES}>
              <h2 className={HEADING_CLASSES}>Duplicate names and empty values</h2>
              <p className={PROSE_CLASSES}>
                Repeated names become arrays in encounter order:
                <code className="break-all">tag=one&amp;tag=two</code> →{" "}
                <code className="break-all">{'{ "tag": ["one", "two"] }'}</code>. Empty values become JSON{" "}
                <code>null</code>, and <code>+</code> decodes to a space while <code>%2B</code> stays a literal plus.
              </p>
            </section>
          </div>
          <section data-testid="query-build" className={`${GUIDANCE_CARD_CLASSES} mt-8`}>
            <h2 className={HEADING_CLASSES}>Build a query string from JSON</h2>
            <p className={PROSE_CLASSES}>
              Use a JSON object whose values are strings, numbers, booleans, null, or arrays of these values. Nested
              objects are rejected because a query string cannot represent them. A base URL or path already in the
              target is kept, and <code>?</code> appears only between that base and the parameters.
            </p>
          </section>
        </article>
      )}
      {toolId === "python" && (
        <article data-testid="python-guidance" className={ARTICLE_CLASSES}>
          <div className={GUIDANCE_GRID_CLASSES}>
            <section data-testid="python-how-to" className={GUIDANCE_CARD_CLASSES}>
              <h2 className={HEADING_CLASSES}>How to convert a Python dict to JSON</h2>
              <ol className={STEPS_CLASSES}>
                <li>Paste a dictionary or list copied from print() output or the PDB debugger.</li>
                <li>Choose Python literal as source and JSON as target, or swap them to get Python back.</li>
                <li>Select Convert, then copy result.</li>
              </ol>
            </section>
            <section data-testid="python-safety" className={GUIDANCE_CARD_CLASSES}>
              <h2 className={HEADING_CLASSES}>Parsed, never executed</h2>
              <p className={PROSE_CLASSES}>
                The converter reads a limited literal grammar and never calls Python or <code>eval</code>. String keys,
                nested dictionaries, lists, tuples, finite numbers, booleans, and <code>None</code> are supported. Sets,
                bytes, function calls, and other expressions are rejected.
              </p>
            </section>
          </div>
          <section data-testid="python-syntax" className={`${GUIDANCE_CARD_CLASSES} mt-8`}>
            <h2 className={HEADING_CLASSES}>Python literal vs JSON syntax</h2>
            <div className={TABLE_FRAME_CLASSES}>
              <table data-testid="python-syntax-table" className="w-full table-fixed text-left text-sm">
                <caption className="sr-only">Python literal values and their JSON equivalents</caption>
                <thead className={TABLE_HEAD_CLASSES}>
                  <tr>
                    <th className={COLUMN_HEADER_CLASSES} scope="col">
                      Python
                    </th>
                    <th className={COLUMN_HEADER_CLASSES} scope="col">
                      JSON
                    </th>
                  </tr>
                </thead>
                <tbody className={TABLE_BODY_CLASSES}>
                  <tr>
                    <th className={ROW_HEADER_CLASSES} scope="row">
                      <code>True</code> / <code>False</code>
                    </th>
                    <td className={CELL_CLASSES}>
                      <code>true</code> / <code>false</code>
                    </td>
                  </tr>
                  <tr>
                    <th className={ROW_HEADER_CLASSES} scope="row">
                      <code>None</code>
                    </th>
                    <td className={CELL_CLASSES}>
                      <code>null</code>
                    </td>
                  </tr>
                  <tr>
                    <th className={ROW_HEADER_CLASSES} scope="row">
                      <code>'text'</code>
                    </th>
                    <td className={CELL_CLASSES}>
                      <code>"text"</code>
                    </td>
                  </tr>
                  <tr>
                    <th className={ROW_HEADER_CLASSES} scope="row">
                      <code>(1, 2)</code>
                    </th>
                    <td className={CELL_CLASSES}>
                      <code>[1, 2]</code>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className={NOTE_CLASSES}>
              JSON requires double-quoted keys and strings. Tuples become arrays, so converting back yields a list.
            </p>
          </section>
        </article>
      )}
    </>
  );
}
