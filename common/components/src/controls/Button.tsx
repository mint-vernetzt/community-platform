import React from "react";
import classnames from "classnames";

export type ButtonSize = "small" | "medium" | "large";
export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonLevel =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger";

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
    level = "primary",
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
      "bg-primary": variant === "primary" && level === "primary",
      "bg-secondary": variant === "primary" && level === "secondary",
      "bg-success": variant === "primary" && level === "success",
      "bg-warning": variant === "primary" && level === "warning",
      "bg-danger": variant === "primary" && level === "danger",
      "bg-neutral-50":
        variant === "secondary" &&
        (level === "primary" || level === "secondary"),
      "bg-success-100": variant === "secondary" && level === "success",
      "bg-warning-100": variant === "secondary" && level === "warning",
      "bg-danger-100": variant === "secondary" && level === "danger",
      "hover:bg-primary-400":
        (variant === "primary" || variant === "ghost") && level === "primary",
      "hover:bg-secondary-400":
        (variant === "primary" || variant === "ghost") && level === "secondary",
      "hover:bg-success-400":
        (variant === "primary" || variant === "ghost") && level === "success",
      "hover:bg-warning-400":
        (variant === "primary" || variant === "ghost") && level === "warning",
      "hover:bg-danger-400":
        (variant === "primary" || variant === "ghost") && level === "danger",
      "focus:bg-primary-400":
        (variant === "primary" || variant === "ghost") && level === "primary",
      "focus:bg-secondary-400":
        (variant === "primary" || variant === "ghost") && level === "secondary",
      "focus:bg-success-400":
        (variant === "primary" || variant === "ghost") && level === "success",
      "focus:bg-warning-400":
        (variant === "primary" || variant === "ghost") && level === "warning",
      "focus:bg-danger-400":
        (variant === "primary" || variant === "ghost") && level === "danger",
      "active:bg-primary-700":
        (variant === "primary" || variant === "ghost") && level === "primary",
      "active:bg-secondary-700":
        (variant === "primary" || variant === "ghost") && level === "secondary",
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
        (variant === "ghost" || variant === "secondary") && level === "primary",
      "text-secondary":
        (variant === "ghost" || variant === "secondary") &&
        level === "secondary",
      "text-success":
        (variant === "ghost" || variant === "secondary") && level === "success",
      "text-warning":
        (variant === "ghost" || variant === "secondary") && level === "warning",
      "text-danger":
        (variant === "ghost" || variant === "secondary") && level === "danger",
      "hover:text-neutral-50": variant === "ghost",
      "focus:text-neutral-50": variant === "ghost",
      "active:text-neutral-50": variant === "ghost",
      "hover:text-primary-400": variant === "secondary" && level === "primary",
      "hover:text-secondary-400":
        variant === "secondary" && level === "secondary",
      "hover:text-success-400": variant === "secondary" && level === "success",
      "hover:text-warning-400": variant === "secondary" && level === "warning",
      "hover:text-danger-400": variant === "secondary" && level === "danger",
      "focus:text-primary-400": variant === "secondary" && level === "primary",
      "focus:text-secondary-400":
        variant === "secondary" && level === "secondary",
      "focus:text-success-400": variant === "secondary" && level === "success",
      "focus:text-warning-400": variant === "secondary" && level === "warning",
      "focus:text-danger-400": variant === "secondary" && level === "danger",
      "active:text-secondary-700":
        variant === "secondary" && level === "secondary",
      "active:text-success-700": variant === "secondary" && level === "success",
      "active:text-warning-700": variant === "secondary" && level === "warning",
      "active:text-danger-700": variant === "secondary" && level === "danger",
    },
    {
      "border-primary": variant === "secondary" && level === "primary",
      "border-secondary": variant === "secondary" && level === "secondary",
      "border-success": variant === "secondary" && level === "success",
      "border-warning": variant === "secondary" && level === "warning",
      "border-danger": variant === "secondary" && level === "danger",
      "hover:border-primary-400":
        variant === "secondary" && level === "primary",
      "hover:border-secondary-400":
        variant === "secondary" && level === "secondary",
      "hover:border-success-400":
        variant === "secondary" && level === "success",
      "hover:border-warning-400":
        variant === "secondary" && level === "warning",
      "hover:border-danger-400": variant === "secondary" && level === "danger",
      "focus:border-primary-400":
        variant === "secondary" && level === "primary",
      "focus:border-secondary-400":
        variant === "secondary" && level === "secondary",
      "focus:border-success-400":
        variant === "secondary" && level === "success",
      "focus:border-warning-400":
        variant === "secondary" && level === "warning",
      "focus:border-danger-400": variant === "secondary" && level === "danger",
      "active:border-primary-700":
        variant === "secondary" && level === "primary",
      "active:border-secondary-700":
        variant === "secondary" && level === "secondary",
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
