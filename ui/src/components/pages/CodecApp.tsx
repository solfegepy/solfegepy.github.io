import { BracesIcon, ClockIcon, CodeXmlIcon, KeyRoundIcon, LinkIcon, MenuIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { getTool, TOOL_GROUPS, TOOLS, type ToolId } from "../../lib/tools";
import {
  applyTheme,
  initializeTheme,
  removeThemeOverride,
  resolveSystemTheme,
  subscribeToSystemTheme,
  writeThemeOverride,
  type ThemeOverride,
} from "../../lib/theme";
import { ThemeControl } from "../ui/ThemeControl";
import { Base64Tool } from "./Base64Tool";
import { JwtTool } from "./JwtTool";
import { PythonTool } from "./PythonTool";
import { QueryTool } from "./QueryTool";
import { TimestampTool } from "./TimestampTool";
import { UrlTool } from "./UrlTool";

const ICONS = {
  base64: BracesIcon,
  url: LinkIcon,
  query: CodeXmlIcon,
  jwt: KeyRoundIcon,
  python: BracesIcon,
  timestamp: ClockIcon,
} as const;
const NAV_LINK_CLASSES =
  "group mx-2 flex min-h-11 items-center gap-3 rounded-lg border-l-2 border-transparent px-3 text-sm font-medium text-muted transition duration-200 hover:border-line hover:bg-field hover:text-ink active:translate-y-px focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary";
const ACTIVE_NAV_LINK_CLASSES = "border-accent bg-field font-semibold text-ink shadow-sm";

interface ToolNavigationProps {
  activeTool: ToolId;
  onNavigate?: () => void;
}

function ToolNavigation({ activeTool, onNavigate }: ToolNavigationProps) {
  return (
    <nav data-testid="tool-navigation" aria-label="Tools" className="flex flex-1 flex-col py-5">
      {TOOL_GROUPS.map((group) => (
        <section data-testid="tool-navigation-group" key={group} className="mb-5">
          <h2 className="text-muted px-5 pb-2 font-mono text-xs font-semibold tracking-widest uppercase">{group}</h2>
          <div>
            {TOOLS.filter((tool) => tool.group === group).map((tool) => {
              const Icon = ICONS[tool.id];
              return (
                <a
                  data-testid={`tool-link-${tool.id}`}
                  key={tool.id}
                  href={tool.route}
                  aria-current={tool.id === activeTool ? "page" : undefined}
                  className={`${NAV_LINK_CLASSES} ${tool.id === activeTool ? ACTIVE_NAV_LINK_CLASSES : ""}`}
                  onClick={onNavigate}
                >
                  <span className="border-line bg-panel inline-flex size-8 shrink-0 items-center justify-center rounded-md border">
                    <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
                  </span>
                  {tool.label}
                </a>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

export interface CodecAppProps {
  toolId: ToolId;
}

export function CodecApp({ toolId }: CodecAppProps) {
  const tool = getTool(toolId);
  const [descriptionSummary, ...descriptionDetails] = tool.description;
  const [theme, setTheme] = useState<{ override: ThemeOverride; resolved: "light" | "dark" }>(() => initializeTheme());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(
    () => subscribeToSystemTheme(undefined, undefined, (resolved) => setTheme({ override: null, resolved })),
    [],
  );
  useEffect(() => {
    if (!drawerOpen) return;
    closeRef.current?.focus();
    const close = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        menuRef.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [drawerOpen]);

  const trapFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab") return;
    const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>("button, a[href]")];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    menuRef.current?.focus();
  };
  const toggleTheme = () => {
    const resolved = theme.resolved === "dark" ? "light" : "dark";
    writeThemeOverride(resolved);
    applyTheme(resolved);
    setTheme({ override: resolved, resolved });
  };
  const resetTheme = () => {
    removeThemeOverride();
    const resolved = resolveSystemTheme();
    applyTheme(resolved);
    setTheme({ override: null, resolved });
  };
  const tools = {
    base64: <Base64Tool />,
    url: <UrlTool />,
    query: <QueryTool />,
    jwt: <JwtTool />,
    python: <PythonTool />,
    timestamp: <TimestampTool />,
  };

  return (
    <div data-testid="codec-app" className="min-h-dvh md:flex">
      <a data-testid="skip-link" className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside
        data-testid="desktop-sidebar"
        className="border-line bg-panel sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r md:flex"
      >
        <a
          data-testid="desktop-home-link"
          href="/"
          className="border-line flex min-h-20 items-center border-b px-5"
          aria-label="Codec Bench home"
        >
          <span className="font-display text-xl font-bold tracking-tight">
            Codec<span className="text-accent">/</span>Bench
          </span>
        </a>
        <ToolNavigation activeTool={toolId} />
        <footer data-testid="sidebar-footer" className="border-line mt-auto flex justify-end border-t p-4">
          <ThemeControl
            dark={theme.resolved === "dark"}
            overridden={theme.override !== null}
            onToggle={toggleTheme}
            onReset={resetTheme}
          />
        </footer>
      </aside>

      <header
        data-testid="mobile-header"
        className="border-line bg-panel sticky top-0 z-20 flex min-h-16 items-center justify-between gap-2 border-b px-2 md:hidden"
      >
        <a data-testid="mobile-home-link" href="/" className="font-display min-w-0 text-base font-bold tracking-tight">
          Codec<span className="text-accent">/</span>Bench
        </a>
        <button
          ref={menuRef}
          data-testid="menu-button"
          type="button"
          title="Open tools menu"
          className="icon-button"
          aria-label="Open tools menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          <MenuIcon aria-hidden="true" size={20} />
        </button>
      </header>

      {drawerOpen && (
        <div data-testid="mobile-drawer-layer" className="fixed inset-0 z-30 md:hidden">
          <button
            data-testid="drawer-backdrop"
            type="button"
            title="Close tools menu"
            aria-label="Close tools menu"
            className="bg-ink/45 absolute inset-0"
            onClick={closeDrawer}
          />
          <aside
            data-testid="mobile-drawer"
            aria-label="Tool menu"
            className="border-line bg-panel relative flex h-dvh w-4/5 max-w-80 flex-col border-r shadow-lg"
            onKeyDown={trapFocus}
          >
            <div className="border-line flex min-h-16 items-center justify-between border-b px-4">
              <span className="font-display text-lg font-bold">Tools</span>
              <button
                ref={closeRef}
                data-testid="drawer-close"
                type="button"
                title="Close tools menu"
                className="icon-button"
                aria-label="Close tools menu"
                onClick={closeDrawer}
              >
                <XIcon aria-hidden="true" size={20} />
              </button>
            </div>
            <ToolNavigation activeTool={toolId} onNavigate={() => setDrawerOpen(false)} />
            <footer data-testid="mobile-footer" className="border-line mt-auto flex justify-end border-t p-4">
              <ThemeControl
                dark={theme.resolved === "dark"}
                overridden={theme.override !== null}
                onToggle={toggleTheme}
                onReset={resetTheme}
              />
            </footer>
          </aside>
        </div>
      )}

      <main
        id="main-content"
        data-testid="app-main"
        className="mx-auto max-w-7xl min-w-0 flex-1 px-4 pt-7 pb-12 md:px-8 md:pt-10"
      >
        <header data-testid="tool-header" className="border-line mb-7 border-b pb-6">
          <p className="text-accent mb-2 font-mono text-xs font-semibold tracking-widest uppercase">
            Tool / {tool.group}
          </p>
          <h1 className="font-display text-ink text-3xl leading-tight font-bold tracking-tight text-balance md:text-4xl">
            {tool.title}
          </h1>
          <div data-testid="tool-description" className="text-muted mt-3 max-w-prose leading-7 text-pretty">
            <p>{descriptionSummary}</p>
            {descriptionDetails.length > 0 && (
              <ul className="list-disc pl-5">
                {descriptionDetails.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        </header>
        {tools[toolId]}
      </main>
    </div>
  );
}
