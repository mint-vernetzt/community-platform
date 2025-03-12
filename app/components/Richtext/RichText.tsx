import { useHydrated } from "remix-utils/use-hydrated";
import { removeHtmlTags } from "~/lib/utils/transformHtml";

interface RichTextProps {
  html: string;
  additionalClassNames?: string;
  id?: string;
}

// Optimization idea:
// Maybe we could already render the RichText on the server and transfer the rendered tsx to the client. (React server components)
export function RichText({ html, additionalClassNames, id }: RichTextProps) {
  const isHydrated = useHydrated();
  return isHydrated ? (
    <div
      id={id}
      className={additionalClassNames}
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  ) : (
    // TODO: Optimize noscript fallback
    // - Display Link destinations
    // - Get line break to work
    // - ...
    <div id={id} className={additionalClassNames}>
      {removeHtmlTags(html.replace(/<br>/g, "\n"), " ")}
    </div>
  );
}
