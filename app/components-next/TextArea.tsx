import classNames from "classnames";
import React, { type FormEventHandler } from "react";
import Counter from "../components/Counter/Counter";
import { ToggleCheckbox } from "../components/FormElements/Checkbox/ToggleCheckbox";
import { RTE, type RTELocales } from "./RTE/RTE";
import { removeHtmlTags } from "~/lib/utils/transformHtml";

export interface TextAreaProps {
  id: string;
  label: string;
  isPublic?: boolean;
  withPublicPrivateToggle?: boolean;
  errorMessage?: string;
  publicPosition?: "top" | "side";
  rte?: {
    locales: RTELocales;
  };
  helperText?: string;
}

const TextArea = (
  props: Omit<React.HTMLProps<HTMLTextAreaElement | HTMLInputElement>, "ref"> &
    TextAreaProps
) => {
  const {
    id,
    isPublic,
    withPublicPrivateToggle,
    placeholder,
    errorMessage,
    publicPosition = "side",
    rte,
    maxLength,
    defaultValue = "",
    helperText,
    onChange: defaultOnChange,
    ...rest
  } = props;
  const { value, className, readOnly, tabIndex, ...rteInputProps } = rest;

  const [characterCount, updateCharacterCount] = React.useState(
    props.defaultValue?.toString().length || 0
  );

  const handleTextAreaChange: FormEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    event.preventDefault();
    if (defaultOnChange) {
      defaultOnChange(event);
    }
    let tmpValue = event.currentTarget.value;
    const currentLength = event.currentTarget.value.length;
    if (maxLength !== undefined && currentLength > maxLength) {
      // Check the delta to also cut copy paste input
      const delta = currentLength - maxLength;
      // Use slice to cut the string right were the cursor currently is at (Thats the place were to many characters got inserted, so there they have to be removed)
      const currentCursorIndex = event.currentTarget.selectionEnd;
      tmpValue = `${tmpValue.slice(
        0,
        currentCursorIndex - delta
      )}${tmpValue.slice(currentCursorIndex, currentLength)}`;

      event.currentTarget.value = tmpValue;
      event.currentTarget.selectionEnd = currentCursorIndex - delta;
    }
    updateCharacterCount(tmpValue.length);
  };

  const counterContainerClasses = classNames(
    "mv-flex mv-w-full mv-mt-2",
    helperText === undefined && maxLength !== undefined
      ? "mv-justify-end"
      : "mv-justify-between"
  );

  return (
    <>
      <div className="mv-flex mv-flex-col mv-w-full">
        <div className="form-control w-full">
          <div className="flex flex-row items-center mb-2">
            <label htmlFor={id} className="label flex-auto">
              {props.label}
              {props.required === true ? " *" : ""}
            </label>

            {withPublicPrivateToggle !== undefined &&
              isPublic !== undefined &&
              publicPosition === "top" && (
                <ToggleCheckbox
                  name="privateFields"
                  value={props.name}
                  hidden={!withPublicPrivateToggle}
                  defaultChecked={!isPublic}
                />
              )}
          </div>
          <div className="flex flex-row">
            <div className="flex-auto">
              {rte !== undefined ? (
                <div className="mv-relative">
                  <RTE
                    {...rteInputProps}
                    id={id}
                    maxLength={maxLength}
                    defaultValue={defaultValue}
                    placeholder="Enter your text here"
                    locales={rte.locales}
                  />
                  <noscript className="mv-absolute mv-top-10 mv-w-full">
                    <textarea
                      {...rest}
                      id={id}
                      maxLength={maxLength}
                      // removeHtmlTags is just for the edge case that someone used RTE already and then turned javascript off at one point.
                      defaultValue={removeHtmlTags(
                        String(defaultValue).replace(/<br>/g, "\n")
                      )}
                      className="mv-relative mv-w-full mv-h-[194px] mv-p-2 mv-border mv-border-gray-200 mv-rounded-b-lg focus-within:mv-ring-2 focus-within:mv-ring-blue-400 focus-within:mv-border-blue-400 active-within:mv-ring-2 active-within:mv-ring-blue-400 active-within:mv-border-blue-400"
                    />
                  </noscript>
                </div>
              ) : null}
              {rte === undefined ? (
                <textarea
                  {...rest}
                  id={id}
                  maxLength={maxLength}
                  defaultValue={defaultValue}
                  onChange={
                    maxLength !== undefined ? handleTextAreaChange : undefined
                  }
                  className="mv-relative mv-w-full mv-h-[234px] mv-p-2 mv-border mv-border-gray-200 mv-rounded-lg focus-within:mv-ring-2 focus-within:mv-ring-blue-400 focus-within:mv-border-blue-400 active-within:mv-ring-2 active-within:mv-ring-blue-400 active-within:mv-border-blue-400"
                />
              ) : null}
            </div>
            {withPublicPrivateToggle !== undefined &&
              props.isPublic !== undefined &&
              publicPosition === "side" && (
                <ToggleCheckbox
                  name="privateFields"
                  value={props.name}
                  hidden={!withPublicPrivateToggle}
                  defaultChecked={!isPublic}
                />
              )}
          </div>
        </div>
        {(maxLength !== undefined || helperText !== undefined) && (
          <div className={counterContainerClasses}>
            {helperText !== undefined && (
              <div className="mv-text-sm mv-text-gray-700 mv-pr-8">
                {helperText}
              </div>
            )}
            {maxLength !== undefined && rte === undefined && (
              <Counter currentCount={characterCount} maxCount={maxLength} />
            )}
          </div>
        )}
        {errorMessage !== undefined && (
          <div className="mv-text-sm mv-font-semibold mv-text-negative-600 mv-mt-2">
            {errorMessage}
          </div>
        )}
      </div>
    </>
  );
};

export { TextArea };
