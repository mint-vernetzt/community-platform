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
      "mv-h-[72px]": props.maxRows === 2,
      "mv-overflow-hidden": props.maxRows !== undefined,
    },
    "mv-flex mv-flex-wrap gap-2"
  );
  return <div className={classes}>{validChildren}</div>;
}

export type ChipProps = {
  children?: React.ReactNode;
};

function Chip(props: ChipProps) {
  return (
    <div className="mv-bg-secondary-50 mv-text-secondary-600 mv-text-xs mv-py-1.5 mv-px-3 mv-rounded-lg mv-font-semibold mv-w-fit mv-max-w-full mv-h-fit mv-text-left mv-text-ellipsis mv-overflow-hidden">
      {props.children}
    </div>
  );
}

export default Chip;
