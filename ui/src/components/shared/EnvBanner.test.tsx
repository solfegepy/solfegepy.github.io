import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EnvBanner } from "./EnvBanner";

const env = vi.hoisted(() => ({ ENV: undefined as string | undefined }));
vi.mock("astro:env/client", () => env);

describe("EnvBanner", () => {
  it("shows the environment and its enabled features in development", () => {
    env.ENV = "development";
    render(<EnvBanner />);
    expect(screen.getByTestId("env-banner")).toHaveTextContent("ENV: development · Features: envBanner");
  });

  it.each(["production", undefined])("renders nothing when ENV is %s", (value) => {
    env.ENV = value;
    render(<EnvBanner />);
    expect(screen.queryByTestId("env-banner")).not.toBeInTheDocument();
  });
});
