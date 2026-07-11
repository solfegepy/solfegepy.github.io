import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { TOOL_GROUPS, TOOLS } from "./tools";

const README = readFileSync("../README.md", "utf8");

describe("tool registry", () => {
  it("defines every tool once with unique IDs and routes", () => {
    expect(TOOLS.map(({ id }) => id)).toEqual(["base64", "url", "query", "jwt", "python", "timestamp"]);
    expect(new Set(TOOLS.map(({ id }) => id)).size).toBe(TOOLS.length);
    expect(new Set(TOOLS.map(({ route }) => route)).size).toBe(TOOLS.length);
  });

  it("keeps intended group and tool order", () => {
    expect(TOOL_GROUPS).toEqual(["Encoding", "Conversion"]);
    expect(TOOLS.map(({ group, label }) => [group, label])).toEqual([
      ["Encoding", "Base64"],
      ["Encoding", "URL"],
      ["Encoding", "Query Params"],
      ["Encoding", "JWT"],
      ["Conversion", "Python → JSON"],
      ["Conversion", "Timestamp"],
    ]);
  });

  it("defines JWT route and metadata from registry", () => {
    expect(TOOLS.find(({ id }) => id === "jwt")).toEqual({
      id: "jwt",
      group: "Encoding",
      label: "JWT",
      route: "/jwt",
      title: "JWT Decoder",
      description: ["Decode JWT headers and payloads without signature verification."],
    });
  });

  it("documents every registered tool", () => {
    const toolList = README.match(/## Tools\n(?<body>[\s\S]*?)(?=\n## )/)?.groups?.body;

    expect(toolList).toBeDefined();
    for (const { label } of TOOLS) expect(toolList).toContain(label);
  });

  it("documents executable quality commands", () => {
    expect(README).toContain("make lint");
    expect(README).toContain("make test");
    expect(README).toContain("make test-e2e");
    expect(README).not.toMatch(/(?:^|\n)(?:prettier|pnpm run (?:lint|test:e2e))\b/);
  });
});
