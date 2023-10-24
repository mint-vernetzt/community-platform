import classNames from "classnames";
import React from "react";

export type CircleButtonVariant = "normal" | "outline" | "ghost";
export type CircleButtonType = "button" | "a";
export type CircleButtonSize = "small" | "medium" | "large";

export type CircleButtonProps = {
  variant?: CircleButtonVariant;
  size?: CircleButtonSize;
  as?: CircleButtonType;
  floating?: boolean;
};

function CircleButton(
  props: CircleButtonProps &
    (
      | React.ButtonHTMLAttributes<HTMLButtonElement>
      | React.AnchorHTMLAttributes<HTMLAnchorElement>
    )
) {
  const {
    as = "button",
    variant = "normal",
    floating = false,
    size = "medium",
    ...otherProps
  } = props;

  // check if disabled prop is present and true (reason: Button and Anchor props)
  const isDisabled = "disabled" in props && props.disabled;

  const classes = classNames(
    "mv-btn",
    "mv-btn-circle",
    size === "small" && "mv-w-8 mv-h-8 mv-border-1  mv-text-xl",
    size === "medium" && "mv-w-12 mv-h-12 mv-border-1  mv-text-5xl",
    size === "large" && "mv-w-16 mv-h-16 mv-border-2 mv-text-6xl", // TODO: design 54px (7xl is 48px) see: common/design/tailwind.config.js
    "mv-font-normal",
    // button disabled
    isDisabled &&
      variant === "normal" &&
      "mv-bg-neutral-200 mv-text-neutral-400",
    // button
    !isDisabled &&
      variant === "normal" &&
      "mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700",
    // button outline disabled
    isDisabled &&
      variant === "outline" &&
      "mv-bg-neutral-50 mv-border-neutral-300 mv-text-neutral-300",
    // button outline
    !isDisabled &&
      variant === "outline" &&
      "mv-bg-neutral-50 mv-border-primary mv-text-primary hover:mv-bg-primary-50 focus:mv-bg-primary-50 active:mv-bg-primary-100",
    // button ghost disabled
    isDisabled && variant === "ghost" && "mv-bg-neutral-50 mv-text-neutral-300",
    // button ghost
    !isDisabled &&
      variant === "ghost" &&
      "mv-text-primary hover:mv-text-primary-700 hover:mv-bg-neutral-50 focus:mv-text-primary-700 focus:mv-bg-neutral-50 active:mv-bg-neutral-100",
    // floating
    floating && "mv-shadow-lg"
  );

  const element = React.createElement(as, {
    ...otherProps,
    className: classes,
  });

  return element;
}

export default CircleButton;
