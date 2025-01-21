import { nl2br } from "~/lib/string/nl2br";

interface RichTextProps {
  html: string;
  additionalClassNames?: string;
  id?: string;
}

export function RichText({ html, additionalClassNames, id }: RichTextProps) {
  const hasParagraph = html.indexOf("<p>") !== -1;

  if (hasParagraph) {
    return (
      <div
        id={id}
        className={additionalClassNames}
        dangerouslySetInnerHTML={{
          __html: html,
        }}
      />
    );
  } else {
    return (
      <p
        id={id}
        className={`mb-6 ${
          additionalClassNames !== undefined ? additionalClassNames : ""
        }`}
        dangerouslySetInnerHTML={{
          __html: nl2br(html, true),
        }}
      />
    );
  }
}
