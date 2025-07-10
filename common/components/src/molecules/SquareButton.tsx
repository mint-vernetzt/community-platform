import classnames from "classnames";
import { createElement } from "react";
import { Link, type LinkProps } from "react-router";

type SquareButtonSize = "small" | "medium" | "large";
type SquareButtonVariant = "normal" | "outline" | "ghost";
type SquareButtonType = "button" | "link" | "div" | "label";
type SquareButtonLevel =
  | "primary"
  // | "secondary"
  // | "positive"
  // | "attention"
  | "negative";

type SquareButtonProps = {
  size?: SquareButtonSize;
  loading?: boolean;
  variant?: SquareButtonVariant;
  level?: SquareButtonLevel;
  responsive?: boolean; // lg -> md -> sm
  as?: SquareButtonType;
  fullSize?: boolean;
};

function SquareButton(
  props: SquareButtonProps &
    (
      | React.ButtonHTMLAttributes<HTMLButtonElement>
      | (LinkProps & React.RefAttributes<HTMLAnchorElement>)
      | React.LabelHTMLAttributes<HTMLLabelElement>
    )
) {
  const {
    size = "medium",
    variant = "normal",
    level = "primary",
    as = "button",
    fullSize = false,
    loading,
    ...otherProps
  } = props;

  // check if disabled prop is present and true (reason: Button and Anchor props)
  const isDisabled = "disabled" in props && props.disabled;

  const classes = classnames(
    "mv-appearance-none",
    "mv-font-semibold",
    "mv-whitespace-nowrap",
    "mv-flex",
    "mv-items-center",
    "mv-justify-center",
    "mv-align-middle",
    "mv-text-center",
    "mv-rounded-lg",
    "mv-p-2",
    isDisabled && "mv-pointer-events-none",
    as === "label" && isDisabled === false && "mv-cursor-pointer",
    // button size
    size === "small" && "mv-h-8 mv-w-8 mv-text-xs mv-leading-4",
    size === "medium" && "mv-h-10 mv-w-10 mv-text-sm mv-leading-5",
    size === "large" && "mv-h-12 mv-w-12 mv-text-base mv-leading-[22px]",
    // button border
    variant === "outline" && size !== "large" && "mv-border",
    variant === "outline" && size === "large" && "mv-border-2",
    // button full size
    fullSize && "mv-w-full mv-aspect-square",
    // button primary disabled
    isDisabled &&
      variant === "normal" &&
      level === "primary" &&
      "mv-bg-neutral-200 mv-text-neutral-400",
    // button negative disabled
    isDisabled &&
      variant === "normal" &&
      level === "negative" &&
      "mv-bg-negative-300 mv-text-white",
    // button primary
    !isDisabled &&
      variant === "normal" &&
      level === "primary" &&
      "mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 active:mv-bg-primary-700 focus:mv-ring-2 focus:mv-ring-primary-200 focus:mv-outline-none",
    // button negative
    !isDisabled &&
      variant === "normal" &&
      level === "negative" &&
      "mv-bg-negative-600 mv-text-white hover:mv-bg-negative-700 active:mv-bg-negative-800 focus:mv-ring-2 focus:mv-ring-negative-900 focus:mv-outline-none",
    // button primary outline disabled
    isDisabled &&
      variant === "outline" &&
      "mv-bg-white mv-border-neutral-300 mv-text-neutral-300",
    // button primary outline
    !isDisabled &&
      variant === "outline" &&
      size !== "large" &&
      "mv-bg-white mv-border-primary mv-text-primary hover:mv-bg-neutral-100 active:mv-bg-neutral-200 focus:mv-ring-1 focus:mv-ring-primary-200 focus:mv-outline-none focus:mv-border-primary-200",
    !isDisabled &&
      variant === "outline" &&
      size === "large" &&
      "mv-bg-white mv-border-primary mv-text-primary hover:mv-bg-neutral-100 active:mv-bg-neutral-200 focus:mv-outline-none focus:mv-border-primary-200",
    // button primary ghost disabled
    isDisabled && variant === "ghost" && "mv-bg-white mv-text-neutral-300",
    // button primary ghost
    !isDisabled &&
      variant === "ghost" &&
      "mv-bg-white mv-text-primary hover:mv-text-primary-700 hover:mv-bg-neutral-50 focus:mv-underline focus:mv-underline-offset-4 active:mv-bg-neutral-100 focus:mv-outline-none",

    Array.isArray(otherProps.children) &&
      otherProps.children.length > 1 &&
      "mv-gap-2",
    loading !== undefined && loading !== false && "mv-loading"
  );

  if (as === "link" && "to" in otherProps) {
    return (
      <Link
        {...otherProps}
        className={`${
          otherProps.className !== undefined ? `${otherProps.className} ` : ""
        }${classes}`}
      >
        {otherProps.children}
      </Link>
    );
  } else if (
    as === "button" &&
    "to" in otherProps === false &&
    "type" in otherProps
  ) {
    return (
      <button
        {...otherProps}
        className={`${
          otherProps.className !== undefined ? `${otherProps.className} ` : ""
        }${classes}`}
      >
        {otherProps.children}
      </button>
    );
  } else if (
    as === "label" &&
    "to" in otherProps === false &&
    "htmlFor" in otherProps
  ) {
    return (
      <label
        {...otherProps}
        className={`${
          otherProps.className !== undefined ? `${otherProps.className} ` : ""
        }${classes}`}
      >
        {otherProps.children}
      </label>
    );
  } else {
    return createElement(as, {
      ...otherProps,
      className: `${
        otherProps.className !== undefined ? `${otherProps.className} ` : ""
      }${classes}`,
    });
  }
}

export { SquareButton };
