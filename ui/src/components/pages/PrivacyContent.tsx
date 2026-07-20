import { CookieIcon } from "lucide-react";
import type { ReactNode } from "react";

import { ContentSection } from "../shared/ContentSection";
import { ActionButton } from "../ui/ActionButton";

const LINK_CLASSES = "text-primary font-semibold underline underline-offset-2";
const CONTACT_EMAIL = "contact@codec64.com";

// Lifetimes match the vanilla-cookieconsent default expiry and GA_COOKIE_EXPIRES_SECONDS in lib/analytics.ts.
const COOKIES = [
  {
    cookie: "cc_cookie",
    party: "First party",
    lifetime: "182 days",
    purpose: "Remembers your cookie choices",
    category: "Necessary",
  },
  {
    cookie: "_ga",
    party: "First party",
    lifetime: "13 months after your last visit",
    purpose: "Distinguishes visitors for Google Analytics",
    category: "Analytics",
  },
  {
    cookie: "_ga_J0WPVDJ942",
    party: "First party",
    lifetime: "13 months after your last visit",
    purpose: "Persists Google Analytics session state",
    category: "Analytics",
  },
  {
    cookie: "_gcl_*",
    party: "First party",
    lifetime: "90 days",
    purpose: "Links ad clicks to visits",
    category: "Advertising",
  },
] as const;

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a data-testid="privacy-external-link" href={href} target="_blank" rel="noreferrer" className={LINK_CLASSES}>
      {children}
    </a>
  );
}

function ContactLink() {
  return (
    <a data-testid="privacy-contact-link" href={`mailto:${CONTACT_EMAIL}`} className={LINK_CLASSES}>
      {CONTACT_EMAIL}
    </a>
  );
}

function openCookieSettings(): void {
  void import("../../lib/analytics").then((m) => m.showCookieSettings());
}

