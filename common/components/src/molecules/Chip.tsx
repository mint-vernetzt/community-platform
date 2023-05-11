import classNames from "classnames";
import React from "react";

export type ChipContainerProps = {
  children?: React.ReactNode;
  maxRows?: number;
};

export function ChipContainer(props: ChipContainerProps) {
  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      return React.isValidElement(child) && child.type === Chip;
    }
  );
  const classes = classNames(
    {
      "h-[72px]": props.maxRows === 2,
      "overflow-hidden": props.maxRows !== undefined,
    },
    "flex flex-wrap gap-2"
  );
  return <div className={classes}>{validChildren}</div>;
}

export type ChipProps = {
  children?: React.ReactNode;
};

function Chip(props: ChipProps) {
  return (
    <div className="bg-secondary-50 text-secondary-600 text-xs py-1.5 px-3 rounded-lg font-semibold w-fit max-w-full h-fit text-left text-ellipsis overflow-hidden">
      {props.children}
    </div>
  );
}

export default Chip;
