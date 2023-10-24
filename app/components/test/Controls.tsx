import React, { type ReactNode } from "react";

export type ControlsProps = {
  children: ReactNode;
};

function Controls(props: ControlsProps) {
  const children = React.Children.toArray(props.children).filter((child) => {
    const isValid = React.isValidElement(child) || typeof child === "string";
    if (!isValid) {
      console.warn(
        `The child you passed to <Controls> is not a valid element and will be ignored: ${child}`
      );
    }
    return isValid;
  });

  return <div className="mv-flex mv-gap-4">{children}</div>;
}

export default Controls;
