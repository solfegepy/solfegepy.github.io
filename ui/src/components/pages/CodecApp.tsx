import { CircleHelpIcon, MenuIcon, ShieldCheckIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";

import { disableAnalytics, loadAnalytics } from "../../lib/analytics";
import { parseConsentRecord, shouldShowBanner, CONSENT_STORAGE_KEY, type ConsentRecord } from "../../lib/consent";
import { getTool, TOOL_GROUPS, TOOLS, type ToolId } from "../../lib/tools";
import { TOOL_PRESENTATION } from "../../lib/presentation";
import {
  applyTheme,
  initializeTheme,
  removeThemeOverride,
  resolveSystemTheme,
  subscribeToSystemTheme,
  writeThemeOverride,
  type ThemeOverride,
} from "../../lib/theme";
import { CookieBanner } from "../ui/CookieBanner";
import { ThemeControl } from "../ui/ThemeControl";
import { Base64Tool } from "./Base64Tool";
import { FaqContent } from "./FaqContent";
import { JwtTool } from "./JwtTool";
import { PrivacyContent } from "./PrivacyContent";
import { PythonTool } from "./PythonTool";
import { QueryTool } from "./QueryTool";
import { TimestampTool } from "./TimestampTool";
import { UrlTool } from "./UrlTool";

function readConsentRecord(): ConsentRecord | null {
  try {
    return parseConsentRecord(localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeConsentRecord(record: ConsentRecord): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ponytail: consent simply does not persist when storage is blocked; the banner reappears next visit.
  }
}

const NAV_LINK_CLASSES =
  "group mx-3 flex min-h-11 items-center gap-3 rounded-lg border border-transparent px-3 text-sm font-medium text-muted transition duration-200 hover:bg-field hover:text-ink active:translate-y-px focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary";
const ACTIVE_NAV_LINK_CLASSES = "border-primary/20 bg-primary-soft font-semibold text-primary";
const NAV_GROUP_CLASSES = "mb-5";
const NAV_GROUP_LABEL_CLASSES = "text-muted px-5 pb-2 font-mono text-xs font-semibold tracking-widest uppercase";
const BRAND_SLASH_CLASSES = "text-accent";
const ICON_BUTTON_CLASSES = "icon-button";

interface ToolNavigationProps {
  activeTool: ToolId | undefined;
  faqCurrent: boolean;
  onNavigate?: () => void;
}

function ToolNavigation({ activeTool, faqCurrent, onNavigate }: ToolNavigationProps) {
  return (
    <nav data-testid="tool-navigation" aria-label="Tools and help" className="flex flex-1 flex-col py-5">
      {TOOL_GROUPS.map((group) => (
        <section data-testid="tool-navigation-group" key={group} className={NAV_GROUP_CLASSES}>
          <p className={NAV_GROUP_LABEL_CLASSES}>{group}</p>
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
                  <span
                    className={`rounded-control inline-flex size-8 shrink-0 items-center justify-center border ${accentClasses}`}
                  >
                    <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
                  </span>
                  {tool.label}
                </a>
              );
            })}
          </div>
        </section>
      ))}
      <section data-testid="help-navigation-group" className={NAV_GROUP_CLASSES}>
        <p className={NAV_GROUP_LABEL_CLASSES}>Help</p>
        <a
          data-testid="faq-link"
          data-accent="faq"
          href="/faq"
          aria-current={faqCurrent ? "page" : undefined}
          className={`${NAV_LINK_CLASSES} ${faqCurrent ? ACTIVE_NAV_LINK_CLASSES : ""}`}
          onClick={onNavigate}
        >
          <span
            className={`rounded-control inline-flex size-8 shrink-0 items-center justify-center border ${TOOL_PRESENTATION.faq.accentClasses}`}
          >
            <CircleHelpIcon aria-hidden="true" size={16} strokeWidth={1.8} />
          </span>
          FAQ
        </a>
      </section>
    </nav>
  );
}

interface FooterLegalLinksProps {
  onReopenCookieSettings: (event: MouseEvent) => void;
}

