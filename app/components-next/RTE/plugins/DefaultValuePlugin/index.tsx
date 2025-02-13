import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $getRoot,
  $insertNodes,
  $setSelection,
  CLEAR_HISTORY_COMMAND,
} from "lexical";
import React from "react";
import { type OverrideableInputProps } from "../../RTE";
import { useNavigation } from "react-router";

function DefaultValuePlugin(
  props: Pick<OverrideableInputProps, "defaultValue">
) {
  const { defaultValue = "" } = props;
  const [editor] = useLexicalComposerContext();
  const navigation = useNavigation();

  // Reset editor to default state on form reset
  React.useEffect(() => {
    const handleFormReset = () => {
      editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const parser = new DOMParser();
        const dom = parser.parseFromString(String(defaultValue), "text/html");
        const nodes = $generateNodesFromDOM(editor, dom);
        $insertNodes(nodes);
        $setSelection(null);
      });
    };

    document.addEventListener("reset", handleFormReset);

    return () => {
      document.removeEventListener("reset", handleFormReset);
    };
  }, [editor, defaultValue]);

  React.useEffect(() => {
    // Reset editor to default state on idle but only if there is difference between default value and editor value
    if (navigation.state === "idle") {
      const shouldReset = editor.read(() => {
        const htmlString = $generateHtmlFromNodes(editor);
        return htmlString !== defaultValue;
      });
      if (shouldReset) {
        editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
        return editor.update(() => {
          const root = $getRoot();
          root.clear();
          const parser = new DOMParser();
          const dom = parser.parseFromString(String(defaultValue), "text/html");
          const nodes = $generateNodesFromDOM(editor, dom);
          $insertNodes(nodes);
          $setSelection(null);
        });
      }
    }
  }, [navigation, editor, defaultValue]);

  return null;
}

export { DefaultValuePlugin };
