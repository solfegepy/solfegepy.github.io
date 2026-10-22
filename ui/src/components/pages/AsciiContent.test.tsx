import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AsciiContent } from "./AsciiContent";

describe("AsciiContent", () => {
  it("renders a labelled searchable reference with counts and readable spacing", async () => {
    const user = userEvent.setup();
    render(<AsciiContent />);

    const input = screen.getByRole("searchbox", { name: "Search characters or codes" });
    const getTable = () => screen.getByRole("table", { name: "ASCII and Latin character codes" });
    expect(
      within(getTable())
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual(["Character", "Decimal", "Hex", "URL encoded (UTF-8)"]);
    expect(within(getTable()).getAllByRole("row")).toHaveLength(849);
    expect(screen.getByRole("status")).toHaveTextContent("848 results");

    await user.type(input, "5E");
    expect(within(getTable()).getAllByRole("row")).toHaveLength(2);
    expect(within(getTable()).getByRole("row", { name: "^ 94 U+005E %5E" })).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "e");
    const letterRows = within(getTable())
      .getAllByRole("row")
      .map((row) => row.textContent ?? "");
    for (const character of ["e", "E", "è", "é", "ê", "ë", "ē", "ė", "ę", "ě", "ẹ", "ế", "æ", "œ"]) {
      expect(letterRows.some((row) => row.startsWith(character))).toBe(true);
    }
    expect(letterRows.some((row) => row.startsWith("b"))).toBe(false);

    await user.clear(input);
    await user.type(input, "not a code");
    expect(screen.getByText("No matches")).toBeInTheDocument();
    expect(screen.getByTestId("ascii-empty-state")).toHaveTextContent(
      "Try a character, decimal code, hexadecimal code, or percent encoding",
    );

    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByRole("status")).toHaveTextContent("848 results");
    expect(within(getTable()).getAllByRole("row")).toHaveLength(849);
    expect(within(getTable()).getByText("SPACE")).toBeInTheDocument();
    expect(within(getTable()).getByText("NO-BREAK SPACE")).toBeInTheDocument();
    expect(within(getTable()).getByText("SOFT HYPHEN")).toBeInTheDocument();
  });
});
