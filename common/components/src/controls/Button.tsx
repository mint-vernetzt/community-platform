import React from "react";

type ButtonSize = "small" | "medium" | "large";

type ButtonProps = {
  size?: ButtonSize;
};

function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonProps
) {
  const { size = "medium" } = props;

  let buttonClass = "btn-md";
  let fontSize = "text-sm";
  let padding = "px-7 py-2";
  if (size === "small") {
    buttonClass = "btn-sm";
    fontSize = "text-xs";
    padding = "px-4";
  } else if (size === "large") {
    buttonClass = "btn-lg";
    fontSize = "text-base";
    padding = "px-10";
  }

  return (
    <button
      className={`btn ${buttonClass} ${fontSize} ${padding} font-semibold bg-primary hover:bg-primary-400 active:bg-primary-700 text-neutral-50`}
    >
      {props.children}
    </button>
  );
}

export default Button;
