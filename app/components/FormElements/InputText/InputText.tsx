import * as React from "react";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";
import { useFormContext } from "react-hook-form";

export interface InputTextProps {
  label: string;
  isPublic?: boolean;
  errorMessage?: string;
  withClearButton?: boolean;
}

const InputText = React.forwardRef(
  (props: React.HTMLProps<HTMLInputElement> & InputTextProps, ref) => {
    const inputRef = React.createRef<HTMLInputElement>();
    const id = props.id ?? props.label;
    const { isPublic, errorMessage, withClearButton, ...rest } = props;

    const { setValue } = useFormContext();

    const handleClear = (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (inputRef.current) {
        if (setValue) {
          setValue(id, "", { shouldDirty: true });
        }

        inputRef.current.value = "";
        inputRef.current.focus();
      }
    };
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
              ref={inputRef}
              {...rest}
              type={props.type ?? "text"}
              className={`input input-bordered w-full ${props.className}`}
              id={id}
              name={id}
            />
          </div>
          {withClearButton === true && (
            <button className="p-2" onClick={handleClear}>
              x
            </button>
          )}
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

export default InputText;
InputText.displayName = "InputText";
