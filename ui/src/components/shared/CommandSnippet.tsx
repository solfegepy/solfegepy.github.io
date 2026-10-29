import { Copy } from "lucide-react";
import { useState } from "react";

import { InlineStatus } from "../ui/InlineStatus";

interface CommandSnippetProps {
  command: string;
  label: string;
  prompt: "$" | "PS>";
}

/** Shows a selectable command after a shell prompt and copies only the command to the clipboard on request. */
export function CommandSnippet({ command, label, prompt }: CommandSnippetProps) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function copyCommand() {
    setStatus("");
    setError("");

    if (!navigator.clipboard?.writeText) {
      // Keep the command manually copyable when browser clipboard access is unavailable.
      setError("Clipboard unavailable. Select the command and copy it manually.");
      return;
    }

    try {
      await navigator.clipboard.writeText(command);
      setStatus("Command copied.");
    } catch {
      setError("Copy failed. Select the command and copy it manually.");
    }
  }

  return (
    <div data-testid="command-snippet" className="min-w-0 space-y-2">
      <div className="relative">
        <button
          data-testid="command-snippet-copy"
          type="button"
          className="text-muted hover:text-primary focus-visible:outline-primary rounded-control absolute top-1 right-1 inline-flex min-h-11 min-w-11 items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label={label}
          title={label}
          onClick={copyCommand}
        >
          <Copy aria-hidden="true" size={17} />
        </button>
        <pre className="rounded-control border-line bg-panel text-ink overflow-x-auto border p-4 pr-14 font-mono text-sm">
          {/* Keep the prompt out of manual selections so pasted commands run as-is. */}
          <span data-testid="command-snippet-prompt" aria-hidden="true" className="text-muted mr-2 select-none">
            {prompt}
          </span>
          <code data-testid="command-snippet-command" className="whitespace-pre select-text">
            {command}
          </code>
        </pre>
      </div>
      <InlineStatus error={error} status={status} />
    </div>
  );
}
