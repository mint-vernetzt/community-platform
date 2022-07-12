import * as React from "react";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";

export interface TextAreaProps {
  id: string;
  label: string;
  isPublic?: boolean;
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
          {isPublic !== undefined && publicPosition === "top" && (
            <ToggleCheckbox
              name="publicFields"
              value={props.name}
              defaultChecked={isPublic}
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
          {props.isPublic !== undefined && publicPosition === "side" && (
            <ToggleCheckbox
              name="publicFields"
              value={props.name}
              defaultChecked={isPublic}
            />
          )}
        </div>
      </div>
    );
  }
);

export default TextArea;
TextArea.displayName = "TextArea";
