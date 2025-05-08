import classNames from "classnames";
import { Children, isValidElement } from "react";

export type ControlsProps = {
  direction?: "horizontal" | "vertical";
  children: React.ReactNode;
};

function Controls(props: ControlsProps) {
  const { direction = "horizontal" } = props;
  const children = Children.toArray(props.children).filter((child) => {
    const isValid = isValidElement(child);
    if (!isValid) {
      console.warn(
        `The child you passed to <Controls> is not a valid element and will be ignored: ${child}`
      );
    }
    return isValid;
  });

  const classes = classNames(
    "mv-grid mv-gap-4 mv-w-full",
    direction === "horizontal" && "mv-grid-flow-col mv-auto-cols-fr",
    direction === "vertical" && "mv-grid-flow-row mv-auto-rows-fr"
  );

  return <div className={classes}>{children}</div>;
}

export { Controls };
