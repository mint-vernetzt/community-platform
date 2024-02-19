import classNames from "classnames";
import React from "react";
export interface LinkProps {
  to: string;
  children?: string | React.ReactNode;
  variant?: "primary";
  active?: boolean;
  className?: string;
  as?: string | React.ElementType;
  isExternal?: boolean;
}

export const Link = React.forwardRef((props: LinkProps, ref) => {
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

  const element = React.createElement(as, {
    href,
    className: classes,
    to,
    rel,
    target,
    ref,
    ...otherProps,
  });
  return element;
});

Link.displayName = "Link";

export default Link;
