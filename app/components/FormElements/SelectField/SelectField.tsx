import React from "react";

export interface OptionsProps {
  label: string;
  value: string;
}

export interface OptGroupProps {
  label: string;
  options: OptionsProps[];
}
export interface SelectFieldProps {
  label: string;
  options?: OptionsProps[] | OptGroupProps[];
}

const SelectField = React.forwardRef(
  (props: React.HTMLProps<HTMLSelectElement> & SelectFieldProps, ref) => {
    const { id, label, options = [], ...rest } = props;

    return (
      <div className="form-control w-full">
        <label htmlFor={id} className="label">
          {label}
          {props.required === true ? " *" : ""}
        </label>
        {/* TODO: add selected class on change */}
        <select
          {...rest}
          className={`select select-bordered${props.className ?? ""}`}
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
                <optgroup key={`${id}-option-${index}`} label={option.label}>
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
    );
  }
);

export default SelectField;
SelectField.displayName = "SelectField";
