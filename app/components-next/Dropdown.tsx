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
  responsive?: boolean;
};

function DropdownLabel(
  props: React.PropsWithChildren & {
    listRef?: React.RefObject<HTMLDivElement>;
    responsive?: boolean;
  }
) {
  const { responsive = true } = props;

  const [checked, setChecked] = useState(false);
  const ref = useRef<HTMLLabelElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [props.listRef]);

  const classes = classNames(
    "peer group justify-between items-center gap-1 cursor-pointer font-semibold text-gray-700 hover:bg-gray-100 group-has-focus-within/dropdown:ring-2 group-has-focus-within/dropdown:ring-primary-200 transition bg-white",
    responsive
      ? "w-full @lg:w-fit @lg:min-w-content inline-flex @lg:flex p-6 @lg:px-4 @lg:py-2.5 @lg:rounded-lg @lg:border @lg:border-gray-300"
      : "w-fit min-w-content flex px-4 py-2.5 rounded-lg border border-gray-300"
  );

  return (
    <label ref={ref} className={classes}>
      <span>{props.children}</span>
      <input
        form="none"
        type="checkbox"
        className="h-0 w-0 opacity-0"
        checked={checked}
        onChange={handleChange}
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="rotate-90 group-has-checked:-rotate-90 shrink-0"
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
    <legend className="mt-2 mx-4 text-neutral-700 text-sm font-semibold">
      {props.children}
    </legend>
  );
}

function DropdownListDivider() {
  return <hr className="mx-4 my-2 border-t border-gray-200" />;
}

function DropdownListCategory(props: React.PropsWithChildren) {
  return (
    <p className="mx-4 my-2 uppercase whitespace-normal">{props.children}</p>
  );
}

type DropdownListType = React.DetailedReactHTMLElement<
  DropdownListProps,
  HTMLElement
>;
type DropdownListProps = React.HTMLProps<HTMLDivElement> &
  React.PropsWithChildren & {
    orientation?: "left" | "right";
    responsive?: boolean;
  };

const DropdownList = forwardRef<
  HTMLDivElement,
  React.PropsWithChildren & {
    orientation?: "left" | "right";
    responsive?: boolean;
  }
>((props, ref) => {
  const { orientation = "left", responsive = true } = props;

  const classes = classNames(
    "overflow-auto hidden peer-has-checked:block peer-has-checked:z-10 bg-white py-2",
    responsive
      ? "@lg:w-72 @lg:h-fit @lg:max-h-72 lg:absolute @lg:top-[calc(100%+0.5rem)] @lg:rounded-lg @lg:shadow-xl"
      : "w-72 h-fit max-h-72 absolute top-[calc(100%+0.5rem)] rounded-lg shadow-xl",
    orientation === "left" && "left-0",
    orientation === "right" && "right-0"
  );

  return (
    <div ref={ref} className={classes}>
      <ul>
        {Children.map(props.children, (child) => {
          const isEnabled =
            isValidElement(child) &&
            "props" in child &&
            typeof child.props === "object" &&
            child.props !== null &&
            (("disabled" in child.props && child.props.disabled !== true) ||
              ("type" in child.props &&
                child.props.type === "radio" &&
                "defaultChecked" in child.props &&
                child.props.defaultChecked !== true));

          const classes = classNames(
            isValidElement(child) &&
              child.type !== DropdownListDivider &&
              child.type !== DropDownListLegend &&
              child.type !== DropdownListCategory &&
              child.type !== "div" &&
              child.type !== "p" &&
              isEnabled &&
              "bg-white hover:bg-gray-100"
          );

          return (
            <li className={classes}>
              <div
                className={
                  isValidElement(child) && child.type !== "div"
                    ? "focus-within:ring-2 focus-within:ring-primary-200 m-0.5"
                    : "m-0.5"
                }
              >
                {child}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});

export function Dropdown(
  props: React.PropsWithChildren & {
    orientation?: "left" | "right";
    className?: string;
    responsive?: boolean;
  }
) {
  const { orientation = "left", responsive = true } = props;

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
          responsive,
        })
      : null;

  const label = children.find((child) => {
    return isValidElement(child) && child.type === DropdownLabel;
  });
  const labelClone =
    typeof label !== "undefined"
      ? cloneElement<DropdownLabelProps>(label as DropdownLabelType, {
          listRef,
          responsive,
        })
      : null;

  const classes = classNames(
    props.className,
    "relative group/dropdown",
    responsive
      ? "w-full @lg:w-fit @lg:whitespace-nowrap"
      : "w-fit whitespace-nowrap"
  );

  return (
    <div className={classes}>
      {labelClone}
      {listClone}
      {responsive && <hr className="@lg:hidden border-b border-gray-200" />}
    </div>
  );
}

Dropdown.Label = DropdownLabel;
DropdownList.displayName = "DropdownList";
Dropdown.List = DropdownList;
Dropdown.Divider = DropdownListDivider;
Dropdown.Legend = DropDownListLegend;
Dropdown.Category = DropdownListCategory;
