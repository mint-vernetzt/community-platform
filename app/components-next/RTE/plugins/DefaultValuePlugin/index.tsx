import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getSelection, $insertNodes } from "lexical";
import React from "react";

function DefaultValuePlugin(props: { defaultValue: string }) {
  const { defaultValue } = props;
  const [editor] = useLexicalComposerContext();

  // Set editor default value
  React.useEffect(() => {
    return editor.update(() => {
      const selection = $getSelection();
      if (selection === null) {
        const parser = new DOMParser();
        const dom = parser.parseFromString(String(defaultValue), "text/html");
        const nodes = $generateNodesFromDOM(editor, dom);
        $insertNodes(nodes);
      }
    });
  }, [editor, defaultValue]);

  return null;
}

export { DefaultValuePlugin };
