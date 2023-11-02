import classnames from "classnames";
import React from "react";

export interface InputProps {
  name: string;
  label: string;
  isPublic?: boolean;
  withPublicPrivateToggle?: boolean;
  errorMessage?: string;
  helperText?: string;
}

const Input = React.forwardRef(
  (props: React.HTMLProps<HTMLInputElement> & InputProps, forwardRef) => {
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
          <div className="flex flex-row items-center">
            <div className="flex-auto">
              <label
                htmlFor={id}
                className={`mv-text-sm mv-text-gray-700 mv-font-semibold mv-mb-1 mv-flex mv-items-center`}
              >
                Label
                {errorMessage && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="16"
                    viewBox="0 0 15 16"
                    className="mv-ml-auto"
                  >
                    <path
                      fill="#EF4444"
                      fill-rule="nonzero"
                      d="M15 8A7.5 7.5 0 1 1 0 8a7.5 7.5 0 0 1 15 0ZM7.5 4.25a.848.848 0 0 0-.844.933l.328 3.288a.517.517 0 0 0 1.032 0l.328-3.288A.849.849 0 0 0 7.5 4.25Zm.002 5.625a.937.937 0 1 0 0 1.875.937.937 0 0 0 0-1.875Z"
                    />
                  </svg>
                )}
              </label>
              <input
                {...rest}
                ref={forwardRef as React.RefObject<HTMLInputElement>}
                type={props.type ?? "text"}
                className={`mv-rounded-lg mv-border mv-border-gray-300 mv-w-full mv-p-2 mv-text-gray-800 mv-text-base mv-leading-snug mv-font-semibold placeholder:mv-font-normal placeholder:mv-gray-400 focus:mv-border-blue-400 focus-visible:mv-outline-0  ${
                  errorMessage ? " mv-border-negative-600" : ""
                }`}
                id={id}
                name={id}
                placeholder="Placeholder"
              />
              {helperText && (
                <div className="mv-text-sm mv-text-gray-700 mv-mt-2">
                  Helper text below.
                </div>
              )}
              {errorMessage && (
                <div className="mv-text-sm mv-text-negative-600 mv-mt-2">
                  Errortext
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full mv-mb-6">
          <div className="flex flex-row items-center">
            <div className="flex-auto">
              <label
                htmlFor={id}
                className={`mv-text-sm mv-text-gray-700 mv-font-semibold mv-mb-1 mv-flex mv-items-center`}
              >
                Label
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="16"
                  viewBox="0 0 15 16"
                  className="mv-ml-auto"
                >
                  <path
                    fill="#EF4444"
                    fill-rule="nonzero"
                    d="M15 8A7.5 7.5 0 1 1 0 8a7.5 7.5 0 0 1 15 0ZM7.5 4.25a.848.848 0 0 0-.844.933l.328 3.288a.517.517 0 0 0 1.032 0l.328-3.288A.849.849 0 0 0 7.5 4.25Zm.002 5.625a.937.937 0 1 0 0 1.875.937.937 0 0 0 0-1.875Z"
                  />
                </svg>
              </label>
              <input
                {...rest}
                ref={forwardRef as React.RefObject<HTMLInputElement>}
                type={props.type ?? "text"}
                className={`mv-rounded-lg mv-border mv-border-gray-300 mv-w-full mv-p-2 mv-text-gray-800 mv-text-base mv-leading-snug mv-font-semibold placeholder:mv-font-normal placeholder:mv-gray-400 focus:mv-border-blue-400 focus-visible:mv-outline-0 mv-border-negative-600`}
                id={id}
                name={id}
                placeholder="Placeholder"
              />
              <div className="mv-text-sm mv-text-negative-600 mv-mt-2">
                Errortext
              </div>
            </div>
          </div>
        </div>

        <div className="w-full mv-mb-6">
          <div className="flex flex-row items-center">
            <div className="flex-auto">
              <label
                htmlFor={id}
                className={`mv-text-sm mv-text-gray-700 mv-font-semibold mv-mb-1 mv-flex mv-items-center`}
              >
                Label
                {errorMessage && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="16"
                    viewBox="0 0 15 16"
                    className="mv-ml-auto"
                  >
                    <path
                      fill="#EF4444"
                      fill-rule="nonzero"
                      d="M15 8A7.5 7.5 0 1 1 0 8a7.5 7.5 0 0 1 15 0ZM7.5 4.25a.848.848 0 0 0-.844.933l.328 3.288a.517.517 0 0 0 1.032 0l.328-3.288A.849.849 0 0 0 7.5 4.25Zm.002 5.625a.937.937 0 1 0 0 1.875.937.937 0 0 0 0-1.875Z"
                    />
                  </svg>
                )}
              </label>
              <input
                {...rest}
                ref={forwardRef as React.RefObject<HTMLInputElement>}
                type={props.type ?? "text"}
                className={`mv-rounded-lg mv-border mv-border-gray-300 mv-w-full mv-p-2 mv-text-gray-800 mv-text-base mv-leading-snug mv-font-semibold placeholder:mv-font-normal placeholder:mv-gray-400 focus:mv-border-blue-400 focus-visible:mv-outline-0  ${
                  errorMessage ? " mv-border-negative-600" : ""
                }`}
                id={id}
                name={id}
                placeholder="Placeholder"
                value="Input"
              />

              <div className="mv-text-sm mv-text-gray-700 mv-mt-2">
                Helper text below.
              </div>
            </div>
          </div>
        </div>
        <div className="w-full mv-mb-6">
          <div className="flex flex-row items-center">
            <div className="flex-auto">
              <label
                htmlFor={id}
                className={`mv-text-sm mv-text-gray-700 mv-font-semibold mv-mb-1 mv-flex mv-items-center`}
              >
                Label
                {errorMessage && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="16"
                    viewBox="0 0 15 16"
                    className="mv-ml-auto"
                  >
                    <path
                      fill="#EF4444"
                      fill-rule="nonzero"
                      d="M15 8A7.5 7.5 0 1 1 0 8a7.5 7.5 0 0 1 15 0ZM7.5 4.25a.848.848 0 0 0-.844.933l.328 3.288a.517.517 0 0 0 1.032 0l.328-3.288A.849.849 0 0 0 7.5 4.25Zm.002 5.625a.937.937 0 1 0 0 1.875.937.937 0 0 0 0-1.875Z"
                    />
                  </svg>
                )}
              </label>
              <input
                {...rest}
                ref={forwardRef as React.RefObject<HTMLInputElement>}
                type={props.type ?? "text"}
                className={`mv-rounded-lg mv-border mv-border-gray-300 mv-w-full mv-p-2 mv-text-gray-800 mv-text-base mv-leading-snug mv-font-semibold placeholder:mv-font-normal placeholder:mv-gray-400 focus:mv-border-blue-400 focus-visible:mv-outline-0  ${
                  errorMessage ? " mv-border-negative-600" : ""
                }`}
                id={id}
                name={id}
                placeholder="Placeholder"
              />
              <div className="mv-flex mv-gap-4 mv-flex-nowrap mv-mt-2 ">
                <div className="mv-text-sm mv-text-gray-700">
                  Helper text below hat hier zwei Zeilen und ist super lang so
                  sieht das dann aus.
                </div>
                <div className="shrink-0 mv-text-sm mv-text-gray-400">
                  235/300
                </div>
              </div>
              {errorMessage && (
                <div className="mv-text-sm mv-text-negative-600 mv-mt-2">
                  Errortext
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-full mv-mb-6">
          <label
            htmlFor={id}
            className={`mv-text-sm mv-text-gray-700 mv-font-semibold mv-mb-1 mv-flex mv-items-center`}
          >
            Label
            {errorMessage && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="16"
                viewBox="0 0 15 16"
                className="mv-ml-auto"
              >
                <path
                  fill="#EF4444"
                  fill-rule="nonzero"
                  d="M15 8A7.5 7.5 0 1 1 0 8a7.5 7.5 0 0 1 15 0ZM7.5 4.25a.848.848 0 0 0-.844.933l.328 3.288a.517.517 0 0 0 1.032 0l.328-3.288A.849.849 0 0 0 7.5 4.25Zm.002 5.625a.937.937 0 1 0 0 1.875.937.937 0 0 0 0-1.875Z"
                />
              </svg>
            )}
          </label>
          <div className="mv-text-[0px] mv-leading-[0px]">
            <textarea
              id={id}
              name={id}
              placeholder="Textarea"
              className={`mv-p-2 mv-text-gray-800 mv-text-base mv-leading-snug mv-rounded-lg mv-border mv-border-gray-300 mv-w-full mv-font-semibold placeholder:mv-font-normal placeholder:mv-gray-400 focus:mv-border-blue-400 focus-visible:mv-outline-0  ${
                errorMessage ? " mv-border-negative-600" : ""
              }`}
            ></textarea>
          </div>
          <div className="mv-flex mv-gap-4 mv-flex-nowrap mv-mt-2 ">
            <div className="mv-text-sm mv-text-gray-700">
              Helper text below hat hier zwei Zeilen und ist super lang so sieht
              das dann aus.
            </div>
            <div className="shrink-0 mv-text-sm mv-text-gray-400">235/300</div>
          </div>
          {errorMessage && (
            <div className="mv-text-sm mv-text-negative-600 mv-mt-2">
              Errortext
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default Input;
