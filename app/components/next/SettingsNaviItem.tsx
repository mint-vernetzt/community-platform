import classNames from "classnames";
import { createContext, useContext } from "react";
import { Counter as DesignCounter } from "./Counter";

// Design:
// Name: Settings Navi
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10089-3608&t=GN24nvSjNasWIKry-4

const SettingsNaviItemContext = createContext<{ active: boolean }>({
  active: false,
});

function useSettingsNaviItemContext() {
  const context = useContext(SettingsNaviItemContext);
  if (typeof context === "undefined") {
    throw new Error(
      "useSettingsNaviItemContext must be used within a SettingsNaviItem"
    );
  }
  return context;
}

function SettingsNaviItem(props: {
  children: React.ReactNode;
  active?: boolean;
}) {
  const { children, active = false } = props;

  return (
    <SettingsNaviItemContext value={{ active }}>
      <li>{children}</li>
    </SettingsNaviItemContext>
  );
}

function getSettingsNaviItemStyles(options: {
  isActive?: boolean;
  isCritical?: boolean;
  type: "desktop" | "mobile";
}) {
  const { isActive = false, isCritical = false, type } = options;
  const classes = classNames(
    type === "mobile"
      ? "w-full p-4 bg-white flex items-center justify-between gap-2 border-b border-b-neutral-200 last:border-b-transparent text-lg font-semibold leading-[22px]"
      : "",
    isCritical
      ? "text-negative-700"
      : isActive
        ? "text-primary"
        : "text-neutral-700"
  );
  return {
    className: classes,
  };
}

function Label(props: { children: React.ReactNode }) {
  const { children } = props;

  return <div className="flex gap-2 items-center">{children}</div>;
}

function Counter(props: React.PropsWithChildren<{ active?: boolean }>) {
  const { active } = useSettingsNaviItemContext();
  return (
    <>
      <div className="hidden lg:block">
        <DesignCounter active={active}>{props.children}</DesignCounter>
      </div>
      <div className="lg:hidden">
        <DesignCounter active={true}>{props.children}</DesignCounter>
      </div>
    </>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7.42969 5C7.48587 5.00005 7.54184 5.01 7.59375 5.0293C7.64554 5.04859 7.69273 5.07675 7.73242 5.1123L12.874 9.72754C12.9139 9.76322 12.9452 9.80588 12.9668 9.85254C12.9884 9.89926 13 9.94942 13 10C13 10.0506 12.9884 10.1008 12.9668 10.1475C12.9452 10.1941 12.9138 10.2368 12.874 10.2725L7.73242 14.8867C7.69268 14.9225 7.64571 14.9513 7.59375 14.9707C7.54184 14.99 7.48589 14.9999 7.42969 15C7.37333 15 7.3167 14.9901 7.26465 14.9707C7.21271 14.9513 7.1657 14.9225 7.12598 14.8867C7.08612 14.851 7.05479 14.8084 7.0332 14.7617C7.01165 14.715 7 14.6648 7 14.6143C7.00007 14.5639 7.01172 14.5143 7.0332 14.4678C7.05479 14.4211 7.08612 14.3785 7.12598 14.3428L11.9648 10L7.12598 5.65723C7.08614 5.62147 7.05476 5.57894 7.0332 5.53223C7.01165 5.48552 7 5.43532 7 5.38477C7.00004 5.3343 7.01168 5.28393 7.0332 5.2373C7.05476 5.19076 7.08627 5.14795 7.12598 5.1123C7.16566 5.07675 7.21287 5.0486 7.26465 5.0293C7.3167 5.00995 7.37335 5 7.42969 5Z"
        fill="#3C4658"
      />
      <path
        d="M7.42969 5C7.48587 5.00005 7.54184 5.01 7.59375 5.0293C7.64554 5.04859 7.69273 5.07675 7.73242 5.1123L12.874 9.72754C12.9139 9.76322 12.9452 9.80588 12.9668 9.85254C12.9884 9.89926 13 9.94942 13 10C13 10.0506 12.9884 10.1008 12.9668 10.1475C12.9452 10.1941 12.9138 10.2368 12.874 10.2725L7.73242 14.8867C7.69268 14.9225 7.64571 14.9513 7.59375 14.9707C7.54184 14.99 7.48589 14.9999 7.42969 15C7.37333 15 7.3167 14.9901 7.26465 14.9707C7.21271 14.9513 7.1657 14.9225 7.12598 14.8867C7.08612 14.851 7.05479 14.8084 7.0332 14.7617C7.01165 14.715 7 14.6648 7 14.6143C7.00007 14.5639 7.01172 14.5143 7.0332 14.4678C7.05479 14.4211 7.08612 14.3785 7.12598 14.3428L11.9648 10L7.12598 5.65723C7.08614 5.62147 7.05476 5.57894 7.0332 5.53223C7.01165 5.48552 7 5.43532 7 5.38477C7.00004 5.3343 7.01168 5.28393 7.0332 5.2373C7.05476 5.19076 7.08627 5.14795 7.12598 5.1123C7.16566 5.07675 7.21287 5.0486 7.26465 5.0293C7.3167 5.00995 7.37335 5 7.42969 5Z"
        stroke="#3C4658"
      />
    </svg>
  );
}

SettingsNaviItem.getSettingsNaviItemStyles = getSettingsNaviItemStyles;
SettingsNaviItem.ChevronRightIcon = ChevronRightIcon;
SettingsNaviItem.Label = Label;
SettingsNaviItem.Counter = Counter;

export default SettingsNaviItem;
