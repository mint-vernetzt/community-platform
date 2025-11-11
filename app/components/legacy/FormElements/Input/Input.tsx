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
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label
          htmlFor={inputProps.id || label}
          className={`font-semibold${errorMessage ? " text-negative-700" : ""}`}
          title={errorMessage}
        >
          {label}
          {inputProps.required !== undefined ? " *" : ""}
        </label>
      )}

      <div className="flex flex-row items-center">
        <div className="flex-auto">
          <input
            {...inputProps}
            ref={inputProps.ref}
            type={inputProps.type ?? "text"}
            className={`appearance-none rounded-lg border border-gray-300 w-full min-h-10 p-2 text-gray-800 bg-white text-base text-start leading-snug font-semibold placeholder:font-normal placeholder:gray-400 focus:border-blue-400 focus-visible:outline-0 ${
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
