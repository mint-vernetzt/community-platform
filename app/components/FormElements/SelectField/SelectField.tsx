import React from "react";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";

export interface OptionsProps {
  label: string;
  value: string;
}

export interface OptGroupProps {
  label: string;
  options: OptionsProps[];
}

export type OptionOrGroup = OptionsProps | OptGroupProps;

export interface SelectFieldProps {
  label: string;
  options?: OptionOrGroup[];
  isPublic?: boolean;
  publicPosition?: "top" | "side";
  visibilityName?: string;
}

const SelectField = React.forwardRef(
  (props: React.HTMLProps<HTMLSelectElement> & SelectFieldProps, ref) => {
    const {
      id,
      label,
      options = [],
      isPublic,
      publicPosition = "side",
      visibilityName,
      ...rest
    } = props;

    return (
      <div className="form-control w-full">
        <div className="flex flex-row items-center mb-2">
          <label htmlFor={id} className="label flex-auto">
            {label}
            {props.required === true ? " *" : ""}
          </label>
          {isPublic !== undefined && publicPosition === "top" && (
            <ToggleCheckbox
              name="publicFields"
              value={visibilityName ?? props.name}
              defaultChecked={props.isPublic}
            />
          )}
        </div>
        <div className="flex flex-row items-center">
          <div className="flex-auto">
            <select
              {...rest}
              className={`select w-full select-bordered ${
                props.className ?? ""
              }`}
            >
              <option></option>
              {options.map((option, index) => (
                <React.Fragment key={index}>
                  {"value" in option && (
                    <option key={`${id}-option-${index}`} value={option.value}>
                      {option.label}
                    </option>
                  )}

                  {"options" in option && (
                    <optgroup
                      key={`${id}-option-${index}`}
                      label={option.label}
                    >
                      {option.options.map((groupOption, groupOptionIndex) => (
                        <option
                          key={`${id}-option-${index}-${groupOptionIndex}`}
                          value={groupOption.value}
                        >
                          {groupOption.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </React.Fragment>
              ))}
            </select>
          </div>
          {isPublic !== undefined && publicPosition === "side" && (
            <ToggleCheckbox
              name="publicFields"
              value={props.name}
              defaultChecked={isPublic}
            />
          )}
        </div>
      </div>
    );
  }
);

export default SelectField;
SelectField.displayName = "SelectField";
