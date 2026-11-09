import { ChevronDownIcon, CircleHelpIcon, InfoIcon, MenuIcon, ShieldCheckIcon, XIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { TOOL_PRESENTATION } from "../../lib/presentation";
import { applyTheme, readTheme, writeTheme, type Theme } from "../../lib/theme";
import { getTool, TOOL_GROUPS, TOOLS, type ToolId } from "../../lib/tools";
import { BrandLogo } from "../ui/BrandLogo";
import { ThemeControl } from "../ui/ThemeControl";
import { AboutContent } from "./AboutContent";
import { AsciiContent } from "./AsciiContent";
import { OpenSslCheatsheet } from "./OpenSslCheatsheet";
import { SshCheatsheet } from "./SshCheatsheet";
import { Base64Tool } from "./Base64Tool";
import { FaqContent } from "./FaqContent";
import { JwtTool } from "./JwtTool";
import { PrivacyContent } from "./PrivacyContent";
import { PythonTool } from "./PythonTool";
import { QueryTool } from "./QueryTool";
import { TimestampTool } from "./TimestampTool";
import { TailwindTool } from "./TailwindTool";
import { UrlTool } from "./UrlTool";
import { ToolGuidance } from "./ToolGuidance";

const NAV_LINK_CLASSES =
  "group mx-3 flex min-h-11 items-center gap-3 rounded-control border border-transparent px-3 text-control font-medium text-muted transition hover:bg-field hover:text-ink active:translate-y-px focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary";
const ACTIVE_NAV_LINK_CLASSES = "border-primary/20 bg-primary-soft font-semibold text-primary";
const NAV_GROUP_CLASSES = "mb-5";
const NAV_GROUP_LABEL_CLASSES =
  "mx-3 flex min-h-11 items-center justify-between gap-2 rounded-control px-2 text-meta font-semibold text-muted transition hover:bg-field hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary";
const BRAND_SUFFIX_CLASSES = "text-accent-strong";
const ICON_BUTTON_CLASSES = "icon-button";
const iconAccentClass = (accentClasses: string) =>
  accentClasses.split(" ").find((className) => className.startsWith("text-")) ?? "text-muted";

type InfoPage = "faq" | "privacy" | "about" | "ascii" | "openssl" | "ssh";

interface NavigationGroupProps {
  label: string;
  testId: string;
  children: ReactNode;
}

/** Group links under an independently collapsible, keyboard-accessible control. */
function NavigationGroup({ label, testId, children }: NavigationGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const contentId = useId();
  return (
    <section data-testid={testId} className={`${NAV_GROUP_CLASSES} flex flex-col`}>
      <button
        data-testid={`navigation-toggle-${label.toLowerCase()}`}
        type="button"
        className={NAV_GROUP_LABEL_CLASSES}
        title={`${expanded ? "Collapse" : "Expand"} ${label}`}
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded(!expanded)}
      >
        {label}
        <ChevronDownIcon aria-hidden="true" size={16} className={expanded ? "" : "-rotate-90"} />
      </button>
      <div id={contentId} hidden={!expanded}>
        {children}
      </div>
    </section>
  );
}

interface ToolNavigationProps {
  activeTool: ToolId | undefined;
  currentPage: InfoPage | undefined;
  onNavigate?: () => void;
}

