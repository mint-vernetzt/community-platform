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
    <div className="flex gap-1.5 items-center">
      <menu className="flex gap-2 items-center">
        {links.map((link) => {
          return <li key={link.toString()}>{link}</li>;
        })}
      </menu>
      {typeof current !== "undefined" ? current : null}
    </div>
  );
}

function Link(props: { to: string; children: React.ReactNode }) {
  const { to, children } = props;

  return (
    <TextButton as="link" to={to} arrowRight variant="dark" weight="base">
      {children}
    </TextButton>
  );
}

function Current(props: { children: React.ReactNode }) {
  return (
    <span className="text-base leading-5 text-neutral-700 font-normal">
      {props.children}
    </span>
  );
}

BreadCrump.Link = Link;
BreadCrump.Current = Current;
