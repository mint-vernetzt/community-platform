import classNames from "classnames";
import { Children, isValidElement } from "react";

function FormControlLabel(props: React.PropsWithChildren) {
  return (
    <span className="hyphens-auto" lang="de">
      {props.children}
    </span>
  );
}

function FromControlInfo(props: { id: string } & React.PropsWithChildren) {
  const { children, ...otherProps } = props;

  return (
    <>
      <input
        {...otherProps}
        form="none"
        type="checkbox"
        className="peer h-0 w-0 opacity-0 fixed top-0 left-0"
        onChange={(event) => {
          event.stopPropagation();
        }}
      />
      <span className="px-4 pb-2.5 hidden peer-[:checked]:block text-sm whitespace-normal">
        {children}
      </span>
    </>
  );
}

function FormControlCounter(props: React.PropsWithChildren) {
  return <span className="ml-auto">{props.children}</span>;
}

function Checkbox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <>
      <div className="w-5 h-5 relative">
        <input {...props} type="checkbox" className="h-0 w-0 opacity-0 fixed" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          viewBox="0 0 20 20"
          className="block group-has-[:checked]:hidden"
        >
          <path
            fill="currentColor"
            d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
          />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          viewBox="0 0 20 20"
          className="hidden group-has-[:checked]:block"
        >
          <path
            fill="currentColor"
            d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
          />
          <path
            fill="currentColor"
            d="M13.712 6.212a.937.937 0 0 1 1.34 1.312l-4.991 6.238a.938.938 0 0 1-1.349.026L5.404 10.48A.938.938 0 0 1 6.73 9.154l2.617 2.617 4.34-5.53a.3.3 0 0 1 .025-.029Z"
          />
        </svg>
      </div>
    </>
  );
}

function Radio(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <>
      <input {...props} type="radio" className="h-0 w-0 opacity-0 absolute" />
      <div className="w-5 h-5 relative">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block group-has-[:checked]:hidden"
        >
          <rect
            x="0.6"
            y="0.6"
            width="18.8"
            height="18.8"
            rx="9.4"
            fill="white"
          />
          <rect
            x="0.6"
            y="0.6"
            width="18.8"
            height="18.8"
            rx="9.4"
            stroke="#3C4658"
            strokeWidth="1.2"
          />
        </svg>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="hidden group-has-[:checked]:block"
        >
          <rect
            x="0.6"
            y="0.6"
            width="18.8"
            height="18.8"
            rx="9.4"
            fill="white"
          />
          <rect
            x="0.6"
            y="0.6"
            width="18.8"
            height="18.8"
            rx="9.4"
            stroke="#3C4658"
            strokeWidth="1.2"
          />
          <rect
            x="3.5"
            y="3.5"
            width="13"
            height="13"
            rx="6.5"
            fill="#3C4658"
          />
          <rect
            x="3.5"
            y="3.5"
            width="13"
            height="13"
            rx="6.5"
            stroke="#3C4658"
          />
        </svg>
      </div>
    </>
  );
}

export function FormControl(
  props: React.InputHTMLAttributes<HTMLInputElement> &
    React.PropsWithChildren & {
      labelPosition?: "left" | "right";
    }
) {
  const { children, labelPosition = "left", ...otherProps } = props;

  const childrenArray = Children.toArray(children);

  const label = childrenArray.find((child) => {
    return isValidElement(child) && child.type === FormControlLabel;
  });

  const counter = childrenArray.find((child) => {
    return isValidElement(child) && child.type === FormControlCounter;
  });

  const info = childrenArray.find((child) => {
    return isValidElement(child) && child.type === FromControlInfo;
  });

  const classes = classNames(
    "group px-4 py-2.5 flex justify-between items-center gap-1 transition",
    props.disabled ? "text-gray-400 cursor-auto" : "cursor-pointer",
    props.hidden ? "hidden" : ""
  );

  return (
    <>
      <label className={classes}>
        {props.type === "checkbox" && labelPosition === "right" && (
          <Checkbox {...otherProps} />
        )}
        {props.type === "radio" && labelPosition === "right" && (
          <Radio {...otherProps} />
        )}
        <span className="whitespace-normal">{label}</span>
        {typeof info !== "undefined" && (
          <label
            htmlFor={
              typeof info === "object" &&
              "props" in info &&
              typeof info.props === "object" &&
              info.props !== null &&
              "id" in info.props &&
              typeof info.props.id === "string"
                ? info.props.id
                : String(label)
            }
            className="h-[20px] hover:text-primary focus:text-primary"
            aria-label={String(label)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="rounded-full border border-neutral-50"
            >
              <rect
                x="0.5"
                y="0.5"
                width="19"
                height="19"
                rx="9.5"
                stroke="currentColor"
              />
              <rect
                x="9"
                y="8"
                width="2"
                height="7"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="9"
                y="5"
                width="2"
                height="2"
                rx="1"
                fill="currentColor"
              />
            </svg>
          </label>
        )}
        {counter}
        {props.type === "checkbox" && labelPosition === "left" && (
          <Checkbox {...otherProps} />
        )}
        {props.type === "radio" && labelPosition === "left" && (
          <Radio {...otherProps} />
        )}
      </label>
      <span className={props.disabled ? "text-gray-400" : ""}>{info}</span>
    </>
  );
}

FormControl.Label = FormControlLabel;
FormControl.Info = FromControlInfo;
FormControl.Counter = FormControlCounter;
