import {
  BracesIcon,
  BinaryIcon,
  CircleHelpIcon,
  ClockIcon,
  CodeXmlIcon,
  CookieIcon,
  InfoIcon,
  KeyRoundIcon,
  TerminalIcon,
  LinkIcon,
  PaletteIcon,
  type LucideIcon,
} from "lucide-react";

import type { ToolId } from "./tools";

export type PresentationId = ToolId | "faq" | "privacy" | "about" | "ascii" | "openssl" | "ssh";

interface ToolPresentation {
  Icon: LucideIcon;
}

/** Shared secondary (teal) identity tile classes used by every tool and info page. */
export const TOOL_IDENTITY_CLASSES = "border-secondary bg-secondary-soft text-secondary";

/** UI-only icon metadata for tool identities. */
export const TOOL_PRESENTATION = {
  base64: {
    Icon: BracesIcon,
  },
  url: { Icon: LinkIcon },
  query: { Icon: CodeXmlIcon },
  jwt: { Icon: KeyRoundIcon },
  python: { Icon: BracesIcon },
  timestamp: {
    Icon: ClockIcon,
  },
  tailwind: {
    Icon: PaletteIcon,
  },
  faq: { Icon: CircleHelpIcon },
  privacy: {
    Icon: CookieIcon,
  },
  about: { Icon: InfoIcon },
  ascii: { Icon: BinaryIcon },
  openssl: { Icon: TerminalIcon },
  ssh: { Icon: TerminalIcon },
} as const satisfies Record<PresentationId, ToolPresentation>;
