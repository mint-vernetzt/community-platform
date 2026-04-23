// Design
// Name: Hinweis
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=12822-5235&m=dev

import { Children, isValidElement } from "react";

function Hint(props: { children: React.ReactNode }) {
  const childrenArray = Children.toArray(props.children);

  const infoIcon = childrenArray.find((child) => {
    return isValidElement(child) && child.type === Hint.InfoIcon;
  });

  const otherChildren = childrenArray.filter((child) => {
    if (isValidElement(child)) {
      return child.type !== Hint.InfoIcon;
    }
    return true;
  });

  if (typeof infoIcon === "undefined") {
    return (
      <p className="py-2 px-4 rounded-lg bg-primary-50 text-neutral-600">
        {props.children}
      </p>
    );
  }

  return (
    <div className="py-2 px-4 rounded-lg bg-primary-50 text-neutral-600 flex gap-2">
      {infoIcon}
      <div>{otherChildren}</div>
    </div>
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
