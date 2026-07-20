import { MoonIcon, SunIcon } from "lucide-react";

interface ThemeControlProps {
  dark: boolean;
  overridden: boolean;
  onReset: () => void;
  onToggle: () => void;
}

export function ThemeControl({ dark, overridden, onReset, onToggle }: ThemeControlProps) {
  const Icon = dark ? SunIcon : MoonIcon;
  const label = dark ? "Use light theme" : "Use dark theme";
  return (
    <div data-testid="theme-controls" className="flex flex-wrap items-center justify-end gap-2">
      <button
        data-testid="theme-system-reset"
        type="button"
        className="text-muted hover:text-primary focus-visible:outline-primary disabled:bg-paper min-h-11 rounded-lg px-2 font-mono text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
        onClick={onReset}
        disabled={!overridden}
        aria-label="Use system theme"
        title="Use system theme"
      >
        System
      </button>
      <button
        data-testid="theme-control"
        type="button"
        className="border-line bg-panel text-ink hover:border-primary hover:text-primary focus-visible:outline-primary inline-flex size-11 items-center justify-center rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={onToggle}
        aria-label={label}
        title={label}
      >
        <Icon aria-hidden="true" size={18} />
      </button>
    </div>
  );
}
