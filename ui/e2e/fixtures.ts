import { expect, test as base, type ConsoleMessage } from "@playwright/test";

type BrowserError = {
  message: string;
  source: string;
};
type TestFixtures = { browserErrors: void };

// Entries must match both message and source. Keep hydration errors visible even if a future entry matches.
const THIRD_PARTY_ERROR_ALLOWLIST: { message: RegExp; source: RegExp }[] = [];

function isAllowlistedThirdPartyError({ message, source }: BrowserError): boolean {
  if (/hydration/i.test(message)) return false;
  return THIRD_PARTY_ERROR_ALLOWLIST.some((entry) => entry.message.test(message) && entry.source.test(source));
}

export const test = base.extend<TestFixtures>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: BrowserError[] = [];
      const onConsole = (message: ConsoleMessage) => {
        if (message.type() === "error") {
          errors.push({ message: message.text(), source: message.location().url || "<unknown>" });
        }
      };
      const onPageError = (error: Error) => {
        errors.push({ message: error.message, source: error.stack?.split("\n")[1]?.trim() ?? "<unknown>" });
      };

      page.on("console", onConsole);
      page.on("pageerror", onPageError);
      await use().finally(() => {
        page.off("console", onConsole);
        page.off("pageerror", onPageError);
        const unexpected = errors.filter((error) => !isAllowlistedThirdPartyError(error));
        expect(unexpected.map(({ message, source }) => `${message} (${source})`)).toEqual([]);
      });
    },
    { auto: true },
  ],
});

export { expect };
