import classNames from "classnames";
import { Counter } from "../components/legacy/Counter/Counter";
import { ToggleCheckbox } from "../components/legacy/FormElements/Checkbox/ToggleCheckbox";
import { RTE, type RTELocales } from "./RTE/RTE";
import { removeHtmlTags } from "~/lib/utils/transformHtml";
import { useState } from "react";
import { type UseFormRegisterReturn } from "react-hook-form";

export interface TextAreaProps {
  label: string;
  isPublic?: boolean;
  withPublicPrivateToggle?: boolean;
  errorMessage?: string;
  errorId?: string;
  publicPosition?: "top" | "side";
  rte?: {
    locales: RTELocales;
    defaultValue?: string;
    legacyFormRegister?: UseFormRegisterReturn<
      "bioRTEState" | "descriptionRTEState"
    >;
  };
  helperText?: string;
}

const TextArea = (
  props: Omit<React.HTMLProps<HTMLTextAreaElement | HTMLInputElement>, "ref"> &
    TextAreaProps
) => {
  const {
    label,
    isPublic,
    withPublicPrivateToggle,
    errorMessage,
    errorId,
    publicPosition = "side",
    rte,
    helperText,
    ...inputProps
  } = props;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { value, className, readOnly, tabIndex, ...rteInputProps } = inputProps;

  const [characterCount, updateCharacterCount] = useState(
    props.defaultValue?.toString().length || 0
  );

  const handleTextAreaChange: React.FormEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    event.preventDefault();
    if (inputProps.onChange) {
      inputProps.onChange(event);
    }
    let tmpValue = event.currentTarget.value;
    const currentLength = event.currentTarget.value.length;
    if (
      inputProps.maxLength !== undefined &&
      currentLength > inputProps.maxLength
    ) {
      // Check the delta to also cut copy paste input
      const delta = currentLength - inputProps.maxLength;
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
    "flex w-full mt-2",
    helperText === undefined && inputProps.maxLength !== undefined
      ? "justify-end"
      : "justify-between"
  );

  return (
    <>
      <div className="flex flex-col w-full">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-row items-center mb-2">
            <label
              htmlFor={inputProps.id || label}
              className="font-semibold flex-auto"
            >
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
                <div className="relative">
                  <RTE
                    {...rteInputProps}
                    id={inputProps.id || label}
                    maxLength={inputProps.maxLength}
                    defaultValue={undefined}
                    rteStateDefaultValue={rte.defaultValue}
                    htmlDefaultValue={props.defaultValue}
                    placeholder={rte.locales.rte.placeholder}
                    locales={rte.locales}
                    legacyFormRegister={rte.legacyFormRegister}
                  />
                  <noscript className="absolute top-10 w-full">
                    <textarea
                      {...inputProps}
                      id={inputProps.id || label}
                      maxLength={inputProps.maxLength}
                      // removeHtmlTags is just for the edge case that someone used RTE already and then turned javascript off at one point.
                      defaultValue={removeHtmlTags(
                        String(inputProps.defaultValue || "").replace(
                          /<br>/g,
                          "\n"
                        )
                      )}
                      className="relative w-full h-[194px] p-2 border border-gray-200 rounded-b-lg focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 active-within:ring-2 active-within:ring-blue-400 active-within:border-blue-400"
                    />
                    <input
                      type="hidden"
                      id={`${inputProps.id || label}-rte-state`}
                      name={`${inputProps.name}RTEState`}
                      defaultValue={undefined}
                      tabIndex={-1}
                    />
                  </noscript>
                </div>
              ) : null}
              {rte === undefined ? (
                <textarea
                  {...inputProps}
                  id={inputProps.id || label}
                  maxLength={inputProps.maxLength}
                  defaultValue={inputProps.defaultValue}
                  onChange={
                    inputProps.maxLength !== undefined
                      ? handleTextAreaChange
                      : undefined
                  }
                  className="relative w-full h-[234px] p-2 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 active-within:ring-2 active-within:ring-blue-400 active-within:border-blue-400"
                />
              ) : null}
            </div>
            {withPublicPrivateToggle !== undefined &&
              isPublic !== undefined &&
              publicPosition === "side" && (
                <ToggleCheckbox
                  name="privateFields"
                  value={inputProps.name}
                  hidden={!withPublicPrivateToggle}
                  defaultChecked={!isPublic}
                />
              )}
          </div>
        </div>
        {(inputProps.maxLength !== undefined || helperText !== undefined) && (
          <div className={counterContainerClasses}>
            {helperText !== undefined && (
              <div className="text-sm text-gray-700 pr-8">{helperText}</div>
            )}
            {inputProps.maxLength !== undefined && rte === undefined && (
              <Counter
                currentCount={characterCount}
                maxCount={inputProps.maxLength}
              />
            )}
          </div>
        )}
        {errorMessage !== undefined && (
          <div
            id={errorId}
            className="text-sm font-semibold text-negative-600 mt-2"
          >
            {errorMessage}
          </div>
        )}
      </div>
    </>
  );
};

export { TextArea };
