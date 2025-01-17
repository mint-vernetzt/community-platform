import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $insertNodes, $setSelection } from "lexical";
import React from "react";

function DefaultValuePlugin(props: { defaultValue: string }) {
  const { defaultValue } = props;
  const [editor] = useLexicalComposerContext();
  // Set editor default value
  React.useEffect(() => {
    console.log("Default value effect");
    const alreadyHasContent = editor.read(() => {
      const root = $getRoot();
      return root.getTextContentSize() > 0;
    });
    if (alreadyHasContent === false) {
      return editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(String(defaultValue), "text/html");
        const nodes = $generateNodesFromDOM(editor, dom);
        $insertNodes(nodes);
        $setSelection(null);
        console.log("Insert default value in editor");
      });
    }
  }, [editor, defaultValue]);

  return null;
}

export { DefaultValuePlugin };
