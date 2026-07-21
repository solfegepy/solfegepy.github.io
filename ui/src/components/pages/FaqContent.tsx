import { ChevronDownIcon } from "lucide-react";
import type { ReactNode } from "react";

interface FaqItemData {
  question: string;
  answer: ReactNode;
}

interface FaqSectionData {
  heading: string;
  route: string;
  linkLabel: string;
  items: readonly FaqItemData[];
}

const CODE_CLASSES = "break-all font-mono text-sm text-ink";
const SECTION_CLASSES = "border-line border-t pt-7 first:border-t-0 first:pt-0";

const FAQ_SECTIONS: readonly FaqSectionData[] = [
  {
    heading: "Base64",
    route: "/",
    linkLabel: "Open Base64 encoder and decoder",
    items: [
      {
        question: "How do I encode text to Base64?",
        answer: (
          <>
            Enter UTF-8 text in the Base64 tool, choose Plain text as the source and Base64 encoded as the target, then
            select Convert. For example, <code className={CODE_CLASSES}>Hello</code> becomes{" "}
            <code className={CODE_CLASSES}>SGVsbG8=</code>.
          </>
        ),
      },
      {
        question: "How do I decode Base64 to text?",
        answer:
          "Paste Base64, choose Base64 encoded as the source and Plain text as the target, then select Convert. The decoded bytes must be valid UTF-8 text; binary files are outside this tool's scope.",
      },
      {
        question: "Is Base64 encryption?",
        answer:
          "No. Base64 changes bytes into a text-safe representation and adds no confidentiality. Anyone with a Base64 decoder can recover the original data, so never treat encoding as secret protection.",
      },
      {
        question: "What is the difference between Base64 and Base64url?",
        answer: (
          <>
            Standard Base64 uses <code className={CODE_CLASSES}>+</code> and <code className={CODE_CLASSES}>/</code> and
            commonly uses <code className={CODE_CLASSES}>=</code> padding. Base64url uses{" "}
            <code className={CODE_CLASSES}>-</code> and <code className={CODE_CLASSES}>_</code> so values fit URLs and
            file names more safely, and it commonly omits padding.
          </>
        ),
      },
      {
        question: "Why does Base64 end with =?",
        answer: (
          <>
            One or two <code className={CODE_CLASSES}>=</code> characters pad the final Base64 group when input length
            does not divide evenly into three-byte blocks. Padding carries no secret data; whether it may be omitted
            depends on the format using Base64.
          </>
        ),
      },
    ],
  },
  {
    heading: "URL encoding",
    route: "/url",
    linkLabel: "Open URL encoder and decoder",
    items: [
      {
        question: "What is URL encoding or percent-encoding?",
        answer: (
          <>
            Percent-encoding represents characters as <code className={CODE_CLASSES}>%</code> followed by hexadecimal
            byte values, such as a space written as <code className={CODE_CLASSES}>%20</code>. It lets text travel
            safely in URL components while preserving URL syntax.
          </>
        ),
      },
      {
        question: "How do I URL-encode a string?",
        answer: (
          <>
            Use RFC 3986 component mode for one path, query, or fragment value. Use Full URI only for a complete URI
            whose structural characters, such as <code className={CODE_CLASSES}>:</code>,{" "}
            <code className={CODE_CLASSES}>/</code>, <code className={CODE_CLASSES}>?</code>, and{" "}
            <code className={CODE_CLASSES}>#</code>, must remain intact.
          </>
        ),
      },
      {
        question: "Should a URL space be %20 or +?",
        answer: (
          <>
            Use <code className={CODE_CLASSES}>%20</code> in ordinary URL percent-encoding.{" "}
            <code className={CODE_CLASSES}>+</code> represents a space in form URL encoding; a literal plus in that
            format must be <code className={CODE_CLASSES}>%2B</code>.
          </>
        ),
      },
      {
        question: "What is the difference between encodeURI and encodeURIComponent?",
        answer: (
          <>
            <code className={CODE_CLASSES}>encodeURI</code> preserves delimiters belonging to a complete URI.{" "}
            <code className={CODE_CLASSES}>encodeURIComponent</code> encodes delimiters inside one value; Codec Bench's
            Full URI and RFC 3986 component modes provide those respective behaviors.
          </>
        ),
      },
      {
        question: "Why does URL decoding fail?",
        answer:
          "Common causes include incomplete % escapes, non-hex escape characters, invalid UTF-8, or choosing form decoding for a value that uses a different convention. Confirm whether input is a full URI, component, or form value.",
      },
    ],
  },
  {
    heading: "Query parameters",
    route: "/query",
    linkLabel: "Open query parameter parser and builder",
    items: [
      {
        question: "How do I parse URL query parameters into JSON?",
        answer: (
          <>
            Paste a full URL, a query beginning with <code className={CODE_CLASSES}>?</code>, or the query text alone.
            Choose Query string as the source and JSON as the target, then select Convert.
          </>
        ),
      },
      {
        question: "How do I convert JSON into a URL query string?",
        answer: (
          <>
            Use a JSON object whose values are strings or arrays of strings, choose JSON as the source, and convert. The
            result omits the leading <code className={CODE_CLASSES}>?</code>, ready to append after one.
          </>
        ),
      },
      {
        question: "How are duplicate query parameters converted to JSON?",
        answer: (
          <>
            Repeated names become arrays in encounter order. For example,{" "}
            <code className={CODE_CLASSES}>tag=one&amp;tag=two</code> becomes{" "}
            <code className={CODE_CLASSES}>{'{ "tag": ["one", "two"] }'}</code>.
          </>
        ),
      },
      {
        question: "Does a query string need a leading question mark?",
        answer: (
          <>
            No. Codec Bench accepts <code className={CODE_CLASSES}>name=Ada</code>,{" "}
            <code className={CODE_CLASSES}>?name=Ada</code>, or a full URL. Built query output intentionally excludes
            the leading question mark.
          </>
        ),
      },
      {
        question: "How are spaces and plus signs handled in query parameters?",
        answer: (
          <>
            Query parsing follows form-style URL rules: <code className={CODE_CLASSES}>+</code> decodes to a space and{" "}
            <code className={CODE_CLASSES}>%2B</code> decodes to a literal plus. Building a query writes spaces as{" "}
            <code className={CODE_CLASSES}>+</code> and literal plus signs as <code className={CODE_CLASSES}>%2B</code>.
          </>
        ),
      },
    ],
  },
  {
    heading: "JWT",
    route: "/jwt",
    linkLabel: "Open JWT decoder",
    items: [
      {
        question: "Can I decode a JWT without a secret key?",
        answer:
          "Yes, when it is a signed three-part JWT with readable Base64url header and payload. A key is required to verify its signature, not to inspect those encoded fields.",
      },
      {
        question: "Does decoding a JWT verify its signature?",
        answer:
          "No. Codec Bench displays header, payload, and encoded signature only. Never use decoded claims for authentication or authorization until trusted server-side code verifies signature, issuer, audience, expiry, and other required claims.",
      },
      {
        question: "What are the three parts of a JWT?",
        answer:
          "A compact signed JWT contains a JOSE header, claims payload, and signature separated by periods. The first two parts are Base64url-encoded JSON objects.",
      },
      {
        question: "Can an expired JWT still be decoded?",
        answer: (
          <>
            Yes. Expiry does not prevent Base64url decoding, and this decoder does not evaluate the{" "}
            <code className={CODE_CLASSES}>exp</code> claim. A decoded expired token remains expired and must not be
            accepted.
          </>
        ),
      },
      {
        question: "Is a JWT encrypted?",
        answer:
          "A typical three-part signed JWT is encoded and readable, not encrypted. Encrypted JWE tokens use a different structure and are not supported by this decoder.",
      },
    ],
  },
  {
    heading: "Python and JSON",
    route: "/python-json",
    linkLabel: "Open Python literal to JSON converter",
    items: [
      {
        question: "How do I convert a Python dictionary to JSON?",
        answer: (
          <>
            Paste a supported Python literal, choose Python literal as the source and JSON as the target, then select
            Convert. String keys, nested dictionaries, lists, tuples, finite numbers, booleans, and{" "}
            <code className={CODE_CLASSES}>None</code> are supported.
          </>
        ),
      },
      {
        question: "Why is a Python dictionary not valid JSON?",
        answer: (
          <>
            Python and JSON use similar containers but different literal syntax. JSON requires double-quoted object keys
            and strings, and uses <code className={CODE_CLASSES}>true</code>,{" "}
            <code className={CODE_CLASSES}>false</code>, and <code className={CODE_CLASSES}>null</code> instead of
            Python's <code className={CODE_CLASSES}>True</code>, <code className={CODE_CLASSES}>False</code>, and{" "}
            <code className={CODE_CLASSES}>None</code>.
          </>
        ),
      },
      {
        question: "How do Python True, False, and None convert to JSON?",
        answer: (
          <>
            They become JSON <code className={CODE_CLASSES}>true</code>, <code className={CODE_CLASSES}>false</code>,
            and <code className={CODE_CLASSES}>null</code>. Converting back restores{" "}
            <code className={CODE_CLASSES}>True</code>, <code className={CODE_CLASSES}>False</code>, and{" "}
            <code className={CODE_CLASSES}>None</code>.
          </>
        ),
      },
      {
        question: "Can nested Python dictionaries and lists convert to JSON?",
        answer:
          "Yes. Supported dictionaries, lists, and tuples can nest; tuples become JSON arrays. Sets, bytes, object constructors, and executable expressions are not supported.",
      },
      {
        question: "Does the Python-to-JSON converter execute Python code?",
        answer: (
          <>
            No. It parses a limited literal grammar in the browser and does not call Python or{" "}
            <code className={CODE_CLASSES}>eval</code>. Function calls, imports, comprehensions, and other executable
            expressions are rejected.
          </>
        ),
      },
    ],
  },
  {
    heading: "Unix timestamps and Z time",
    route: "/timestamp",
    linkLabel: "Open Unix timestamp and Z time converter",
    items: [
      {
        question: "How do I convert a Unix timestamp to a UTC date?",
        answer: (
          <>
            Choose Unix seconds or Unix milliseconds as the source and Z time as the target, enter the value, then
            select Convert. Output uses UTC ISO 8601, such as{" "}
            <code className={CODE_CLASSES}>2026-07-21T12:00:00.000Z</code>.
          </>
        ),
      },
      {
        question: "Is a Unix timestamp in seconds or milliseconds?",
        answer:
          "Traditional Unix time uses seconds; browsers and many APIs use milliseconds. Around current dates seconds commonly have 10 digits and milliseconds 13, but Codec Bench requires explicit format selection instead of guessing.",
      },
      {
        question: "What is the Unix epoch?",
        answer: (
          <>
            The Unix epoch is <code className={CODE_CLASSES}>1970-01-01T00:00:00Z</code>. Unix timestamps count elapsed
            seconds or, in some systems, milliseconds from that UTC instant while ignoring leap seconds.
          </>
        ),
      },
      {
        question: "What does Z mean in a date and time?",
        answer: (
          <>
            A trailing <code className={CODE_CLASSES}>Z</code> identifies zero-offset UTC, sometimes called Zulu time.
            Codec Bench accepts strict UTC ISO 8601 Z time and does not convert local time-zone names or offsets.
          </>
        ),
      },
      {
        question: "Why is my Unix timestamp invalid?",
        answer:
          "Check seconds vs milliseconds, remove signs or non-numeric text, and use a non-negative value within years 1970–9999. Decimal input is accepted, but precision below one millisecond is truncated and Unix output is an integer.",
      },
    ],
  },
];

