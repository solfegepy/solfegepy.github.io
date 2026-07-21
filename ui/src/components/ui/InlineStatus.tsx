interface InlineStatusProps {
  error: string;
  status: string;
}

/** Announces conversion feedback without reserving empty layout space. */
export function InlineStatus({ error, status }: InlineStatusProps) {
  if (error)
    return (
      <p
        data-testid="inline-status"
        role="alert"
        className="border-danger bg-danger-soft text-danger rounded-lg border px-3 py-2 text-sm font-medium"
      >
        {error}
      </p>
    );
  if (status)
    return (
      <p
        data-testid="inline-status"
        role="status"
        className="border-success bg-success-soft text-success rounded-lg border px-3 py-2 text-sm font-medium"
      >
        {status}
      </p>
    );
  return null;
}
