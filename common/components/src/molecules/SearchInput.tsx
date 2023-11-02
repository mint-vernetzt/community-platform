import classnames from "classnames";
import React from "react";

export interface SearchInputProps {
  name: string;
  label: string;
  isPublic?: boolean;
  withPublicPrivateToggle?: boolean;
  errorMessage?: string;
  helperText?: string;
}

const SearchInput = React.forwardRef(
  (props: React.HTMLProps<HTMLInputElement> & SearchInputProps, forwardRef) => {
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
            <label htmlFor={id} className={`mv-hidden`}>
              Suche
            </label>
            <input
              {...rest}
              ref={forwardRef as React.RefObject<HTMLInputElement>}
              type={props.type ?? "text"}
              className={`mv-rounded-lg mv-border mv-border-gray-300 mv-w-full mv-p-2 mv-pr-12 mv-text-gray-800 mv-text-base mv-leading-snug mv-font-semibold placeholder:mv-font-normal placeholder:mv-gray-400 focus:mv-border-blue-400 focus-visible:mv-outline-0  ${
                errorMessage ? " mv-border-negative-600" : ""
              }`}
              id={id}
              name={id}
              placeholder="Suchbegriff..."
            />
            <div className="mv-absolute mv-right-3 mv-top-1/2 mv--translate-y-1/2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 22 22"
              >
                <path
                  fill="#454C5C"
                  d="M16.15 13.811a8.491 8.491 0 1 0-1.825 1.826h-.002c.039.053.082.103.129.15l5.03 5.03a1.306 1.306 0 1 0 1.847-1.847l-5.03-5.03a1.309 1.309 0 0 0-.15-.129Zm.337-5.021a7.185 7.185 0 1 1-14.37 0 7.185 7.185 0 0 1 14.37 0Z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default SearchInput;
