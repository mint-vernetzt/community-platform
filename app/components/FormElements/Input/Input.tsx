import * as React from "react";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";
export interface InputProps {
  label: string;
  isPublic?: boolean;
  withPublicPrivateToggle?: boolean;
  errorMessage?: string;
}

const Input = React.forwardRef(
  (props: React.HTMLProps<HTMLInputElement> & InputProps, forwardRef) => {
    const id = props.id ?? props.label;
    const { isPublic, withPublicPrivateToggle, errorMessage, ...rest } = props;

    return (
      <div className="form-control mv-w-full">
        {props.label && (
          <label
            htmlFor={id}
            className={`label ${errorMessage ? " mv-text-red-500" : ""}`}
            title={props.errorMessage}
          >
            {props.label}
            {props.required !== undefined ? " *" : ""}
          </label>
        )}

        <div className="mv-flex mv-flex-row mv-items-center">
          <div className="mv-flex-auto">
            <input
              {...rest}
              // TODO: can this type assertion be removed and proofen by code?
              ref={forwardRef as React.RefObject<HTMLInputElement>}
              type={props.type ?? "text"}
              className={`mv-appearance-none mv-rounded-lg mv-border mv-border-gray-300 mv-w-full mv-min-h-10 mv-p-2 mv-text-gray-800 mv-bg-white mv-text-base mv-text-start mv-leading-snug mv-font-semibold placeholder:mv-font-normal placeholder:mv-gray-400 focus:mv-border-blue-400 focus-visible:mv-outline-0 ${
                props.className !== undefined ? props.className : ""
              }`.trimEnd()}
              id={id}
              name={id}
            />
          </div>
          {isPublic !== undefined && withPublicPrivateToggle !== undefined && (
            <ToggleCheckbox
              name="privateFields"
              value={props.name}
              hidden={!withPublicPrivateToggle}
              defaultChecked={!isPublic}
            />
          )}
        </div>
      </div>
    );
  }
);

export default Input;
Input.displayName = "Input";
