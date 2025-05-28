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
    as = "link",
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
  if (as === "link") {
    href = to;
  }

  const classes = classNames(
    className !== undefined && className,
    as === "link" && "hover:mv-underline mv-underline-offset-4 mv-decoration-2",
    variant === "primary" && "mv-text-primary",
    active && "mv-underline mv-cursor-default mv-pointer-events-none"
  );

  if (as === "link") {
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

  const element = createElement(
    as,
    {
      ...otherProps,
      href,
      className: classes,
      to,
      rel,
      target,
    },
    otherProps.children
  );
  return element;
}

export { Link };
