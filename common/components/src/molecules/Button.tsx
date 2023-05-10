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
    "mv-btn",
    "mv-border-2",
    {
      "mv-btn-sm": size === "small",
      "mv-btn-md": size === "medium",
      "mv-btn-lg": size === "large",
    },
    {
      "mv-text-xs": size === "small",
      "mv-text-sm": size === "medium",
      "mv-text-base": size === "large",
    },
    {
      "mv-px-4": size === "small",
      "mv-px-7 mv-py-2": size === "medium",
      "mv-px-10": size === "large",
    },
    {
      "mv-gap-2":
        Array.isArray(otherProps.children) && otherProps.children.length > 1,
    },
    "mv-font-semibold",
    {
      "mv-bg-primary": variant === "primary" && level === "primary",
      "mv-bg-secondary": variant === "primary" && level === "secondary",
      "mv-bg-success": variant === "primary" && level === "success",
      "mv-bg-warning": variant === "primary" && level === "warning",
      "mv-bg-danger": variant === "primary" && level === "danger",
      "mv-bg-neutral-50":
        variant === "secondary" &&
        (level === "primary" || level === "secondary"),
      "mv-bg-success-100": variant === "secondary" && level === "success",
      "mv-bg-warning-100": variant === "secondary" && level === "warning",
      "mv-bg-danger-100": variant === "secondary" && level === "danger",
      "hover:mv-bg-primary-400":
        (variant === "primary" || variant === "ghost") && level === "primary",
      "hover:mv-bg-secondary-400":
        (variant === "primary" || variant === "ghost") && level === "secondary",
      "hover:mv-bg-success-400":
        (variant === "primary" || variant === "ghost") && level === "success",
      "hover:mv-bg-warning-400":
        (variant === "primary" || variant === "ghost") && level === "warning",
      "hover:mv-bg-danger-400":
        (variant === "primary" || variant === "ghost") && level === "danger",
      "focus:mv-bg-primary-400":
        (variant === "primary" || variant === "ghost") && level === "primary",
      "focus:mv-bg-secondary-400":
        (variant === "primary" || variant === "ghost") && level === "secondary",
      "focus:mv-bg-success-400":
        (variant === "primary" || variant === "ghost") && level === "success",
      "focus:mv-bg-warning-400":
        (variant === "primary" || variant === "ghost") && level === "warning",
      "focus:mv-bg-danger-400":
        (variant === "primary" || variant === "ghost") && level === "danger",
      "active:mv-bg-primary-700":
        (variant === "primary" || variant === "ghost") && level === "primary",
      "active:mv-bg-secondary-700":
        (variant === "primary" || variant === "ghost") && level === "secondary",
      "active:mv-bg-success-700":
        (variant === "primary" || variant === "ghost") && level === "success",
      "active:mv-bg-warning-700":
        (variant === "primary" || variant === "ghost") && level === "warning",
      "active:mv-bg-danger-700":
        (variant === "primary" || variant === "ghost") && level === "danger",
    },

    {
      "mv-text-neutral-50": variant === "primary",
      "mv-text-primary":
        (variant === "ghost" || variant === "secondary") && level === "primary",
      "mv-text-secondary":
        (variant === "ghost" || variant === "secondary") &&
        level === "secondary",
      "mv-text-success":
        (variant === "ghost" || variant === "secondary") && level === "success",
      "mv-text-warning":
        (variant === "ghost" || variant === "secondary") && level === "warning",
      "mv-text-danger":
        (variant === "ghost" || variant === "secondary") && level === "danger",
      "hover:mv-text-neutral-50": variant === "ghost",
      "focus:mv-text-neutral-50": variant === "ghost",
      "active:mv-text-neutral-50": variant === "ghost",
      "hover:mv-text-primary-400":
        variant === "secondary" && level === "primary",
      "hover:mv-text-secondary-400":
        variant === "secondary" && level === "secondary",
      "hover:mv-text-success-400":
        variant === "secondary" && level === "success",
      "hover:mv-text-warning-400":
        variant === "secondary" && level === "warning",
      "hover:mv-text-danger-400": variant === "secondary" && level === "danger",
      "focus:mv-text-primary-400":
        variant === "secondary" && level === "primary",
      "focus:mv-text-secondary-400":
        variant === "secondary" && level === "secondary",
      "focus:mv-text-success-400":
        variant === "secondary" && level === "success",
      "focus:mv-text-warning-400":
        variant === "secondary" && level === "warning",
      "focus:mv-text-danger-400": variant === "secondary" && level === "danger",
      "active:mv-text-secondary-700":
        variant === "secondary" && level === "secondary",
      "active:mv-text-success-700":
        variant === "secondary" && level === "success",
      "active:mv-text-warning-700":
        variant === "secondary" && level === "warning",
      "active:mv-text-danger-700":
        variant === "secondary" && level === "danger",
    },
    {
      "mv-border-primary": variant === "secondary" && level === "primary",
      "mv-border-secondary": variant === "secondary" && level === "secondary",
      "mv-border-success": variant === "secondary" && level === "success",
      "mv-border-warning": variant === "secondary" && level === "warning",
      "mv-border-danger": variant === "secondary" && level === "danger",
      "hover:mv-border-primary-400":
        variant === "secondary" && level === "primary",
      "hover:mv-border-secondary-400":
        variant === "secondary" && level === "secondary",
      "hover:mv-border-success-400":
        variant === "secondary" && level === "success",
      "hover:mv-border-warning-400":
        variant === "secondary" && level === "warning",
      "hover:mv-border-danger-400":
        variant === "secondary" && level === "danger",
      "focus:mv-border-primary-400":
        variant === "secondary" && level === "primary",
      "focus:mv-border-secondary-400":
        variant === "secondary" && level === "secondary",
      "focus:mv-border-success-400":
        variant === "secondary" && level === "success",
      "focus:mv-border-warning-400":
        variant === "secondary" && level === "warning",
      "focus:mv-border-danger-400":
        variant === "secondary" && level === "danger",
      "active:mv-border-primary-700":
        variant === "secondary" && level === "primary",
      "active:mv-border-secondary-700":
        variant === "secondary" && level === "secondary",
      "active:mv-border-success-700":
        variant === "secondary" && level === "success",
      "active:mv-border-warning-700":
        variant === "secondary" && level === "warning",
      "active:mv-border-danger-700":
        variant === "secondary" && level === "danger",
    },
    {
      loading: otherProps.loading !== undefined && otherProps.loading !== false,
    },
    "disabled:mv-opacity-50"
  );

  return <button {...otherProps} className={classes} />;
}

export default Button;
