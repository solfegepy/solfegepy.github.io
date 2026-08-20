import type { ReactNode } from "react";

const SECTION_CLASSES = "border-line bg-panel min-w-0 rounded-surface border p-4 shadow-sm md:p-6";
const LINK_CLASSES = "text-primary font-semibold underline underline-offset-2";

const COOKIES = [
  { cookie: "_ga", party: "First party", lifetime: "2 years", purpose: "Distinguishes visitors for Google Analytics" },
  {
    cookie: "_ga_J0WPVDJ942",
    party: "First party",
    lifetime: "2 years",
    purpose: "Persists Google Analytics session state",
  },
] as const;

interface PolicySectionProps {
  id: string;
  heading: string;
  children: ReactNode;
}

function PolicySection({ id, heading, children }: PolicySectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      data-testid={`privacy-${id}`}
      className={`${SECTION_CLASSES} mt-6 first:mt-0`}
    >
      <h2 id={`${id}-heading`} className="font-display text-ink text-2xl font-bold">
        {heading}
      </h2>
      <div className="text-muted mt-4 max-w-prose leading-7">{children}</div>
    </section>
  );
}

/** Privacy & cookies policy: who runs the site, what Google Analytics collects, and how to withdraw consent. */
export function PrivacyContent() {
  return (
    <div data-testid="privacy-content">
      <PolicySection id="who-runs-this-site" heading="Who runs this site">
        <p>
          Codec Bench is a set of free, browser-only encoding and conversion tools, operated by an independent developer
          at codec64.com. Privacy questions:{" "}
          <a data-testid="privacy-contact-link" href="mailto:sebpydev@outlook.com" className={LINK_CLASSES}>
            sebpydev@outlook.com
          </a>
          .
        </p>
      </PolicySection>

      <PolicySection id="what-you-enter" heading="What you enter">
        <p>
          Everything you enter is processed in your browser only. It is never sent to our servers, to Google Analytics,
          or to anyone else — not even after you accept analytics cookies.
        </p>
      </PolicySection>

      <PolicySection id="google-analytics" heading="Google Analytics">
        <p>
          If you accept, we use Google Analytics to see which pages are used. It collects your IP-derived approximate
          location, device and browser type, and which pages you view. Google Analytics processes this data as our data
          processor. Nothing from Google Analytics loads until you accept. Read{" "}
          <a
            data-testid="privacy-vendor-link"
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer"
            className={LINK_CLASSES}
          >
            Google's privacy policy
          </a>
          .
        </p>
      </PolicySection>

      <PolicySection id="fonts" heading="Fonts">
        <p>
          Every page requests the IBM Plex Sans and JetBrains Mono typefaces from fonts.googleapis.com and
          fonts.gstatic.com, before any cookie decision. These requests do not set cookies; they only serve font files
          needed to render the page as designed.
        </p>
      </PolicySection>

      <PolicySection id="cookies-we-use" heading="Cookies we use">
        <p>These cookies are only set after you accept analytics; rejecting means none of them is ever set.</p>
        <div className="border-line rounded-control mt-5 max-w-full overflow-x-auto border">
          <table data-testid="privacy-cookie-table" className="w-full text-left text-sm">
            <caption className="sr-only">Cookies Codec Bench sets</caption>
            <thead className="bg-field text-ink">
              <tr>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Cookie
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Party
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Lifetime
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Purpose
                </th>
              </tr>
            </thead>
            <tbody className="text-muted divide-line divide-y">
              {COOKIES.map((row) => (
                <tr key={row.cookie}>
                  <th className="text-ink px-4 py-3 font-semibold" scope="row">
                    <code>{row.cookie}</code>
                  </th>
                  <td className="px-4 py-3">{row.party}</td>
                  <td className="px-4 py-3">{row.lifetime}</td>
                  <td className="px-4 py-3">{row.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          The consent record itself is stored in your browser's local storage, not a cookie, and is strictly necessary —
          see Withdrawing consent below.
        </p>
      </PolicySection>

      <PolicySection id="legal-basis" heading="Legal basis">
        <p>
          Under UK PECR and UK GDPR, we only set these non-essential cookies with your prior consent. You can accept or
          reject with equal ease, and withdraw consent at any time — see below.
        </p>
        <p className="mt-4">
          You have the right to access, erase, object to, and port your data, and to exercise these rights by emailing{" "}
          <a data-testid="privacy-rights-link" href="mailto:sebpydev@outlook.com" className={LINK_CLASSES}>
            sebpydev@outlook.com
          </a>
          . You also have the right to complain to a supervisory authority, such as the UK's{" "}
          <a
            data-testid="privacy-ico-link"
            href="https://ico.org.uk/make-a-complaint/"
            target="_blank"
            rel="noreferrer"
            className={LINK_CLASSES}
          >
            Information Commissioner's Office
          </a>
          .
        </p>
      </PolicySection>

      <PolicySection id="withdrawing-consent" heading="Withdrawing consent">
        <p>
          Use the <strong>Cookie settings</strong> link in the footer of any page to reopen the cookie banner and change
          your choice at any time. Your choice is stored in your browser's local storage and is re-asked every 6 months.
        </p>
      </PolicySection>

      <PolicySection id="changes-to-this-policy" heading="Changes to this policy">
        <p>This policy may change. The current version is always the one on this page.</p>
      </PolicySection>
    </div>
  );
}
