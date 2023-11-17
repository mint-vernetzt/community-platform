import classNames from "classnames";
import type { FormEventHandler } from "react";
import React from "react";
import {
  countHtmlEntities,
  countHtmlLineBreakTags,
  removeHtmlTags,
  replaceHtmlEntities,
} from "~/lib/utils/sanitizeUserHtml";
import Counter from "../../Counter/Counter";
import type { TextAreaProps } from "../TextArea/TextArea";
import TextArea from "../TextArea/TextArea";

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
    // TODO: Same with schema
    let defaultValueLength;
    if (defaultValue !== null) {
      // TODO: Can this type assertion be removed and proofen by code?
      defaultValueLength = (defaultValue as string)?.length || 0;
      if (props.rte) {
        const htmlLineBreakCount = countHtmlLineBreakTags(
          defaultValue as string
        );
        const htmlEntityCount = countHtmlEntities(defaultValue as string);
        const sanitizedHtml = replaceHtmlEntities(
          removeHtmlTags(defaultValue as string)
        );
        // Html entities (f.e. &amp;) and html line breaks (<br>) are counted and added to the character counter
        defaultValueLength =
          sanitizedHtml.length + htmlLineBreakCount + htmlEntityCount;
      }
    } else {
      defaultValueLength = 0;
    }
    const [characterCount, updateCharacterCount] =
      React.useState(defaultValueLength);
    const handleTextAreaChange: FormEventHandler<HTMLTextAreaElement> = (
      event
    ) => {
      event.preventDefault();
      if (defaultOnChange) {
        defaultOnChange(event);
      }

      let contentLength = event.currentTarget.value.length;
      if (props.rte) {
        const htmlLineBreakCount = countHtmlLineBreakTags(
          event.currentTarget.value
        );
        const htmlEntityCount = countHtmlEntities(event.currentTarget.value);
        const sanitizedHtml = replaceHtmlEntities(
          removeHtmlTags(event.currentTarget.value)
        );
        // Html entities (f.e. &amp;) and html line breaks (<br>) are counted and added to the character counter
        contentLength =
          sanitizedHtml.length + htmlLineBreakCount + htmlEntityCount;
      }
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
