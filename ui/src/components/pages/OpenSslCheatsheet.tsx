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
      <p data-testid="openssl-prerequisites" className="text-muted">
        Run one command in your local terminal, then paste its output where your application expects the secret. You
        need an installed <code>openssl</code> executable on PATH. macOS and Linux also need <code>tr</code>; Windows
        does not include OpenSSL by default. Fix terminal errors before using any output.
      </p>

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
            OpenSSL generates 32 random bytes: 32 bytes × 8 = 256 bits. Its cryptographically secure randomness is
            Base64-encoded, then <code>+</code> becomes <code>-</code>, <code>/</code> becomes <code>_</code>, and
            padding is removed. Encoding preserves the random bytes; it adds no entropy. Successful output contains 43
            characters from <code>A–Z</code>, <code>a–z</code>, <code>0–9</code>, <code>_</code>, and <code>-</code>,
            without embedded whitespace. The POSIX command also removes the trailing newline. A random value need not
            contain every character class.
          </p>
          <p className="text-muted mt-3">
            Use this format only when your application accepts a random Base64URL secret of this length. The commands
            generate the value on your machine; the website does not receive it.
          </p>
        </div>
      </section>

      <section data-testid="openssl-hex" aria-labelledby="openssl-hex" className="space-y-4">
        <h2 id="openssl-hex" className="text-ink text-xl font-bold">
          Hexadecimal secret
        </h2>
        <CommandSnippet command={HEX_COMMAND} prompt="$" label="Copy hexadecimal secret command" />
        <p className="text-muted">
          Use this when your application requires a hex secret. The same command runs in POSIX shells and PowerShell. It
          returns 32 random bytes (256 bits) as 64 lowercase characters from <code>0–9</code> and <code>a–f</code>. Hex
          is longer than Base64URL for the same randomness; it adds no entropy.
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
