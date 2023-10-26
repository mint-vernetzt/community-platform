import React, { type ReactNode } from "react";

export type ControlsProps = {
  children: ReactNode;
};

function Controls(props: ControlsProps) {
  const children = React.Children.toArray(props.children).filter((child) => {
    const isValid = React.isValidElement(child);
    if (!isValid) {
      console.warn(
        `The child you passed to <Controls> is not a valid element and will be ignored: ${child}`
      );
    }
    return isValid;
  });

  return (
    <div
      className={`mv-grid mv-grid-flow-col mv-auto-cols-fr mv-gap-4 mv-w-full`}
    >
      {children}
    </div>
  );
}

export default Controls;
