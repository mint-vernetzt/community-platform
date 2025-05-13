import { forwardRef, useRef } from "react";
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

const InputText = forwardRef(
  (props: React.HTMLProps<HTMLInputElement> & InputTextProps, forwardRef) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const {
      label,
      isPublic,
      withPublicPrivateToggle,
      errorMessage,
      withClearButton,
      centered,
      ...inputProps
    } = props;
    const formContext = useFormContext();
    const setValue = formContext ? formContext.setValue : null;

    const handleClear = (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (inputRef.current) {
        if (setValue !== null) {
          setValue(inputProps.id || label, "", { shouldDirty: true });
        }

        inputRef.current.value = "";
        inputRef.current.focus();
      }
    };

    return (
      <div className={`form-control w-full${centered ? " items-center" : ""}`}>
        {label && (
          <label
            htmlFor={inputProps.id || label}
            className={`label${errorMessage ? " text-red-500" : ""}`}
            title={errorMessage}
          >
            {label} {inputProps.required !== undefined ? "*" : ""}
          </label>
        )}

        <div className="flex flex-row items-center">
          <div className="flex-auto">
            <input
              {...inputProps}
              ref={(node) => {
                inputRef.current = node;
                if (typeof forwardRef === "function") {
                  forwardRef(node);
                } else if (forwardRef) {
                  forwardRef.current = node;
                }
              }}
              type={inputProps.type ?? "text"}
              className={`input input-bordered w-full input-lg ${
                inputProps.className !== undefined ? inputProps.className : ""
              }`.trimEnd()}
              id={inputProps.id || label}
              name={inputProps.id || label}
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
          {withPublicPrivateToggle !== undefined && isPublic !== undefined && (
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
  }
);

export default InputText;
InputText.displayName = "InputText";
