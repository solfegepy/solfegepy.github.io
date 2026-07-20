import type { ReactNode } from "react";

const SECTION_CLASSES = "border-line bg-panel min-w-0 rounded-surface border p-4 shadow-sm md:p-6";

interface ContentSectionProps {
  id: string;
  heading: string;
  testId: string;
  children: ReactNode;
}

/** Headed prose card for text pages such as the privacy policy and About page. */
export function ContentSection({ id, heading, testId, children }: ContentSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      data-testid={testId}
      className={`${SECTION_CLASSES} mt-6 first:mt-0`}
    >
      <h2 id={`${id}-heading`} className="font-display text-ink text-2xl font-bold">
        {heading}
      </h2>
      <div className="text-muted mt-4 max-w-prose space-y-4 leading-7">{children}</div>
    </section>
  );
}
