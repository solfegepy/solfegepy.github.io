import { useEffect, useRef } from "react";

interface CookieBannerProps {
  visible: boolean;
  onAccept: () => void;
  onReject: () => void;
}

const BUTTON_CLASSES =
  "min-h-11 flex-1 rounded-control border px-4 py-2 text-center font-mono text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:flex-none";

const HEIGHT_VAR = "--cookie-banner-height";

/** Consent banner for non-essential analytics; hidden until the visitor has an undecided or stale record. */
export function CookieBanner({ visible, onAccept, onReject }: CookieBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = bannerRef.current;
    const root = document.documentElement.style;
    if (!visible || !node || typeof ResizeObserver === "undefined") {
      root.setProperty(HEIGHT_VAR, "0px");
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height ?? 0;
      root.setProperty(HEIGHT_VAR, `${height}px`);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <>
      {/* ponytail: banner is `fixed`, so it doesn't push document flow and can permanently cover
          bottom-of-page content on short/zoomed viewports. This measured-height spacer, paired with
          `scroll-padding-bottom` in globals.css, reserves and targets scroll room clear of it. */}
      <div aria-hidden="true" style={{ height: `var(${HEIGHT_VAR}, 0px)` }} />
      <div
        ref={bannerRef}
        id="cookie-banner"
        data-testid="cookie-banner"
        role="region"
        aria-label="Cookie consent"
        hidden={!visible}
        className="border-line bg-panel fixed inset-x-0 bottom-0 z-40 border-t p-4 shadow-lg"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-muted max-w-prose min-w-0 text-sm leading-6">
            We use Google Analytics to understand how the site is used — this only runs if you accept.{" "}
            <a
              data-testid="cookie-banner-policy-link"
              href="/privacy"
              className="text-primary font-semibold underline underline-offset-2"
            >
              Read our cookie policy
            </a>
            .
          </p>
          <div className="flex w-full shrink-0 gap-2 md:w-auto">
            <button
              data-testid="cookie-reject"
              type="button"
              title="Reject analytics cookies"
              className={`${BUTTON_CLASSES} border-line bg-field text-ink hover:border-primary hover:text-primary`}
              onClick={onReject}
            >
              Reject
            </button>
            <button
              data-testid="cookie-accept"
              type="button"
              title="Accept analytics cookies"
              className={`${BUTTON_CLASSES} border-line bg-field text-ink hover:border-primary hover:text-primary`}
              onClick={onAccept}
            >
              Accept analytics
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
