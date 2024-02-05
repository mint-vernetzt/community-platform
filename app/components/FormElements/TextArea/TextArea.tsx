import * as React from "react";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";
import { RTE } from "./RTE.client";
import { ClientOnly } from "remix-utils/client-only";
import type ReactQuill from "react-quill";

export interface TextAreaProps {
  id: string;
  label: string;
  isPublic?: boolean;
  withPublicPrivateToggle?: boolean;
  errorMessage?: string;
  publicPosition?: "top" | "side";
  rte?: boolean;
  quillRef?: React.RefObject<ReactQuill>;
}

const TextArea = React.forwardRef(
  (props: React.HTMLProps<HTMLTextAreaElement> & TextAreaProps, ref) => {
    const {
      id,
      isPublic,
      withPublicPrivateToggle,
      placeholder,
      errorMessage,
      publicPosition = "side",
      rte = false,
      ...rest
    } = props;

    const quillRef = React.useRef<ReactQuill>(
      props.quillRef !== undefined ? props.quillRef.current : null
    );

    return (
      <div className="form-control w-full">
        <div className="flex flex-row items-center mb-2">
          <label htmlFor={id} className="label flex-auto">
            {props.label}
            {props.required === true ? " *" : ""}
          </label>

          {withPublicPrivateToggle !== undefined &&
            isPublic !== undefined &&
            publicPosition === "top" && (
              <ToggleCheckbox
                name="privateFields"
                value={props.name}
                hidden={!withPublicPrivateToggle}
                defaultChecked={!isPublic}
              />
            )}
        </div>
        <div className="flex flex-row">
          <div className="flex-auto">
            {rte === true && (
              <ClientOnly>
                {() => {
                  return (
                    <RTE
                      id={id}
                      defaultValue={`${rest.defaultValue || ""}`}
                      maxLength={rest.maxLength}
                      quillRef={quillRef}
                    />
                  );
                }}
              </ClientOnly>
            )}
            <textarea
              {...rest}
              id={id}
              className={`textarea textarea-bordered h-24 w-full ${
                props.className
              }${rte === true ? " hidden" : ""}`}
            ></textarea>
          </div>
          {withPublicPrivateToggle !== undefined &&
            props.isPublic !== undefined &&
            publicPosition === "side" && (
              <ToggleCheckbox
                name="privateFields"
                value={props.name}
                hidden={!withPublicPrivateToggle}
                defaultChecked={!isPublic}
              />
            )}
        </div>
      </div>
    );
  }
);

export default TextArea;
TextArea.displayName = "TextArea";
