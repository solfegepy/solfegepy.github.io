import { ENV, Feature, enabledFeatures, isFeatureEnabled } from "../../lib/features";

/** Show the build environment and its enabled feature flags in a thin strip above the page. */
export function EnvBanner() {
  if (!isFeatureEnabled(Feature.EnvBanner)) return null;
  return (
    <div data-testid="env-banner" className="bg-warning-soft text-warning shrink-0 px-4 py-1 text-center text-xs">
      ENV: {ENV} · Features: {enabledFeatures().join(", ") || "none"}
    </div>
  );
}
