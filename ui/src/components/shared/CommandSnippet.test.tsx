import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CommandSnippet } from "./CommandSnippet";

function stubClipboard(clipboard: Pick<Clipboard, "writeText"> | undefined): () => void {
  const previous = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: clipboard });
  return () => {
    if (previous) Object.defineProperty(navigator, "clipboard", previous);
    else Reflect.deleteProperty(navigator, "clipboard");
  };
}

describe("CommandSnippet", () => {
  it("copies only the command and announces success after the clipboard write resolves", async () => {
    let resolveWrite: (() => void) | undefined;
    const writeText = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveWrite = resolve;
        }),
    );
    const restoreClipboard = stubClipboard({ writeText });
    try {
      render(<CommandSnippet command="openssl rand -base64 32" label="Copy OpenSSL command" prompt="$" />);

      fireEvent.click(screen.getByRole("button", { name: "Copy OpenSSL command" }));

      expect(screen.getByTestId("command-snippet-prompt")).toHaveTextContent("$");
      expect(writeText).toHaveBeenCalledWith("openssl rand -base64 32");
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      resolveWrite?.();

      expect(await screen.findByRole("status")).toHaveTextContent("Command copied.");
      expect(screen.getByTestId("command-snippet-command")).toHaveTextContent("openssl rand -base64 32");
    } finally {
      restoreClipboard();
    }
  });

  it("keeps a rejected command selectable and scopes feedback to its snippet", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    const restoreClipboard = stubClipboard({ writeText });
    try {
      render(
        <>
          <CommandSnippet command="first command" label="Copy first command" prompt="$" />
          <CommandSnippet command="second command" label="Copy second command" prompt="$" />
        </>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Copy first command" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Copy failed. Select the command and copy it manually.",
      );
      expect(screen.getAllByTestId("command-snippet-command")[0]).toHaveTextContent("first command");
      expect(screen.getAllByTestId("command-snippet-command")[0]).toHaveClass("select-text");
      expect(screen.getAllByTestId("inline-status")).toHaveLength(1);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    } finally {
      restoreClipboard();
    }
  });

  it("reports missing clipboard support and leaves the command available", async () => {
    const restoreClipboard = stubClipboard(undefined);
    try {
      render(<CommandSnippet command="ssh-keygen -t ed25519" label="Copy SSH command" prompt="$" />);

      fireEvent.click(screen.getByRole("button", { name: "Copy SSH command" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Clipboard unavailable. Select the command and copy it manually.",
      );
      expect(screen.getByTestId("command-snippet-command")).toHaveTextContent("ssh-keygen -t ed25519");
    } finally {
      restoreClipboard();
    }
  });
});
