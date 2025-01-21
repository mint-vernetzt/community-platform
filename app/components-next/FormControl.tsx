import classNames from "classnames";
import React from "react";

function FormControlLabel(props: React.PropsWithChildren) {
  return (
    <span className="mv-hyphens-auto" lang="de">
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
        type="checkbox"
        className="mv-peer mv-h-0 mv-w-0 mv-opacity-0 mv-hidden"
        onChange={(event) => {
          event.stopPropagation();
        }}
      />
      <span className="mv-px-4 mv-pb-2.5 mv-hidden peer-[:checked]:mv-block mv-text-sm mv-whitespace-normal">
        {props.children}
      </span>
    </>
  );
}

function FormControlCounter(props: React.PropsWithChildren) {
  return <span className="mv-ml-auto">{props.children}</span>;
}

function Checkbox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <>
      <input
        {...props}
        type="checkbox"
        className="mv-h-0 mv-w-0 mv-opacity-0"
      />
      <div className="mv-w-5 mv-h-5 mv-relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          viewBox="0 0 20 20"
          className="mv-block group-has-[:checked]:mv-hidden"
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
          className="mv-hidden group-has-[:checked]:mv-block"
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
      <input
        {...props}
        type="radio"
        className="mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
      />
      <div className="mv-w-5 mv-h-5 mv-relative">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mv-block group-has-[:checked]:mv-hidden"
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
          className="mv-hidden group-has-[:checked]:mv-block"
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
  props: React.InputHTMLAttributes<HTMLInputElement> & React.PropsWithChildren
) {
  const { children, ...otherProps } = props;

  const childrenArray = React.Children.toArray(props.children);

  const label = childrenArray.find((child) => {
    return React.isValidElement(child) && child.type === FormControlLabel;
  });

  const counter = childrenArray.find((child) => {
    return React.isValidElement(child) && child.type === FormControlCounter;
  });

  const info = childrenArray.find((child) => {
    return React.isValidElement(child) && child.type === FromControlInfo;
  });

  const classes = classNames(
    "mv-group mv-px-4 mv-py-2.5 mv-flex mv-justify-between mv-items-center mv-cursor-pointer mv-gap-1 mv-transition",
    props.disabled && "mv-text-gray-400 mv-cursor-not-allowed"
  );

  return (
    <>
      <label className={classes}>
        <span className="mv-whitespace-normal">{label}</span>
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
                : undefined
            }
            className="mv-h-[20px] hover:mv-text-primary focus:mv-text-primary"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mv-rounded-full mv-border mv-border-neutral-50"
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
        {props.type === "checkbox" && <Checkbox {...otherProps} />}
        {props.type === "radio" && <Radio {...otherProps} />}
      </label>
      <span className={props.disabled ? "mv-text-gray-400" : ""}>{info}</span>
    </>
  );
}

FormControl.Label = FormControlLabel;
FormControl.Info = FromControlInfo;
FormControl.Counter = FormControlCounter;
