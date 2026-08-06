import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

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
        className="border-line bg-field text-muted hover:border-primary hover:text-primary focus-visible:outline-primary disabled:bg-paper rounded-control inline-flex min-h-11 items-center gap-2 border px-3 font-mono text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
        onClick={onReset}
        disabled={!overridden}
        aria-label="Use system theme"
        title="Use system theme"
      >
        <MonitorIcon aria-hidden="true" size={16} />
        System
      </button>
      <button
        data-testid="theme-control"
        type="button"
        className="border-line bg-field text-ink hover:border-primary hover:text-primary focus-visible:outline-primary rounded-control inline-flex size-11 items-center justify-center border transition focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={onToggle}
        aria-label={label}
        title={label}
      >
        <Icon aria-hidden="true" size={18} />
      </button>
    </div>
  );
}
