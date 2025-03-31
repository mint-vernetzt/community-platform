import { type FormMetadata } from "@conform-to/react-v1";
import classNames from "classnames";
import React from "react";
import { Link } from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";

export type InputType = "text" | "password" | "email" | "number" | "hidden";

export type InputLabelProps = {
  htmlFor?: string;
  hidden?: boolean;
  hasError?: boolean;
  disabled?: boolean;
};

function InputLabel(props: React.PropsWithChildren<InputLabelProps>) {
  const classes = classNames(
    "mv-text-sm mv-font-semibold mv-mb-1 mv-flex mv-items-center mv-justify-between",
    typeof props.hidden !== "undefined" &&
      props.hidden !== false &&
      "mv-hidden",
    typeof props.disabled !== "undefined" && props.disabled !== false
      ? "mv-text-neutral-300"
      : "mv-text-gray-700"
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

function InputClearIcon(props: {
  formMetaData: FormMetadata;
  disabled?: boolean;
}) {
  const { formMetaData, disabled = false } = props;
  const isHydrated = useHydrated();
  const clearIcon = (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.1605 6.16152L6.1605 6.16152L6.1614 6.16062C6.17301 6.14898 6.1868 6.13975 6.20199 6.13345C6.21717 6.12715 6.23345 6.1239 6.2499 6.1239C6.26634 6.1239 6.28262 6.12715 6.2978 6.13345C6.31299 6.13975 6.32678 6.14898 6.3384 6.16062L6.33878 6.161L9.64628 9.46976L9.9999 9.82351L10.3535 9.46976L13.6609 6.16107C13.6726 6.14939 13.6865 6.14013 13.7018 6.1338C13.717 6.12748 13.7334 6.12423 13.7499 6.12423C13.7664 6.12423 13.7828 6.12748 13.798 6.1338C13.8133 6.14013 13.8272 6.14939 13.8388 6.16107L14.1924 5.80752L13.8388 6.16107C13.8505 6.17275 13.8598 6.18662 13.8661 6.20188C13.8724 6.21714 13.8757 6.2335 13.8757 6.25002C13.8757 6.26654 13.8724 6.2829 13.8661 6.29815C13.8598 6.31339 13.8506 6.32723 13.8389 6.3389C13.8389 6.33892 13.8389 6.33894 13.8388 6.33896L10.5302 9.6464L10.1764 10L10.5302 10.3536L13.8388 13.6611C13.8389 13.6611 13.8389 13.6611 13.8389 13.6611C13.8389 13.6611 13.8389 13.6611 13.8389 13.6611C13.8506 13.6728 13.8598 13.6866 13.8661 13.7019C13.8724 13.7171 13.8757 13.7335 13.8757 13.75C13.8757 13.7665 13.8724 13.7829 13.8661 13.7982C13.8598 13.8134 13.8505 13.8273 13.8388 13.839L13.8388 13.839C13.8272 13.8506 13.8133 13.8599 13.798 13.8662C13.7828 13.8726 13.7664 13.8758 13.7499 13.8758C13.7334 13.8758 13.717 13.8726 13.7018 13.8662C13.6865 13.8599 13.6727 13.8507 13.661 13.839C13.661 13.839 13.661 13.839 13.6609 13.839L10.3535 10.5303L9.9999 10.1765L9.64628 10.5303L6.33884 13.839C6.33882 13.839 6.3388 13.839 6.33878 13.839C6.32711 13.8507 6.31327 13.8599 6.29803 13.8662C6.28277 13.8726 6.26642 13.8758 6.2499 13.8758C6.23337 13.8758 6.21702 13.8726 6.20176 13.8662C6.1865 13.8599 6.17263 13.8506 6.16095 13.839L5.8074 14.1925L6.16095 13.839C6.14927 13.8273 6.14 13.8134 6.13368 13.7982C6.12736 13.7829 6.12411 13.7665 6.12411 13.75C6.12411 13.7335 6.12736 13.7171 6.13368 13.7019C6.14 13.6866 6.14927 13.6728 6.16095 13.6611L9.46963 10.3536L9.82339 10L9.46963 9.6464L6.16088 6.3389L6.1605 6.33852C6.14886 6.32691 6.13963 6.31311 6.13332 6.29793C6.12702 6.28274 6.12378 6.26646 6.12378 6.25002C6.12378 6.23357 6.12702 6.21729 6.13332 6.20211C6.13963 6.18692 6.14886 6.17313 6.1605 6.16152Z"
        fill="currentColor"
        stroke="currentColor"
      />
    </svg>
  );
  return isHydrated === true ? (
    <button
      type="reset"
      disabled={disabled}
      onClick={() => {
        setTimeout(() => formMetaData.reset(), 0);
      }}
    >
      {clearIcon}
    </button>
  ) : (
    <Link to=".">{clearIcon}</Link>
  );
}

function InputHelperText(
  props: React.PropsWithChildren<{
    disabled?: boolean;
  }>
) {
  return (
    <div
      className={`mv-text-sm mv-mt-2 ${
        typeof props.disabled !== "undefined" && props.disabled !== false
          ? "mv-text-neutral-300"
          : "mv-text-gray-700"
      }`}
    >
      {props.children}
    </div>
  );
}

function InputError(
  props: React.PropsWithChildren & React.HTMLProps<HTMLDivElement>
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

function InputControls(props: React.PropsWithChildren) {
  return (
    <div className="mv-flex mv-items-center mv-self-end mv-gap-2 mv-shrink">
      {props.children}
    </div>
  );
}

export type InputProps = React.HTMLProps<HTMLInputElement> & {
  standalone?: boolean;
  withoutName?: boolean;
};

function Input(props: InputProps) {
  const { children, standalone, withoutName, ...inputProps } = props;
  const name =
    withoutName === true ? undefined : inputProps.name || inputProps.id;

  const defaultValueLength = inputProps.defaultValue
    ? inputProps.defaultValue.toString().length
    : 0;
  const [characterCount, updateCharacterCount] =
    React.useState(defaultValueLength);
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (inputProps.onChange !== undefined) {
      inputProps.onChange(event);
    }
    if (
      inputProps.maxLength !== undefined &&
      event.currentTarget.value.length > inputProps.maxLength
    ) {
      event.currentTarget.value = event.currentTarget.value.substring(
        0,
        inputProps.maxLength
      );
    }
    updateCharacterCount(event.currentTarget.value.length);
  };

  if (inputProps.type === "hidden") {
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
  });
  type LabelComponentType = React.DetailedReactHTMLElement<
    React.PropsWithChildren<InputLabelProps>,
    HTMLLabelElement
  > & { ref: React.RefObject<HTMLLabelElement> };

  let label: LabelComponentType | React.ReactElement | undefined;
  if (typeof labelString !== "undefined") {
    label = (
      <InputLabel htmlFor={inputProps.id} hasError={errors.length > 0} hidden>
        {labelString}
      </InputLabel>
    );
  } else if (typeof labelComponent !== "undefined") {
    label = React.cloneElement<React.PropsWithChildren<InputLabelProps>>(
      labelComponent as LabelComponentType,
      {
        hasError: errors.length > 0,
      }
    );
  }

  if (typeof label === "undefined") {
    throw new Error("Input component must have a label");
  }

  const searchIcon = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === InputSearchIcon;
  });
  const clearIcon = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === InputClearIcon;
  });
  const helperText = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === InputHelperText;
  });
  const controls = validChildren.find((child) => {
    return (
      React.isValidElement(child) &&
      child.type === InputControls &&
      typeof child.props === "object" &&
      child.props !== null &&
      "children" in child.props &&
      React.isValidElement(child.props.children) &&
      React.Children.toArray(child.props.children).length > 0
    );
  });

  const inputClasses = classNames(
    "mv-rounded-lg mv-border mv-border-gray-300 mv-w-full mv-p-2 mv-pr-12 mv-text-gray-800 mv-text-base mv-leading-snug mv-font-semibold placeholder:mv-font-normal placeholder:mv-gray-400 focus:mv-border-blue-400 focus-visible:mv-outline-0",
    errors.length > 0 && "mv-border-negative-600",
    typeof inputProps.disabled !== "undefined" &&
      inputProps.disabled === true &&
      "mv-text-neutral-300",
    typeof searchIcon !== "undefined" && "mv-pl-10"
  );

  const inputCounterContainerClasses = classNames(
    "mv-flex mv-w-full",
    helperText !== undefined || errors.length > 0
      ? "mv-justify-between"
      : "mv-justify-end"
  );

  return (
    <div className="w-full">
      <div className="mv-flex mv-gap-2">
        <div className="mv-relative mv-flex mv-flex-col mv-gap-2 mv-flex-nowrap mv-grow">
          {label}
          <div className="mv-relative">
            <input
              className={inputClasses}
              type={inputProps.type || "text"}
              {...inputProps}
              name={name}
              onChange={
                inputProps.maxLength !== undefined
                  ? handleInputChange
                  : inputProps.onChange
              }
            />
            {typeof searchIcon !== "undefined" && (
              <div className="mv-absolute mv-left-2 mv-top-0 mv-h-full mv-flex mv-items-center">
                {searchIcon}
              </div>
            )}
            {typeof clearIcon !== "undefined" && (
              <div className="mv-absolute mv-right-2 mv-top-0 mv-h-full mv-flex mv-items-center">
                {clearIcon}
              </div>
            )}
          </div>
        </div>
        {typeof controls !== "undefined" && controls}
      </div>
      {inputProps.maxLength !== undefined ? (
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
            maxCount={inputProps.maxLength}
          />
        </div>
      ) : null}

      {inputProps.maxLength === undefined && helperText !== undefined ? (
        <div className="mv-pr-8">{helperText}</div>
      ) : null}

      {inputProps.maxLength === undefined && errors.length > 0 ? (
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
Input.ClearIcon = InputClearIcon;
Input.Controls = InputControls;

export { Input };