function ToolNavigation({ activeTool, currentPage, onNavigate }: ToolNavigationProps) {
  const faqCurrent = currentPage === "faq";
  const aboutCurrent = currentPage === "about";
  const asciiCurrent = currentPage === "ascii";
  return (
    <nav data-testid="tool-navigation" aria-label="Tools and help" className="flex flex-1 flex-col py-5">
      {TOOL_GROUPS.map((group) => (
        <NavigationGroup label={group} testId="tool-navigation-group" key={group}>
          <div>
            {TOOLS.filter((tool) => tool.group === group).map((tool) => {
              const { Icon, accentClasses } = TOOL_PRESENTATION[tool.id];
              const current = tool.id === activeTool;
              return (
                <a
                  data-testid={`tool-link-${tool.id}`}
                  data-accent={tool.id}
                  key={tool.id}
                  href={tool.route}
                  aria-current={current ? "page" : undefined}
                  className={`${NAV_LINK_CLASSES} ${current ? ACTIVE_NAV_LINK_CLASSES : ""}`}
                  onClick={onNavigate}
                >
                  <Icon
                    aria-hidden="true"
                    className={`shrink-0 ${iconAccentClass(accentClasses)}`}
                    size={16}
                    strokeWidth={2}
                  />
                  {tool.label}
                </a>
              );
            })}
            {group === "Encoding" && (
              <a
                data-testid="ascii-link"
                data-accent="ascii"
                href="/ascii/"
                aria-current={asciiCurrent ? "page" : undefined}
                className={`${NAV_LINK_CLASSES} ${asciiCurrent ? ACTIVE_NAV_LINK_CLASSES : ""}`}
                onClick={onNavigate}
              >
                <TOOL_PRESENTATION.ascii.Icon
                  aria-hidden="true"
                  className={`shrink-0 ${iconAccentClass(TOOL_PRESENTATION.ascii.accentClasses)}`}
                  size={16}
                  strokeWidth={2}
                />
                ASCII &amp; Latin Codes
              </a>
            )}
          </div>
        </NavigationGroup>
      ))}
      <NavigationGroup label="Cheatsheets" testId="cheatsheets-navigation-group">
        <a
          data-testid="cheatsheet-link-openssl"
          data-accent="openssl"
          href="/cheatsheets/openssl/"
          aria-current={currentPage === "openssl" ? "page" : undefined}
          className={`${NAV_LINK_CLASSES} ${currentPage === "openssl" ? ACTIVE_NAV_LINK_CLASSES : ""}`}
          onClick={onNavigate}
        >
          <TOOL_PRESENTATION.openssl.Icon
            aria-hidden="true"
            className={`shrink-0 ${iconAccentClass(TOOL_PRESENTATION.openssl.accentClasses)}`}
            size={16}
            strokeWidth={2}
          />
          OpenSSL
        </a>
        <a
          data-testid="cheatsheet-link-ssh"
          data-accent="ssh"
          href="/cheatsheets/ssh/"
          aria-current={currentPage === "ssh" ? "page" : undefined}
          className={`${NAV_LINK_CLASSES} ${currentPage === "ssh" ? ACTIVE_NAV_LINK_CLASSES : ""}`}
          onClick={onNavigate}
        >
          <TOOL_PRESENTATION.ssh.Icon
            aria-hidden="true"
            className={`shrink-0 ${iconAccentClass(TOOL_PRESENTATION.ssh.accentClasses)}`}
            size={16}
            strokeWidth={2}
          />
          SSH
        </a>
      </NavigationGroup>
      <NavigationGroup label="Help" testId="help-navigation-group">
        <a
          data-testid="faq-link"
          data-accent="faq"
          href="/faq/"
          aria-current={faqCurrent ? "page" : undefined}
          className={`${NAV_LINK_CLASSES} ${faqCurrent ? ACTIVE_NAV_LINK_CLASSES : ""}`}
          onClick={onNavigate}
        >
          <CircleHelpIcon
            aria-hidden="true"
            className={`shrink-0 ${iconAccentClass(TOOL_PRESENTATION.faq.accentClasses)}`}
            size={16}
            strokeWidth={2}
          />
          FAQ
        </a>
        <a
          data-testid="about-link"
          data-accent="about"
          href="/about/"
          aria-current={aboutCurrent ? "page" : undefined}
          className={`${NAV_LINK_CLASSES} ${aboutCurrent ? ACTIVE_NAV_LINK_CLASSES : ""}`}
          onClick={onNavigate}
        >
          <InfoIcon
            aria-hidden="true"
            className={`shrink-0 ${iconAccentClass(TOOL_PRESENTATION.about.accentClasses)}`}
            size={16}
            strokeWidth={2}
          />
          About
        </a>
      </NavigationGroup>
    </nav>
  );
}

const FOOTER_LINK_CLASSES =
  "text-muted hover:text-primary min-h-11 text-control font-medium underline underline-offset-2";

function openCookieSettings(): void {
  void import("../../lib/analytics").then((m) => m.showCookieSettings());
}

function FooterLegalLinks() {
  return (
    <div className="flex flex-col items-start gap-1">
      <a data-testid="privacy-link" href="/privacy/" className={FOOTER_LINK_CLASSES}>
        Privacy &amp; cookies
      </a>
      <button
        data-testid="cookie-settings-button"
        type="button"
        title="Change your cookie choices"
        className={`${FOOTER_LINK_CLASSES} flex items-start text-left`}
        onClick={openCookieSettings}
      >
        Cookie settings
      </button>
    </div>
  );
}