/** Privacy & cookies policy: who runs the site, what each service collects, and how to withdraw consent. */
export function PrivacyContent() {
  return (
    <div data-testid="privacy-content">
      <ContentSection id="who-runs-this-site" heading="Who runs this site" testId="privacy-who-runs-this-site">
        <p>
          Codec Bench is a set of free, browser-only encoding and conversion tools, operated by Solfege Media Ltd at
          codec64.com. Solfege Media Ltd is the data controller for the information described here. It is registered in
          England and Wales, company number 07701812, registered office: 65 Walsworth Road, Hitchin, SG4 9FJ.
        </p>
        <p>
          Privacy questions: <ContactLink />.
        </p>
      </ContentSection>

      <ContentSection id="what-you-enter" heading="What you enter" testId="privacy-what-you-enter">
        <p>
          Everything you enter stays in your browser. It never reaches our servers, Google Analytics, or anyone else,
          not even after you accept analytics cookies.
        </p>
      </ContentSection>

      <ContentSection id="stored-on-your-device" heading="Stored on your device" testId="privacy-stored-on-your-device">
        <p>
          If you choose light or dark mode, we save that choice in your browser's local storage under{" "}
          <code>codec-bench-theme</code>. Until you choose, dark mode is used. You can clear it at any time in your
          browser settings. It is never sent to us.
        </p>
      </ContentSection>

      <ContentSection id="hosting" heading="Hosting and server logs" testId="privacy-hosting">
        <p>
          Codec Bench is hosted on GitHub Pages, run by GitHub, Inc. in the United States. When you visit, GitHub logs
          your IP address for security purposes, whether or not you accept cookies. GitHub keeps these logs under{" "}
          <ExternalLink href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
            its own privacy statement
          </ExternalLink>
          , which also sets out the safeguards it relies on for transfers from the UK and EU, including the EU–US Data
          Privacy Framework. We cannot see these logs.
        </p>
      </ContentSection>

      <ContentSection id="google-analytics" heading="Google Analytics" testId="privacy-google-analytics">
        <p>
          If you accept analytics, we use Google Analytics to see which pages people use. It collects your approximate
          location from your IP address, your device and browser type, and the pages you view. Nothing from Google
          Analytics loads before you accept analytics.
        </p>
        <p>
          Google processes this data for us. See{" "}
          <ExternalLink href="https://policies.google.com/technologies/partner-sites">
            how Google uses information from sites that use its services
          </ExternalLink>
          . Google Analytics keeps this data for 14 months, then deletes it.
        </p>
        <p>
          Google may process this data outside the UK and EU, including in the United States. Google LLC is certified
          under the EU–US Data Privacy Framework and its UK Extension, and its data processing terms add standard
          contractual clauses.
        </p>
        <p>
          If you also accept advertising, Google may link your visits to your Google account for audience reports, and
          use them for advertising such as showing you our ads on other sites (remarketing). For this, Google also uses
          the data for its own advertising purposes, and may use its own cookies on google.com if you are signed in. You
          can control the ads Google shows you in{" "}
          <ExternalLink href="https://myadcenter.google.com">My Ad Center</ExternalLink>. Advertising works only if you
          also accept analytics.
        </p>
      </ContentSection>

      <ContentSection id="third-parties" heading="Third parties" testId="privacy-third-parties">
        <p>Pages load nothing from other companies until you accept cookies.</p>
      </ContentSection>

      <ContentSection id="cookies-we-use" heading="Cookies we use" testId="privacy-cookies-we-use">
        <p>
          We use one necessary cookie, <code>cc_cookie</code>, to remember your cookie choices. It is set even when you
          reject optional cookies, so we don't ask again on every page. Analytics and advertising cookies appear only
          when you accept the category that uses them.
        </p>
        <div className="border-line rounded-control max-w-full overflow-x-auto border">
          <table data-testid="privacy-cookie-table" className="w-full text-left text-sm">
            <caption className="sr-only">Cookies Codec Bench sets</caption>
            <thead className="bg-field text-ink">
              <tr>
                {["Cookie", "Party", "Lifetime", "Purpose", "Category"].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-semibold" scope="col">
                    {heading}
                  </th>
                ))}
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
                  <td className="px-4 py-3">{row.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentSection>

      <ContentSection id="legal-basis" heading="Legal basis" testId="privacy-legal-basis">
        <p>
          We set non-essential cookies, and process the data they collect, only with your prior consent: UK PECR and UK
          GDPR for UK visitors, the ePrivacy Directive and GDPR for EU visitors. You can accept or reject with equal
          ease, and the site works the same either way. You can withdraw consent at any time. See below.
        </p>
        <p>
          The hosting logs happen because we have a legitimate interest in running a working, secure, readable site (UK
          GDPR and GDPR Article 6(1)(f)).
        </p>
      </ContentSection>

      <ContentSection id="your-rights" heading="Your rights" testId="privacy-your-rights">
        <p>
          You can ask us to access, correct, or erase the personal data we hold about you, restrict or object to its
          processing, or receive it in a portable format. Email <ContactLink />. We don't know who you are, so to find
          your data we may ask for details such as when you visited and your IP address.
        </p>
        <p>
          If you are unhappy with how we handle your data, you can complain to a data protection authority: in the UK,
          the <ExternalLink href="https://ico.org.uk/make-a-complaint/">Information Commissioner's Office</ExternalLink>
          ; in the EU, the authority in the country where you live or work.
        </p>
      </ContentSection>

      <ContentSection id="withdrawing-consent" heading="Withdrawing consent" testId="privacy-withdrawing-consent">
        <p>
          Use <strong>Cookie settings</strong> on this page, or in the site menu on any page, to reopen your choices and
          change or withdraw consent at any time. Withdrawing analytics deletes its cookies and reloads the page. We
          save your choice in a cookie for 182 days, then ask again.
        </p>
        <ActionButton data-testid="privacy-cookie-settings" tone="primary" onClick={openCookieSettings}>
          <CookieIcon aria-hidden="true" size={16} strokeWidth={1.8} />
          Cookie settings
        </ActionButton>
      </ContentSection>

      <ContentSection id="changes-to-this-policy" heading="Changes to this policy" testId="privacy-changes">
        <p>This policy may change. The current version is always the one on this page.</p>
      </ContentSection>
    </div>
  );
}
