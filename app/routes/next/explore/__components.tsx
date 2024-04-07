import classNames from "classnames";
import React, { InputHTMLAttributes } from "react";

function Checkbox(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <>
      <input
        {...props}
        type="checkbox"
        className="mv-h-0 mv-w-0 mv-opacity-0"
      />
      <div className="mv-w-5 mv-h-5 mv-relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          viewBox="0 0 20 20"
          className="mv-block group-has-[:checked]:mv-hidden"
        >
          <path
            fill="currentColor"
            d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
          />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          viewBox="0 0 20 20"
          className="mv-hidden group-has-[:checked]:mv-block"
        >
          <path
            fill="currentColor"
            d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
          />
          <path
            fill="currentColor"
            d="M13.712 6.212a.937.937 0 0 1 1.34 1.312l-4.991 6.238a.938.938 0 0 1-1.349.026L5.404 10.48A.938.938 0 0 1 6.73 9.154l2.617 2.617 4.34-5.53a.3.3 0 0 1 .025-.029Z"
          />
        </svg>
      </div>
    </>
  );
}

function Radio(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <>
      <input
        {...props}
        type="radio"
        className="mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
      />
      <div className="mv-w-5 mv-h-5 mv-relative">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mv-block group-has-[:checked]:mv-hidden"
        >
          <rect
            x="0.6"
            y="0.6"
            width="18.8"
            height="18.8"
            rx="9.4"
            fill="white"
          />
          <rect
            x="0.6"
            y="0.6"
            width="18.8"
            height="18.8"
            rx="9.4"
            stroke="#3C4658"
            strokeWidth="1.2"
          />
        </svg>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mv-hidden group-has-[:checked]:mv-block"
        >
          <rect
            x="0.6"
            y="0.6"
            width="18.8"
            height="18.8"
            rx="9.4"
            fill="white"
          />
          <rect
            x="0.6"
            y="0.6"
            width="18.8"
            height="18.8"
            rx="9.4"
            stroke="#3C4658"
            strokeWidth="1.2"
          />
          <rect
            x="3.5"
            y="3.5"
            width="13"
            height="13"
            rx="6.5"
            fill="#3C4658"
          />
          <rect
            x="3.5"
            y="3.5"
            width="13"
            height="13"
            rx="6.5"
            stroke="#3C4658"
          />
        </svg>
      </div>
    </>
  );
}

export function FormControlLabel(props: React.PropsWithChildren) {
  return <>{props.children}</>;
}

export function FormControlCounter(props: React.PropsWithChildren) {
  return <span className="mv-ml-auto">{props.children}</span>;
}

export function FormControl(
  props: React.InputHTMLAttributes<HTMLInputElement> & React.PropsWithChildren
) {
  const { children, ...otherProps } = props;

  const childrenArray = React.Children.toArray(props.children);

  const label = childrenArray.find((child) => {
    return React.isValidElement(child) && child.type === FormControlLabel;
  });

  const counter = childrenArray.find((child) => {
    return React.isValidElement(child) && child.type === FormControlCounter;
  });

  return (
    <label className="mv-group mv-px-4 mv-flex mv-py-2.5 mv-justify-between mv-items-center mv-cursor-pointer mv-gap-1 mv-transition">
      {label}
      {counter}
      {props.type === "checkbox" && <Checkbox {...otherProps} />}
      {props.type === "radio" && <Radio {...otherProps} />}
    </label>
  );
}

FormControl.Label = FormControlLabel;
FormControl.Counter = FormControlCounter;

export function DropdownLabel(
  props: React.PropsWithChildren & { listRef?: React.RefObject<HTMLDivElement> }
) {
  const [checked, setChecked] = React.useState(false);
  const ref = React.useRef<HTMLLabelElement>(null);

  const handleChange = () => {
    setChecked(!checked);
  };

  React.useEffect(() => {
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
  }, []);

  return (
    <label
      ref={ref}
      className="mv-peer mv-group mv-w-full lg:mv-w-fit lg:mv-min-w-content mv-inline-flex lg:mv-flex mv-justify-between mv-items-center mv-gap-3 mv-cursor-pointer mv-p-6 lg:mv-px-4 lg:mv-py-2.5 lg:mv-rounded-lg lg:mv-border lg:mv-border-gray-100 mv-font-semibold mv-text-gray-700 hover:mv-bg-gray-100 group-has-[:focus-within]/dropdown:mv-bg-gray-100 mv-transition"
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

export function DropDownListLegend(props: React.PropsWithChildren) {
  return (
    <legend className="mt-2 mx-4 mv-text-neutral-700 mv-text-sm mv-font-semibold">
      {props.children}
    </legend>
  );
}

export function DropdownListDivider() {
  return <hr className="mv-mx-4 my-2 mv-border-t mv-border-gray-200" />;
}

export const DropdownList = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren & { orientation?: "left" | "right" }
>((props, ref) => {
  const orientation = props.orientation || "left";

  const classes = classNames(
    "lg:mv-w-72 lg:mv-min-h-fit lg:mv-max-h-64 mv-overflow-scroll lg:mv-absolute lg:mv-top-[calc(100%+0.5rem)] mv-py-2 lg:mv-rounded-lg lg:mv-shadow-xl mv-hidden peer-has-[:checked]:mv-block peer-has-[:checked]:mv-z-10 mv-bg-white",
    orientation === "left" && "mv-left-0",
    orientation === "right" && "mv-right-0"
  );

  return (
    <div ref={ref} className={classes}>
      <ul>
        {React.Children.map(props.children, (child) => {
          const classes = classNames(
            React.isValidElement(child) &&
              child.type !== DropdownListDivider &&
              child.type !== DropDownListLegend &&
              child.type !== "div" &&
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
  const children = React.Children.toArray(props.children);

  const list = children.find((child) => {
    return React.isValidElement(child) && child.type === DropdownList;
  });
  const listRef = React.useRef();
  const listClone =
    typeof list !== "undefined"
      ? React.cloneElement(list as React.ReactElement, {
          ref: listRef,
          orientation,
        })
      : null;

  const label = children.find((child) => {
    return React.isValidElement(child) && child.type === DropdownLabel;
  });
  const labelClone =
    typeof label !== "undefined"
      ? React.cloneElement(label as React.ReactElement, {
          listRef,
        })
      : null;

  const classes = classNames(
    props.className,
    "mv-relative mv-group/dropdown mv-w-full lg:mv-w-fit"
  );

  return (
    <div className={classes}>
      {labelClone}
      {listClone}
      <hr className="lg:mv-hidden mv-border-b mv-border-gray-200" />
    </div>
  );
}

Dropdown.Label = DropdownLabel;
Dropdown.List = DropdownList;
Dropdown.Divider = DropdownListDivider;
Dropdown.Legend = DropDownListLegend;
