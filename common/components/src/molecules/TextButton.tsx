import classNames from "classnames";
import { Children, cloneElement, createElement, isValidElement } from "react";
import { Link, type LinkProps } from "react-router";

export type TextButtonVariants = "primary" | "neutral" | "dark";
type TextButtonSize = "small" | "medium" | "large";
type TextButtonWeight = "normal" | "thin" | "base";
type TextButtonType = "button" | "link";

type TextButtonProps = {
  size?: TextButtonSize;
  variant?: TextButtonVariants;
  weight?: TextButtonWeight;
  as?: TextButtonType;
  arrowLeft?: boolean;
  arrowRight?: boolean;
};

function getIconSize(size: TextButtonSize) {
  let iconSize = 14;
  if (size === "small") {
    iconSize = 12;
  }
  if (size === "large") {
    iconSize = 20;
  }
  return iconSize;
}

function ChevronLeft(props: { size: TextButtonSize }) {
  const iconSize = getIconSize(props.size);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={iconSize}
      height={iconSize}
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <path
        fillRule="evenodd"
        d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
      />
    </svg>
  );
}

function ChevronRight(props: { size: TextButtonSize }) {
  const iconSize = getIconSize(props.size);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={iconSize}
      height={iconSize}
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <path
        fillRule="evenodd"
        d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
      />
    </svg>
  );
}

function TextButton(
  props: TextButtonProps &
    (
      | React.ButtonHTMLAttributes<HTMLButtonElement>
      | (LinkProps & React.RefAttributes<HTMLAnchorElement>)
      | React.PropsWithChildren
    )
) {
  const {
    variant = "primary",
    size = "medium",
    weight = "normal",
    arrowLeft = false,
    arrowRight = false,
    ...otherProps
  } = props;

  const classes = classNames(
    "mv-flex mv-w-fit mv-items-center mv-gap-2 hover:mv-underline active:mv-underline mv-underline-offset-4",
    variant === "primary" && "mv-text-primary",
    variant === "neutral" && "mv-text-neutral",
    variant === "dark" && "mv-text-neutral-700",
    size === "small" && "mv-text-sm",
    size === "large" && "mv-text-2xl",
    weight === "thin" && "mv-font-thin",
    weight === "base" && "mv-font-normal",
    weight === "normal" && "mv-font-semibold"
  );

  // If component is used as a wrapper, we need to clone inner node, apply the styles and rearrange the children
  if (typeof props.as === "undefined" && typeof props.children !== "string") {
    const element = Children.only(props.children);
    if (isValidElement(element)) {
      const elementChildren =
        typeof element.props === "object" &&
        element.props !== null &&
        "children" in element.props
          ? isValidElement(element.props.children)
            ? Children.toArray(element.props.children)
            : element.props.children
          : null;
      const clone = cloneElement(
        element as React.ReactElement,
        {
          // TODO: fix type issue
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - We should look at our cloneElement implementation.
          className: classes,
        },
        <>
          {props.arrowLeft && <ChevronLeft size={size} />}
          {elementChildren as React.ReactNode}
          {props.arrowRight && <ChevronRight size={size} />}
        </>
      );
      return clone;
    }
    return null;
  }

  const children = (
    <>
      {arrowLeft && <ChevronLeft size={size} />}
      {props.children}
      {arrowRight && <ChevronRight size={size} />}
    </>
  );

  const as = props.as || "button";

  if (as === "link" && "to" in otherProps) {
    return (
      <Link
        {...otherProps}
        className={`${
          otherProps.className !== undefined ? `${otherProps.className} ` : ""
        }${classes}`}
      >
        {children}
      </Link>
    );
  } else if (as === "button" && "to" in otherProps === false) {
    return (
      <button {...otherProps} className={classes}>
        {children}
      </button>
    );
  } else {
    return createElement(
      as,
      {
        ...otherProps,
        className: classes,
      },
      children
    );
  }
}

export { TextButton };
