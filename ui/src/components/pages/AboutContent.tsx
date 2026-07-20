import { TOOLS } from "../../lib/tools";
import { ContentSection } from "../shared/ContentSection";

const LINK_CLASSES = "text-primary font-semibold underline underline-offset-2";

/** About page: what Codec Bench offers and the company behind it. */
export function AboutContent() {
  return (
    <div data-testid="about-content">
      <ContentSection id="what-it-does" heading="What Codec Bench does" testId="about-what-it-does">
        <p>
          Codec Bench is a set of free encoding and conversion tools for developers. Every conversion runs in your
          browser, so what you enter never leaves your device.
        </p>
        <ul className="marker:text-accent list-disc pl-5">
          {TOOLS.map((tool) => (
            <li key={tool.id}>
              <a data-testid="about-tool-link" href={tool.route} className={LINK_CLASSES}>
                {tool.title}
              </a>
            </li>
          ))}
        </ul>
      </ContentSection>

      <ContentSection id="who-we-are" heading="Who we are" testId="about-who-we-are">
        <p>
          Codec Bench is run by Solfege Media Ltd, registered in England and Wales, company number 07701812. Registered
          office: 65 Walsworth Road, Hitchin, SG4 9FJ.
        </p>
        <p>
          Questions or feedback:{" "}
          <a data-testid="about-contact-link" href="mailto:contact@codec64.com" className={LINK_CLASSES}>
            contact@codec64.com
          </a>
          .
        </p>
      </ContentSection>
    </div>
  );
}
