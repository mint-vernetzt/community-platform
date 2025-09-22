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
      className={`w-full flex flex-col gap-8 @sm:px-4 @lg:px-6 @sm:py-6 @sm:bg-white @sm:rounded-2xl @sm:border @sm:border-neutral-200${
        props.additionalClassNames !== undefined
          ? ` ${props.additionalClassNames}`
          : ""
      }`}
    >
      {typeof headline !== "undefined" || typeof subline !== "undefined" ? (
        <div className="flex flex-col gap-2">
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
      className="text-2xl font-bold text-primary leading-[26px] mb-0"
      {...otherProps}
    >
      {children}
    </h2>
  );
}

function SectionSubline(props: React.PropsWithChildren<{ id?: string }>) {
  const { children, ...otherProps } = props;

  return (
    <p className="text-base text-neutral-600" {...otherProps}>
      {children}
    </p>
  );
}

Section.Headline = SectionHeadline;
Section.Subline = SectionSubline;
