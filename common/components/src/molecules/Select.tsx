import React from "react";
import Input, { type InputLabelProps } from "./Input";

export type SelectProps = React.HTMLProps<HTMLSelectElement>;

function Select(props: SelectProps) {
  const { children, ...selectProps } = props;
  const validChildren = React.Children.toArray(children).filter((child) => {
    return React.isValidElement(child) || typeof child === "string";
  });

  const error = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === Input.Error;
  });

  const labelString = validChildren.find((child) => {
    return typeof child === "string";
  });
  const labelComponent = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === Input.Label;
  });
  type LabelComponentType = React.DetailedReactHTMLElement<
    React.PropsWithChildren<InputLabelProps>,
    HTMLLabelElement
  > & { ref: React.RefObject<HTMLLabelElement> };

  let label: LabelComponentType | React.ReactElement | undefined;
  if (typeof labelString !== "undefined") {
    label = (
      <Input.Label
        htmlFor={props.id}
        hasError={typeof error !== "undefined"}
        hidden
      >
        {labelString}
      </Input.Label>
    );
  } else if (typeof labelComponent !== "undefined") {
    label = React.cloneElement<React.PropsWithChildren<InputLabelProps>>(
      labelComponent as LabelComponentType,
      {
        hasError: typeof error !== "undefined",
      }
    );
  }

  if (typeof label === "undefined") {
    throw new Error("Input component must have a label");
  }

  const options = validChildren.filter((child) => {
    return (
      React.isValidElement(child) &&
      (child.type === "option" || child.type === React.Fragment)
    );
  });

  const helperText = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === Input.HelperText;
  });

  return (
    <div className="w-full">
      {label}
      <div className="mv-relative">
        <select
          {...selectProps}
          className="mv-appearance-none mv-bg-select-arrow mv-bg-no-repeat mv-bg-[right_0.5rem_center] mv-rounded-lg mv-border mv-border-gray-300 mv-w-full mv-p-2 mv-pr-12 mv-text-gray-800 invalid:mv-text-gray-400 mv-text-base mv-leading-snug mv-font-semibold placeholder:mv-font-normal placeholder:mv-gray-400 focus:mv-border-blue-400 focus-visible:mv-outline-0"
        >
          {options}
        </select>
      </div>
      {helperText}
      {error}
    </div>
  );
}

Select.Label = Input.Label;
Select.HelperText = Input.HelperText;
Select.Error = Input.Error;

export default Select;
