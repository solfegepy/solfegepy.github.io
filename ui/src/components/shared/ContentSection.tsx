import type { ReactNode } from "react";

const SECTION_CLASSES = "border-line min-w-0 border-t pt-8 first:border-t-0 first:pt-0";

interface ContentSectionProps {
  id: string;
  heading: string;
  testId: string;
  children: ReactNode;
}

/** Open prose section for text pages such as the privacy policy and About page. */
export function ContentSection({ id, heading, testId, children }: ContentSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} data-testid={testId} className={SECTION_CLASSES}>
      <h2 id={`${id}-heading`} className="font-display text-ink text-section-title font-semibold">
        {heading}
      </h2>
      <div className="text-muted text-body max-w-reading mt-3 space-y-4">{children}</div>
    </section>
  );
}
