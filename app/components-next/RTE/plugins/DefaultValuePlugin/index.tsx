import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $insertNodes, $setSelection } from "lexical";
import React from "react";
import { type OverrideableInputProps } from "../../RTE";

function DefaultValuePlugin(
  props: Pick<OverrideableInputProps, "defaultValue">
) {
  const { defaultValue } = props;
  const [editor] = useLexicalComposerContext();
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Set editor default value
  React.useEffect(() => {
    if (isInitialized === false) {
      return editor.update(() => {
        const root = $getRoot();
        if (root.getTextContentSize() === 0) {
          const parser = new DOMParser();
          const dom = parser.parseFromString(String(defaultValue), "text/html");
          const nodes = $generateNodesFromDOM(editor, dom);
          $insertNodes(nodes);
          $setSelection(null);
          setIsInitialized(true);
        }
      });
    }
  }, [editor, defaultValue, isInitialized]);

  return null;
}

export { DefaultValuePlugin };
