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
}

export function TextareaField({
  ariaLabel,
  value,
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  testId,
  className = "",
}: TextareaFieldProps) {
  return (
    <div data-testid="textarea-field" className="channel flex min-w-0 flex-1 flex-col">
      <textarea
        data-testid={testId}
        aria-label={ariaLabel}
        className={`border-line bg-field text-ink placeholder:text-muted/70 focus:border-primary focus:ring-primary/15 disabled:bg-paper disabled:text-muted min-h-56 w-full min-w-0 resize-y overflow-auto rounded-lg border p-4 font-mono text-sm leading-6 transition outline-none focus:ring-3 disabled:cursor-not-allowed disabled:resize-none md:min-h-72 ${className}`}
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
