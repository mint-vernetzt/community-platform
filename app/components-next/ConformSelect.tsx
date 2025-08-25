import {
  Input,
  type InputLabelProps,
} from "@mint-vernetzt/components/src/molecules/Input";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from "react";

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

  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const labelRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const { target } = event;
      if (
        isOpen === true &&
        inputRef.current !== null &&
        listRef.current !== null &&
        labelRef.current !== null &&
        inputRef.current !== target &&
        listRef.current !== target &&
        labelRef.current !== target &&
        inputRef.current.contains(target as Node) === false &&
        listRef.current.contains(target as Node) === false &&
        labelRef.current.contains(target as Node) === false
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  });

  return (
    <>
      <input
        ref={inputRef}
        id={id}
        type="checkbox"
        className="mv-peer mv-fixed mv-w-0 mv-h-0 mv-opacity-0 mv-top-0 mv-left-0"
        checked={isOpen}
        disabled={disabled === true}
        onChange={() => {
          setIsOpen((prev) => !prev);
        }}
      />
      <label
        ref={labelRef}
        className={`mv-relative mv-flex mv-gap-2.5 mv-justify-between mv-bg-white mv-rounded-lg mv-border mv-border-neutral-300 mv-w-full mv-pl-3 mv-py-2 mv-pr-2 mv-text-base mv-leading-5 mv-font-semibold peer-focus:mv-border-primary-200 peer-focus:mv-ring-1 peer-focus:mv-ring-primary-200 peer-checked:mv-rounded-b-none ${
          disabled === true ? "mv-text-neutral-300" : "mv-text-neutral-600"
        }`}
        htmlFor={id}
      >
        <span>{cta}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="21"
          fill="none"
          viewBox="0 0 20 21"
          className="group-has-[:checked]/conform-select:mv-rotate-180"
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
      <ul
        ref={listRef}
        className="mv-absolute mv-top-[64px] mv-w-full mv-hidden group-has-[:checked]/conform-select:mv-flex mv-flex-col mv-bg-white mv-z-10 mv-max-h-96 mv-overflow-y-auto mv-rounded-b-lg mv-border mv-border-gray-300 mv-border-t-transparent peer-focus:mv-border-t-primary-200"
      >
        {listItems.map((button) => {
          if (isValidElement(button)) {
            if (button.type === "button") {
              return (
                <li
                  key={button.key}
                  className="mv-border-2 mv-border-transparent hover:mv-bg-neutral-100 focus-within:mv-border-primary-200 last:mv-rounded-b-lg"
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
  const validChildren = Children.toArray(children).filter((child) => {
    return isValidElement(child) || typeof child === "string";
  });

  const error = validChildren.find((child) => {
    return isValidElement(child) && child.type === Input.Error;
  });

  const labelString = validChildren.find((child) => {
    return typeof child === "string";
  });
  const labelComponent = validChildren.find((child) => {
    return isValidElement(child) && child.type === Input.Label;
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
    label = cloneElement<React.PropsWithChildren<InputLabelProps>>(
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
      isValidElement(child) && (child.type === "button" || child.type === "div")
    );
  });

  const helperText = validChildren.find((child) => {
    return isValidElement(child) && child.type === Input.HelperText;
  });

  const controls = validChildren.find((child) => {
    return isValidElement(child) && child.type === ConformSelectControls;
  });

  return (
    <div className="mv-relative mv-w-full">
      {label}
      {typeof controls !== "undefined" ? (
        <div className="mv-flex mv-flex-col mv-w-full">
          <div className="mv-flex mv-w-full mv-gap-2">
            <div className="mv-group/conform-select mv-flex mv-w-full mv-flex-col">
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

function getListItemChildrenStyles() {
  return {
    className:
      "mv-w-full mv-appearance-none mv-px-3.5 mv-py-2.5 mv-text-start mv-text-neutral-700 mv-leading-5 focus:mv-outline-none",
  };
}

ConformSelect.Label = Input.Label;
ConformSelect.HelperText = Input.HelperText;
ConformSelect.Error = Input.Error;
ConformSelect.Controls = ConformSelectControls;
ConformSelect.getListItemChildrenStyles = getListItemChildrenStyles;

export { ConformSelect };
