import classNames from "classnames";
import type { FormEventHandler } from "react";
import React from "react";
import type ReactQuill from "react-quill";
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

    const quillRef = React.useRef<ReactQuill>(null);
    const [characterCount, updateCharacterCount] = React.useState(0);
    const [value, setValue] = React.useState("");
    React.useEffect(() => {
      if (quillRef.current !== null) {
        // Getting the right character count from quills trimmed content
        const trimmedContent = quillRef.current.getEditor().getText().trim();
        updateCharacterCount(trimmedContent.length);
      } else {
        updateCharacterCount(value.length);
      }
    }, [quillRef, value]);
    // This hook is for same page navigation to rerender the element and show the correct character count
    React.useEffect(() => {
      if (defaultValue !== null) {
        setValue(defaultValue.toString());
      }
    }, [defaultValue]);

    const handleTextAreaChange: FormEventHandler<HTMLTextAreaElement> = (
      event
    ) => {
      event.preventDefault();
      if (defaultOnChange) {
        defaultOnChange(event);
      }
      setValue(event.currentTarget.value);
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
            maxLength={maxCharacters}
            onChange={handleTextAreaChange}
            quillRef={quillRef}
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
