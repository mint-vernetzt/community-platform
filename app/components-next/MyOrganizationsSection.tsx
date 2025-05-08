import { Children, isValidElement } from "react";

export function Section(props: {
  children: React.ReactNode;
  additionalClassNames?: string;
}) {
  const validChildren = Children.toArray(props.children).filter((child) => {
    return isValidElement(child);
  });

  const headline = validChildren.find((child) => {
    return isValidElement(child) && child.type === Section.Headline;
  });
  const subline = validChildren.find((child) => {
    return isValidElement(child) && child.type === Section.Subline;
  });

  const otherChildren = validChildren.filter((child) => {
    return (
      isValidElement(child) &&
      child.type !== Section.Headline &&
      child.type !== Section.Subline
    );
  });

  return (
    <section
      className={`mv-w-full mv-flex mv-flex-col mv-gap-8 @sm:mv-px-4 @lg:mv-px-6 @sm:mv-py-6 @sm:mv-gap-6 @sm:mv-bg-white @sm:mv-rounded-2xl @sm:mv-border @sm:mv-border-neutral-200${
        props.additionalClassNames !== undefined
          ? ` ${props.additionalClassNames}`
          : ""
      }`}
    >
      {typeof headline !== "undefined" || typeof subline !== "undefined" ? (
        <div className="mv-flex mv-flex-col mv-gap-2">
          {headline}
          {subline}
        </div>
      ) : null}
      {otherChildren}
    </section>
  );
}

function SectionHeadline(props: React.PropsWithChildren<{ id?: string }>) {
  const { children, ...otherProps } = props;
  return (
    <h2
      className="mv-text-2xl mv-font-bold mv-text-primary mv-leading-[26px] mv-mb-0"
      {...otherProps}
    >
      {children}
    </h2>
  );
}

function SectionSubline(props: React.PropsWithChildren<{ id?: string }>) {
  const { children, ...otherProps } = props;

  return (
    <p className="mv-text-base mv-text-neutral-600" {...otherProps}>
      {children}
    </p>
  );
}

Section.Headline = SectionHeadline;
Section.Subline = SectionSubline;
