import classNames from "classnames";
import { type PropsWithChildren } from "react";

export type InputType = "text" | "password" | "email" | "number" | "hidden";

export type InputProps = {
  id: string;
  name?: string;
  type?: InputType;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  hiddenLabel?: boolean;
};

function Input(props: PropsWithChildren<InputProps>) {
  const { type = "text" } = props;

  const labelClasses = classNames(
    "mv-text-sm mv-text-gray-700 mv-font-semibold mv-mb-1 mv-flex mv-items-center",
    props.hiddenLabel && "mv-hidden"
  );

  if (type === "hidden") {
    return (
      <input
        type={type}
        id={props.id}
        name={props.name || props.id}
        value={props.value}
      />
    );
  }

  return (
    <div className="w-full mv-mb-6">
      <label htmlFor={props.id} className={labelClasses}>
        {props.children}
      </label>
      <div className="mv-relative">
        <input
          type={type}
          className="mv-rounded-lg mv-border mv-border-gray-300 mv-w-full mv-p-2 mv-pr-12 mv-text-gray-800 mv-text-base mv-leading-snug mv-font-semibold placeholder:mv-font-normal placeholder:mv-gray-400 focus:mv-border-blue-400 focus-visible:mv-outline-0"
          id={props.id}
          name={props.name || props.id}
          defaultValue={props.defaultValue}
          placeholder={props.placeholder}
        />
        <div className="mv-absolute mv-right-3 mv-top-1/2 mv--translate-y-1/2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            fill="none"
            viewBox="0 0 22 22"
          >
            <path
              fill="#454C5C"
              d="M16.15 13.811a8.491 8.491 0 1 0-1.825 1.826h-.002c.039.053.082.103.129.15l5.03 5.03a1.306 1.306 0 1 0 1.847-1.847l-5.03-5.03a1.309 1.309 0 0 0-.15-.129Zm.337-5.021a7.185 7.185 0 1 1-14.37 0 7.185 7.185 0 0 1 14.37 0Z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default Input;
