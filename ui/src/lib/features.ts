import { ENV } from "astro:env/client";

export { ENV };

/** Feature flag names. Reference flags through this object, never as string literals. */
export const Feature = {
  EnvBanner: "envBanner",
} as const;

export type Feature = (typeof Feature)[keyof typeof Feature];

// Environments where each feature is switched on. `Record<Feature, …>` makes a new flag without an entry a type error.
const FEATURE_ENVIRONMENTS: Record<Feature, readonly string[]> = {
  [Feature.EnvBanner]: ["development"],
};

/** Return whether a feature is switched on for the `ENV` this build was made with; unset `ENV` fails closed. */
export function isFeatureEnabled(feature: Feature): boolean {
  return ENV !== undefined && FEATURE_ENVIRONMENTS[feature].includes(ENV);
}

/** Return every feature switched on for this build, in declaration order. */
export function enabledFeatures(): Feature[] {
  return Object.values(Feature).filter(isFeatureEnabled);
}
