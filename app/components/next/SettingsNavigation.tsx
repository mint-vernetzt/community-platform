import classNames from "classnames";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router";
import { Counter as DesignCounter } from "./Counter";
import MobileSettingsHeader from "./MobileSettingsHeader";

// Design:
// Name: Settings Navi
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10089-3608&t=GN24nvSjNasWIKry-4

const SettingsNavigationItemContext = createContext<{
  active: boolean;
  critical: boolean;
}>({
  active: false,
  critical: false,
});

function useSettingsNavigationContext() {
  const context = useContext(SettingsNavigationItemContext);
  if (typeof context === "undefined") {
    throw new Error(
      "useSettingsNavigationContext must be used within a SettingsNavigationItem"
    );
  }
  return context;
}

function SettingsNavigation(props: {
  children: React.ReactNode;
  deep: string | null;
}) {
  const { children, deep } = props;

  const childrenArray = Children.toArray(children);

  const mobileActionSection = childrenArray.find((child) => {
    return isValidElement(child) && child.type === MobileActionSection;
  });

  const desktopActionSection = childrenArray.find((child) => {
    return isValidElement(child) && child.type === DesktopActionSection;
  });

  const mobileSettingsHeader = childrenArray.find((child) => {
    return isValidElement(child) && child.type === MobileSettingsHeader;
  });

  const desktopHeader = childrenArray.find((child) => {
    return isValidElement(child) && child.type === DesktopHeader;
  });

  const content = childrenArray.find((child) => {
    return isValidElement(child) && child.type === Content;
  });

  const menuItems = childrenArray.filter((child) => {
    return (
      isValidElement(child) &&
      child.type !== MobileActionSection &&
      child.type !== MobileSettingsHeader &&
      child.type !== DesktopActionSection &&
      child.type !== DesktopHeader &&
      child.type !== Content
    );
  });

  const classes = classNames(
    "w-full flex flex-col fixed top-0 left-0 right-0 h-dvh lg:relative lg:h-fit"
  );

  const menuRef = useRef<HTMLMenuElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentSmallerThanMenu, setContentSmallerThanMenu] = useState(true);
  const location = useLocation();
  useEffect(() => {
    if (menuRef.current !== null && contentRef.current !== null) {
      const menuHeight = menuRef.current.clientHeight;
      const contentHeight = contentRef.current.clientHeight;
      // Menu rounded bottom right only when content is smaller than menu (-border radius menu)
      if (contentHeight > menuHeight - 8) {
        setContentSmallerThanMenu(false);
      } else {
        setContentSmallerThanMenu(true);
      }
    }
  }, [location]);

  const menuContainerClasses = classNames(
    "w-full",
    contentSmallerThanMenu ? "lg:w-[436px]" : "lg:w-[435px]",
    deep !== null
      ? "hidden lg:flex lg:flex-col"
      : "flex flex-col overflow-y-scroll"
  );

  const menuClasses = classNames(
    "w-full flex flex-col bg-white lg:border-b border-neutral-200 lg:overflow-hidden",
    contentSmallerThanMenu
      ? "lg:rounded-b-lg lg:border-x"
      : "lg:rounded-bl-lg lg:border-l"
  );

  const contentClasses = classNames(
    "h-fit grow lg:border-b border-neutral-200",
    contentSmallerThanMenu
      ? "lg:rounded-br-lg lg:border-r"
      : "lg:rounded-b-lg lg:border-x",
    deep === null ? "hidden lg:block" : ""
  );

  return (
    <div className={classes}>
      {mobileSettingsHeader}
      {desktopHeader}
      {desktopActionSection}
      <div className="w-full flex lg:border-t border-neutral-200 overflow-y-scroll">
        <div className={menuContainerClasses}>
          {mobileActionSection}
          <menu ref={menuRef} className={menuClasses}>
            {menuItems}
          </menu>
        </div>
        <div ref={contentRef} className={contentClasses}>
          {content}
        </div>
      </div>
    </div>
  );
}

function DesktopHeader(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <div className="w-full hidden lg:block p-8 border-x border-t border-neutral-200 bg-primary-50 rounded-t-lg text-primary text-3xl font-bold leading-7">
      {children}
    </div>
  );
}

function MobileActionSection(props: { children: React.ReactNode }) {
  const { children } = props;

  return <>{children}</>;
}

function DesktopActionSection(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <div className="w-full hidden lg:flex justify-between items-center gap-6 pl-8 py-6 pr-6 border-x border-neutral-200 bg-white">
      {children}
    </div>
  );
}

function Item(props: {
  children: React.ReactNode;
  active?: boolean;
  critical?: boolean;
}) {
  const { children, active = false, critical = false } = props;

  return (
    <SettingsNavigationItemContext value={{ active, critical }}>
      <li className="relative border-b border-neutral-200 last:border-b-0 focus-within:outline-2 focus-within:outline-primary-200 focus-within:-outline-offset-2 group/counter">
        <StateFlag />
        {children}
      </li>
    </SettingsNavigationItemContext>
  );
}

function getSettingsNaviItemStyles(options: {
  active?: boolean;
  critical?: boolean;
}) {
  const { active = false, critical = false } = options;
  const classes = classNames(
    "w-full p-4 lg:p-8 bg-white flex items-center justify-between gap-2 text-lg lg:text-3xl font-semibold leading-[22px] lg:leading-7 focus:outline-none",
    critical
      ? "text-negative-700 hover:text-negative-900"
      : active
        ? "lg:text-primary hover:text-primary"
        : "text-neutral-700 hover:text-primary"
  );
  return {
    className: classes,
  };
}

function StateFlag() {
  const { active, critical } = useSettingsNavigationContext();
  const classes = classNames(
    "hidden lg:block absolute left-0 w-2 h-full",
    active ? (critical ? "bg-negative-700" : "bg-primary") : "hidden"
  );

  return <div className={classes} />;
}

function Label(props: { children: React.ReactNode }) {
  const { children } = props;

  return <div className="flex gap-2 lg:gap-2.5 items-center">{children}</div>;
}

function Counter(props: { children: React.ReactNode }) {
  const { children } = props;
  const { active } = useSettingsNavigationContext();
  return (
    <>
      <div className="hidden lg:block pt-1">
        <DesignCounter active={active} responsive>
          {children}
        </DesignCounter>
      </div>
      <div className="lg:hidden pt-0.5">
        <DesignCounter active responsive>
          {children}
        </DesignCounter>
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
      className="lg:hidden"
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

function Content(props: { children: React.ReactNode }) {
  const { children } = props;

  return <>{children}</>;
}

Item.ChevronRightIcon = ChevronRightIcon;
Item.Label = Label;
Item.Counter = Counter;
SettingsNavigation.MobileHeader = MobileSettingsHeader;
SettingsNavigation.MobileHeader.Back = MobileSettingsHeader.Back;
SettingsNavigation.MobileHeader.BackIcon = MobileSettingsHeader.BackIcon;
SettingsNavigation.MobileHeader.Close = MobileSettingsHeader.Close;
SettingsNavigation.MobileHeader.CloseIcon = MobileSettingsHeader.CloseIcon;
SettingsNavigation.DesktopHeader = DesktopHeader;
SettingsNavigation.MobileActionSection = MobileActionSection;
SettingsNavigation.DesktopActionSection = DesktopActionSection;
SettingsNavigation.Item = Item;
SettingsNavigation.getSettingsNaviItemStyles = getSettingsNaviItemStyles;
SettingsNavigation.Content = Content;

export default SettingsNavigation;
