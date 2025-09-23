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
  return <div className="shrink-0 flex gap-4 ml-auto">{props.children}</div>;
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
        className="peer fixed w-0 h-0 opacity-0 top-0 left-0"
        checked={isOpen}
        disabled={disabled === true}
        onChange={() => {
          setIsOpen((prev) => !prev);
        }}
      />
      <label
        ref={labelRef}
        className={`relative flex gap-2.5 justify-between bg-white rounded-lg border border-neutral-300 w-full pl-3 py-2 pr-2 text-base leading-5 font-semibold peer-focus:border-primary-200 peer-focus:ring-1 peer-focus:ring-primary-200 peer-checked:rounded-b-none ${
          disabled === true ? "text-neutral-300" : "text-neutral-600"
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
          className="group-has-[:checked]/conform-select:rotate-180"
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
        className="absolute top-[64px] w-full hidden group-has-[:checked]/conform-select:flex flex-col bg-white z-10 max-h-96 overflow-y-auto rounded-b-lg border border-gray-300 border-t-transparent peer-focus:border-t-primary-200"
      >
        {listItems.map((button) => {
          if (isValidElement(button)) {
            if (button.type === "button") {
              return (
                <li
                  key={button.key}
                  className="border-2 border-transparent hover:bg-neutral-100 focus-within:border-primary-200 last:rounded-b-lg"
                >
                  {button}
                </li>
              );
            } else {
              return (
                <li key={button.key} className="w-full">
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
    <div className="relative w-full">
      {label}
      {typeof controls !== "undefined" ? (
        <div className="flex flex-col w-full">
          <div className="flex w-full gap-2">
            <div className="group/conform-select flex w-full flex-col">
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
        <div className="group/conform-select flex flex-col w-full">
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
      "w-full appearance-none px-3.5 py-2.5 text-start text-neutral-700 leading-5 focus:outline-hidden",
  };
}

ConformSelect.Label = Input.Label;
ConformSelect.HelperText = Input.HelperText;
ConformSelect.Error = Input.Error;
ConformSelect.Controls = ConformSelectControls;
ConformSelect.getListItemChildrenStyles = getListItemChildrenStyles;

export { ConformSelect };
