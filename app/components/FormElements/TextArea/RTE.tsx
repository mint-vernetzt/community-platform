import * as React from "react";
import type ReactQuill from "react-quill";

export const LazyQuill = React.lazy(async () => {
  const module = await import("react-quill");
  return { default: module.default };
});

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

  return (
    <React.Suspense fallback={<div>Richtext Editor loading...</div>}>
      <div id={`${toolbar}`}>
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
          <button className="ql-bold"></button>
          <button className="ql-italic"></button>
          <button className="ql-underline"></button>
        </div>
        <div className="ql-formats">
          <button type="button" className="ql-list" value="ordered" />
          <button type="button" className="ql-list" value="bullet" />
        </div>
        <div className="ql-formats">
          <button type="button" className="ql-link" />
        </div>
        <div className="ql-formats">
          <button className="ql-clean"></button>
        </div>
      </div>
      <LazyQuill
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
      />
    </React.Suspense>
  );
}
