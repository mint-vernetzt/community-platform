import classNames from "classnames";
import React from "react";

export type ChipColor = "primary" | "secondary";

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
    "mv-flex mv-flex-wrap mv-gap-2"
  );
  return <div className={classes}>{validChildren}</div>;
}

export type ChipProps = {
  children?: React.ReactNode;
  color?: ChipColor;
};

function Chip(props: ChipProps) {
  const { color = "primary" } = props;

  const classes = classNames(
    {
      "mv-bg-primary-50 mv-text-primary-600": color === "primary",
      "mv-bg-secondary-50 mv-text-secondary-600": color === "secondary",
    },
    "mv-text-xs mv-py-1.5 mv-px-3 mv-rounded-lg mv-font-semibold mv-w-fit mv-max-w-full mv-h-fit mv-text-left mv-text-ellipsis mv-whitespace-nowrap mv-overflow-hidden"
  );

  return <div className={classes}>{props.children}</div>;
}

export default Chip;
