import * as React from "react";
import type ReactQuill from "react-quill";

export const LazyQuill = React.lazy(async () => {
  const module = await import("react-quill");
  return { default: module.default };
});

const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

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

  return (
    <React.Suspense fallback={<div>Richtext Editor loading...</div>}>
      <LazyQuill
        ref={quillRef}
        theme="snow"
        defaultValue={defaultValue}
        onChange={(content) => {
          setTextareaContentById(id, content);
        }}
        modules={modules}
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
