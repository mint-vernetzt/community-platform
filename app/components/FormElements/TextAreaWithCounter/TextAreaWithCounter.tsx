import React, { FormEventHandler, useState } from "react";
import TextArea, { TextAreaProps } from "../TextArea/TextArea";

export interface TextAreaWithCounterProps {
  maxCharacters: number;
  characterCount: number | undefined;
}

const TextAreaWithCounter = React.forwardRef(
  (
    props: React.HTMLProps<HTMLTextAreaElement> &
      TextAreaProps &
      TextAreaWithCounterProps,
    ref
  ) => {
    const { maxCharacters, ...rest } = props;
    const [characterCount, updateCharacterCount] =
      props.characterCount !== undefined
        ? useState(props.characterCount)
        : useState(0);
    const handleTextAreaChange: FormEventHandler = (event) => {
      console.log(event);
      event.preventDefault();
      //updateCharacterCount(event.target.value.length);
    };

    return <TextArea onChange={handleTextAreaChange} {...rest} ref={ref} />;
    {
      /** <CharacterCount characterCount={characterCount} maxCharacters={maxCharacters} /> */
    }
  }
);

export default TextAreaWithCounter;
TextAreaWithCounter.displayName = "TextAreaWithCounter";
