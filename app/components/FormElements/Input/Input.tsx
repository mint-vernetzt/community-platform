import type React from "react";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";
export interface InputProps {
  label: string;
  isPublic?: boolean;
  withPublicPrivateToggle?: boolean;
  errorMessage?: string;
}

const Input = (props: React.HTMLProps<HTMLInputElement> & InputProps) => {
  const {
    label,
    isPublic,
    withPublicPrivateToggle,
    errorMessage,
    ...inputProps
  } = props;

  return (
    <div className="form-control mv-w-full">
      {label && (
        <label
          htmlFor={inputProps.id || label}
          className={`label ${errorMessage ? " mv-text-red-500" : ""}`}
          title={errorMessage}
        >
          {label}
          {inputProps.required !== undefined ? " *" : ""}
        </label>
      )}

      <div className="mv-flex mv-flex-row mv-items-center">
        <div className="mv-flex-auto">
          <input
            {...inputProps}
            ref={inputProps.ref}
            type={inputProps.type ?? "text"}
            className={`mv-appearance-none mv-rounded-lg mv-border mv-border-gray-300 mv-w-full mv-min-h-10 mv-p-2 mv-text-gray-800 mv-bg-white mv-text-base mv-text-start mv-leading-snug mv-font-semibold placeholder:mv-font-normal placeholder:mv-gray-400 focus:mv-border-blue-400 focus-visible:mv-outline-0 ${
              inputProps.className !== undefined ? inputProps.className : ""
            }`.trimEnd()}
            id={inputProps.id || label}
            name={inputProps.id || label}
          />
        </div>
        {isPublic !== undefined && withPublicPrivateToggle !== undefined && (
          <ToggleCheckbox
            name="privateFields"
            value={inputProps.name}
            hidden={!withPublicPrivateToggle}
            defaultChecked={!isPublic}
          />
        )}
      </div>
    </div>
  );
};

export default Input;
