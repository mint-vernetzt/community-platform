import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { type UseFormRegisterReturn } from "react-hook-form";
import { type InputForFormProps } from "../../RTE";
import { useEffect, useState } from "react";

function InputForFormPlugin(
  props: InputForFormProps & {
    legacyFormRegister?: UseFormRegisterReturn<
      "bioRTEState" | "descriptionRTEState"
    >;
  }
) {
  const {
    legacyFormRegister,
    htmlDefaultValue,
    rteStateDefaultValue,
    contentEditableRef,
    ...rest
  } = props;
  const [editor] = useLexicalComposerContext();
  const [htmlValue, setHtmlValue] = useState(
    typeof htmlDefaultValue === "string" ? htmlDefaultValue : ""
  );
  const [editorStateValue, setEditorStateValue] = useState(
    typeof rteStateDefaultValue === "string" ? rteStateDefaultValue : ""
  );
  const [editorStateInitialized, setEditorStateInitialized] = useState(false);

  useEffect(() => {
    // First init the editor state
    editor.update(
      () => {
        if (typeof rteStateDefaultValue === "string") {
          const editorState = editor.parseEditorState(rteStateDefaultValue);
          if (editorState.isEmpty() === false) {
            editor.setEditorState(editorState);
          }
        }
        setEditorStateInitialized(true);
      },
      {
        discrete: true,
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editorStateInitialized === false) {
      return;
    }
    // Second, synchronize the values of the inputs with the editor content on update
    let isFirstUpdate = true;
    const onEditorUpdate = () => {
      if (isFirstUpdate) {
        isFirstUpdate = false;
        return; // Ignore the first update event
      }
      if (contentEditableRef.current !== null) {
        editor.read(() => {
          if (contentEditableRef.current !== null) {
            const htmlString = contentEditableRef.current.innerHTML;
            if (htmlString === "<p><br></p>") {
              setHtmlValue("");
            } else {
              setHtmlValue(
                htmlString.replaceAll(
                  /^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g,
                  ""
                )
              );
            }
          }
        });
      }
      editor.read(() => {
        const editorState = editor.getEditorState();
        const editorStateJSON = JSON.stringify(editorState.toJSON());
        setEditorStateValue(String(editorStateJSON));
      });
    };
    return editor.registerUpdateListener(onEditorUpdate);
  }, [editorStateInitialized, contentEditableRef, editor]);

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
