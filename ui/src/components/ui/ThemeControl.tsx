import { MoonIcon, SunIcon } from "lucide-react";

interface ThemeControlProps {
  dark: boolean;
  onToggle: () => void;
}

export function ThemeControl({ dark, onToggle }: ThemeControlProps) {
  const Icon = dark ? SunIcon : MoonIcon;
  const label = dark ? "Use light theme" : "Use dark theme";
  return (
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
  );
}
