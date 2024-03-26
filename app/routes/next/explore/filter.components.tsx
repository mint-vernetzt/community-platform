import React from "react";

function Radio() {
  return (
    <div className="mv-ml-auto mv-w-5 mv-h-5 mv-border mv-border-gray-700 mv-rounded-full mv-flex mv-items-center mv-justify-center">
      <div className="mv-w-3 mv-h-3 mv-rounded-full group-has-[:checked]:mv-bg-gray-700"></div>
    </div>
  );
}

export function FormControlCounter(props: React.PropsWithChildren) {
  const { children } = props;

  return <>{children}</>;
}

export function FormControlLabel(props: React.PropsWithChildren) {
  const { children } = props;

  return <>{children}</>;
}

export function FormControl(
  props: React.PropsWithChildren & React.InputHTMLAttributes<HTMLInputElement>
) {
  const { children, type, defaultChecked, ...otherProps } = props;

  const validChildren = React.Children.toArray(children).filter((child) => {
    return React.isValidElement(child);
  });

  const label = validChildren.find((child) => {
    return (child as React.ReactElement).type === FormControlLabel;
  });

  const counter = validChildren.find((child) => {
    return (child as React.ReactElement).type === FormControlCounter;
  });

  return (
    <label className="mv-px-4 mv-py-2.5 mv-flex mv-gap-3 mv-text-gray-700 mv-cursor-pointer mv-items-center mv-group hover:mv-bg-gray-100 focus-within:mv-bg-gray-100 mv-transition">
      {label}
      <input
        {...otherProps}
        type={type}
        className="mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
        defaultChecked={defaultChecked}
        tabIndex={defaultChecked ? 0 : -1}
      />
      <div className="mv-ml-auto flex mv-items-center mv-gap-3">
        {typeof counter !== "undefined" ? counter : null}
        {type === "radio" && <Radio />}
      </div>
    </label>
  );
}

FormControl.Counter = FormControlCounter;
FormControl.Label = FormControlLabel;
