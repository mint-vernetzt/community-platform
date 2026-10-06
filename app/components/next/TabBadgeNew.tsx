// Design:
// Name: Tab Badge "Neu"
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10748-9608&m=dev

import classNames from "classnames";

function TabBadgeNew(
  props: React.PropsWithChildren<{ state?: "default" | "disabled" | "neutral" }>
) {
  const { state = "default" } = props;

  const spanClassName = classNames(
    "flex justify-center items-center w-fit rounded-full py-0.5 px-1.5",
    {
      "bg-positive-200": state === "default",
      "bg-positive-100": state === "disabled",
      "bg-neutral-200": state === "neutral",
    }
  );

  const divClassName = classNames("text-xs leading-none font-semibold", {
    "text-positive-900": state === "default",
    "text-positive-700": state === "disabled",
    "text-neutral-700": state === "neutral",
  });

  return (
    <span className={spanClassName}>
      <div className={divClassName}>{props.children}</div>
    </span>
  );
}

export { TabBadgeNew };
