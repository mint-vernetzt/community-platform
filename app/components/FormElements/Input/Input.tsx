import * as React from "react";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";
export interface InputProps {
  label: string;
  isPublic?: boolean;
  errorMessage?: string;
}

const Input = React.forwardRef(
  (props: React.HTMLProps<HTMLInputElement> & InputProps, forwardRef) => {
    const id = props.id ?? props.label;
    const { placeholder, isPublic, errorMessage, ...rest } = props;

    return (
      <div className="form-control w-full">
        {props.label && (
          <label
            htmlFor={id}
            className={`label ${errorMessage ? " text-red-500" : ""}`}
            title={props.errorMessage}
          >
            {props.label}
            {props.required !== undefined ? "*" : ""}
          </label>
        )}

        <div className="flex flex-row items-center">
          <div className="flex-auto">
            <input
              {...rest}
              ref={forwardRef as React.RefObject<HTMLInputElement>}
              type={props.type ?? "text"}
              className={`input input-bordered w-full ${props.className}`}
              id={id}
              name={id}
            />
          </div>
          {props.isPublic !== undefined && (
            <ToggleCheckbox
              name="publicFields"
              value={props.name}
              defaultChecked={props.isPublic}
            />
          )}
        </div>
      </div>
    );
  }
);

export default Input;
Input.displayName = "Input";
