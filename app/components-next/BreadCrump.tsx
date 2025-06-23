import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { Children, isValidElement, type PropsWithChildren } from "react";

export function BreadCrump(props: PropsWithChildren) {
  const { children } = props;

  const childrenArray = Children.toArray(children);

  const links = childrenArray.filter((child) => {
    return isValidElement(child) && child.type === Link;
  });

  const current = childrenArray.find((child) => {
    return isValidElement(child) && child.type === Current;
  });

  return (
    <div className="mv-flex mv-gap-1.5 mv-items-center">
      <menu className="mv-flex mv-gap-2 mv-items-center">
        {links.map((link) => {
          return <li key={link.toString()}>{link}</li>;
        })}
      </menu>
      {typeof current !== "undefined" ? current : null}
    </div>
  );
}

function Link(props: {
  to: string;
  isFirst?: boolean;
  standalone?: boolean;
  children: React.ReactNode;
}) {
  const { to, standalone = false, children } = props;

  return (
    <TextButton
      as="link"
      to={to}
      arrowRight={standalone === false}
      arrowLeft={standalone === true}
      variant="dark"
      weight="base"
    >
      {children}
    </TextButton>
  );
}

function Current(props: { children: React.ReactNode }) {
  return (
    <span className="mv-text-base mv-leading-5 mv-text-neutral-700 mv-font-normal">
      {props.children}
    </span>
  );
}

BreadCrump.Link = Link;
BreadCrump.Current = Current;
