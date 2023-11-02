import classnames from "classnames";
import React from "react";

export interface CheckboxProps {
  name: string;
  label: string;
  checkboxId?: string;
  errorMessage?: string;
  helperText?: string;
}

const Checkbox = React.forwardRef(
  (props: React.HTMLProps<HTMLCheckboxElement> & CheckboxProps, forwardRef) => {
    const id = props.id ?? props.label;
    const { checkboxId, errorMessage, helperText, ...rest } = props;

    return (
      <div className="mv-w-72 mv-py-5">
        <div className="w-full mv-mb-6">
          <div className="mv-text-neutral-600 mv-text-lg mv-font-semibold mv-mb-4">
            Label-Überschrift z.B. Welche barrierefreien Elemente treffen zu?
          </div>
          <div className="mv-flex mv-flex-row mv-flex-nowrap mv-gap-3 mv-py-2 mv-mb-2 last:mv-mb-0">
            <div className="flex-shrink-0 mv-w-5 mv-h-5">
              <input
                type="checkbox"
                id={checkboxId}
                className="mv-appearance-none 
                mv-cursor-pointer
                mv-rounded-[2px] mv-border mv-border-gray-700 mv-w-5 mv-h-5 mv-bg-white 
                checked:mv-bg-checkbox-checked mv-bg-no-repeat mv-bg-center"
              />
            </div>
            <label
              htmlFor={checkboxId}
              className={`mv-text-base mv-text-gray-700 mv-leading-5`}
            >
              Label
            </label>
          </div>
          <div className="mv-flex mv-flex-row mv-flex-nowrap mv-gap-3 mv-py-2 mv-mb-2 last:mv-mb-0">
            <div className="flex-shrink-0 mv-w-5 mv-h-5">
              <input
                type="checkbox"
                id={checkboxId}
                className="mv-appearance-none 
                mv-cursor-pointer
                mv-rounded-[2px] mv-border mv-border-gray-700 mv-w-5 mv-h-5 mv-bg-white 
                checked:mv-bg-checkbox-checked mv-bg-no-repeat mv-bg-center"
              />
            </div>
            <label
              htmlFor={checkboxId}
              className={`mv-text-base mv-text-gray-700 mv-leading-5`}
            >
              Label
            </label>
          </div>
          <div className="mv-flex mv-flex-row mv-flex-nowrap mv-gap-3 mv-py-2 mv-mb-2 last:mv-mb-0">
            <div className="flex-shrink-0 mv-w-5 mv-h-5">
              <input
                type="checkbox"
                id={checkboxId}
                className="mv-appearance-none 
                mv-cursor-pointer
                mv-rounded-[2px] mv-border mv-border-gray-700 mv-w-5 mv-h-5 mv-bg-white 
                checked:mv-bg-checkbox-checked mv-bg-no-repeat mv-bg-center"
              />
            </div>
            <label
              htmlFor={checkboxId}
              className={`mv-text-base mv-text-gray-700 mv-leading-5`}
            >
              Safer Space vorhanden (Info: Ein Ort oder eine Umgebung, an dem
              sich eine Person sicherer fühlen kann, dass sie weniger
              Diskriminierung, Kritik, Belästigung oder anderen emotionalen oder
              körperlichen Schäden ausgesetzt ist.)
            </label>
          </div>
        </div>
      </div>
    );
  }
);

export default Checkbox;
