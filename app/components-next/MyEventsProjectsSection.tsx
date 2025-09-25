import { TabBar } from "@mint-vernetzt/components/src/organisms/TabBar";
import { Children, isValidElement } from "react";

export function Section(
  props: { children: React.ReactNode } & Pick<
    React.HTMLProps<HTMLElement>,
    "className"
  >
) {
  const { className } = props;
  const validChildren = Children.toArray(props.children).filter((child) => {
    return isValidElement(child);
  });

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
          : "py-6 px-4 @lg:px-6 flex flex-col gap-4 border border-neutral-200 bg-white rounded-2xl"
      }`}
    >
      {title !== undefined || text !== undefined ? (
        <div className="flex flex-col gap-2">
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
      className="text-2xl font-bold text-primary leading-[26px] mb-0"
      {...rest}
    >
      {children}
    </h2>
  );
}

function SectionText(props: { children: React.ReactNode }) {
  return <p className="text-sm text-neutral-700">{props.children}</p>;
}

Section.Title = SectionTitle;
Section.Text = SectionText;
Section.TabBar = TabBar;
