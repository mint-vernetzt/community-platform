import * as React from "react";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";

export interface TextAreaProps {
  id: string;
  label: string;
  isPublic?: boolean;
  withPublicPrivateToggle?: boolean;
  errorMessage?: string;
  publicPosition?: "top" | "side";
  onChange?: Function; // <--- ?
}

const TextArea = React.forwardRef(
  (props: React.HTMLProps<HTMLTextAreaElement> & TextAreaProps, ref) => {
    const {
      id,
      isPublic,
      placeholder,
      errorMessage,
      publicPosition = "side",
      ...rest
    } = props;
    return (
      <div className="form-control w-full">
        <div className="flex flex-row items-center mb-2">
          <label htmlFor={id} className="label flex-auto">
            {props.label}
            {props.required === true ? " *" : ""}
          </label>
          {props.withPublicPrivateToggle !== undefined &&
            isPublic !== undefined &&
            publicPosition === "top" && (
              <ToggleCheckbox
                name="privateFields"
                value={props.name}
                hidden={!props.withPublicPrivateToggle}
                defaultChecked={!isPublic}
              />
            )}
        </div>
        <div className="flex flex-row">
          <div className="flex-auto">
            <textarea
              {...rest}
              id={id}
              name={id}
              className={`textarea textarea-bordered h-24 w-full ${props.className}`}
            ></textarea>
          </div>
          {props.withPublicPrivateToggle !== undefined &&
            props.isPublic !== undefined &&
            publicPosition === "side" && (
              <ToggleCheckbox
                name="privateFields"
                value={props.name}
                hidden={!props.withPublicPrivateToggle}
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
