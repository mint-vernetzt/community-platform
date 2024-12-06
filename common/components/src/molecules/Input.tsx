import classNames from "classnames";
import React from "react";

export type InputType = "text" | "password" | "email" | "number" | "hidden";

type InputLabelProps = {
  htmlFor?: string;
  hidden?: boolean;
  hasError?: boolean;
};

function InputLabel(props: React.PropsWithChildren<InputLabelProps>) {
  const classes = classNames(
    "mv-text-sm mv-text-gray-700 mv-font-semibold mv-mb-1 mv-flex mv-items-center mv-justify-between",
    typeof props.hidden !== "undefined" && props.hidden !== false && "mv-hidden"
  );

  return (
    <label htmlFor={props.htmlFor} className={classes}>
      {props.children}
      {typeof props.hasError !== "undefined" && props.hasError !== false && (
        <div className="mv-text-negative-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="16"
            viewBox="0 0 15 16"
            className="mv-ml-auto"
          >
            <path
              fill="currentColor"
              fillRule="nonzero"
              d="M15 8A7.5 7.5 0 1 1 0 8a7.5 7.5 0 0 1 15 0ZM7.5 4.25a.848.848 0 0 0-.844.933l.328 3.288a.517.517 0 0 0 1.032 0l.328-3.288A.849.849 0 0 0 7.5 4.25Zm.002 5.625a.937.937 0 1 0 0 1.875.937.937 0 0 0 0-1.875Z"
            />
          </svg>
        </div>
      )}
    </label>
  );
}

function InputSearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 22 22"
    >
      <path
        fill="#454C5C"
        d="M16.15 13.811a8.491 8.491 0 1 0-1.825 1.826h-.002c.039.053.082.103.129.15l5.03 5.03a1.306 1.306 0 1 0 1.847-1.847l-5.03-5.03a1.309 1.309 0 0 0-.15-.129Zm.337-5.021a7.185 7.185 0 1 1-14.37 0 7.185 7.185 0 0 1 14.37 0Z"
      />
    </svg>
  );
}

function InputHelperText(props: React.PropsWithChildren<{}>) {
  return (
    <div className="mv-text-sm mv-text-gray-700 mv-mt-2">{props.children}</div>
  );
}

function InputError(
  props: React.PropsWithChildren<{}> & React.HTMLProps<HTMLDivElement>
) {
  const { children, className: additionalClassName, ...rest } = props;
  return (
    <div
      {...rest}
      className={`mv-text-sm mv-font-semibold mv-text-negative-600 mv-mt-2${
        additionalClassName !== undefined ? ` ${additionalClassName}` : ""
      }`}
    >
      {children}
    </div>
  );
}

function InputCounter(props: { currentCount: number; maxCount: number }) {
  return (
    <div
      className={`mv-text-sm ${
        props.currentCount < props.maxCount
          ? "mv-text-gray-700"
          : "mv-text-negative-600"
      } mv-mt-2`}
    >
      {props.currentCount}/{props.maxCount}
    </div>
  );
}

function InputControls(props: React.PropsWithChildren<{}>) {
  return (
    <div className="mv-flex mv-items-center mv-self-end mv-gap-2 mv-shrink">
      {props.children}
    </div>
  );
}

export type InputProps = React.HTMLProps<HTMLInputElement> & {
  standalone?: boolean;
};

function Input(props: InputProps) {
  const { type = "text", children, standalone, ...inputProps } = props;
  const name = props.name || props.id;

  const defaultValueLength = props.defaultValue
    ? props.defaultValue.toString().length
    : 0;
  const [characterCount, updateCharacterCount] =
    React.useState(defaultValueLength);
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (props.onChange !== undefined) {
      props.onChange(event);
    }
    if (
      props.maxLength !== undefined &&
      event.currentTarget.value.length > props.maxLength
    ) {
      event.currentTarget.value = event.currentTarget.value.substring(
        0,
        props.maxLength
      );
    }
    updateCharacterCount(event.currentTarget.value.length);
  };

  if (type === "hidden") {
    return <input {...inputProps} className="mv-hidden" name={name} />;
  }

  const validChildren = React.Children.toArray(children).filter((child) => {
    return React.isValidElement(child) || typeof child === "string";
  });

  const errors = validChildren.filter((child) => {
    return React.isValidElement(child) && child.type === InputError;
  });

  const labelString = validChildren.find((child) => {
    return typeof child === "string";
  });
  const labelComponent = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === InputLabel;
  }) as React.ReactElement;

  let label: React.ReactElement<typeof InputLabel> | undefined;
  if (typeof labelString !== "undefined") {
    label = (
      <InputLabel htmlFor={props.id} hasError={errors.length > 0} hidden>
        {labelString}
      </InputLabel>
    );
  } else if (typeof labelComponent !== "undefined") {
    label = React.cloneElement(labelComponent, {
      hasError: errors.length > 0,
    });
  }

  if (typeof label === "undefined") {
    throw new Error("Input component must have a label");
  }

  const icon = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === InputSearchIcon;
  });
  const helperText = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === InputHelperText;
  });
  const controls = validChildren.find((child) => {
    return (
      React.isValidElement(child) &&
      child.type === InputControls &&
      React.Children.toArray(child.props.children).length > 0
    );
  });

  const inputClasses = classNames(
    "mv-rounded-lg mv-border mv-border-gray-300 mv-w-full mv-p-2 mv-pr-12 mv-text-gray-800 mv-text-base mv-leading-snug mv-font-semibold placeholder:mv-font-normal placeholder:mv-gray-400 focus:mv-border-blue-400 focus-visible:mv-outline-0",
    errors.length > 0 && "mv-border-negative-600"
  );

  const inputCounterContainerClasses = classNames(
    "mv-flex mv-w-full",
    helperText !== undefined || errors.length > 0
      ? "mv-justify-between"
      : "mv-justify-end"
  );

  return (
    <div className="w-full">
      <div className="mv-relative mv-flex mv-gap-2 mv-flex-nowrap">
        <div className="mv-grow">
          {label}
          <input
            className={inputClasses}
            {...inputProps}
            name={name}
            onChange={
              props.maxLength !== undefined ? handleInputChange : props.onChange
            }
          />
          {typeof icon !== "undefined" && typeof controls === "undefined" && (
            <div className="mv-absolute mv-right-3 mv-top-2/3 -mv-translate-y-1/2">
              {icon}
            </div>
          )}
        </div>
        {typeof controls !== "undefined" && controls}
      </div>
      {props.maxLength !== undefined ? (
        <div className={inputCounterContainerClasses}>
          {helperText !== undefined || errors.length > 0 ? (
            <div className="mv-flex mv-flex-col">
              {helperText !== undefined ? (
                <div className="mv-pr-8">{helperText}</div>
              ) : null}
              {errors.length > 0 ? (
                <ul>
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <InputCounter
            currentCount={characterCount}
            maxCount={props.maxLength}
          />
        </div>
      ) : null}

      {props.maxLength === undefined && helperText !== undefined ? (
        <div className="mv-pr-8">{helperText}</div>
      ) : null}

      {props.maxLength === undefined && errors.length > 0 ? (
        <ul>
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      ) : null}
      {typeof standalone !== "undefined" && standalone !== false && (
        <input type="submit" className="mv-hidden" />
      )}
    </div>
  );
}

Input.Label = InputLabel;
Input.HelperText = InputHelperText;
Input.Error = InputError;
Input.SearchIcon = InputSearchIcon;
Input.Controls = InputControls;

export default Input;
