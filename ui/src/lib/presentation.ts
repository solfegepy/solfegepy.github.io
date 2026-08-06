import {
  BracesIcon,
  CircleHelpIcon,
  ClockIcon,
  CodeXmlIcon,
  KeyRoundIcon,
  LinkIcon,
  type LucideIcon,
} from "lucide-react";

import type { ToolId } from "./tools";

export type PresentationId = ToolId | "faq";

interface ToolPresentation {
  Icon: LucideIcon;
  accentClasses: string;
}

/** UI-only icon and semantic accent metadata for tool identities. */
export const TOOL_PRESENTATION = {
  base64: {
    Icon: BracesIcon,
    accentClasses: "border-tool-base64-border bg-tool-base64-soft text-tool-base64",
  },
  url: { Icon: LinkIcon, accentClasses: "border-tool-url-border bg-tool-url-soft text-tool-url" },
  query: { Icon: CodeXmlIcon, accentClasses: "border-tool-query-border bg-tool-query-soft text-tool-query" },
  jwt: { Icon: KeyRoundIcon, accentClasses: "border-tool-jwt-border bg-tool-jwt-soft text-tool-jwt" },
  python: { Icon: BracesIcon, accentClasses: "border-tool-python-border bg-tool-python-soft text-tool-python" },
  timestamp: {
    Icon: ClockIcon,
    accentClasses: "border-tool-timestamp-border bg-tool-timestamp-soft text-tool-timestamp",
  },
  faq: { Icon: CircleHelpIcon, accentClasses: "border-tool-faq-border bg-tool-faq-soft text-tool-faq" },
} as const satisfies Record<PresentationId, ToolPresentation>;
