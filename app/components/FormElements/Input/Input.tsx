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
      <div className="form-control w-full">
        {props.label && (
          <label
            htmlFor={id}
            className={`label ${errorMessage ? " text-red-500" : ""}`}
            title={props.errorMessage}
          >
            {props.label}
            {props.required !== undefined ? " *" : ""}
          </label>
        )}

        <div className="flex flex-row items-center">
          <div className="flex-auto">
            <input
              {...rest}
              // TODO: can this type assertion be removed and proofen by code?
              ref={forwardRef as React.RefObject<HTMLInputElement>}
              type={props.type ?? "text"}
              className={`input input-bordered input-lg w-full ${
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
