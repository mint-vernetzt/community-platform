import classNames from "classnames";
import { createContext, useContext, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";

const EntitiesSelectMenuItemContext = createContext<Pick<
  DropDownMenuItemProps,
  "pathname" | "disabled"
> | null>(null);

function useIsActive() {
  const context = useContext(EntitiesSelectMenuItemContext);
  if (context === null) {
    throw new Error(
      "useIsActive must be used within a EntitiesSelectMenuItemContext"
    );
  }
  const { pathname } = context;
  const location = useLocation();
  const isActive = location.pathname.startsWith(pathname);
  return isActive;
}

function useIsDisabled() {
  const context = useContext(EntitiesSelectMenuItemContext);
  if (context === null) {
    throw new Error(
      "useIsDisabled must be used within a EntitiesSelectMenuItemContext"
    );
  }
  const { disabled } = context;
  return disabled === true;
}

function Badge(props: React.PropsWithChildren) {
  const isActive = useIsActive();
  const isDisabled = useIsDisabled();

  const classes = classNames(
    "text-xs font-semibold leading-4 grid grid-cols-1 grid-rows-1 place-items-center h-4 px-2.5 rounded-lg",
    "group-hover/item:bg-primary @lg:group-hover/item:bg-primary-50 @lg:group-hover/itemlabel:bg-white group-hover/item:text-white @lg:group-hover/item:text-primary",
    isActive
      ? "text-white @lg:text-primary bg-primary @lg:bg-white"
      : `${
          isDisabled
            ? "bg-neutral-200 text-neutral-700"
            : "bg-primary-50 text-primary"
        }`
  );
  return <span className={classes}>{props.children}</span>;
}

type DropDownMenuItemProps = React.PropsWithChildren & {
  pathname: string;
  search: string;
  disabled?: boolean;
  isDropdownLabel?: boolean;
};

function EntitiesSelectDropdownItem(props: DropDownMenuItemProps) {
  const {
    pathname,
    search,
    disabled = false,
    isDropdownLabel,
    children,
    ...otherProps
  } = props;

  const location = useLocation();
  const isActive = location.pathname.startsWith(pathname);

  const classes = classNames(
    "group/item w-full rounded",
    "text-base font-semibold",
    "whitespace-normal",
    "flex gap-2 items-center",
    "grow min-w-fit",
    isActive === false
      ? `${
          typeof isDropdownLabel === "undefined" || isDropdownLabel === false
            ? "hover:bg-primary-50 @lg:hover:bg-transparent @lg:focus-within:bg-primary-100 @lg:focus-within:bg-transparent"
            : ""
        }`
      : `p-2 @lg:p-0 ${
          typeof isDropdownLabel === "undefined" || isDropdownLabel === false
            ? "bg-primary-50 @lg:bg-transparent focus-within:bg-primary-100 @lg:focus-within:bg-transparent"
            : "cursor-pointer"
        }`
  );

  const linkClasses = classNames(
    "w-full @lg:max-w-content cursor-pointer p-2 @lg:p-0 outline-hidden focus:ring-primary-200 focus:ring-2 rounded-lg"
  );

  return (
    <EntitiesSelectMenuItemContext.Provider value={{ pathname, disabled }}>
      {isActive &&
      (typeof isDropdownLabel === "undefined" || isDropdownLabel === false) ? (
        <li className={classes}>{children}</li>
      ) : isActive ? (
        <p className={classes}>{children}</p>
      ) : (
        <li className={classes}>
          <NavLink
            className={linkClasses}
            {...otherProps}
            to={`${pathname}${search}`}
            preventScrollReset
            prefetch="intent"
          >
            {children}
          </NavLink>
        </li>
      )}
    </EntitiesSelectMenuItemContext.Provider>
  );
}

function EntitiesSelectDropdownItemLabel(props: React.PropsWithChildren) {
  const isActive = useIsActive();
  const isDisabled = useIsDisabled();

  const classes = classNames(
    "group/itemlabel w-full",
    "flex gap-3 @lg:gap-2 items-center justify-between",
    "@lg:px-4 @lg:py-2",
    isActive
      ? "@lg:bg-primary @lg:text-white @lg:border-transparent @lg:cursor-default"
      : `@lg:bg-white ${
          isDisabled ? "text-neutral-400" : "text-neutral-600"
        } hover:text-neutral-700 @lg:hover:bg-primary-50`,
    "@lg:rounded-lg @lg:border @lg:border-neutral-100",
    "text-base @lg:text-sm font-semibold",
    "whitespace-normal"
  );

  return <span className={classes}>{props.children}</span>;
}

function EntitiesSelectLabel(props: React.PropsWithChildren) {
  const classes = classNames(
    "w-full py-1 pr-4 cursor-pointer",
    "inline-flex @lg:hidden items-center justify-between cursor-pointer",
    "bg-neutral-50 rounded-lg border border-neutral-200",
    "group-has-[:focus-within]/dropdown-label:bg-neutral-100 group-has-[:focus-within]/dropdown-label:ring-2 group-has-[:focus-within]/dropdown-label:ring-primary-200"
  );

  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <div className="group/dropdown-label">
      <label className={classes}>
        {props.children}
        <input
          type="checkbox"
          className="h-0 w-0 opacity-0"
          checked={isOpen}
          onChange={() => setIsOpen(!isOpen)}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          className="rotate-90 group-has-[:checked]:-rotate-90 shrink-0"
        >
          <path
            fill="currentColor"
            fillRule="nonzero"
            d="M6.147 15.854a.5.5 0 0 1 0-.708L11.794 9.5 6.147 3.855a.5.5 0 1 1 .708-.708l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708 0v-.001Z"
          ></path>
        </svg>
      </label>
    </div>
  );
}

function EntitiesSelectDropdownLabel(props: React.PropsWithChildren) {
  return (
    <p className="block @lg:hidden mb-2 text-sm font-semibold text-neutral-700">
      {props.children}
    </p>
  );
}

function EntitiesSelectDropdown(props: React.PropsWithChildren) {
  const classes = classNames(
    "absolute @lg:relative top-20 @lg:top-0 z-20 @lg:z-0 bg-white w-full @lg:max-w-full",
    "mt-2 @lg:m-0 p-2 @lg:p-6",
    "hidden group-has-[:checked]:flex @lg:inline-flex @lg:overflow-auto",
    "flex-col @lg:flex-row",
    "gap-2 @lg:gap-6",
    "border rounded-lg border-neutral-200 @lg:rounded-lg @lg:border-0"
  );

  return <menu className={classes}>{props.children}</menu>;
}

function EntitiesSelect(props: React.PropsWithChildren) {
  const classes = classNames("relative group peer", "w-full @lg:max-w-fit");

  return <div className={classes}>{props.children}</div>;
}

EntitiesSelect.Menu = EntitiesSelectDropdown;
EntitiesSelectDropdown.Item = EntitiesSelectDropdownItem;
EntitiesSelectDropdown.Label = EntitiesSelectDropdownLabel;
EntitiesSelectDropdownItem.Label = EntitiesSelectDropdownItemLabel;
EntitiesSelect.Label = EntitiesSelectLabel;
EntitiesSelect.Badge = Badge;

export { EntitiesSelect };
