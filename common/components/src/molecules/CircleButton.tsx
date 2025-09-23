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
    "rounded-full flex items-center justify-center font-normal",
    size === "x-small" && fullSize === false && "w-6 h-6 border text-md",
    size === "small" && fullSize === false && "w-8 h-8 border text-xl",
    size === "medium" && fullSize === false && "w-12 h-12 border text-5xl",
    size === "large" && fullSize === false && "w-16 h-16 border-2 text-6xl", // TODO: design 54px (7xl is 48px) see: common/design/tailwind.config.js
    fullSize && "w-full h-full",
    // button disabled
    isDisabled && variant === "normal" && "bg-neutral-200 text-neutral-400",
    // button
    !isDisabled &&
      variant === "normal" &&
      "bg-primary text-neutral-50 hover:bg-primary-600 focus:bg-primary-600 active:bg-primary-700",
    // button primary outline disabled
    isDisabled &&
      variant === "outline" &&
      "bg-white border-neutral-300 text-neutral-300",
    // button primary outline
    !isDisabled &&
      variant === "outline" &&
      size !== "large" &&
      "bg-white border-primary text-primary hover:bg-neutral-100 active:bg-neutral-200 focus:ring-1 focus:ring-primary-200 focus:outline-hidden focus:border-primary-200",
    !isDisabled &&
      variant === "outline" &&
      size === "large" &&
      "bg-white border-primary text-primary hover:bg-neutral-100 active:bg-neutral-200 focus:outline-hidden focus:border-primary-200",
    // button ghost disabled
    isDisabled && variant === "ghost" && "bg-neutral-50 text-neutral-300",
    // button ghost
    !isDisabled &&
      variant === "ghost" &&
      "text-primary hover:text-primary-700 hover:bg-neutral-50 focus:text-primary-700 focus:bg-neutral-50 active:bg-neutral-100",
    // floating
    floating && "shadow-lg"
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
