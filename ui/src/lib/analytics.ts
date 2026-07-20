import * as CookieConsent from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";

export const GA_MEASUREMENT_ID = "G-J0WPVDJ942";

// 13 months, the CNIL ceiling for audience-measurement cookies, instead of GA4's 2-year default.
// The privacy policy's cookie table states this lifetime, so change both together.
const GA_COOKIE_EXPIRES_SECONDS = 395 * 24 * 60 * 60;

const ANALYTICS_CATEGORY = "analytics";
const ADVERTISING_CATEGORY = "advertising";
const PRIVACY_PATH = "/privacy";

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

type Gtag = (...args: unknown[]) => void;

// Set once gtag.js is loaded, so a later consent change updates it instead of loading it twice.
let gtag: Gtag | undefined;

/** Return Google's advertising consent signals for the visitor's advertising choice. */
function advertisingConsent(): Record<string, "granted" | "denied"> {
  const state = CookieConsent.acceptedCategory(ADVERTISING_CATEGORY) ? "granted" : "denied";
  return { ad_storage: state, ad_user_data: state, ad_personalization: state };
}

/** Load Google Analytics. Call only after the visitor accepts analytics cookies. */
function loadGoogleAnalytics(): Gtag {
  window.dataLayer = window.dataLayer ?? [];
  const push: Gtag = function () {
    // gtag.js only processes the `arguments` object, not a plain array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  push("consent", "default", { analytics_storage: "granted", ...advertisingConsent() });
  push("js", new Date());
  push("config", GA_MEASUREMENT_ID, { cookie_expires: GA_COOKIE_EXPIRES_SECONDS });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
  return push;
}

// Advertising features run on top of Google Analytics, so they need analytics consent as well.
function applyConsent(): void {
  if (!CookieConsent.acceptedCategory(ANALYTICS_CATEGORY)) return;
  if (gtag) gtag("consent", "update", advertisingConsent());
  else gtag = loadGoogleAnalytics();
}

/** Show the cookie banner on a first visit and load Google Analytics only once the visitor accepts. */
export function runCookieConsent(): Promise<void> {
  return CookieConsent.run({
    // Bump when trackers, cookies, or categories change, so every visitor is asked again.
    revision: 0,
    guiOptions: { consentModal: { layout: "box", position: "bottom right", equalWeightButtons: true } },
    categories: {
      [ANALYTICS_CATEGORY]: {
        // Withdrawing consent deletes the GA cookies and reloads so gtag.js stops running.
        autoClear: { cookies: [{ name: /^_ga/ }], reloadPage: true },
      },
      [ADVERTISING_CATEGORY]: {
        autoClear: { cookies: [{ name: /^_gcl_/ }] },
      },
    },
    onConsent: applyConsent,
    onChange: applyConsent,
    language: {
      default: "en",
      translations: {
        en: {
          consentModal: {
            title: "We value your privacy",
            description:
              "With your permission, we and Google use cookies and process data such as your IP address and " +
              "browser information to measure how Codec Bench is used, and to personalise the advertising you " +
              "see, including our ads on other sites. Nothing you enter in the tools is ever included. You can " +
              "change or withdraw your consent at any time with <strong>Cookie settings</strong> in the site " +
              `menu or on our <a href="${PRIVACY_PATH}">privacy page</a>.`,
            acceptAllBtn: "Accept all",
            acceptNecessaryBtn: "Reject all",
            showPreferencesBtn: "Manage choices",
            footer: `<a href="${PRIVACY_PATH}">Privacy & cookies</a>`,
          },
          preferencesModal: {
            title: "Cookie settings",
            acceptAllBtn: "Accept all",
            acceptNecessaryBtn: "Reject all",
            savePreferencesBtn: "Save choices",
            closeIconLabel: "Close",
            sections: [
              {
                title: "Analytics",
                description:
                  "Google Analytics counts visits and shows which pages people use, so we can improve the site.",
                linkedCategory: ANALYTICS_CATEGORY,
              },
              {
                title: "Advertising",
                description:
                  "Lets Google link your visits to your Google account for audience reports, and use them for " +
                  "advertising such as remarketing. Works only if you also allow analytics.",
                linkedCategory: ADVERTISING_CATEGORY,
              },
              { description: `Read our <a href="${PRIVACY_PATH}">privacy policy</a> for the full list of cookies.` },
            ],
          },
        },
      },
    },
  });
}

/** Open the cookie settings so the visitor can change their choices. */
export function showCookieSettings(): void {
  CookieConsent.showPreferences();
}
