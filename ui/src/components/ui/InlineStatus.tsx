interface InlineStatusProps {
  error: string;
  status: string;
}

export function InlineStatus({ error, status }: InlineStatusProps) {
  if (error)
    return (
      <p
        data-testid="inline-status"
        role="alert"
        className="border-accent/40 bg-accent/10 text-accent-strong rounded-lg border px-3 py-2 text-sm font-medium"
      >
        {error}
      </p>
    );
  if (status)
    return (
      <p data-testid="inline-status" role="status" className="text-primary px-1 text-sm font-medium">
        {status}
      </p>
    );
  return <div data-testid="inline-status" className="h-5" aria-hidden="true" />;
}
