import classNames from "classnames";
import React, { type FormEventHandler } from "react";
import Counter from "../../Counter/Counter";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";
import { RTE } from "../../../components-next/RTE";
import { useHydrated } from "remix-utils/use-hydrated";

export interface TextAreaWithCounterProps {
  id: string;
  label: string;
  isPublic?: boolean;
  withPublicPrivateToggle?: boolean;
  errorMessage?: string;
  publicPosition?: "top" | "side";
  rte?: boolean;
  maxCharacters?: number;
  helperText?: string;
}

const TextAreaWithCounter = React.forwardRef(
  (
    props: React.HTMLProps<HTMLTextAreaElement> & TextAreaWithCounterProps,
    ref
  ) => {
    const {
      id,
      isPublic,
      withPublicPrivateToggle,
      placeholder,
      errorMessage,
      publicPosition = "side",
      rte = false,
      maxCharacters,
      defaultValue = "",
      helperText,
      onChange: defaultOnChange,
      ...rest
    } = props;

    const isHydrated = useHydrated();

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
      if (maxCharacters !== undefined && currentLength > maxCharacters) {
        // Check the delta to also cut copy paste input
        const delta = currentLength - maxCharacters;
        // Use slice to cut the string right were the cursor currently is at (Thats the place were to many characters got inserted, so there they have to be removed)
        const currentCursorIndex = event.currentTarget.selectionEnd;
        tmpValue = `${tmpValue.slice(
          0,
          currentCursorIndex - delta
        )}${tmpValue.slice(currentCursorIndex, currentLength)}`;

        event.currentTarget.value = tmpValue;
        event.currentTarget.selectionEnd = currentCursorIndex - delta;
        updateCharacterCount(tmpValue.length);
      }
    };

    const counterContainerClasses = classNames(
      "mv-flex mv-w-full mv-mt-2",
      helperText === undefined && maxCharacters !== undefined
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
                {rte === true && isHydrated ? (
                  <RTE
                    defaultValue={`${defaultValue || ""}`}
                    placeholder="Enter your text here"
                    maxLength={maxCharacters}
                  />
                ) : null}
                <textarea
                  {...rest}
                  id={id}
                  defaultValue={defaultValue}
                  onChange={handleTextAreaChange}
                  className={`textarea textarea-bordered h-24 w-full ${
                    props.className
                  }${rte === true && isHydrated ? " hidden" : ""}`}
                ></textarea>
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
          {(maxCharacters !== undefined || helperText !== undefined) && (
            <div className={counterContainerClasses}>
              {helperText !== undefined && (
                <div className="mv-text-sm mv-text-gray-700 mv-pr-8">
                  {helperText}
                </div>
              )}
              {maxCharacters !== undefined && rte === false && (
                <Counter
                  currentCount={characterCount}
                  maxCount={maxCharacters}
                />
              )}
            </div>
          )}
        </div>
      </>
    );
  }
);

export default TextAreaWithCounter;
TextAreaWithCounter.displayName = "TextAreaWithCounter";
