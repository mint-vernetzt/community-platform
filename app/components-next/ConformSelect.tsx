import {
  Input,
  type InputLabelProps,
} from "@mint-vernetzt/components/src/molecules/Input";
import React from "react";

type ButtonSelectProps = React.PropsWithChildren<
  Pick<React.HTMLProps<HTMLLabelElement>, "id"> & {
    cta: string;
    disabled?: boolean;
  }
>;

function ConformSelect(props: ButtonSelectProps) {
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
  });
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
    throw new Error("ButtonSelect component must have a label");
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

  const [checked, setChecked] = React.useState(false);
  const labelRef = React.useRef<HTMLLabelElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    event.stopPropagation();
    setChecked(!checked);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        labelRef.current !== null &&
        inputRef.current !== null &&
        target !== labelRef.current &&
        target !== inputRef.current
      ) {
        setChecked(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [labelRef, inputRef]);

  return (
    <div className="w-full">
      {label}
      <div className="mv-group mv-flex mv-flex-col mv-w-full">
        <input
          id={`expand-${props.id}`}
          type="checkbox"
          className="mv-w-0 mv-h-0 mv-opacity-0"
          checked={checked}
          onChange={handleChange}
          ref={inputRef}
          disabled={disabled === true}
        />
        <label
          className={`mv-bg-white mv-bg-select-arrow mv-bg-no-repeat mv-bg-[right_0.5rem_center] mv-rounded-lg mv-border mv-border-neutral-300 mv-w-full mv-p-2 mv-pr-12 mv-text-base mv-leading-snug mv-font-semibold group-focus-within:mv-border-blue-400 ${
            disabled === true ? "mv-text-neutral-300" : "mv-text-neutral-800"
          }`}
          htmlFor={`expand-${props.id}`}
          ref={labelRef}
        >
          {props.cta}
        </label>
        <ul className="mv-w-full mv-hidden group-has-[:checked]:mv-flex mv-flex-col mv-bg-white mv-z-10 mv-max-h-96 mv-overflow-y-auto mv-rounded-lg mv-p-2 mv-border mv-border-gray-300">
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
      </div>
      {helperText}
      {error}
    </div>
  );
}

ConformSelect.Label = Input.Label;
ConformSelect.HelperText = Input.HelperText;
ConformSelect.Error = Input.Error;

export { ConformSelect };
