import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TextareaField } from "./TextareaField";

describe("TextareaField", () => {
  it("disables resizing for read-only fields and keeps editable fields resizable", () => {
    render(
      <>
        <TextareaField ariaLabel="Read-only output" value="output" placeholder="" readOnly testId="readonly" />
        <TextareaField ariaLabel="Editable input" value="input" onChange={() => {}} placeholder="" testId="editable" />
      </>,
    );

    expect(screen.getByRole("textbox", { name: "Read-only output" })).toHaveClass("resize-none");
    expect(screen.getByRole("textbox", { name: "Editable input" })).toHaveClass("resize-y");
  });
});
