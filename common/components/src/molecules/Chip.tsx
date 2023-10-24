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
  interactive?: boolean;
  removable?: boolean;
  disabled?: boolean;
  responsive?: boolean;
};

function Cross() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="9"
      height="10"
      viewBox="0 0 9 10"
      fill="none"
    >
      <path
        d="M0.183617 0.80764C0.241674 0.749436 0.310643 0.703258 0.386575 0.671749C0.462506 0.640241 0.543908 0.624023 0.626117 0.624023C0.708326 0.624023 0.789728 0.640241 0.865659 0.671749C0.941591 0.703258 1.01056 0.749436 1.06862 0.80764L4.37612 4.11639L7.68362 0.80764C7.74173 0.74953 7.81071 0.703435 7.88664 0.671986C7.96256 0.640537 8.04394 0.624351 8.12612 0.624351C8.2083 0.624351 8.28967 0.640537 8.3656 0.671986C8.44152 0.703435 8.51051 0.74953 8.56862 0.80764C8.62673 0.86575 8.67282 0.934737 8.70427 1.01066C8.73572 1.08659 8.75191 1.16796 8.75191 1.25014C8.75191 1.33232 8.73572 1.4137 8.70427 1.48962C8.67282 1.56554 8.62673 1.63453 8.56862 1.69264L5.25987 5.00014L8.56862 8.30764C8.62673 8.36575 8.67282 8.43474 8.70427 8.51066C8.73572 8.58659 8.75191 8.66796 8.75191 8.75014C8.75191 8.83232 8.73572 8.9137 8.70427 8.98962C8.67282 9.06554 8.62673 9.13453 8.56862 9.19264C8.51051 9.25075 8.44152 9.29685 8.3656 9.32829C8.28967 9.35974 8.2083 9.37593 8.12612 9.37593C8.04394 9.37593 7.96256 9.35974 7.88664 9.32829C7.81071 9.29685 7.74173 9.25075 7.68362 9.19264L4.37612 5.88389L1.06862 9.19264C1.01051 9.25075 0.941521 9.29685 0.865597 9.32829C0.789672 9.35974 0.708297 9.37593 0.626117 9.37593C0.543937 9.37593 0.462562 9.35974 0.386637 9.32829C0.310713 9.29685 0.241727 9.25075 0.183617 9.19264C0.125507 9.13453 0.0794115 9.06554 0.0479627 8.98962C0.0165138 8.9137 0.000327229 8.83232 0.000327229 8.75014C0.000327229 8.66796 0.0165138 8.58659 0.0479627 8.51066C0.0794115 8.43474 0.125507 8.36575 0.183617 8.30764L3.49237 5.00014L0.183617 1.69264C0.125413 1.63458 0.0792341 1.56561 0.047726 1.48968C0.016218 1.41375 0 1.33235 0 1.25014C0 1.16793 0.016218 1.08653 0.047726 1.0106C0.0792341 0.934667 0.125413 0.865697 0.183617 0.80764Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Chip(props: ChipProps) {
  const { color = "primary" } = props;

  const disabled =
    typeof props.disabled !== "undefined" && props.disabled !== false;
  const interactive =
    ((typeof props.interactive !== "undefined" && props.interactive) ||
      (typeof props.removable !== "undefined" && props.removable)) &&
    !disabled;
  const classes = classNames(
    color === "primary" &&
      !disabled &&
      "mv-bg-primary-50 mv-border-primary-50 mv-text-primary-600",
    color === "primary" &&
      interactive &&
      "hover:mv-bg-primary-600 hover:mv-text-white",
    color === "secondary" &&
      !disabled &&
      "mv-bg-secondary-50 mv-border-secondary-50 mv-text-secondary-600",
    color === "secondary" &&
      interactive &&
      "hover:mv-bg-secondary-600 hover:mv-text-white",
    disabled && "mv-bg-white mv-text-gray-300 mv-border-gray-300",
    interactive && "mv-cursor-pointer",
    props.removable && "mv-flex mv-gap-2 mv-items-center",
    "mv-text-xs mv-py-1.5 mv-px-3 mv-border mv-rounded-lg mv-font-semibold mv-w-fit mv-max-w-full mv-h-fit mv-text-left mv-text-ellipsis mv-whitespace-nowrap mv-overflow-hidden",
    props.responsive && "md:mv-px-4 md:mv-py-2 md:mv-text-sm"
  );

  if (typeof props.children === "string") {
    return (
      <div className={classes}>
        {props.children}
        {props.removable && <Cross />}
      </div>
    );
  }

  const element = React.Children.only(props.children);
  if (React.isValidElement(element)) {
    const elementChildren = React.Children.toArray(element.props.children);
    if (typeof props.removable !== "undefined" && props.removable) {
      elementChildren.push(<Cross />);
    }
    const clone = React.cloneElement(
      element as React.ReactElement,
      {
        className: classes,
      },
      elementChildren
    );
    return clone;
  }

  return null;
}

export default Chip;
