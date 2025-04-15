import {
  Input,
  type InputLabelProps,
} from "@mint-vernetzt/components/src/molecules/Input";
import React from "react";

function ConformSelectControls(props: React.PropsWithChildren) {
  return (
    <div className="mv-shrink-0 mv-flex mv-gap-4 mv-ml-auto">
      {props.children}
    </div>
  );
}

function ConformSelectInput(props: {
  id: string;
  disabled?: boolean;
  cta: string;
  listItems: React.ReactNode[];
}) {
  const { id, disabled = false, cta, listItems } = props;

  return (
    <>
      <input
        id={id}
        type="checkbox"
        className="mv-peer mv-fixed mv-w-0 mv-h-0 mv-opacity-0 mv-top-0 mv-left-0 group-has-[:checked]/conform-select:mv-w-screen group-has-[:checked]/conform-select:mv-h-dvh"
        defaultChecked={false}
        disabled={disabled === true}
      />
      <label
        className={`mv-relative mv-bg-white mv-rounded-lg mv-border mv-border-neutral-300 mv-w-full mv-p-2 mv-pr-12 mv-text-base mv-leading-snug mv-font-semibold group-focus-within/conform-select:mv-border-blue-400 peer-focus:mv-border-blue-400 peer-focus:mv-ring-2 peer-focus:mv-ring-blue-500 ${
          disabled === true ? "mv-text-neutral-300" : "mv-text-neutral-800"
        }`}
        htmlFor={id}
      >
        {cta}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="21"
          fill="none"
          viewBox="0 0 20 21"
          className="mv-absolute mv-right-2 mv-top-2 group-has-[:checked]/conform-select:mv-rotate-180"
        >
          <path
            stroke="#262D38"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.4"
            d="m5 7.5 5 5.5 5-5.5"
          />
        </svg>
      </label>
      <ul className="mv-w-full mv-hidden group-has-[:checked]/conform-select:mv-flex mv-flex-col mv-bg-white mv-z-10 mv-max-h-96 mv-overflow-y-auto mv-rounded-lg mv-p-2 mv-border mv-border-gray-300">
        {listItems.map((button) => {
          if (React.isValidElement(button)) {
            if (button.type === "button") {
              return (
                <li
                  key={button.key}
                  className="mv-w-full hover:mv-text-white hover:mv-bg-primary-200 focus-within:mv-text-white focus-within:mv-bg-primary-200 mv-rounded focus-within:mv-rounded-none"
                >
                  {button}
                </li>
              );
            } else {
              return (
                <li key={button.key} className="mv-w-full">
                  {button}
                </li>
              );
            }
          }
          return null;
        })}
      </ul>
    </>
  );
}

type ConformSelectProps = React.PropsWithChildren<
  Pick<React.HTMLProps<HTMLLabelElement>, "id"> & {
    cta: string;
    disabled?: boolean;
  }
>;

function ConformSelect(props: ConformSelectProps) {
  const { children, disabled = false } = props;
  const validChildren = React.Children.toArray(children).filter((child) => {
    return React.isValidElement(child) || typeof child === "string";
  });

  const error = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === Input.Error;
  });

  const labelString = validChildren.find((child) => {
    return typeof child === "string";
  });
  const labelComponent = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === Input.Label;
  }) as React.ReactElement;

  type LabelComponentType = React.DetailedReactHTMLElement<
    React.PropsWithChildren<InputLabelProps>,
    HTMLLabelElement
  > & { ref: React.RefObject<HTMLLabelElement> };

  let label: LabelComponentType | React.ReactElement | undefined;
  if (typeof labelString !== "undefined") {
    label = (
      <Input.Label
        htmlFor={props.id}
        hasError={typeof error !== "undefined"}
        hidden
      >
        {labelString}
      </Input.Label>
    );
  } else if (typeof labelComponent !== "undefined") {
    label = React.cloneElement<React.PropsWithChildren<InputLabelProps>>(
      labelComponent as LabelComponentType,
      {
        hasError: typeof error !== "undefined",
      }
    );
  }

  if (typeof label === "undefined") {
    throw new Error("ConformSelect component must have a label");
  }

  const listItems = validChildren.filter((child) => {
    return (
      React.isValidElement(child) &&
      (child.type === "button" || child.type === "div")
    );
  });

  const helperText = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === Input.HelperText;
  });

  const controls = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === ConformSelectControls;
  });

  return (
    <div className="w-full">
      {label}
      {typeof controls !== "undefined" ? (
        <div className="mv-flex mv-flex-col mv-w-full">
          <div className="mv-flex mv-w-full mv-gap-2">
            <div className="mv-group/conform-select mv-flex w-full mv-flex-col">
              <ConformSelectInput
                id={`expand-${props.id}`}
                disabled={disabled}
                cta={props.cta}
                listItems={listItems}
              />
            </div>
            {controls}
          </div>
        </div>
      ) : (
        <div className="mv-group/conform-select mv-flex mv-flex-col mv-w-full">
          <ConformSelectInput
            id={`expand-${props.id}`}
            disabled={disabled}
            cta={props.cta}
            listItems={listItems}
          />
        </div>
      )}
      {helperText}
      {error}
    </div>
  );
}

ConformSelect.Label = Input.Label;
ConformSelect.HelperText = Input.HelperText;
ConformSelect.Error = Input.Error;
ConformSelect.Controls = ConformSelectControls;

export { ConformSelect };
