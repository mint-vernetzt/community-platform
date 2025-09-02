import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useState } from "react";
import { type UseFormRegisterReturn } from "react-hook-form";
import { type InputForFormProps } from "../../RTE";

function InputForFormPlugin(
  props: InputForFormProps & {
    legacyFormRegister?: UseFormRegisterReturn<
      "bioRTEState" | "descriptionRTEState"
    >;
  }
) {
  const { contentEditableRef, legacyFormRegister, ...rest } = props;
  const [editor] = useLexicalComposerContext();
  const [htmlValue, setHtmlValue] = useState("");
  const [editorStateValue, setEditorStateValue] = useState<string>(
    String(rest.defaultValue)
  );

  // Synchronize the values of the inputs with the editor content
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      if (contentEditableRef.current !== null) {
        editor.read(() => {
          if (contentEditableRef.current !== null) {
            const htmlString = contentEditableRef.current.innerHTML;
            console.log("HTML string from editor: ", htmlString);

            if (htmlString === "<p><br></p>") {
              setHtmlValue("");
            } else {
              setHtmlValue(htmlString);
            }
          }
        });
      }
      editor.read(() => {
        const editorState = editor.getEditorState();
        const editorStateJSON = JSON.stringify(editorState.toJSON());
        setEditorStateValue(String(editorStateJSON));
      });
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
