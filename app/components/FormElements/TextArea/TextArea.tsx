import * as React from "react";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";
import type ReactQuill from "react-quill";
import { RTE } from "../../../components-next/RTE";
import { useHydrated } from "remix-utils/use-hydrated";

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

    const isHydrated = useHydrated();

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
            {rte === true && isHydrated ? (
              <RTE
                defaultValue={`${rest.defaultValue || ""}`}
                placeholder="Enter your text here"
                maxLength={rest.maxLength}
              />
            ) : null}
            <textarea
              {...rest}
              id={id}
              className={`textarea textarea-bordered h-24 w-full ${
                props.className
              }${rte === true && isHydrated ? " hidden" : ""}`}
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
