import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { type InputForFormProps } from "../../RTE";
import { useEffect, useState } from "react";
import { type UseFormRegisterReturn } from "react-hook-form";

function InputForFormPlugin(
  props: Omit<InputForFormProps, "defaultValue"> & {
    legacyFormRegister?: UseFormRegisterReturn<"bioRTEState">;
  }
) {
  const { contentEditableRef, legacyFormRegister, ...rest } = props;
  const [editor] = useLexicalComposerContext();
  const [htmlValue, setHtmlValue] = useState("");
  const [editorStateValue, setEditorStateValue] = useState("");

  // Synchronize the values of the inputs with the editor content
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      if (contentEditableRef.current !== null) {
        editor.read(() => {
          if (contentEditableRef.current !== null) {
            const htmlString = contentEditableRef.current.innerHTML;
            if (htmlString === "<p><br></p>") {
              setHtmlValue("");
            } else {
              setHtmlValue(htmlString);
            }
            const editorState = editor.getEditorState();
            const editorStateJSON = JSON.stringify(editorState);
            setEditorStateValue(editorStateJSON);
          }
        });
      }
    });
  }, [editor, contentEditableRef]);

  return (
    <>
      <input
        {...rest}
        tabIndex={-1}
        value={htmlValue}
        onChange={(event) => {
          event.preventDefault();
        }}
        className="mv-hidden"
        onFocus={(event) => {
          event.preventDefault();
          event.stopPropagation();
          editor.focus();
        }}
      />
      {typeof legacyFormRegister === "undefined" ? (
        <input
          {...rest}
          id={`${rest.id}-rte-state`}
          name={`${rest.name}RTEState`}
          tabIndex={-1}
          value={editorStateValue}
          onChange={(event) => {
            event.preventDefault();
          }}
          className="mv-hidden"
          onFocus={(event) => {
            event.preventDefault();
            event.stopPropagation();
            editor.focus();
          }}
        />
      ) : (
        <input
          {...legacyFormRegister}
          tabIndex={-1}
          value={editorStateValue}
          onChange={(event) => {
            event.preventDefault();
          }}
          className="mv-hidden"
          onFocus={(event) => {
            event.preventDefault();
            event.stopPropagation();
            editor.focus();
          }}
        />
      )}
    </>
  );
}

export { InputForFormPlugin };
