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
        const newValue =
          htmlString === "<p><br></p>" ? "" : `<div>${htmlString}</div>`;
        setValue(newValue);
      });
    });
  }, [editor]);

  return (
    <input
      {...rest}
      tabIndex={-1}
      value={value}
      readOnly
      className="mv-hidden"
    ></input>
  );
}

export { InputForFormPlugin };
