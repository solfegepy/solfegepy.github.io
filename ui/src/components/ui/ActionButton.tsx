import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  tone?: "primary" | "quiet";
}

const BASE_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 font-mono text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:border-line disabled:bg-paper disabled:text-muted";

export function ActionButton({ children, title, tone = "quiet", type = "button", ...props }: ActionButtonProps) {
  const toneClasses =
    tone === "primary"
      ? "border-primary bg-primary text-paper hover:bg-primary-strong"
      : "border-line bg-panel text-ink hover:border-primary hover:text-primary";
  return (
    <button
      data-testid="action-button"
      type={type}
      title={title ?? (typeof children === "string" ? children : undefined)}
      className={`${BASE_CLASSES} ${toneClasses}`}
      {...props}
    >
      {children}
    </button>
  );
}
