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
  quillRef?: React.RefObject<ReactQuill>;
}

export function RTE({ id, defaultValue, maxLength, quillRef }: RTEProps) {
  const toolbar = `toolbar_${id}`;
  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => {
    if (quillRef !== undefined) {
      if (quillRef.current !== null) {
        // Add additional classnames
        const additionalClassNames = [
          "mv-border-l-0",
          "mv-border-r-0",
          "mv-border-b-0",
          "mv-border-t",
        ];
        quillRef.current
          .getEditingArea()
          .classList.add(...additionalClassNames);
        // Prevent focus trap by deleting the "Tab" key binding -> But this also removes the indentation functionality of the "Tab" key -> What is more important?
        // Maybe we could add code that exits the focus trap when pushing "Tab" key twice in a short time?
        const keyboard = quillRef.current.getEditor().getModule("keyboard");
        delete keyboard.bindings[9];
        // Undoing / preventing the input when content length is greater than the max length property (which is used for the character counter)
        const content = quillRef.current.getEditor().getText();
        const contentLength = content.length;
        const trimmedContent = content.trim();
        const trimmedContentLength = trimmedContent.length;
        const htmlContent = quillRef.current.getEditorContents().toString();
        const trimmedHtml = htmlContent
          .replace(/^(<p><br><\/p>)+/gi, "")
          .replace(/(<p><br><\/p>)+$/gi, "")
          .replace(/^<p>( )+/gi, "<p>")
          .replace(/( )+<\/p>$/gi, "</p>");
        if (maxLength !== undefined && trimmedContentLength > maxLength) {
          // Check the delta to also cut copy paste input
          const delta = contentLength - maxLength - 1;
          // Use slice to cut the string right were the cursor currently is at (Thats the place were to many characters got inserted, so there they have to be removed)
          const currentCursorIndex =
            quillRef.current.getEditorSelection()?.index || 0;
          const slicedContent = `${trimmedContent.slice(
            0,
            currentCursorIndex - delta
          )}${trimmedContent.slice(currentCursorIndex, contentLength)}`;
          quillRef.current.getEditor().setText(slicedContent);
          // Unfortunatly cursor moves to the beginning of the line after resetting the text. Thats why below line is added.
          quillRef.current
            .getEditor()
            .setSelection(currentCursorIndex - delta, 0);
        } else {
          setTextareaContentById(id, trimmedHtml);
        }
      }
    }
  }, [quillRef, value, maxLength, id]);

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
          modules={{ toolbar: `#${toolbar}` }}
          onChange={setValue}
          value={value}
          className="mv-pb-10"
        />
      </div>
    </React.Suspense>
  );
}
