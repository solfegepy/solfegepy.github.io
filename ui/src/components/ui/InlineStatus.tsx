interface InlineStatusProps {
  error: string;
  status: string;
}

const STATUS_ICON_CLASSES = "mt-0.5 shrink-0";

/** Announces conversion feedback without reserving empty layout space. */
export function InlineStatus({ error, status }: InlineStatusProps) {
  if (error)
    return (
      <p
        data-testid="inline-status"
        role="alert"
        className="border-danger bg-danger-soft text-danger rounded-control flex items-start gap-2 border px-3 py-2 text-sm font-medium"
      >
        <CircleAlertIcon aria-hidden="true" className={STATUS_ICON_CLASSES} size={17} />
        {error}
      </p>
    );
  if (status)
    return (
      <p
        data-testid="inline-status"
        role="status"
        className="border-success bg-success-soft text-success rounded-control flex items-start gap-2 border px-3 py-2 text-sm font-medium"
      >
        <CircleCheckIcon aria-hidden="true" className={STATUS_ICON_CLASSES} size={17} />
        {status}
      </p>
    );
  return null;
}
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
