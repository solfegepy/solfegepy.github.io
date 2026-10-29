import { CommandSnippet } from "../shared/CommandSnippet";

const POSIX_DIRECTORY_COMMAND = "mkdir -p ~/.ssh && chmod 700 ~/.ssh";
const POWERSHELL_DIRECTORY_COMMAND = 'New-Item -ItemType Directory -Force "$HOME/.ssh" | Out-Null';
// One option per line keeps each flag readable; "\" (POSIX) and "`" (PowerShell) continue the command.
const POSIX_KEY_COMMAND = [
  "ssh-keygen \\",
  "  -t ed25519 \\",
  '  -N "" \\',
  '  -C "ci_github 2026-10-29" \\',
  "  -f ~/.ssh/id_ed25519_ci_github",
].join("\n");
const POWERSHELL_KEY_COMMAND = [
  "ssh-keygen `",
  "  -t ed25519 `",
  '  -N "" `',
  '  -C "ci_github 2026-10-29" `',
  '  -f "$HOME/.ssh/id_ed25519_ci_github"',
].join("\n");
const POSIX_PUBLIC_KEY_COMMAND = "cat ~/.ssh/id_ed25519_ci_github.pub";
const POWERSHELL_PUBLIC_KEY_COMMAND = 'Get-Content "$HOME/.ssh/id_ed25519_ci_github.pub"';
const POSIX_COPY_ID_COMMAND = [
  "ssh-copy-id \\",
  "  -i ~/.ssh/id_ed25519_ci_github.pub \\",
  "  user@server.example.com",
].join("\n");
// Windows OpenSSH ships without ssh-copy-id, so pipe the public key into the server's authorized_keys instead.
const POWERSHELL_COPY_ID_COMMAND = [
  'Get-Content "$HOME/.ssh/id_ed25519_ci_github.pub" |',
  "  ssh user@server.example.com `",
  '  "umask 077; mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"',
].join("\n");