const FOOTER_LINK_CLASSES = "text-muted hover:text-primary min-h-11 text-sm font-medium underline underline-offset-2";

function FooterLegalLinks({ onReopenCookieSettings }: FooterLegalLinksProps) {
  return (
    <div className="flex flex-col items-start gap-1">
      <a data-testid="privacy-link" href="/privacy" className={FOOTER_LINK_CLASSES}>
        Privacy &amp; cookies
      </a>
      <a
        data-testid="cookie-settings-link"
        href="#cookie-banner"
        className={FOOTER_LINK_CLASSES}
        onClick={onReopenCookieSettings}
      >
        Cookie settings
      </a>
    </div>
  );
}

export type CodecAppProps = { toolId: ToolId; page?: never } | { page: "faq" | "privacy"; toolId?: never };

export function CodecApp(props: CodecAppProps) {
  const isFaq = props.page === "faq";
  const isPrivacy = props.page === "privacy";
  const tool = props.page === undefined ? getTool(props.toolId) : undefined;
  const [descriptionSummary, ...descriptionDetails] = tool?.description ?? [];
  const [theme, setTheme] = useState<{ override: ThemeOverride; resolved: "light" | "dark" }>({
    override: null,
    resolved: "light",
  });
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [consentRecord, setConsentRecord] = useState<ConsentRecord | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setTheme(initializeTheme());
      setHydrated(true);
    });
    const unsubscribe = subscribeToSystemTheme(undefined, undefined, (resolved) =>
      setTheme({ override: null, resolved }),
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const record = readConsentRecord();
      setConsentRecord(record);
      if (record?.status === "granted") loadAnalytics();
      setBannerVisible(shouldShowBanner(record, Date.now()));
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
      document.documentElement.style.overflow = previousOverflow;
      if (typeof dialog.close === "function" && dialog.open) dialog.close();
      else dialog.removeAttribute("open");
    };
  }, [drawerOpen]);

  const closeDrawer = () => {
    const dialog = dialogRef.current;
    if (dialog?.open && typeof dialog.close === "function") dialog.close();
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
  const acceptConsent = () => {
    const record: ConsentRecord = { status: "granted", decidedAt: Date.now() };
    writeConsentRecord(record);
    setConsentRecord(record);
    setBannerVisible(false);
    loadAnalytics();
  };
  const rejectConsent = () => {
    const previouslyGranted = consentRecord?.status === "granted";
    const record: ConsentRecord = { status: "denied", decidedAt: Date.now() };
    writeConsentRecord(record);
    setConsentRecord(record);
    setBannerVisible(false);
    if (previouslyGranted) {
      disableAnalytics();
      window.location.reload();
    }
  };
  const reopenCookieSettings = (event: MouseEvent) => {
    event.preventDefault();
    setBannerVisible(true);
  };
  const tools = {
    base64: <Base64Tool />,
    url: <UrlTool />,
    query: <QueryTool />,
    jwt: <JwtTool />,
    python: <PythonTool />,
    timestamp: <TimestampTool />,
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
        className="border-line bg-panel sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r shadow-sm md:flex"
      >
        <a data-testid="desktop-home-link" href="/" className="border-line flex min-h-20 items-center border-b px-5">
          <span className="font-display text-xl font-extrabold tracking-tight">
            Codec<span className={BRAND_SLASH_CLASSES}>/</span>Bench
          </span>
        </a>
        <ToolNavigation activeTool={props.page ? undefined : props.toolId} faqCurrent={isFaq} />
        <footer
          data-testid="sidebar-footer"
          className="border-line mt-auto flex flex-col items-stretch gap-3 border-t p-4"
        >
          <span className="text-muted text-sm font-medium whitespace-nowrap">Appearance</span>
          <ThemeControl
            dark={theme.resolved === "dark"}
            overridden={theme.override !== null}
            onToggle={toggleTheme}
            onReset={resetTheme}
          />
          <FooterLegalLinks onReopenCookieSettings={reopenCookieSettings} />
        </footer>
      </aside>

      <header
        data-testid="mobile-header"
        className="border-line bg-panel sticky top-0 z-20 flex min-h-16 items-center justify-between gap-2 border-b px-4 shadow-sm md:hidden"
      >
        <a
          data-testid="mobile-home-link"
          href="/"
          className="font-display inline-flex min-h-11 min-w-0 items-center text-base font-extrabold tracking-tight"
        >
          Codec<span className={BRAND_SLASH_CLASSES}>/</span>Bench
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
            data-testid="drawer-backdrop"
            type="button"
            tabIndex={-1}
            title="Close tools menu"
            aria-label="Close tools menu"
            className="bg-ink/45 absolute inset-0"
            onClick={closeDrawer}
          />
          <aside
            data-testid="mobile-drawer"
            aria-label="Tools"
            className="border-line bg-panel relative flex h-dvh w-4/5 max-w-80 flex-col border-r shadow-lg"
          >
            <div className="border-line flex min-h-16 items-center justify-between border-b px-4">
              <span className="font-display text-lg font-bold">Tools</span>
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
              activeTool={props.page ? undefined : props.toolId}
              faqCurrent={isFaq}
              onNavigate={() => setDrawerOpen(false)}
            />
            <footer
              data-testid="mobile-footer"
              className="border-line mt-auto flex flex-col items-stretch gap-3 border-t p-4"
            >
              <FooterLegalLinks onReopenCookieSettings={reopenCookieSettings} />
              <div className="flex justify-end">
                <ThemeControl
                  dark={theme.resolved === "dark"}
                  overridden={theme.override !== null}
                  onToggle={toggleTheme}
                  onReset={resetTheme}
                />
              </div>
            </footer>
          </aside>
        </dialog>
      )}

      <main
        id="main-content"
        data-testid="app-main"
        className="mx-auto max-w-7xl min-w-0 flex-1 px-4 pt-5 pb-12 md:px-6 md:pt-8"
      >
        <header
          data-testid={isFaq ? "faq-header" : isPrivacy ? "privacy-header" : "tool-header"}
          data-accent={isFaq ? "faq" : isPrivacy ? "privacy" : props.toolId}
          className="mb-6"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span
                data-testid="page-identity-icon"
                className={`rounded-control mt-1 inline-flex size-11 shrink-0 items-center justify-center border ${pagePresentation.accentClasses}`}
              >
                <PageIcon aria-hidden="true" size={21} strokeWidth={1.8} />
              </span>
              <h1 className="font-display text-ink min-w-0 text-3xl leading-tight font-extrabold tracking-tight text-balance md:text-4xl">
                {tool ? tool.title : isFaq ? "Encoding and Conversion FAQ" : "Privacy & Cookies Policy"}
              </h1>
            </div>
            {!isFaq && !isPrivacy && (
              <p
                data-testid="tool-privacy"
                className="border-success bg-success-soft text-success rounded-control flex shrink-0 items-center gap-2 border px-3 py-2 text-sm font-semibold"
              >
                <ShieldCheckIcon aria-hidden="true" size={18} strokeWidth={1.8} />
                Your data stays in this browser.
              </p>
            )}
          </div>
          {isFaq ? (
            <p data-testid="faq-lead" className="text-muted mt-3 max-w-prose text-pretty">
              Direct answers about Codec Bench formats, limits, and browser-only conversion tools.
            </p>
          ) : isPrivacy ? (
            <p data-testid="privacy-lead" className="text-muted mt-3 max-w-prose text-pretty">
              How Codec Bench uses Google Analytics cookies, what data is collected, and how to withdraw consent.
            </p>
          ) : (
            <div data-testid="tool-description" className="text-muted mt-2 max-w-prose text-sm leading-6 text-pretty">
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
        {isFaq ? <FaqContent /> : isPrivacy ? <PrivacyContent /> : tool ? tools[tool.id] : null}
      </main>
      <CookieBanner visible={bannerVisible} onAccept={acceptConsent} onReject={rejectConsent} />
    </div>
  );
}
