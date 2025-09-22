import classNames from "classnames";
import { Children, isValidElement, type ReactNode } from "react";

type StatusProps = {
  variant?: "primary" | "neutral" | "positive" | "negative";
  inverted?: boolean;
  children: ReactNode;
};

function Status(props: StatusProps) {
  const { variant = "primary", inverted = false } = props;

  const children = Children.toArray(props.children).filter((child) => {
    const isValid = isValidElement(child) || typeof child === "string";
    if (!isValid) {
      console.warn(
        `The child you passed to <Status> is not a valid element and will be ignored: ${child}`
      );
    }
    return isValid;
  });

  const classes = classNames(
    "py-2 px-4 text-center font-semibold leading-5",
    variant === "primary" && inverted && "text-primary bg-primary-100",
    variant === "primary" && !inverted && "text-white bg-primary-300",
    variant === "neutral" && "text-white bg-neutral",
    variant === "positive" && "text-white bg-positive",
    variant === "negative" && "text-white bg-negative"
  );

  return <div className={classes}>{children}</div>;
}

export { Status };
