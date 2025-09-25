import classNames from "classnames";
import { Children, isValidElement } from "react";

type ControlsProps = {
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
    "grid gap-4 w-full",
    direction === "horizontal" && "grid-flow-col auto-cols-fr",
    direction === "vertical" && "grid-flow-row auto-rows-fr"
  );

  return <div className={classes}>{children}</div>;
}

export { Controls };
