import classNames from "classnames";
import { createElement } from "react";
interface LinkProps {
  to: string;
  children?: string | React.ReactNode;
  variant?: "primary";
  active?: boolean;
  className?: string;
  as?: string | React.ElementType;
  isExternal?: boolean;
}

function Link(props: LinkProps) {
  const {
    to,
    isExternal = false,
    as = "a",
    className,
    variant,
    active,
    ...otherProps
  } = props;

  let rel;
  let target;
  if (isExternal) {
    rel = "noopener noreferrer";
    target = "_blank";
  }

  let href;
  if (as === "a") {
    href = to;
  }

  const classes = classNames(
    className !== undefined && className,
    as === "a" && "hover:mv-underline mv-underline-offset-4 mv-decoration-2",
    variant === "primary" && "mv-text-primary",
    active && "mv-underline mv-cursor-default mv-pointer-events-none"
  );

  const element = createElement(as, {
    href,
    className: classes,
    to,
    rel,
    target,
    ...otherProps,
  });
  return element;
}

export { Link };
