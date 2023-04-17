import React from "react";
import classnames from "classnames";

export type ButtonSize = "small" | "medium" | "large";
export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonLevel = "normal" | "success" | "warning" | "danger";

export type ButtonProps = {
  size?: ButtonSize;
  loading?: boolean;
  variant?: ButtonVariant;
  level?: ButtonLevel;
};

function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonProps
) {
  const {
    size = "medium",
    variant = "primary",
    level = "normal",
    ...otherProps
  } = props;

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
      "bg-primary": variant === "primary" && level === "normal",
      "bg-success": variant === "primary" && level === "success",
      "bg-warning": variant === "primary" && level === "warning",
      "bg-danger": variant === "primary" && level === "danger",
      "bg-neutral-50": variant === "secondary" && level === "normal",
      "bg-success-100": variant === "secondary" && level === "success",
      "bg-warning-100": variant === "secondary" && level === "warning",
      "bg-danger-100": variant === "secondary" && level === "danger",
      "hover:bg-primary-400":
        (variant === "primary" || variant === "ghost") && level === "normal",
      "hover:bg-success-400":
        (variant === "primary" || variant === "ghost") && level === "success",
      "hover:bg-warning-400":
        (variant === "primary" || variant === "ghost") && level === "warning",
      "hover:bg-danger-400":
        (variant === "primary" || variant === "ghost") && level === "danger",
      "focus:bg-primary-400":
        (variant === "primary" || variant === "ghost") && level === "normal",
      "focus:bg-success-400":
        (variant === "primary" || variant === "ghost") && level === "success",
      "focus:bg-warning-400":
        (variant === "primary" || variant === "ghost") && level === "warning",
      "focus:bg-danger-400":
        (variant === "primary" || variant === "ghost") && level === "danger",
      "active:bg-primary-700":
        (variant === "primary" || variant === "ghost") && level === "normal",
      "active:bg-success-700":
        (variant === "primary" || variant === "ghost") && level === "success",
      "active:bg-warning-700":
        (variant === "primary" || variant === "ghost") && level === "warning",
      "active:bg-danger-700":
        (variant === "primary" || variant === "ghost") && level === "danger",
    },

    {
      "text-neutral-50": variant === "primary",
      "text-primary":
        (variant === "ghost" || variant === "secondary") && level === "normal",
      "text-success":
        (variant === "ghost" || variant === "secondary") && level === "success",
      "text-warning":
        (variant === "ghost" || variant === "secondary") && level === "warning",
      "text-danger":
        (variant === "ghost" || variant === "secondary") && level === "danger",
      "hover:text-neutral-50": variant === "ghost",
      "focus:text-neutral-50": variant === "ghost",
      "active:text-neutral-50": variant === "ghost",
      "hover:text-primary-400": variant === "secondary" && level === "normal",
      "hover:text-success-400": variant === "secondary" && level === "success",
      "hover:text-warning-400": variant === "secondary" && level === "warning",
      "hover:text-danger-400": variant === "secondary" && level === "danger",
      "focus:text-primary-400": variant === "secondary" && level === "normal",
      "focus:text-success-400": variant === "secondary" && level === "success",
      "focus:text-warning-400": variant === "secondary" && level === "warning",
      "focus:text-danger-400": variant === "secondary" && level === "danger",
      "active:text-primary-700": variant === "secondary" && level === "normal",
      "active:text-success-700": variant === "secondary" && level === "success",
      "active:text-warning-700": variant === "secondary" && level === "warning",
      "active:text-danger-700": variant === "secondary" && level === "danger",
    },
    {
      "border-primary": variant === "secondary" && level === "normal",
      "border-success": variant === "secondary" && level === "success",
      "border-warning": variant === "secondary" && level === "warning",
      "border-danger": variant === "secondary" && level === "danger",
      "hover:border-primary-400": variant === "secondary" && level === "normal",
      "hover:border-success-400":
        variant === "secondary" && level === "success",
      "hover:border-warning-400":
        variant === "secondary" && level === "warning",
      "hover:border-danger-400": variant === "secondary" && level === "danger",
      "focus:border-primary-400": variant === "secondary" && level === "normal",
      "focus:border-success-400":
        variant === "secondary" && level === "success",
      "focus:border-warning-400":
        variant === "secondary" && level === "warning",
      "focus:border-danger-400": variant === "secondary" && level === "danger",
      "active:border-primary-700":
        variant === "secondary" && level === "normal",
      "active:border-success-700":
        variant === "secondary" && level === "success",
      "active:border-warning-700":
        variant === "secondary" && level === "warning",
      "active:border-danger-700": variant === "secondary" && level === "danger",
    },
    {
      loading: otherProps.loading !== undefined && otherProps.loading !== false,
    },
    "disabled:opacity-50"
  );

  return <button {...otherProps} className={classes} />;
}

export default Button;
