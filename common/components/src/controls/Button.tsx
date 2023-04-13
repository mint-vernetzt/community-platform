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
  const { size = "medium", variant: type = "primary", ...otherProps } = props;

  const classes = classnames(
    "btn",
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
    { "bg-primary": type === "primary" },
    "hover:bg-primary-400",
    "active:bg-primary-700",
    {
      "text-neutral-50": type === "primary",
      "text-primary": type === "ghost",
      "hover:text-neutral-50": type === "ghost",
      "active:text-neutral-50": type === "ghost",
    },
    { loading: otherProps.loading !== undefined },
    "disabled:opacity-50"
  );

  return <button {...otherProps} className={classes} />;
}

export default Button;