interface FaqItemProps {
  accordionName: string;
  item: FaqItemData;
}

function FaqItem({ accordionName, item }: FaqItemProps) {
  return (
    <details data-testid="faq-item" name={accordionName} className="bg-panel open:bg-field group">
      <summary
        data-testid="faq-summary"
        className="hover:bg-field focus-visible:outline-primary flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <h3 className="font-display text-ink min-w-0 text-base leading-7 font-semibold md:text-lg">{item.question}</h3>
        <ChevronDownIcon
          aria-hidden="true"
          className="text-muted size-5 shrink-0 transition-transform duration-200 group-open:rotate-180"
          strokeWidth={2}
        />
      </summary>
      <p data-testid="faq-answer" className="text-muted px-4 pt-1 pb-5 leading-7 break-words md:pr-12">
        {item.answer}
      </p>
    </details>
  );
}

interface FaqCategoryProps {
  section: FaqSectionData;
}

function FaqCategory({ section }: FaqCategoryProps) {
  const accordionName = `faq-${section.heading.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <section data-testid="faq-category" className={SECTION_CLASSES}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-ink text-2xl font-bold tracking-tight">{section.heading}</h2>
        <a
          data-testid="faq-tool-link"
          href={section.route}
          className="text-primary focus-visible:outline-primary text-sm font-semibold underline decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {section.linkLabel}
        </a>
      </div>
      <div
        data-testid="faq-accordion"
        className="border-line bg-panel divide-line divide-y overflow-hidden rounded-xl border shadow-sm"
      >
        {section.items.map((item) => (
          <FaqItem key={item.question} accordionName={accordionName} item={item} />
        ))}
      </div>
    </section>
  );
}

/** Renders static FAQ categories and native disclosure items. */
export function FaqContent() {
  return (
    <div data-testid="faq-content" className="grid gap-9">
      {FAQ_SECTIONS.map((section) => (
        <FaqCategory key={section.heading} section={section} />
      ))}
    </div>
  );
}
