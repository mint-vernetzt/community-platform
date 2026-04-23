// Design
// Name: Hinweis
// Source: https://www.figma.com/design/9aKvb1kUWVYaLDi4xjRaSB/Event-Settings?node-id=288-7794&m=dev
// TODO: No component only frame

import React from "react";

function Hint(props: { children: React.ReactNode }) {
  return (
    <p className="inline-flex gap-2 py-2 px-4 rounded-lg bg-primary-50 text-neutral-600">
      {props.children}
    </p>
  );
}

function InfoIcon() {
  return (
    <div className="pt-1 text-primary-700">
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="0.5"
          y="0.5"
          width="14"
          height="14"
          rx="7"
          stroke="currentColor"
        />
        <rect
          x="6.69922"
          y="3.25"
          width="1.6"
          height="1.6"
          rx="0.8"
          fill="currentColor"
        />
        <rect
          x="6.75"
          y="6.15039"
          width="1.5"
          height="5.6"
          rx="0.4"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

Hint.InfoIcon = InfoIcon;

export default Hint;