const INFO_PAGES = {
  faq: {
    heading: "Encoding and Conversion FAQ",
    lead: "Direct answers about Codec64 formats, limits, and browser-only conversion tools.",
    content: <FaqContent />,
  },
  privacy: {
    heading: "Privacy & Cookies Policy",
    lead: "How Codec64 uses Google Analytics cookies, what data is collected, and how to withdraw consent.",
    content: <PrivacyContent />,
  },
  about: {
    heading: "About Codec64",
    lead: (
      <>
        Our{" "}
        <a
          data-testid="about-privacy-link"
          href="/privacy/"
          className="text-primary font-semibold underline underline-offset-2"
        >
          privacy &amp; cookies policy
        </a>{" "}
        explains exactly what data the site handles.
      </>
    ),
    content: <AboutContent />,
  },
  ascii: {
    heading: "ASCII & Latin Codes",
    lead: "Find a character by its hexadecimal or URL-encoded value, or browse accented Latin letter families.",
    content: <AsciiContent />,
  },
  openssl: {
    heading: "OpenSSL Cheatsheet",
    lead: "Generate a random Base64URL or hexadecimal secret on your own machine.",
    content: <OpenSslCheatsheet />,
  },
  ssh: {
    heading: "SSH Cheatsheet",
    lead: "Create an Ed25519 SSH key for automation on your own machine and share only its public key.",
    content: <SshCheatsheet />,
  },
} as const satisfies Record<InfoPage, { heading: string; lead: ReactNode; content: ReactNode }>;

export type CodecAppProps = { toolId: ToolId; page?: never } | { page: InfoPage; toolId?: never };

