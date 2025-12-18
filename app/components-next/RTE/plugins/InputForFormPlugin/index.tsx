import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { type UseFormRegisterReturn } from "react-hook-form";
import { type InputForFormProps } from "../../RTE";
import { useEffect, useState } from "react";
import { $getSelection, type EditorState } from "lexical";

function InputForFormPlugin(
  props: InputForFormProps & {
    legacyFormRegister?: UseFormRegisterReturn<
      "bioRTEState" | "descriptionRTEState"
    >;
    isFormDirty?: boolean;
  }
) {
  const {
    legacyFormRegister,
    htmlDefaultValue,
    rteStateDefaultValue,
    contentEditableRef,
    isFormDirty,
    ...rest
  } = props;
  const [editor] = useLexicalComposerContext();
  const [htmlValue, setHtmlValue] = useState(htmlDefaultValue);
  const [editorStateValue, setEditorStateValue] =
    useState(rteStateDefaultValue);
  const [initialEditorState, setInitialEditorState] =
    useState<EditorState | null>(null);

  useEffect(() => {
    editor.read(() => {
      const currentEditorState = editor.getEditorState();
      setInitialEditorState(currentEditorState);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  useEffect(() => {
    if (isFormDirty === false || typeof isFormDirty === "undefined") {
      editor.update(
        () => {
          let editorState = initialEditorState;
          if (rteStateDefaultValue !== "") {
            editorState = editor.parseEditorState(rteStateDefaultValue);
          }
          if (editorState !== null) {
            editor.setEditorState(editorState);
          }
          setEditorStateValue(rteStateDefaultValue);
          setHtmlValue(htmlDefaultValue);
        },
        {
          discrete: true,
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormDirty]);

  useEffect(() => {
    const onEditorUpdate = () => {
      let selection = null;
      editor.read(() => {
        selection = $getSelection();
      });
      if (selection === null) {
        return; // Ignore update events that where not caused by user input
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
  }, [contentEditableRef, editor]);

  return (
    <>
      <input
        {...rest}
        tabIndex={-1}
        value={htmlValue}
        onChange={(event) => {
          event.preventDefault();
        }}
        className="hidden"
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
          className="hidden"
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
          className="hidden"
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
