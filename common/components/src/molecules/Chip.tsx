import classNames from "classnames";
import { Children, cloneElement, isValidElement } from "react";

type ChipColor = "primary" | "secondary";

type ChipSize = "small" | "medium";

type ChipProps = {
  children?: React.ReactNode;
  color?: ChipColor;
  size?: ChipSize;
  interactive?: boolean;
  disabled?: boolean;
  responsive?: boolean;
};

function Chip(props: ChipProps) {
  const { color = "primary", size = "small" } = props;

  const disabled =
    typeof props.disabled !== "undefined" && props.disabled !== false;
  const interactive =
    typeof props.interactive !== "undefined" && props.interactive && !disabled;
  const classes = classNames(
    color === "primary" &&
      !disabled &&
      "bg-primary-50 border-primary-50 text-primary-600",
    color === "primary" &&
      interactive &&
      "hover:bg-primary-600 hover:text-white",
    color === "secondary" &&
      !disabled &&
      "bg-secondary-50 border-secondary-50 text-secondary-600",
    color === "secondary" &&
      interactive &&
      "hover:bg-secondary-600 hover:text-white",
    disabled && "bg-white text-gray-300 border-gray-300",
    !disabled && interactive && "cursor-pointer",
    "flex gap-2 items-center",
    "border rounded-lg font-semibold w-fit max-w-full h-fit text-left text-ellipsis whitespace-nowrap overflow-hidden shrink-0",
    props.responsive && "@md:px-4 @md:py-2 @md:text-base",
    size === "small" && "text-xs py-1.5 px-3",
    size === "medium" && "text-base py-2 px-4"
  );
  const children = Children.toArray(props.children);

  const validChildren = children.filter((child) => {
    return (
      typeof child === "string" ||
      (isValidElement(child) && child.type !== ChipDelete)
    );
  });

  const enhancedChildren = validChildren.map((child, index) => {
    if (
      typeof child !== "string" &&
      isValidElement(child) &&
      typeof child.props === "object" &&
      child.props !== null &&
      "children" in child.props &&
      "disabled" in child.props
    ) {
      const clone = cloneElement(
        child,
        {
          // @ts-ignore - We should look at our cloneElement implementation.
          disabled: disabled,
          className: `${"className" in child.props && typeof child.props.className === "string" ? `${child.props.className} ` : ""}line-clamp-1`,
        },

        child.props.children
      );
      return clone;
    }
    return (
      <span
        key={typeof child === "string" ? child : index}
        className="line-clamp-1"
      >
        {child}
      </span>
    );
  });

  const chipDelete = children.find((child) => {
    return isValidElement(child) && child.type === ChipDelete;
  });

  if (
    typeof chipDelete !== "undefined" &&
    isValidElement(chipDelete) &&
    typeof chipDelete.props === "object" &&
    chipDelete.props !== null &&
    "children" in chipDelete.props
  ) {
    const chipDeleteClone = cloneElement(
      chipDelete,
      {
        // @ts-ignore - We should look at our cloneElement implementation.
        responsive: props.responsive,
        interactive: props.interactive,
        color,
        disabled: props.disabled,
      },
      chipDelete.props.children
    );
    return (
      <div className={classes}>
        {enhancedChildren}
        {chipDeleteClone}
      </div>
    );
  }

  return <div className={classes}>{enhancedChildren}</div>;
}

function ChipDelete(
  props: React.PropsWithChildren<{
    responsive?: boolean;
    interactive?: boolean;
    disabled?: boolean;
    color?: ChipColor;
  }>
) {
  const { color = "primary" } = props;

  const element = Children.only(props.children) as React.ReactElement;

  const interactive =
    typeof props.interactive !== "undefined" && props.interactive;
  const disabled = typeof props.disabled !== "undefined" && props.disabled;

  const classes = classNames(
    "rounded-full hover:bg-white -my-2",
    typeof props.responsive !== "undefined" && props.responsive && "@md:my-0",
    !disabled && interactive && color === "primary" && "hover:text-primary-600",
    !disabled &&
      interactive &&
      color === "secondary" &&
      "hover:text-secondary-600",
    disabled && "cursor-default"
  );

  let clone;
  if (typeof element.props === "object" && element.props !== null) {
    clone = cloneElement(
      element,
      // TODO: i18n of title and aria-label
      // @ts-ignore - We should look at our cloneElement implementation.
      { className: classes, disabled, title: "Delete", "aria-label": "Delete" },
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path
          d="M5.80752 5.80752C5.86558 5.74931 5.93454 5.70314 6.01048 5.67163C6.08641 5.64012 6.16781 5.6239 6.25002 5.6239C6.33223 5.6239 6.41363 5.64012 6.48956 5.67163C6.56549 5.70314 6.63446 5.74931 6.69252 5.80752L10 9.11627L13.3075 5.80752C13.3656 5.74941 13.4346 5.70331 13.5105 5.67186C13.5865 5.64042 13.6678 5.62423 13.75 5.62423C13.8322 5.62423 13.9136 5.64042 13.9895 5.67186C14.0654 5.70331 14.1344 5.74941 14.1925 5.80752C14.2506 5.86563 14.2967 5.93461 14.3282 6.01054C14.3596 6.08646 14.3758 6.16784 14.3758 6.25002C14.3758 6.3322 14.3596 6.41357 14.3282 6.4895C14.2967 6.56542 14.2506 6.63441 14.1925 6.69252L10.8838 10L14.1925 13.3075C14.2506 13.3656 14.2967 13.4346 14.3282 13.5105C14.3596 13.5865 14.3758 13.6678 14.3758 13.75C14.3758 13.8322 14.3596 13.9136 14.3282 13.9895C14.2967 14.0654 14.2506 14.1344 14.1925 14.1925C14.1344 14.2506 14.0654 14.2967 13.9895 14.3282C13.9136 14.3596 13.8322 14.3758 13.75 14.3758C13.6678 14.3758 13.5865 14.3596 13.5105 14.3282C13.4346 14.2967 13.3656 14.2506 13.3075 14.1925L10 10.8838L6.69252 14.1925C6.63441 14.2506 6.56542 14.2967 6.4895 14.3282C6.41357 14.3596 6.3322 14.3758 6.25002 14.3758C6.16784 14.3758 6.08646 14.3596 6.01054 14.3282C5.93461 14.2967 5.86563 14.2506 5.80752 14.1925C5.74941 14.1344 5.70331 14.0654 5.67186 13.9895C5.64042 13.9136 5.62423 13.8322 5.62423 13.75C5.62423 13.6678 5.64042 13.5865 5.67186 13.5105C5.70331 13.4346 5.74941 13.3656 5.80752 13.3075L9.11627 10L5.80752 6.69252C5.74931 6.63446 5.70314 6.56549 5.67163 6.48956C5.64012 6.41363 5.6239 6.33223 5.6239 6.25002C5.6239 6.16781 5.64012 6.08641 5.67163 6.01048C5.70314 5.93454 5.74931 5.86558 5.80752 5.80752Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return clone;
}

Chip.Delete = ChipDelete;

type ChipContainerProps = {
  children?: React.ReactNode;
  maxRows?: number;
};

export function ChipContainer(props: ChipContainerProps) {
  const validChildren = Children.toArray(props.children).filter((child) => {
    return isValidElement(child) && child.type === Chip;
  });
  const classes = classNames(
    {
      "h-[72px]": props.maxRows === 2,
      "overflow-hidden": props.maxRows !== undefined,
    },
    "flex flex-wrap gap-2"
  );
  return <div className={classes}>{validChildren}</div>;
}

Chip.Container = ChipContainer;

export { Chip };