export function CodecApp(props: CodecAppProps) {
  const infoPage = props.page === undefined ? undefined : INFO_PAGES[props.page];
  const tool = props.page === undefined ? getTool(props.toolId) : undefined;
  const [descriptionSummary, ...descriptionDetails] = tool?.description ?? [];
  const [theme, setTheme] = useState<Theme>("dark");
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const exitAnimationRef = useRef<Animation | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setTheme(readTheme());
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!drawerOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.documentElement.style.overflow;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      exitAnimationRef.current?.cancel();
      exitAnimationRef.current = null;
      document.documentElement.style.overflow = previousOverflow;
      if (typeof dialog.close === "function" && dialog.open) dialog.close();
      else dialog.removeAttribute("open");
    };
  }, [drawerOpen]);

  const closeDrawer = () => {
    // Repeated Escape or backdrop clicks must not restart an exit already in progress.
    if (exitAnimationRef.current) return;
    const finishClosing = () => {
      const dialog = dialogRef.current;
      if (dialog?.open && typeof dialog.close === "function") dialog.close();
      setDrawerOpen(false);
      menuRef.current?.focus();
    };
    const drawer = drawerRef.current;
    const backdrop = backdropRef.current;
    // Close immediately for reduced motion or browsers without Web Animations support.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !drawer?.animate || !backdrop) {
      finishClosing();
      return;
    }
    const options: KeyframeAnimationOptions = { duration: 150, easing: "ease-in", fill: "forwards" };
    backdrop.animate([{ opacity: getComputedStyle(backdrop).opacity }, { opacity: 0 }], options);
    const animation = drawer.animate(
      [{ transform: getComputedStyle(drawer).transform }, { transform: "translateX(100%)" }],
      options,
    );
    exitAnimationRef.current = animation;
    animation.onfinish = finishClosing;
  };
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    writeTheme(next);
    applyTheme(next);
    setTheme(next);
  };
  const tools = {
    base64: <Base64Tool />,
    url: <UrlTool />,
    query: <QueryTool />,
    jwt: <JwtTool />,
    python: <PythonTool />,
    timestamp: <TimestampTool />,
    tailwind: <TailwindTool />,
  };
  const pagePresentation = TOOL_PRESENTATION[props.page ?? props.toolId];
  const PageIcon = pagePresentation.Icon;

  return (
    <div
      data-testid="codec-app"
      data-hydrated={hydrated}
      aria-busy={!hydrated}
      inert={hydrated ? undefined : true}
      className="min-h-dvh md:flex"
    >
      <a data-testid="skip-link" className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside
        data-testid="desktop-sidebar"
        className="border-line bg-panel w-sidebar sticky top-0 hidden h-dvh shrink-0 flex-col overflow-y-auto border-r md:flex"
      >
        <a
          data-testid="desktop-home-link"
          href="/base64/"
          className="border-line flex min-h-20 items-center gap-3 border-b px-5"
        >
          <BrandLogo />
          <span className="font-display text-xl font-extrabold tracking-tight">
            Codec<span className={BRAND_SUFFIX_CLASSES}>64</span>
          </span>
        </a>
        <ToolNavigation activeTool={props.toolId} currentPage={props.page} />
        <footer
          data-testid="sidebar-footer"
          className="border-line mt-auto flex flex-col items-start gap-3 border-t p-4"
        >
          <FooterLegalLinks />
          <div className="flex w-full justify-end">
            <ThemeControl dark={theme === "dark"} onToggle={toggleTheme} />
          </div>
        </footer>
      </aside>

      <header
        data-testid="mobile-header"
        className="border-line bg-panel sticky top-0 z-20 flex min-h-16 items-center justify-between gap-2 border-b px-4 md:hidden"
      >
        <a
          data-testid="mobile-home-link"
          href="/base64/"
          className="font-display text-section-title inline-flex min-h-11 min-w-0 items-center gap-2 font-bold tracking-normal"
        >
          <BrandLogo />
          <span>
            Codec<span className={BRAND_SUFFIX_CLASSES}>64</span>
          </span>
        </a>
        <button
          ref={menuRef}
          data-testid="menu-button"
          type="button"
          title="Open tools menu"
          className={ICON_BUTTON_CLASSES}
          aria-label="Open tools menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          <MenuIcon aria-hidden="true" size={20} />
        </button>
      </header>

      {drawerOpen && (
        <dialog
          ref={dialogRef}
          data-testid="mobile-drawer-layer"
          aria-label="Tool menu"
          aria-modal="true"
          className="mobile-drawer-dialog fixed inset-0 z-30 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 md:hidden"
          onCancel={(event) => {
            event.preventDefault();
            closeDrawer();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeDrawer();
              return;
            }
            if (event.key !== "Tab") return;
            const focusable = event.currentTarget.querySelectorAll<HTMLElement>(
              'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
            );
            const first = focusable.item(0);
            const last = focusable.item(focusable.length - 1);
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }}
        >
          <button
            ref={backdropRef}
            data-testid="drawer-backdrop"
            type="button"
            tabIndex={-1}
            title="Close tools menu"
            aria-label="Close tools menu"
            className="mobile-drawer-backdrop bg-ink/45 absolute inset-0"
            onClick={closeDrawer}
          />
          <aside
            ref={drawerRef}
            data-testid="mobile-drawer"
            aria-label="Tools"
            className="mobile-drawer-panel border-line bg-panel shadow-drawer w-drawer relative ml-auto flex h-dvh flex-col border-l"
          >
            <div className="border-line flex min-h-16 items-center justify-between border-b px-4">
              <span className="font-display text-section-title font-semibold">Tools</span>
              <button
                ref={closeRef}
                data-testid="drawer-close"
                type="button"
                title="Close tools menu"
                className={ICON_BUTTON_CLASSES}
                aria-label="Close tools menu"
                onClick={closeDrawer}
              >
                <XIcon aria-hidden="true" size={20} />
              </button>
            </div>
            <ToolNavigation
              activeTool={props.toolId}
              currentPage={props.page}
              onNavigate={() => setDrawerOpen(false)}
            />
            <footer
              data-testid="mobile-footer"
              className="border-line mt-auto flex flex-col items-stretch gap-3 border-t p-4"
            >
              <FooterLegalLinks />
              <div className="flex justify-end">
                <ThemeControl dark={theme === "dark"} onToggle={toggleTheme} />
              </div>
            </footer>
          </aside>
        </dialog>
      )}

      <main
        id="main-content"
        data-testid="app-main"
        className="max-w-workbench mx-auto min-w-0 flex-1 px-4 pt-5 pb-12 md:px-8 md:pt-8"
      >
        <header
          data-testid={props.page ? `${props.page}-header` : "tool-header"}
          data-accent={props.page ?? props.toolId}
          className="mb-6"
        >
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-start md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span
                data-testid="page-identity-icon"
                className={`rounded-control inline-flex size-(--text-page-title) shrink-0 items-center justify-center border ${pagePresentation.accentClasses}`}
              >
                <PageIcon aria-hidden="true" size={21} strokeWidth={1.8} />
              </span>
              <h1 className="font-display text-ink text-page-title min-w-0 font-bold tracking-normal text-balance">
                {infoPage ? infoPage.heading : tool?.title}
              </h1>
            </div>
            {!infoPage && (
              <p
                data-testid="tool-privacy"
                className="border-success bg-success-soft text-success rounded-control text-control flex shrink-0 items-center gap-2 border px-3 py-2 font-semibold"
              >
                <ShieldCheckIcon aria-hidden="true" size={18} strokeWidth={1.8} />
                Your data stays in this browser.
              </p>
            )}
          </div>
          {infoPage ? (
            <p data-testid={`${props.page}-lead`} className="text-muted max-w-reading mt-3 text-pretty">
              {infoPage.lead}
            </p>
          ) : (
            <div data-testid="tool-description" className="text-muted max-w-reading text-control mt-2 text-pretty">
              <p>{descriptionSummary}</p>
              {descriptionDetails.length > 0 && (
                <ul className="marker:text-accent mt-1 flex list-disc flex-wrap gap-x-6 gap-y-1 pl-4">
                  {descriptionDetails.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </header>
        {infoPage ? infoPage.content : tool ? tools[tool.id] : null}
        {tool && <ToolGuidance toolId={tool.id} />}
      </main>
    </div>
  );
}
