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
  withPublicPrivateToggle?: boolean;
  publicPosition?: "top" | "side";
  visibilityName?: string;
}

const SelectField = React.forwardRef(
  (props: React.HTMLProps<HTMLSelectElement> & SelectFieldProps) => {
    const {
      label,
      options = [],
      isPublic,
      withPublicPrivateToggle,
      publicPosition = "side",
      visibilityName,
      ...selectProps
    } = props;

    return (
      <div className="form-control w-full">
        <div className="flex flex-row items-center mb-2">
          <label htmlFor={selectProps.id} className="label flex-auto">
            {label}
            {selectProps.required === true ? " *" : ""}
          </label>
          {withPublicPrivateToggle !== undefined &&
            isPublic !== undefined &&
            publicPosition === "top" && (
              <ToggleCheckbox
                name="privateFields"
                value={visibilityName ?? selectProps.name}
                hidden={!withPublicPrivateToggle}
                defaultChecked={!isPublic}
              />
            )}
        </div>
        <div className="flex flex-row items-center">
          <div className="flex-auto">
            <select
              {...selectProps}
              className={`select w-full select-bordered ${
                selectProps.className ?? ""
              }`}
            >
              <option></option>
              {options.map((option, index) => (
                <React.Fragment key={index}>
                  {"value" in option && (
                    <option
                      key={`${selectProps.id}-option-${index}`}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )}

                  {"options" in option && (
                    <optgroup
                      key={`${selectProps.id}-option-${index}`}
                      label={option.label}
                    >
                      {option.options.map((groupOption, groupOptionIndex) => (
                        <option
                          key={`${selectProps.id}-option-${index}-${groupOptionIndex}`}
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

          {withPublicPrivateToggle !== undefined &&
            isPublic !== undefined &&
            publicPosition === "side" && (
              <ToggleCheckbox
                name="privateFields"
                value={selectProps.name}
                hidden={!withPublicPrivateToggle}
                defaultChecked={!isPublic}
              />
            )}
        </div>
      </div>
    );
  }
);

export default SelectField;
SelectField.displayName = "SelectField";
