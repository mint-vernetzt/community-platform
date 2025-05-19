import classNames from "classnames";
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from "react";

type DropdownLabelType = React.DetailedReactHTMLElement<
  DropdownLabelProps,
  HTMLLabelElement
>;
type DropdownLabelProps = React.PropsWithChildren & {
  listRef?: React.RefObject<HTMLDivElement | null>;
};

function DropdownLabel(
  props: React.PropsWithChildren & { listRef?: React.RefObject<HTMLDivElement> }
) {
  const [checked, setChecked] = useState(false);
  const ref = useRef<HTMLLabelElement>(null);

  const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    event.stopPropagation();
    setChecked(!checked);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        ref.current !== null &&
        ref.current.contains(target) === false &&
        typeof props.listRef !== "undefined" &&
        props.listRef.current !== null &&
        props.listRef.current.contains(target) === false
      ) {
        setChecked(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [props.listRef]);

  return (
    <label
      ref={ref}
      className="mv-peer mv-group mv-w-full @lg:mv-w-fit @lg:mv-min-w-content mv-inline-flex @lg:mv-flex mv-justify-between mv-items-center mv-gap-1 mv-cursor-pointer mv-p-6 @lg:mv-px-4 @lg:mv-py-2.5 @lg:mv-rounded-lg @lg:mv-border @lg:mv-border-gray-100 mv-font-semibold mv-text-gray-700 hover:mv-bg-gray-100 group-has-[:focus-within]/dropdown:mv-bg-gray-100 mv-transition mv-bg-white"
    >
      <span>{props.children}</span>
      <input
        type="checkbox"
        className="mv-h-0 mv-w-0 mv-opacity-0"
        checked={checked}
        onChange={handleChange}
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="mv-rotate-90 group-has-[:checked]:-mv-rotate-90 mv-shrink-0"
      >
        <path
          fill="currentColor"
          fillRule="nonzero"
          d="M6.147 15.854a.5.5 0 0 1 0-.708L11.794 9.5 6.147 3.855a.5.5 0 1 1 .708-.708l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708 0v-.001Z"
        ></path>
      </svg>
    </label>
  );
}

function DropDownListLegend(props: React.PropsWithChildren) {
  return (
    <legend className="mv-mt-2 mv-mx-4 mv-text-neutral-700 mv-text-sm mv-font-semibold">
      {props.children}
    </legend>
  );
}

function DropdownListDivider() {
  return <hr className="mv-mx-4 mv-my-2 mv-border-t mv-border-gray-200" />;
}

function DropdownListCategory(props: React.PropsWithChildren) {
  return (
    <p className="mv-mx-4 mv-my-2 mv-uppercase mv-whitespace-normal">
      {props.children}
    </p>
  );
}

type DropdownListType = React.DetailedReactHTMLElement<
  DropdownListProps,
  HTMLElement
>;
type DropdownListProps = React.HTMLProps<HTMLDivElement> &
  React.PropsWithChildren & { orientation?: "left" | "right" };

const DropdownList = forwardRef<
  HTMLDivElement,
  React.PropsWithChildren & { orientation?: "left" | "right" }
>((props, ref) => {
  const orientation = props.orientation || "left";

  const classes = classNames(
    "@lg:mv-w-72 @lg:mv-h-fit @lg:mv-max-h-72 mv-overflow-auto @lg:mv-absolute @lg:mv-top-[calc(100%+0.5rem)] mv-py-2 @lg:mv-rounded-lg @lg:mv-shadow-xl mv-hidden peer-has-[:checked]:mv-block peer-has-[:checked]:mv-z-10 mv-bg-white",
    orientation === "left" && "mv-left-0",
    orientation === "right" && "mv-right-0"
  );

  return (
    <div ref={ref} className={classes}>
      <ul>
        {Children.map(props.children, (child) => {
          const classes = classNames(
            isValidElement(child) &&
              child.type !== DropdownListDivider &&
              child.type !== DropDownListLegend &&
              child.type !== DropdownListCategory &&
              child.type !== "div" &&
              child.type !== "p" &&
              "hover:mv-bg-gray-100 focus-within:mv-bg-gray-100"
          );

          return <li className={classes}>{child}</li>;
        })}
      </ul>
    </div>
  );
});

export function Dropdown(
  props: React.PropsWithChildren & {
    orientation?: "left" | "right";
    className?: string;
  }
) {
  const orientation = props.orientation || "left";
  const children = Children.toArray(props.children);

  const list = children.find((child) => {
    return isValidElement(child) && child.type === DropdownList;
  });
  const listRef = useRef<HTMLDivElement | null>(null);
  const listClone =
    typeof list !== "undefined" && typeof list !== "string"
      ? cloneElement<DropdownListProps>(list as DropdownListType, {
          ref: listRef,
          orientation,
        })
      : null;

  const label = children.find((child) => {
    return isValidElement(child) && child.type === DropdownLabel;
  });
  const labelClone =
    typeof label !== "undefined"
      ? cloneElement<DropdownLabelProps>(label as DropdownLabelType, {
          listRef,
        })
      : null;

  const classes = classNames(
    props.className,
    "mv-relative mv-group/dropdown mv-w-full @lg:mv-w-fit @lg:mv-whitespace-nowrap"
  );

  return (
    <div className={classes}>
      {labelClone}
      {listClone}
      <hr className="@lg:mv-hidden mv-border-b mv-border-gray-200" />
    </div>
  );
}

Dropdown.Label = DropdownLabel;
DropdownList.displayName = "DropdownList";
Dropdown.List = DropdownList;
Dropdown.Divider = DropdownListDivider;
Dropdown.Legend = DropDownListLegend;
Dropdown.Category = DropdownListCategory;
