import * as React from "react";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";
import { useFormContext } from "react-hook-form";

export interface InputTextProps {
  label: string;
  isPublic?: boolean;
  withPublicPrivateToggle?: boolean;
  errorMessage?: string;
  withClearButton?: boolean;
  centered?: boolean;
}

const InputText = React.forwardRef(
  (props: React.HTMLProps<HTMLInputElement> & InputTextProps, forwardRef) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const id = props.id ?? props.label;
    const { isPublic, errorMessage, withClearButton, centered, ...rest } =
      props;
    const formContext = useFormContext();
    const setValue = formContext ? formContext.setValue : null;

    const handleClear = (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (inputRef.current) {
        if (setValue !== null) {
          setValue(id, "", { shouldDirty: true });
        }

        inputRef.current.value = "";
        inputRef.current.focus();
      }
    };

    return (
      <div className={`form-control w-full${centered ? " items-center" : ""}`}>
        {props.label && (
          <label
            htmlFor={id}
            className={`label${errorMessage ? " text-red-500" : ""}`}
            title={props.errorMessage}
          >
            {props.label} {props.required !== undefined ? "*" : ""}
          </label>
        )}

        <div className="flex flex-row items-center">
          <div className="flex-auto">
            <input
              {...rest}
              ref={(node) => {
                inputRef.current = node;
                if (typeof forwardRef === "function") {
                  forwardRef(node);
                } else if (forwardRef) {
                  forwardRef.current = node;
                }
              }}
              type={props.type ?? "text"}
              className={`input input-bordered w-full input-lg ${
                props.className !== undefined ? props.className : ""
              }`.trimEnd()}
              id={id}
              name={id}
            />
          </div>
          {withClearButton === true && (
            <button className="p-2 ml-2 text-neutral-600" onClick={handleClear}>
              <svg
                viewBox="0 0 10 10"
                width="10px"
                height="10px"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M.808.808a.625.625 0 0 1 .885 0L5 4.116 8.308.808a.626.626 0 0 1 .885.885L5.883 5l3.31 3.308a.626.626 0 1 1-.885.885L5 5.883l-3.307 3.31a.626.626 0 1 1-.885-.885L4.116 5 .808 1.693a.625.625 0 0 1 0-.885Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          )}
          {props.withPublicPrivateToggle !== undefined &&
            props.isPublic !== undefined && (
              <ToggleCheckbox
                name="privateFields"
                value={props.name}
                hidden={!props.withPublicPrivateToggle}
                defaultChecked={!props.isPublic}
              />
            )}
        </div>
      </div>
    );
  }
);

export default InputText;
InputText.displayName = "InputText";