/** Documents local OpenSSH commands for creating and inspecting an Ed25519 key pair. */
export function SshCheatsheet() {
  return (
    <article
      data-testid="ssh-cheatsheet"
      className="[&>section]:border-line max-w-prose min-w-0 space-y-8 [&>section]:border-t [&>section]:pt-8 [&>section>h2]:text-2xl"
    >
      <p data-testid="ssh-prerequisites" className="text-muted">
        <code>ssh-keygen</code> is an OpenSSH client tool. Install OpenSSH client tools and put them on PATH. These
        commands expect an existing <code>.ssh</code> directory; create it with the command for your shell if needed.
        The commands run on your machine. Fix terminal errors before using the output.
      </p>

      <section data-testid="ssh-directory" aria-labelledby="ssh-directory" className="space-y-4">
        <h2 id="ssh-directory" className="text-ink text-xl font-bold">
          Prepare the directory if needed
        </h2>
        <div>
          <h3 className="text-ink mb-2 font-semibold">macOS / Linux (POSIX shell)</h3>
          <CommandSnippet command={POSIX_DIRECTORY_COMMAND} prompt="$" label="Copy macOS/Linux directory command" />
        </div>
        <div>
          <h3 className="text-ink mb-2 font-semibold">PowerShell 7.3+</h3>
          <CommandSnippet
            command={POWERSHELL_DIRECTORY_COMMAND}
            prompt="PS>"
            label="Copy PowerShell directory command"
          />
        </div>
      </section>

      <section data-testid="ssh-generation" aria-labelledby="ssh-generation" className="space-y-4">
        <h2 id="ssh-generation" className="text-ink text-xl font-bold">
          Generate a key pair
        </h2>
        <div>
          <h3 className="text-ink mb-2 font-semibold">macOS / Linux (POSIX shell)</h3>
          <CommandSnippet command={POSIX_KEY_COMMAND} prompt="$" label="Copy macOS/Linux key command" />
        </div>
        <div>
          <h3 className="text-ink mb-2 font-semibold">PowerShell 7.3+</h3>
          <CommandSnippet command={POWERSHELL_KEY_COMMAND} prompt="PS>" label="Copy PowerShell key command" />
        </div>
        <p className="text-muted">
          Choose a fresh output filename and customize the comment and key name. If the file already exists, decline the
          overwrite prompt unless you intend to replace that key. Do not suppress the prompt or force an overwrite.
        </p>
        <div data-testid="ssh-flags">
          <h3 className="text-ink mb-2 font-semibold">Understand the options</h3>
          <ul className="text-muted list-inside list-disc space-y-2">
            <li>
              <code>-t ed25519</code> selects the Ed25519 key type.
            </li>
            <li>
              <code>-N ""</code> sets an empty passphrase. The automation example leaves the private key without
              passphrase encryption; use a passphrase for a personal key.
            </li>
            <li>
              <code>-C</code> sets a comment stored in plain text in the public key. Use{" "}
              <code>&lt;source&gt;_&lt;destination&gt; &lt;creation date&gt;</code> so the destination can trace and
              rotate the key; never include secrets.
            </li>
            <li>
              <code>-f</code> sets the output filename. Name keys{" "}
              <code>id_&lt;type&gt;_&lt;source&gt;_&lt;destination&gt;[_purpose]</code>, for example{" "}
              <code>~/.ssh/id_ed25519_ci_github</code>, <code>~/.ssh/id_ed25519_home-server_github</code>, or{" "}
              <code>~/.ssh/id_ed25519_dev-laptop_vps_backup</code>.
            </li>
          </ul>
        </div>
      </section>

      <section data-testid="ssh-files" aria-labelledby="ssh-files" className="space-y-4">
        <h2 id="ssh-files" className="text-ink text-xl font-bold">
          Share the public key
        </h2>
        <p className="text-muted">
          The extensionless file is the private key. Keep it protected on the source machine or in its CI secret store.
          The <code>.pub</code> file is the public key; give that file to the destination service. Never share or
          display private-key contents.
        </p>
        <div>
          <h3 className="text-ink mb-2 font-semibold">macOS / Linux (POSIX shell)</h3>
          <CommandSnippet
            command={POSIX_PUBLIC_KEY_COMMAND}
            prompt="$"
            label="Copy macOS/Linux public key inspection command"
          />
        </div>
        <div>
          <h3 className="text-ink mb-2 font-semibold">PowerShell 7.3+</h3>
          <CommandSnippet
            command={POWERSHELL_PUBLIC_KEY_COMMAND}
            prompt="PS>"
            label="Copy PowerShell public key inspection command"
          />
        </div>
      </section>

      <section data-testid="ssh-copy-id" aria-labelledby="ssh-copy-id" className="space-y-4">
        <h2 id="ssh-copy-id" className="text-ink text-xl font-bold">
          Install the public key on a server
        </h2>
        <p className="text-muted">
          For a server you log in to with SSH, append the public key to its <code>~/.ssh/authorized_keys</code>. Replace{" "}
          <code>user@server.example.com</code> with your account and host; the command asks for your existing password
          once. For GitHub or another service, paste the <code>.pub</code> contents into its key settings instead.
        </p>
        <div>
          <h3 className="text-ink mb-2 font-semibold">macOS / Linux (POSIX shell)</h3>
          <CommandSnippet command={POSIX_COPY_ID_COMMAND} prompt="$" label="Copy macOS/Linux ssh-copy-id command" />
        </div>
        <div>
          <h3 className="text-ink mb-2 font-semibold">PowerShell 7.3+</h3>
          <CommandSnippet
            command={POWERSHELL_COPY_ID_COMMAND}
            prompt="PS>"
            label="Copy PowerShell authorized_keys command"
          />
        </div>
      </section>

      <section data-testid="ssh-references" aria-labelledby="ssh-references">
        <h2 id="ssh-references" className="text-ink mb-2 text-xl font-bold">
          References
        </h2>
        <ul className="text-muted list-inside list-disc space-y-2">
          <li>
            <a
              data-testid="ssh-reference-openssh"
              className="text-primary underline underline-offset-2"
              href="https://man.openbsd.org/ssh-keygen.1"
            >
              OpenBSD ssh-keygen manual
            </a>{" "}
            documents key types, options, and private/public output files.
          </li>
        </ul>
      </section>
    </article>
  );
}
