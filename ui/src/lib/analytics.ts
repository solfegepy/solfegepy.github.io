export const GA_MEASUREMENT_ID = "G-J0WPVDJ942";

const GA_SCRIPT_SELECTOR = 'script[src*="googletagmanager.com/gtag/js"]';

/** Inject Google Analytics; safe to call more than once. */
export function loadAnalytics(): void {
  if (document.querySelector(GA_SCRIPT_SELECTOR)) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  const gtag = function () {
    // Google gtag.js requires the Arguments object, not a rest-parameter array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  } as Gtag;

  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
}

/** Opt this browser out of the property until the next page load removes the injected script. */
export function disableAnalytics(): void {
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
}
