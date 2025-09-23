import classnames from "classnames";
import { createElement } from "react";
import { Link, type LinkProps } from "react-router";

// eigene Komponente für Icon-Button mit Varianten für Circle und Square

type ButtonSize = "x-small" | "small" | "medium" | "large";
type ButtonVariant = "normal" | "outline" | "ghost";
type ButtonType = "button" | "link" | "div" | "label";
type ButtonLevel =
  | "primary"
  // | "secondary"
  // | "positive"
  // | "attention"
  | "negative";

type ButtonProps = {
  size?: ButtonSize;
  loading?: boolean;
  variant?: ButtonVariant;
  level?: ButtonLevel;
  responsive?: boolean; // lg -> md -> sm
  as?: ButtonType;
  fullSize?: boolean;
};

function Button(
  props: ButtonProps &
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
    "appearance-none",
    "font-semibold",
    "whitespace-nowrap",
    "flex",
    "items-center",
    "justify-center",
    "align-middle",
    "text-center",
    "rounded-lg",
    isDisabled && "pointer-events-none",
    as === "label" && isDisabled === false && "cursor-pointer",
    // button size
    size === "x-small" && "text-xs p-2 leading-4",
    size === "small" && "text-xs px-4 py-2 leading-4",
    size === "medium" && "h-10 text-sm px-4 py-2.5 leading-5",
    size === "large" && "h-12 text-base px-6 py-2.5 leading-[22px]",
    // button border
    variant === "outline" && size !== "large" && "border",
    variant === "outline" && size === "large" && "border-2",
    // button full size
    fullSize ? "w-full" : "w-fit",
    // button primary disabled
    isDisabled &&
      variant === "normal" &&
      level === "primary" &&
      "bg-neutral-200 text-neutral-400",
    // button negative disabled
    isDisabled &&
      variant === "normal" &&
      level === "negative" &&
      "bg-negative-300 text-white",
    // button primary
    !isDisabled &&
      variant === "normal" &&
      level === "primary" &&
      "bg-primary text-neutral-50 hover:bg-primary-600 active:bg-primary-700 focus:ring-2 focus:ring-primary-200 focus:outline-hidden",
    // button negative
    !isDisabled &&
      variant === "normal" &&
      level === "negative" &&
      "bg-negative-600 text-white hover:bg-negative-700 active:bg-negative-800 focus:ring-2 focus:ring-negative-900 focus:outline-hidden",
    // button primary outline disabled
    isDisabled &&
      variant === "outline" &&
      "bg-white border-neutral-300 text-neutral-300",
    // button primary outline
    !isDisabled &&
      variant === "outline" &&
      size !== "large" &&
      "bg-white border-primary text-primary hover:bg-neutral-100 active:bg-neutral-200 focus:ring-1 focus:ring-primary-200 focus:outline-hidden focus:border-primary-200",
    !isDisabled &&
      variant === "outline" &&
      size === "large" &&
      "bg-white border-primary text-primary hover:bg-neutral-100 active:bg-neutral-200 focus:outline-hidden focus:border-primary-200",
    // button primary ghost disabled
    isDisabled && variant === "ghost" && "bg-white text-neutral-300",
    // button primary ghost
    !isDisabled &&
      variant === "ghost" &&
      "bg-white text-primary hover:text-primary-700 hover:bg-neutral-50 focus:underline focus:underline-offset-4 active:bg-neutral-100 focus:outline-hidden",

    Array.isArray(otherProps.children) &&
      otherProps.children.length > 1 &&
      "gap-2",
    loading !== undefined && loading !== false && "loading"
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

export { Button };
