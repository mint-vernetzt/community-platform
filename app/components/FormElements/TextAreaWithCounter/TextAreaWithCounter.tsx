import type { FormEventHandler } from "react";
import React from "react";
import Counter from "../../Counter/Counter";
import type { TextAreaProps } from "../TextArea/TextArea";
import TextArea from "../TextArea/TextArea";
import classNames from "classnames";

export interface TextAreaWithCounterProps {
  maxCharacters?: number;
  helperText?: string;
}

const TextAreaWithCounter = React.forwardRef(
  (
    props: React.HTMLProps<HTMLTextAreaElement> &
      TextAreaProps &
      TextAreaWithCounterProps,
    ref
  ) => {
    const {
      maxCharacters,
      defaultValue = "",
      helperText,
      onChange: defaultOnChange,
      ...rest
    } = props;
    const defaultValueLength = defaultValue
      ? // TODO: can this type assertion be removed and proofen by code?
        (defaultValue as string).length
      : 0;
    const [characterCount, updateCharacterCount] =
      React.useState(defaultValueLength);
    const handleTextAreaChange: FormEventHandler<HTMLTextAreaElement> = (
      event
    ) => {
      event.preventDefault();
      if (defaultOnChange) {
        defaultOnChange(event);
      }

      const contentLength =
        props.rte === true
          ? event.currentTarget.value.replace(/<[^>]*>/g, "").length
          : event.currentTarget.value.length;

      if (maxCharacters !== undefined && contentLength > maxCharacters) {
        event.currentTarget.value = event.currentTarget.value.substring(
          0,
          maxCharacters
        );
      }
      updateCharacterCount(contentLength);
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
          <TextArea
            {...rest}
            defaultValue={defaultValue}
            ref={ref}
            onChange={handleTextAreaChange}
            maxLength={maxCharacters}
          />
          {(maxCharacters !== undefined || helperText !== undefined) && (
            <div className={counterContainerClasses}>
              {helperText !== undefined && (
                <div className="mv-text-sm mv-text-gray-700">{helperText}</div>
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
