import classNames from "classnames";
import React from "react";

export type SectionVariant = "primary";
export type SectionType = "section" | "div";
export type SectionProps = {
  as?: SectionType;
  variant?: SectionVariant;
  withBorder?: boolean;
};

export function SectionHeader(
  props: React.PropsWithChildren<Pick<SectionProps, "variant" | "withBorder">>
) {
  const { children, variant, withBorder } = props;

  const classes = classNames(
    "mv-text-6xl mv-font-bold mv-p-6 mv-rounded-t-lg",
    variant === "primary" && "mv-bg-primary-50 mv-text-primary",
    typeof variant === "undefined" && "mv-text-neutral",
    withBorder && "mv-border-t mv-border-x mv-border-gray-200"
  );

  return <div className={classes}>{children}</div>;
}

export function SectionBody(
  props: React.PropsWithChildren<Pick<SectionProps, "withBorder">>
) {
  const classes = classNames(
    "mv-p-6 mv-text-neutral",
    props.withBorder && "mv-border-y mv-border-x mv-border-gray-200"
  );
  return <div className={classes}>{props.children}</div>;
}

export function SectionFooter(
  props: React.PropsWithChildren<Pick<SectionProps, "withBorder">>
) {
  const classes = classNames(
    "mv-min-h-[0.5rem]",
    "mv-rounded-b-lg",
    props.withBorder && "mv-border-b mv-border-x mv-border-gray-200"
  );
  return <div className={classes}>{props.children}</div>;
}

function Section(props: React.PropsWithChildren<SectionProps>) {
  const { as = "section" } = props;

  const children = React.Children.toArray(props.children);

  const validChildren = children.filter((child) => {
    return React.isValidElement(child);
  }) as React.ReactElement[];

  const header = validChildren.find((child) => {
    return child.type === SectionHeader;
  });

  let headerClone = null;
  if (header) {
    headerClone = React.cloneElement(header, {
      variant: props.variant,
      withBorder: props.withBorder,
    });
  }

  const body = validChildren.find((child) => {
    return child.type === SectionBody;
  });
  let bodyClone = null;
  if (body) {
    bodyClone = React.cloneElement(body, {
      withBorder: props.withBorder,
    });
  }

  let footer = validChildren.find((child) => {
    return child.type === SectionFooter;
  });

  let footerClone = null;
  if (footer) {
    footerClone = React.cloneElement(footer, {
      withBorder: props.withBorder,
    });
  }

  const noSectionItems =
    typeof header === "undefined" &&
    typeof body === "undefined" &&
    typeof footer === "undefined";

  const classes = classNames(
    "mv-w-full mv-min-w-full mv-flex mv-flex-col",
    noSectionItems && "mv-p-6 mv-rounded-lg",
    noSectionItems && props.withBorder && "mv-border mv-border-gray-200"
  );

  const element = React.createElement(
    as,
    { className: classes },
    noSectionItems ? (
      children
    ) : (
      <>
        {headerClone}
        {bodyClone}
        {footerClone}
      </>
    )
  );

  return element;
}

Section.Header = SectionHeader;
Section.Body = SectionBody;
Section.Footer = SectionFooter;

export default Section;
