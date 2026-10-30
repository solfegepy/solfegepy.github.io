import { CommandSnippet } from "../shared/CommandSnippet";

const POSIX_COMMAND = "openssl rand -base64 32 | tr '+/' '-_' | tr -d '=\\n'";
// PowerShell 7+ continues a statement on lines that start with ".", so each step gets its own line.
const POWERSHELL_COMMAND = [
  "(openssl rand -base64 32)",
  "  .Replace('+', '-')",
  "  .Replace('/', '_')",
  "  .TrimEnd('=')",
].join("\n");

// Hex output needs no character replacement, so one command works in every shell.
const HEX_COMMAND = "openssl rand -hex 32";

/** Documents local commands for creating an unpadded Base64URL or hexadecimal secret. */
export function OpenSslCheatsheet() {
  return (
    <article
      data-testid="openssl-cheatsheet"
      className="[&>section]:border-line max-w-prose min-w-0 space-y-8 [&>section]:border-t [&>section]:pt-8 [&>section>h2]:text-2xl"
    >
      <section data-testid="openssl-base64url" aria-labelledby="openssl-base64url" className="space-y-4">
        <h2 id="openssl-base64url" className="text-ink text-xl font-bold">
          Base64URL secret
        </h2>
        <div>
          <h3 className="text-ink mb-2 font-semibold">macOS / Linux (POSIX shell)</h3>
          <CommandSnippet command={POSIX_COMMAND} prompt="$" label="Copy macOS/Linux command" />
        </div>
        <div>
          <h3 className="text-ink mb-2 font-semibold">Windows PowerShell</h3>
          <CommandSnippet command={POWERSHELL_COMMAND} prompt="PS>" label="Copy PowerShell command" />
        </div>
        <div>
          <h3 className="text-ink mb-2 font-semibold">What the command returns</h3>
          <p className="text-muted">
            OpenSSL generates 32 random bytes (256 bits) Base64-encoded, then it is converted to Base64URL.
          </p>
        </div>
      </section>

      <section data-testid="openssl-hex" aria-labelledby="openssl-hex" className="space-y-4">
        <h2 id="openssl-hex" className="text-ink text-xl font-bold">
          Hexadecimal secret
        </h2>
        <CommandSnippet command={HEX_COMMAND} prompt="$" label="Copy hexadecimal secret command" />
        <p className="text-muted">
          OpenSSL generates 32 random bytes (256 bits) in hexadecimal. Hex is longer than Base64URL for the same
          randomness.
        </p>
      </section>

      <section data-testid="openssl-references" aria-labelledby="openssl-references">
        <h2 id="openssl-references" className="text-ink mb-2 text-xl font-bold">
          References
        </h2>
        <ul className="text-muted list-inside list-disc space-y-2">
          <li>
            <a
              data-testid="openssl-reference-openssl"
              className="text-primary underline underline-offset-2"
              href="https://docs.openssl.org/3.0/man1/openssl-rand/"
            >
              OpenSSL rand documentation
            </a>{" "}
            describes random-byte generation and Base64 output.
          </li>
          <li>
            <a
              data-testid="openssl-reference-rfc4648"
              className="text-primary underline underline-offset-2"
              href="https://www.rfc-editor.org/rfc/rfc4648.html#section-5"
            >
              RFC 4648, section 5
            </a>{" "}
            defines the URL-safe Base64 alphabet.
          </li>
        </ul>
      </section>
    </article>
  );
}
