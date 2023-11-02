import React from "react";

export interface SelectProps {
  name: string;
  label: string;
  isPublic?: boolean;
  withPublicPrivateToggle?: boolean;
  errorMessage?: string;
  helperText?: string;
}

const Select = React.forwardRef(
  (props: React.HTMLProps<HTMLSelectElement> & SelectProps, forwardRef) => {
    const id = props.id ?? props.label;
    const {
      isPublic,
      withPublicPrivateToggle,
      errorMessage,
      helperText,
      ...rest
    } = props;

    return (
      <div className="mv-w-72 mv-py-5">
        <div className="w-full mv-mb-6">
          <div className="mv-relative">
            <label
              htmlFor={id}
              className={`mv-text-sm mv-text-gray-700 mv-font-semibold mv-mb-1`}
            >
              Label
            </label>
            <select
              required
              className={`mv-appearance-none mv-bg-select-arrow mv-bg-no-repeat mv-bg-[right_0.5rem_center] mv-rounded-lg mv-border mv-border-gray-300 mv-w-full mv-p-2 mv-pr-12 mv-text-gray-800 invalid:mv-text-gray-400 mv-text-base mv-leading-snug mv-font-semibold placeholder:mv-font-normal placeholder:mv-gray-400 focus:mv-border-blue-400 focus-visible:mv-outline-0  ${
                errorMessage ? " mv-border-negative-600" : ""
              }`}
              aria-label=""
            >
              <option value="">Bitte auswählen</option>
              <option value="1">One</option>
              <option value="2">Two</option>
              <option value="3">Three</option>
            </select>
          </div>
        </div>
      </div>
    );
  }
);

export default Select;
