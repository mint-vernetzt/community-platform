import classNames from "classnames";
import React from "react";
import { type ReactNode } from "react";

export type StatusProps = {
  variant?: "primary" | "neutral" | "positive" | "negative";
  inverted?: boolean;
  children: ReactNode;
};

function Status(props: StatusProps) {
  const { variant = "primary", inverted = false } = props;

  const children = React.Children.toArray(props.children).filter((child) => {
    const isValid = React.isValidElement(child) || typeof child === "string";
    if (!isValid) {
      console.warn(
        `The child you passed to <Status> is not a valid element and will be ignored: ${child}`
      );
    }
    return isValid;
  });

  // TODO: leading-5 überprüfen
  const classes = classNames(
    "mv-absolute mv-top-0 mv-w-full mv-py-2 mv-px-4 mv-text-center mv-font-semibold mv-leading-5",
    variant === "primary" && inverted && "mv-text-primary mv-bg-primary-100",
    variant === "primary" && !inverted && "mv-text-white mv-bg-primary-300",
    variant === "neutral" && "mv-text-white mv-bg-neutral",
    variant === "positive" && "mv-text-white mv-bg-positive",
    variant === "negative" && "mv-text-white mv-bg-negative"
  );

  return <span className={classes}>{children}</span>;
}

export default Status;
