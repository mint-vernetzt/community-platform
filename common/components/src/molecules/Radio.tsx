import classnames from "classnames";
import React from "react";

export interface RadioProps {
  name: string;
  label: string;
  radioId?: string;
  errorMessage?: string;
  helperText?: string;
}

const Radio = React.forwardRef((props: RadioProps, forwardRef) => {
  const { radioId, errorMessage, helperText, ...rest } = props;

  return (
    <div className="mv-w-72 mv-py-5">
      <div className="w-full mv-mb-6">
        <div className="mv-text-neutral-600 mv-text-lg mv-font-semibold mv-mb-4">
          Label-Überschrift z.B. Räumliche Barrierefreiheit?
        </div>
        <div className="mv-flex mv-flex-row mv-flex-nowrap mv-gap-3 mv-py-2">
          <div className="flex-shrink-0 mv-w-4 mv-h-5 mv-flex mv-items-center">
            <input
              type="radio"
              name="radioName"
              id="{radioId}1"
              value="radioValue1"
              className="mv-appearance-none 
                mv-cursor-pointer
                mv-rounded-full mv-border mv-border-gray-700 mv-w-4 mv-h-4 mv-bg-white 
                checked:mv-border-primary-500 checked:mv-border-[5px]"
            />
          </div>
          <label
            htmlFor="{radioId}1"
            className={`mv-text-base mv-text-gray-700 mv-leading-5`}
          >
            Label
          </label>
        </div>
        <div className="mv-flex mv-flex-row mv-flex-nowrap mv-gap-3 mv-py-2">
          <div className="flex-shrink-0 mv-w-4 mv-h-5 mv-flex mv-items-center">
            <input
              type="radio"
              name="radioName"
              id="{radioId}2"
              value="radioValue2"
              className="mv-appearance-none 
                mv-cursor-pointer
                mv-rounded-full mv-border mv-border-gray-700 mv-w-4 mv-h-4 mv-bg-white 
                checked:mv-border-primary-500 checked:mv-border-[5px]"
            />
          </div>
          <label
            htmlFor="{radioId}2"
            className={`mv-text-base mv-text-gray-700 mv-leading-5`}
          >
            Label
          </label>
        </div>
        <div className="mv-flex mv-flex-row mv-flex-nowrap mv-gap-3 mv-py-2">
          <div className="flex-shrink-0 mv-w-4 mv-h-5 mv-flex mv-items-center">
            <input
              type="radio"
              name="radioName"
              id="{radioId}3"
              value="radioValue3"
              className="mv-appearance-none 
                mv-cursor-pointer
                mv-rounded-full mv-border mv-border-gray-700 mv-w-4 mv-h-4 mv-bg-white 
                checked:mv-border-primary-500 checked:mv-border-[5px]"
            />
          </div>
          <label
            htmlFor="{radioId}3"
            className={`mv-text-base mv-text-gray-700 mv-leading-5`}
          >
            Räumlich nicht barrierefrei Räumlich nicht barrierefrei Räumlich
            nicht barrierefrei Räumlich nicht barrierefrei
          </label>
        </div>
      </div>
    </div>
  );
});

export default Radio;
