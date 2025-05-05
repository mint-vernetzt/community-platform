import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
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
          if (typeof defaultValue !== "undefined") {
            const editorState = editor.parseEditorState(String(defaultValue));
            editor.setEditorState(editorState);
          }
        });
      }
    };

    document.addEventListener("reset", handleFormReset);

    return () => {
      document.removeEventListener("reset", handleFormReset);
    };
  }, [editor, defaultValue]);

  React.useEffect(() => {
    // Reset editor to default state on idle but only if there is difference between default value and editor value
    if (navigation.state === "idle" && typeof defaultValue !== "undefined") {
      return editor.update(() => {
        if (typeof defaultValue !== "undefined") {
          const editorState = editor.parseEditorState(String(defaultValue));
          editor.setEditorState(editorState);
        }
      });
    }
  }, [navigation, editor, defaultValue]);

  return null;
}

export { DefaultValuePlugin };
