// Design:
// Name: Tab/Navi Badge Zahl
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10421-8640&t=24txvZOJ4OBW1SUh-4

import classNames from "classnames";

function Counter(props: React.PropsWithChildren<{ active?: boolean }>) {
  const { active = false } = props;
  return (
    <span
      className={classNames(
        "text-xs font-semibold leading-4 grid grid-cols-1 grid-rows-1 place-items-center h-4 min-w-6 py-0.5 px-1.5 rounded-lg",
        active
          ? "text-primary bg-primary-50"
          : "text-neutral-600 bg-neutral-200"
      )}
    >
      {props.children}
    </span>
  );
}

export { Counter };
