import React from "react";
import classnames from "classnames";

type ButtonSize = "small" | "medium" | "large";
type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  size?: ButtonSize;
  loading?: boolean;
  variant?: ButtonVariant;
};

function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonProps
) {
  const { size = "medium", variant = "primary", ...otherProps } = props;

  const classes = classnames(
    "btn",
    "border-2",
    {
      "btn-sm": size === "small",
      "btn-md": size === "medium",
      "btn-lg": size === "large",
    },
    {
      "text-xs": size === "small",
      "text-sm": size === "medium",
      "text-base": size === "large",
    },
    {
      "px-4": size === "small",
      "px-7 py-2": size === "medium",
      "px-10": size === "large",
    },
    {
      "gap-2":
        Array.isArray(otherProps.children) && otherProps.children.length > 1,
    },
    "font-semibold",
    {
      "bg-primary": variant === "primary",
      "bg-neutral-50": variant === "secondary",
      "hover:bg-primary-400": variant === "primary" || variant === "ghost",
      "focus:bg-primary-400": variant === "primary" || variant === "ghost",
      "active:bg-primary-700": variant === "primary" || variant === "ghost",
    },

    {
      "text-neutral-50": variant === "primary",
      "text-primary": variant === "ghost" || variant === "secondary",
      "hover:text-neutral-50": variant === "ghost",
      "focus:text-neutral-50": variant === "ghost",
      "active:text-neutral-50": variant === "ghost",
      "hover:text-primary-400": variant === "secondary",
      "focus:text-primary-400": variant === "secondary",
      "active:text-primary-700": variant === "secondary",
    },
    {
      "border-primary": variant === "secondary",
      "hover:border-primary-400": variant === "secondary",
      "focus:border-primary-400": variant === "secondary",
      "active:border-primary-700": variant === "secondary",
    },
    { loading: otherProps.loading !== undefined },
    "disabled:opacity-50"
  );

  return <button {...otherProps} className={classes} />;
}

export default Button;
