import classNames from "classnames";
import React from "react";

export type TextButtonVariants = "primary" | "neutral";
export type TextButtonSize = "small" | "medium" | "large";
export type TextButtonWeight = "normal" | "thin";
export type TextButtonType = "button" | "a";

export type TextButtonProps = {
  size?: TextButtonSize;
  variant?: TextButtonVariants;
  weight?: TextButtonWeight;
  as?: TextButtonType;
  arrowLeft?: boolean;
  arrowRight?: boolean;
};

function TextButton(
  props: TextButtonProps &
    (
      | React.ButtonHTMLAttributes<HTMLButtonElement>
      | React.AnchorHTMLAttributes<HTMLAnchorElement>
    )
) {
  const {
    variant = "primary",
    size = "medium",
    weight = "normal",
    as = "button",
    ...otherProps
  } = props;

  const classes = classNames(
    "mv-flex mv-items-center mv-gap-1 hover:mv-underline active:mv-underline mv-underline-offset-4",
    variant === "primary" && "mv-text-primary",
    variant === "neutral" && "mv-text-neutral",
    size === "small" && "mv-text-sm",
    size === "large" && "mv-text-2xl",
    weight === "thin" && "mv-font-thin",
    weight === "normal" && "mv-font-semibold"
  );

  let iconSize = "0.875rem";
  if (size === "small") {
    iconSize = "0.75rem";
  }
  if (size === "large") {
    iconSize = "1.25rem";
  }

  const children = (
    <>
      {props.arrowLeft && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={iconSize}
          height={iconSize}
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
          />
        </svg>
      )}
      {props.children}
      {props.arrowRight && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={iconSize}
          height={iconSize}
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
          />
        </svg>
      )}
    </>
  );

  const element = React.createElement(
    as,
    {
      ...otherProps,
      className: classes,
    },
    children
  );

  return element;
}

export default TextButton;
