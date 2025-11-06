import { Children, isValidElement } from "react";
import ChipMedium from "./ChipMedium";
import classNames from "classnames";

// Design:
// Name: TODO: No name and component available yet
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10308-7341&m=dev
type ChipContainerProps = {
  children?: React.ReactNode;
  maxRows?: number;
};

export function ChipContainer(props: ChipContainerProps) {
  const { children, maxRows } = props;
  const validChildren = Children.toArray(children).filter((child) => {
    return isValidElement(child) && child.type === ChipMedium;
  });
  const classes = classNames(
    {
      "h-[72px]": maxRows === 2,
      "overflow-hidden": maxRows !== undefined,
    },
    "flex flex-wrap gap-2"
  );
  return <ul className={classes}>{validChildren}</ul>;
}
