import classNames from "classnames";
import { createElement } from "react";
import { Link, type LinkProps } from "react-router";

type CircleButtonVariant = "normal" | "outline" | "ghost";
type CircleButtonType = "button" | "link" | "a";
type CircleButtonSize = "x-small" | "small" | "medium" | "large";

type CircleButtonProps = {
  variant?: CircleButtonVariant;
  size?: CircleButtonSize;
  as?: CircleButtonType;
  floating?: boolean;
  fullSize?: boolean;
};

function CircleButton(
  props: CircleButtonProps &
    (
      | React.ButtonHTMLAttributes<HTMLButtonElement>
      | React.AnchorHTMLAttributes<HTMLAnchorElement>
      | (LinkProps & React.RefAttributes<HTMLAnchorElement>)
    )
) {
  const {
    as = "button",
    variant = "normal",
    floating = false,
    size = "medium",
    fullSize = false,
    ...otherProps
  } = props;

  // check if disabled prop is present and true (reason: Button and Anchor props)
  const isDisabled = "disabled" in props && props.disabled;

  const classes = classNames(
    "mv-rounded-full mv-flex mv-items-center mv-justify-center mv-font-normal",
    size === "x-small" &&
      fullSize === false &&
      "mv-w-6 mv-h-6 mv-border mv-text-md",
    size === "small" &&
      fullSize === false &&
      "mv-w-8 mv-h-8 mv-border mv-text-xl",
    size === "medium" &&
      fullSize === false &&
      "mv-w-12 mv-h-12 mv-border mv-text-5xl",
    size === "large" &&
      fullSize === false &&
      "mv-w-16 mv-h-16 mv-border-2 mv-text-6xl", // TODO: design 54px (7xl is 48px) see: common/design/tailwind.config.js
    fullSize && "mv-w-full mv-h-full",
    // button disabled
    isDisabled &&
      variant === "normal" &&
      "mv-bg-neutral-200 mv-text-neutral-400",
    // button
    !isDisabled &&
      variant === "normal" &&
      "mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700",
    // button primary outline disabled
    isDisabled &&
      variant === "outline" &&
      "mv-bg-white mv-border-neutral-300 mv-text-neutral-300",
    // button primary outline
    !isDisabled &&
      variant === "outline" &&
      size !== "large" &&
      "mv-bg-white mv-border-primary mv-text-primary hover:mv-bg-neutral-100 active:mv-bg-neutral-200 focus:mv-ring-1 focus:mv-ring-primary-200 focus:mv-outline-none focus:mv-border-primary-200",
    !isDisabled &&
      variant === "outline" &&
      size === "large" &&
      "mv-bg-white mv-border-primary mv-text-primary hover:mv-bg-neutral-100 active:mv-bg-neutral-200 focus:mv-outline-none focus:mv-border-primary-200",
    // button ghost disabled
    isDisabled && variant === "ghost" && "mv-bg-neutral-50 mv-text-neutral-300",
    // button ghost
    !isDisabled &&
      variant === "ghost" &&
      "mv-text-primary hover:mv-text-primary-700 hover:mv-bg-neutral-50 focus:mv-text-primary-700 focus:mv-bg-neutral-50 active:mv-bg-neutral-100",
    // floating
    floating && "mv-shadow-lg"
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
    "disabled" in otherProps
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
    as === "a" &&
    "to" in otherProps === false &&
    "href" in otherProps
  ) {
    return (
      <a
        {...otherProps}
        className={`${
          otherProps.className !== undefined ? `${otherProps.className} ` : ""
        }${classes}`}
      >
        {otherProps.children}
      </a>
    );
  } else {
    return createElement(
      as,
      {
        ...otherProps,
        className: `${
          otherProps.className !== undefined ? `${otherProps.className} ` : ""
        }${classes}`,
      },
      otherProps.children
    );
  }
}

export { CircleButton };
