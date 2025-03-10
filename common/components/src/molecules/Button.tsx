import classnames from "classnames";
import React from "react";

// eigene Komponente für Icon-Button mit Varianten für Circle und Square

export type ButtonSize = "x-small" | "small" | "medium" | "large";
export type ButtonVariant = "normal" | "outline" | "ghost";
export type ButtonType = "button" | "a" | "div" | "label";
export type ButtonLevel =
  | "primary"
  // | "secondary"
  // | "positive"
  // | "attention"
  | "negative";

export type ButtonProps = {
  size?: ButtonSize;
  loading?: boolean;
  variant?: ButtonVariant;
  level?: ButtonLevel;
  responsive?: boolean; // lg -> md -> sm
  // TODO: implement Button or Anchor props conditional (eg. if as="button" then href not possible)
  as?: ButtonType;
  fullSize?: boolean;
};

function Button(
  props: ButtonProps &
    (
      | React.ButtonHTMLAttributes<HTMLButtonElement>
      | React.AnchorHTMLAttributes<HTMLAnchorElement>
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
    isDisabled && "mv-pointer-events-none",
    as === "label" && isDisabled === false && "mv-cursor-pointer",
    // button size
    size === "x-small" && "mv-text-xs mv-p-2 mv-leading-4",
    size === "small" && "mv-text-xs mv-px-4 mv-py-2 mv-leading-4",
    size === "medium" && "mv-h-10 mv-text-sm mv-px-4 mv-py-2.5 mv-leading-5",
    size === "large" &&
      "mv-h-12 mv-text-base mv-px-6 mv-py-2.5 mv-leading-[22px]",
    // button border
    variant === "outline" && size !== "large" && "mv-border",
    variant === "outline" && size === "large" && "mv-border-2",
    // button full size
    fullSize ? "mv-w-full" : "mv-w-fit",
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
      "mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700",
    // button negative
    !isDisabled &&
      variant === "normal" &&
      level === "negative" &&
      "mv-bg-negative-600 mv-text-white hover:mv-bg-negative-700 focus:mv-bg-negative-700 active:mv-bg-negative-800",
    // button primary outline disabled
    isDisabled &&
      variant === "outline" &&
      "mv-bg-neutral-50 mv-border-neutral-300 mv-text-neutral-300",
    // button primary outline
    !isDisabled &&
      variant === "outline" &&
      "mv-bg-neutral-50 mv-border-primary mv-text-primary hover:mv-bg-primary-50 focus:mv-bg-primary-50 active:mv-bg-primary-100",
    // button primary ghost disabled
    isDisabled && variant === "ghost" && "mv-bg-neutral-50 mv-text-neutral-300",
    // button primary ghost
    !isDisabled &&
      variant === "ghost" &&
      "mv-text-primary hover:mv-text-primary-700 hover:mv-bg-neutral-50 focus:mv-text-primary-700 focus:mv-bg-neutral-50 active:mv-bg-neutral-100",

    Array.isArray(otherProps.children) &&
      otherProps.children.length > 1 &&
      "mv-gap-2",
    loading !== undefined && loading !== false && "mv-loading"
  );

  const element = React.createElement(as, {
    ...otherProps,
    className: `${
      otherProps.className !== undefined ? `${otherProps.className} ` : ""
    }${classes}`,
  });

  return element;
}

export { Button };
