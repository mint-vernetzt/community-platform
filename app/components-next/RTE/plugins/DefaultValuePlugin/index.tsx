import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
// import { $generateNodesFromDOM } from "@lexical/html";
// import {
//   $getRoot,
//   $insertNodes,
//   $setSelection,
//   CLEAR_HISTORY_COMMAND,
// } from "lexical";
import React from "react";
import { useNavigation } from "react-router";
import { type InputForFormProps } from "../../RTE";

function DefaultValuePlugin(props: Pick<InputForFormProps, "defaultValue">) {
  const { defaultValue } = props;
  const [editor] = useLexicalComposerContext();
  const navigation = useNavigation();

  // Reset editor to default state on form reset
  React.useEffect(() => {
    const handleFormReset = () => {
      if (typeof defaultValue !== "undefined") {
        editor.update(() => {
          const editorState = editor.parseEditorState(String(defaultValue));
          editor.setEditorState(editorState);
          // const root = $getRoot();
          // root.clear();
          // const parser = new DOMParser();
          // const dom = parser.parseFromString(String(defaultValue), "text/html");
          // const nodes = $generateNodesFromDOM(editor, dom);
          // $insertNodes(nodes);
          // $setSelection(null);
        });
      }
      // editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
    };

    document.addEventListener("reset", handleFormReset);

    return () => {
      document.removeEventListener("reset", handleFormReset);
    };
  }, [editor, defaultValue]);

  React.useEffect(() => {
    // Reset editor to default state on idle but only if there is difference between default value and editor value
    if (navigation.state === "idle" && typeof defaultValue !== "undefined") {
      // const htmlString = contentEditableRef.current.getHTML();
      // const shouldReset = htmlString !== defaultValue;
      // if (shouldReset) {
      // editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
      return editor.update(() => {
        const editorState = editor.parseEditorState(String(defaultValue));
        editor.setEditorState(editorState);
        // const root = $getRoot();
        // root.clear();
        // const parser = new DOMParser();
        // const dom = parser.parseFromString(String(defaultValue), "text/html");
        // console.log("DefaultValuePlugin - dom", dom);
        // const nodes = $generateNodesFromDOM(editor, dom);
        // $insertNodes(nodes);
        // $setSelection(null);
      });
      // }
    }
  }, [navigation, editor, defaultValue]);

  return null;
}

export { DefaultValuePlugin };
