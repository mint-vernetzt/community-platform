import { useHydrated } from "remix-utils/use-hydrated";

interface RichTextProps {
  html: string;
  additionalClassNames?: string;
  id?: string;
}

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
  ) : null;
}
