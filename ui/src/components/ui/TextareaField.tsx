import type { ChangeEventHandler } from "react";

interface TextareaFieldProps {
  ariaLabel: string;
  value: string;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  placeholder: string;
  disabled?: boolean;
  readOnly?: boolean;
  testId: string;
  className?: string;
  variant?: "field" | "editor";
  height?: "standard" | "medium" | "compact";
}

const FIELD_CLASSES =
  "border-line bg-field rounded-lg border p-4 focus:border-primary focus:ring-primary/15 focus:ring-3";
const EDITOR_CLASSES = "border-0 bg-transparent px-4 py-3 focus:ring-0";
const HEIGHT_CLASSES = {
  standard: "min-h-56 md:min-h-72",
  medium: "min-h-32 md:min-h-40",
  compact: "min-h-24",
} as const;

/** Renders accessible monospace input or output surface. */
export function TextareaField({
  ariaLabel,
  value,
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  testId,
  className = "",
  variant = "field",
  height = "standard",
}: TextareaFieldProps) {
  return (
    <div data-testid="textarea-field" className="flex min-w-0 flex-1 flex-col">
      <textarea
        data-testid={testId}
        aria-label={ariaLabel}
        className={`text-ink placeholder:text-muted disabled:text-muted w-full min-w-0 resize-y overflow-auto font-mono text-sm leading-6 transition outline-none disabled:cursor-not-allowed disabled:resize-none ${HEIGHT_CLASSES[height]} ${variant === "editor" ? EDITOR_CLASSES : FIELD_CLASSES} ${className}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        spellCheck={false}
      />
    </div>
  );
}
