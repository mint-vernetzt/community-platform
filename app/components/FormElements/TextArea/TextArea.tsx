import * as React from "react";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";

export interface TextAreaProps {
  id: string;
  label: string;
  isPublic?: boolean;
  errorMessage?: string;
}

const TextArea = React.forwardRef(
  (props: React.HTMLProps<HTMLTextAreaElement> & TextAreaProps, ref) => {
    const { id, isPublic, placeholder, errorMessage, ...rest } = props;
    return (
      <div className="form-control w-full">
        <label htmlFor={id} className="label">
          {props.label}
          {props.required === true ? " *" : ""}
        </label>
        <div className="flex flex-row">
          <div className="flex-auto">
            <textarea
              {...rest}
              id={id}
              name={id}
              className={`textarea textarea-bordered h-24 w-full ${props.className}`}
            ></textarea>
          </div>
          {props.isPublic !== undefined && (
            <ToggleCheckbox
              name="publicFields"
              value={props.name}
              defaultChecked
            />
          )}
        </div>
      </div>
    );
  }
);

export default TextArea;
TextArea.displayName = "TextArea";
