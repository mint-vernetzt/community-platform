import React from "react";
import classnames from "classnames";

// eigene Komponente für Icon-Button mit Varianten für Circle und Square

export type ButtonSize = "small" | "medium" | "large";
export type ButtonVariant = "normal" | "outline" | "ghost";
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
};

function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonProps
) {
  const {
    size = "medium",
    variant = "normal",
    level = "primary",
    ...otherProps
  } = props;

  const classes = classnames(
    "mv-btn",
    "mv-border-[1.5px]",
    "mv-font-semibold",
    // button size
    size === "small" && "mv-btn-sm mv-text-xs mv-px-4",
    size === "medium" && "mv-btn-md mv-text-sm mv-px-7 mv-py-2",
    size === "large" && "mv-btn-lg mv-text-base mv-px-10",
    // button primary disabled
    props.disabled &&
      variant === "normal" &&
      level === "primary" &&
      "mv-bg-neutral-200 mv-text-neutral-400",
    // button negative disabled
    props.disabled &&
      variant === "normal" &&
      level === "negative" &&
      "mv-bg-negative-300 mv-text-white",
    // button primary
    !props.disabled &&
      variant === "normal" &&
      level === "primary" &&
      "mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700",
    // button negative
    !props.disabled &&
      variant === "normal" &&
      level === "negative" &&
      "mv-bg-negative-600 mv-text-white hover:mv-bg-negative-700 focus:mv-bg-negative-700 active:mv-bg-negative-800",
    // button primary outline disabled
    props.disabled &&
      variant === "outline" &&
      "mv-bg-neutral-50 mv-border-neutral-300 mv-text-neutral-300",
    // button primary outline
    !props.disabled &&
      variant === "outline" &&
      "mv-bg-neutral-50 mv-border-primary mv-text-primary hover:mv-bg-primary-50 focus:mv-bg-primary-50 active:mv-bg-primary-100",
    // button primary ghost disabled
    props.disabled &&
      variant === "ghost" &&
      "mv-bg-neutral-50 mv-text-neutral-300",
    // button primary ghost
    !props.disabled &&
      variant === "ghost" &&
      "mv-text-primary hover:mv-text-primary-700 hover:mv-bg-neutral-50 focus:mv-text-primary-700 focus:mv-bg-neutral-50 active:mv-bg-neutral-100",

    Array.isArray(otherProps.children) &&
      otherProps.children.length > 1 &&
      "mv-gap-2",
    otherProps.loading !== undefined &&
      otherProps.loading !== false &&
      "mv-loading"
  );

  return <button {...otherProps} className={classes} />;
}

export default Button;
