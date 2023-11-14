import * as React from "react";
import ReactQuill from "react-quill";

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
    }
  }, [quillRef]);

  return (
    <React.Suspense fallback={<div>Richtext Editor loading...</div>}>
      <div className="mv-rounded-lg mv-border mv-border-gray-300 mv-overflow-hidden">
        <div className="mv-border-0" id={`${toolbar}`}>
          <div className="ql-formats">
            <select className="ql-header">
              <option value="2">Überschrift 1</option>
              <option value="3">Überschrift 2</option>
              <option value="4">Überschrift 3</option>
              <option value="" selected>
                Text
              </option>
            </select>
          </div>
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
          onChange={(content) => {
            setTextareaContentById(id, content);
          }}
          modules={{ toolbar: `#${toolbar}` }}
          onKeyDown={() => {
            if (
              maxLength !== undefined &&
              quillRef.current &&
              quillRef.current.getEditor().getText().length > maxLength
            ) {
              quillRef.current
                .getEditor()
                .deleteText(
                  maxLength - 1,
                  quillRef.current.getEditor().getText().length
                );
            }
          }}
          className="mv-pb-10"
        />
      </div>
    </React.Suspense>
  );
}
