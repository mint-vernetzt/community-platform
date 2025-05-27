import classNames from "classnames";
import { createElement } from "react";
import { Link as ReactRouterLink } from "react-router";
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

  if (as === "a" && "to" in otherProps) {
    return (
      <ReactRouterLink
        className={`${
          className !== undefined ? `${className} ` : ""
        }${classes}`}
        to={to}
      >
        {otherProps.children}
      </ReactRouterLink>
    );
  }

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
