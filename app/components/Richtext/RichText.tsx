interface RichTextProps {
  html: string;
  additionalClassNames?: string;
  id?: string;
}

export function RichText({ html, additionalClassNames, id }: RichTextProps) {
  return (
    <div
      id={id}
      className={additionalClassNames}
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  );
}
