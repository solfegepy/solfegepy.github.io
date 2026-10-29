import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TAILWIND_PALETTE } from "../../lib/tailwind";
import { TailwindTool } from "./TailwindTool";

describe("TailwindTool", () => {
  it("starts with a labelled empty hex field and an inspection prompt", () => {
    render(<TailwindTool />);

    expect(screen.getByRole("textbox", { name: "Hex color" })).toHaveValue("");
    expect(screen.getByText(/select a tailwind color or enter a hex value/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy tailwind color token" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy hex" })).not.toBeInTheDocument();
  });

  it("matches valid hex immediately and labels both color previews", () => {
    render(<TailwindTool />);

    fireEvent.change(screen.getByRole("textbox", { name: "Hex color" }), { target: { value: "#123456" } });

    expect(screen.getByText("Closest match")).toBeInTheDocument();
    expect(screen.getByTestId("tailwind-token")).toHaveTextContent(/.+/);
    expect(screen.getAllByTestId("tailwind-color-preview")[0]).toHaveTextContent("hsl(210 65% 20%)");
  });

  it("shows canonical input, token, hex, and exact status for a palette color", () => {
    render(<TailwindTool />);

    fireEvent.change(screen.getByRole("textbox", { name: "Hex color" }), { target: { value: "  000  " } });

    expect(screen.getByRole("textbox", { name: "Hex color" })).toHaveValue("  000  ");
    expect(screen.getByTestId("tailwind-match-kind")).toHaveTextContent("Exact match");
    expect(screen.getByTestId("tailwind-token")).toHaveTextContent("black");
    expect(screen.getByTestId("tailwind-hex")).toHaveTextContent("#000000");
  });

  it.each([
    ["#2b7fff", "oklch(62.3% 0.214 259.815)"],
    ["#000", "oklch(0% 0 0)"],
    ["#fff", "oklch(100% 0 0)"],
  ])("displays and copies the matched OKLCH value for %s", async (hex, oklch) => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const restoreClipboard = stubClipboard({ writeText });
    try {
      render(<TailwindTool />);
      fireEvent.change(screen.getByRole("textbox", { name: "Hex color" }), { target: { value: hex } });

      expect(screen.getByTestId("tailwind-oklch")).toHaveTextContent(oklch);
      fireEvent.click(screen.getByRole("button", { name: "Copy OKLCH" }));
      expect(await screen.findByRole("status")).toHaveTextContent("OKLCH copied");
      expect(writeText).toHaveBeenLastCalledWith(oklch);
    } finally {
      restoreClipboard();
    }
  });

  it("displays and copies RGB for the matched palette color", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const restoreClipboard = stubClipboard({ writeText });
    try {
      render(<TailwindTool />);
      fireEvent.change(screen.getByRole("textbox", { name: "Hex color" }), { target: { value: "#0080ff" } });

      expect(screen.getByTestId("tailwind-rgb")).toHaveTextContent("rgb(43 127 255)");
      fireEvent.click(screen.getByRole("button", { name: "Copy RGB" }));
      expect(await screen.findByRole("status")).toHaveTextContent("RGB copied");
      expect(writeText).toHaveBeenLastCalledWith("rgb(43 127 255)");
    } finally {
      restoreClipboard();
    }
  });

  it("clears stale results on invalid input, resets on empty input, and matches after correction", () => {
    render(<TailwindTool />);
    const input = screen.getByRole("textbox", { name: "Hex color" });

    fireEvent.change(input, { target: { value: "#000" } });
    fireEvent.change(input, { target: { value: "#abcd" } });
    expect(screen.getByRole("alert")).toHaveTextContent("A three or six digit hex color.");
    expect(screen.queryByTestId("tailwind-result")).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "" } });
    expect(screen.getByTestId("tailwind-inspection-prompt")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "#fff" } });
    expect(screen.getByTestId("tailwind-token")).toHaveTextContent("white");
  });

  it("selects numbered colors through family and shade controls", () => {
    render(<TailwindTool />);

    fireEvent.change(screen.getByRole("combobox", { name: "Family" }), { target: { value: "blue" } });
    expect(screen.getByTestId("tailwind-token")).toHaveTextContent("blue-500");
    fireEvent.change(screen.getByRole("combobox", { name: "Shade" }), { target: { value: "700" } });

    expect(screen.getByTestId("tailwind-token")).toHaveTextContent("blue-700");
    expect(screen.getByRole("textbox", { name: "Hex color" })).toHaveValue(
      TAILWIND_PALETTE.find(({ token }) => token === "blue-700")?.hex,
    );
  });

  it("shows both described wheels and keeps their selected token synchronized with equivalent controls", () => {
    render(<TailwindTool />);

    const chromaticCanvas = screen.getByTestId("tailwind-chromatic-canvas");
    const neutralCanvas = screen.getByTestId("tailwind-neutral-canvas");
    expect(chromaticCanvas.getAttribute("aria-label")).toMatch(/chromatic wheel.*no token selected/i);
    expect(neutralCanvas.getAttribute("aria-label")).toMatch(/neutral wheel.*no token selected/i);

    fireEvent.change(screen.getByRole("combobox", { name: "Family" }), { target: { value: "blue" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Shade" }), { target: { value: "700" } });

    expect(chromaticCanvas.getAttribute("aria-label")).toMatch(/chromatic wheel.*selected blue-700/i);
    expect(screen.getByRole("button", { name: /select black/i })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: /select white/i }));

    expect(screen.getByTestId("tailwind-token")).toHaveTextContent("white");
    expect(screen.getByRole("button", { name: /select white/i })).toHaveAttribute("aria-pressed", "true");
    expect(chromaticCanvas.getAttribute("aria-label")).toMatch(/chromatic wheel.*no token selected/i);
  });

  it("switches the chromatic wheel between the flat wheel and a described 3D OKLCH space", async () => {
    render(<TailwindTool />);
    const chromaticWheel = screen.getByTestId("tailwind-chromatic-wheel");
    expect(screen.getByRole("button", { name: "2D" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("button", { name: "3D" })).toHaveLength(1);

    fireEvent.change(screen.getByRole("combobox", { name: "Family" }), { target: { value: "blue" } });
    fireEvent.click(screen.getByRole("button", { name: "3D" }));

    const space = await screen.findByTestId("tailwind-chromatic-3d");
    expect(chromaticWheel).toContainElement(space);
    expect(space.getAttribute("aria-label")).toMatch(/chromatic oklch space.*selected blue-500/i);
    expect(screen.getByText(/in oklch, equal steps up the axis are perceived equally lighter/i)).toBeInTheDocument();
    for (const view of ["Bottom", "Side", "Top"])
      expect(screen.getByRole("button", { name: view })).toBeInTheDocument();
    expect(screen.queryByTestId("tailwind-chromatic-canvas")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3D" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "2D" }));
    expect(screen.getByTestId("tailwind-chromatic-canvas").getAttribute("aria-label")).toMatch(/selected blue-500/i);
  });

  it("shows the hovered wheel token as a tooltip", () => {
    render(<TailwindTool />);
    const canvas = screen.getByTestId("tailwind-chromatic-canvas");
    canvas.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 200 });

    // Just right of top centre, innermost ring: first family, lightest shade.
    fireEvent.mouseMove(canvas, { clientX: 102, clientY: 80 });
    expect(canvas).toHaveAttribute("title", "red-50");

    fireEvent.mouseLeave(canvas);
    expect(canvas).not.toHaveAttribute("title");
  });

  it.each(["black", "white"] as const)("shows the %s token as a tooltip", (anchor) => {
    render(<TailwindTool />);
    expect(screen.getByTestId(`tailwind-${anchor}-swatch`)).toHaveAttribute("title", anchor);
  });

  it.each(["black", "white"] as const)("selects the %s anchor without a shade", (anchor) => {
    render(<TailwindTool />);

    fireEvent.change(screen.getByRole("combobox", { name: "Family" }), { target: { value: anchor } });

    expect(screen.getByTestId("tailwind-token")).toHaveTextContent(anchor);
    expect(screen.getByRole("combobox", { name: "Shade" })).toBeDisabled();
  });

  it("preserves the explicitly selected token when palette entries share a hex", () => {
    const duplicate = TAILWIND_PALETTE.find((entry, index, entries) =>
      entries.some((candidate, candidateIndex) => candidate.hex === entry.hex && candidateIndex > index),
    );
    expect(duplicate).toBeDefined();
    const chosen = TAILWIND_PALETTE.find((entry) => entry.hex === duplicate!.hex && entry.token !== duplicate!.token);
    expect(chosen).toBeDefined();
    if (chosen === undefined || duplicate === undefined) return;

    render(<TailwindTool />);
    fireEvent.change(screen.getByRole("combobox", { name: "Family" }), { target: { value: chosen.family } });
    if (chosen.shade !== null) {
      fireEvent.change(screen.getByRole("combobox", { name: "Shade" }), { target: { value: String(chosen.shade) } });
    }

    expect(screen.getByTestId("tailwind-token")).toHaveTextContent(chosen.token);
    expect(screen.getByTestId("tailwind-hex")).toHaveTextContent(chosen.hex);
  });

  it("places the color-distance explanation after the interactive controls", () => {
    render(<TailwindTool />);

    const content = screen.getByTestId("tailwind-tool");
    const interactive = content.querySelector("fieldset");
    const explanation = screen.getByText(/Closest colors are selected using OKLab distance/);
    expect(
      Boolean(interactive && interactive.compareDocumentPosition(explanation) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true);
  });

  it("copies only the requested token, hex, or HSL and announces success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const restoreClipboard = stubClipboard({ writeText });
    try {
      render(<TailwindTool />);
      fireEvent.change(screen.getByRole("textbox", { name: "Hex color" }), { target: { value: "#000" } });

      fireEvent.click(screen.getByRole("button", { name: "Copy tailwind color token" }));
      expect(await screen.findByRole("status")).toHaveTextContent("Token copied");
      expect(writeText).toHaveBeenLastCalledWith("black");

      fireEvent.click(screen.getByRole("button", { name: "Copy hex" }));
      expect(await screen.findByRole("status")).toHaveTextContent("Hex copied");
      expect(writeText).toHaveBeenLastCalledWith("#000000");

      fireEvent.click(screen.getByRole("button", { name: "Copy HSL" }));
      expect(await screen.findByRole("status")).toHaveTextContent("HSL copied");
      expect(writeText).toHaveBeenLastCalledWith("hsl(0 0% 0%)");
    } finally {
      restoreClipboard();
    }
  });

  it("keeps the selected value available when clipboard access is unavailable", async () => {
    const restoreClipboard = stubClipboard(undefined);
    try {
      render(<TailwindTool />);
      fireEvent.change(screen.getByRole("textbox", { name: "Hex color" }), { target: { value: "#000" } });

      fireEvent.click(screen.getByRole("button", { name: "Copy tailwind color token" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(/clipboard.*unavailable/i);
      expect(screen.getByTestId("tailwind-token")).toHaveTextContent("black");
      expect(screen.getByRole("textbox", { name: "Hex color" })).toHaveValue("#000");
    } finally {
      restoreClipboard();
    }
  });

  it("explains rejected clipboard writes while leaving the selected value available", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("permission denied"));
    const restoreClipboard = stubClipboard({ writeText });
    try {
      render(<TailwindTool />);
      fireEvent.change(screen.getByRole("textbox", { name: "Hex color" }), { target: { value: "#fff" } });

      fireEvent.click(screen.getByRole("button", { name: "Copy hex" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(/could not copy/i);
      expect(screen.getByTestId("tailwind-token")).toHaveTextContent("white");
      expect(screen.getByTestId("tailwind-hex")).toHaveTextContent("#ffffff");
    } finally {
      restoreClipboard();
    }
  });

  it("clears copy feedback when the selected value changes", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const restoreClipboard = stubClipboard({ writeText });
    try {
      render(<TailwindTool />);
      const input = screen.getByRole("textbox", { name: "Hex color" });
      fireEvent.change(input, { target: { value: "#000" } });
      fireEvent.click(screen.getByRole("button", { name: "Copy tailwind color token" }));
      expect(await screen.findByRole("status")).toHaveTextContent("Token copied");

      fireEvent.change(input, { target: { value: "#fff" } });

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByTestId("tailwind-token")).toHaveTextContent("white");
    } finally {
      restoreClipboard();
    }
  });

  it("does not report an old pending copy as success for a newer selection", async () => {
    let resolveWrite: (() => void) | undefined;
    const writeText = vi.fn(() => new Promise<void>((resolve) => (resolveWrite = resolve)));
    const restoreClipboard = stubClipboard({ writeText });
    try {
      render(<TailwindTool />);
      const input = screen.getByRole("textbox", { name: "Hex color" });
      fireEvent.change(input, { target: { value: "#000" } });
      fireEvent.click(screen.getByRole("button", { name: "Copy tailwind color token" }));
      expect(writeText).toHaveBeenCalledWith("black");

      fireEvent.change(input, { target: { value: "#fff" } });
      await act(async () => resolveWrite?.());

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByTestId("tailwind-token")).toHaveTextContent("white");
    } finally {
      restoreClipboard();
    }
  });
});

function stubClipboard(clipboard: Pick<Clipboard, "writeText"> | undefined): () => void {
  const previous = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: clipboard });
  return () => {
    if (previous) Object.defineProperty(navigator, "clipboard", previous);
    else Reflect.deleteProperty(navigator, "clipboard");
  };
}
