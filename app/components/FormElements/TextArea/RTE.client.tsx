import * as React from "react";
import ReactQuill from "react-quill";
import {
  countHtmlEntities,
  countHtmlLineBreakTags,
  replaceHtmlEntities,
  removeHtmlTags,
} from "~/lib/utils/sanitizeUserHtml";

export function setTextareaContentById(id: string, text: string) {
  if (typeof window !== "undefined") {
    const $input = document.getElementById(id);
    if ($input && Object?.getOwnPropertyDescriptor !== undefined) {
      var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call($input, text);
      }

      var inputEvent = new Event("input", { bubbles: true });
      $input.dispatchEvent(inputEvent);
    }
  }
}

interface RTEProps {
  id: string;
  defaultValue: string;
  maxLength?: number;
}

export function RTE({ id, defaultValue, maxLength }: RTEProps) {
  const quillRef = React.useRef<ReactQuill>(null);
  const toolbar = `toolbar_${id}`;

  React.useEffect(() => {
    if (quillRef.current) {
      const additionalClassNames = [
        "mv-border-l-0",
        "mv-border-r-0",
        "mv-border-b-0",
        "mv-border-t",
      ];
      quillRef.current.getEditingArea().classList.add(...additionalClassNames);
      // Prevent focus trap by deleting the "Tab" key binding -> But this also removes the indentation functionality of the "Tab" key -> What is more important?
      const keyboard = quillRef.current.getEditor().getModule("keyboard");
      delete keyboard.bindings[9];
    }
  }, [quillRef]);

  return (
    <React.Suspense fallback={<div>Richtext Editor loading...</div>}>
      <div className="mv-rounded-lg mv-border mv-border-gray-300 mv-overflow-hidden">
        <div className="mv-border-0" id={`${toolbar}`}>
          <div className="ql-formats">
            <button className="ql-bold">fett</button>
            <button className="ql-italic">kursiv</button>
            <button className="ql-underline">unterstrichen</button>
          </div>
          <div className="ql-formats">
            <button type="button" className="ql-list" value="ordered">
              nummerierte Liste
            </button>
            <button type="button" className="ql-list" value="bullet">
              unnummerierte Liste
            </button>
          </div>
          <div className="ql-formats">
            <button type="button" className="ql-link">
              Link
            </button>
          </div>
          <div className="ql-formats">
            <button className="ql-clean">Format entfernen</button>
          </div>
        </div>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          defaultValue={defaultValue}
          modules={{ toolbar: `#${toolbar}` }}
          onKeyDown={(event: React.KeyboardEvent<ReactQuill>) => {
            if (quillRef.current) {
              const htmlLineBreakCount = countHtmlLineBreakTags(
                quillRef.current.getEditorContents().toString()
              );
              const htmlEntityCount = countHtmlEntities(
                quillRef.current.getEditorContents().toString()
              );
              const sanitizedHtml = replaceHtmlEntities(
                removeHtmlTags(quillRef.current.getEditorContents().toString())
              );
              // Html entities (f.e. &amp;) and html line breaks (<br>) are counted and added to the character counter
              const contentLength =
                sanitizedHtml.length + htmlLineBreakCount + htmlEntityCount;

              if (maxLength !== undefined && contentLength <= maxLength) {
                // Remove all html tags by setting an empty string when input is empty (actually its not empty, instead they put a \n inside...)
                if (
                  (quillRef.current.getEditingArea() as HTMLDivElement)
                    .innerText === "\n"
                ) {
                  setTextareaContentById(id, "");
                } else {
                  console.log(quillRef.current.getEditorContents().toString());
                  setTextareaContentById(
                    id,
                    quillRef.current.getEditorContents().toString()
                  );
                }
              } else {
                event.preventDefault();
              }
            }
          }}
          className="mv-pb-10"
        />
      </div>
    </React.Suspense>
  );
}
