import classNames from "classnames";
import type { FormEventHandler } from "react";
import React from "react";
import type ReactQuill from "react-quill";
import Counter from "../../Counter/Counter";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";
import { ClientOnly } from "remix-utils";
import { RTE } from "../TextArea/RTE.client";

export interface TextAreaWithCounterProps {
  id: string;
  label: string;
  isPublic?: boolean;
  withPublicPrivateToggle?: boolean;
  errorMessage?: string;
  publicPosition?: "top" | "side";
  onChange?: Function; // <--- ?
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

    const quillRef = React.useRef<ReactQuill>(null);
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
      if (quillRef.current !== null) {
        // Getting the right character count from quills trimmed content
        const trimmedContent = quillRef.current.getEditor().getText().trim();
        updateCharacterCount(trimmedContent.length);
      } else {
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
        }
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
        <div className="mv-flex mv-flex-col">
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
                {rte === true && (
                  <ClientOnly>
                    {() => {
                      return (
                        <RTE
                          id={id}
                          defaultValue={`${defaultValue || ""}`}
                          maxLength={maxCharacters}
                          quillRef={quillRef}
                        />
                      );
                    }}
                  </ClientOnly>
                )}
                <textarea
                  {...rest}
                  id={id}
                  defaultValue={defaultValue}
                  onChange={handleTextAreaChange}
                  className={`textarea textarea-bordered h-24 w-full ${
                    props.className
                  }${rte === true ? " hidden" : ""}`}
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
              {maxCharacters !== undefined && (
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
