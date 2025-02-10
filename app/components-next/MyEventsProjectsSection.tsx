import { TabBar } from "@mint-vernetzt/components/src/organisms/TabBar";
import React from "react";

export function Section(
  props: { children: React.ReactNode } & Pick<
    React.HTMLProps<HTMLElement>,
    "className"
  >
) {
  const { className } = props;
  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      return React.isValidElement(child);
    }
  );

  const title = validChildren.find((child) => {
    return (child as React.ReactElement).type === SectionTitle;
  });
  const text = validChildren.find((child) => {
    return (child as React.ReactElement).type === SectionText;
  });

  const otherChildren = validChildren.filter((child) => {
    return (
      (child as React.ReactElement).type !== SectionTitle &&
      (child as React.ReactElement).type !== SectionText
    );
  });

  return (
    <section
      className={`${
        className !== undefined
          ? className
          : "mv-py-6 mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-4 mv-border mv-border-neutral-200 mv-bg-white mv-rounded-2xl"
      }`}
    >
      {title !== undefined || text !== undefined ? (
        <div className="mv-flex mv-flex-col mv-gap-2">
          {title || null}
          {text || null}
        </div>
      ) : null}
      {otherChildren}
    </section>
  );
}

function SectionTitle(props: React.PropsWithChildren<{ id?: string }>) {
  const { children, ...rest } = props;
  return (
    <h2
      className="mv-text-2xl mv-font-bold mv-text-primary mv-leading-[26px] mv-mb-0"
      {...rest}
    >
      {children}
    </h2>
  );
}

function SectionText(props: { children: React.ReactNode }) {
  return <p className="mv-text-sm mv-text-neutral-700">{props.children}</p>;
}

Section.Title = SectionTitle;
Section.Text = SectionText;
Section.TabBar = TabBar;
