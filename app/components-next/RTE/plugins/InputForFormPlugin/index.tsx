import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes } from "@lexical/html";
import React from "react";
import { type OverrideableInputProps } from "../../RTE";

function InputForFormPlugin(props: OverrideableInputProps) {
  const { defaultValue, ...rest } = props;
  const [editor] = useLexicalComposerContext();
  const [value, setValue] = React.useState(defaultValue);

  // Set editor default value
  React.useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.read(() => {
        const htmlString = $generateHtmlFromNodes(editor);
        setValue(htmlString);
      });
    });
  }, [editor, defaultValue]);

  return (
    <input
      {...rest}
      tabIndex={-1}
      value={value}
      readOnly
      className="mv-hidden"
      onFocus={(event) => {
        event.preventDefault();
        event.stopPropagation();
        editor.focus();
      }}
    ></input>
  );
}

export { InputForFormPlugin };
