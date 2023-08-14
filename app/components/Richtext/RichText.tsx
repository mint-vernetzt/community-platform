import { nl2br } from "~/lib/string/nl2br";

interface RichTextProps {
  html: string;
  additionalClassNames?: string;
}

export function RichtText({ html, additionalClassNames }: RichTextProps) {
  const isRichtext = html.indexOf("<p>") !== -1;

  if (isRichtext) {
    return (
      <div
        className={`rte-content ${additionalClassNames ?? ""}`}
        dangerouslySetInnerHTML={{
          __html: html,
        }}
      />
    );
  } else {
    return (
      <p
        className={`mb-6 ${additionalClassNames ?? ""}`}
        dangerouslySetInnerHTML={{
          __html: nl2br(html, true),
        }}
      />
    );
  }
}
