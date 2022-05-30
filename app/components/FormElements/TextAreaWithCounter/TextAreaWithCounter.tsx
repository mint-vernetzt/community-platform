import React, { FormEventHandler } from "react";
import Counter from "../../Counter/Counter";
import TextArea, { TextAreaProps } from "../TextArea/TextArea";

export interface TextAreaWithCounterProps {
  maxCharacters: number;
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
      onChange: defaultOnChange,
      ...rest
    } = props;
    const [characterCount, updateCharacterCount] = React.useState(
      (defaultValue as string).length
    );
    const handleTextAreaChange: FormEventHandler<HTMLTextAreaElement> = (
      event
    ) => {
      event.preventDefault();
      if (defaultOnChange) {
        defaultOnChange(event);
      }
      if (event.currentTarget.value.length > maxCharacters) {
        event.currentTarget.value = event.currentTarget.value.substring(
          0,
          maxCharacters
        );
      }
      updateCharacterCount(event.currentTarget.value.length);
    };

    return (
      <>
        <TextArea
          {...rest}
          defaultValue={defaultValue}
          ref={ref}
          onChange={handleTextAreaChange}
        />
        <Counter currentCount={characterCount} maxCount={maxCharacters} />
      </>
    );
  }
);

export default TextAreaWithCounter;
TextAreaWithCounter.displayName = "TextAreaWithCounter";
