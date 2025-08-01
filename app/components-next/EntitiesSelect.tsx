import classNames from "classnames";
import { createContext, useContext } from "react";
import { NavLink, useMatch } from "react-router";

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
  const match = useMatch(pathname);
  return match !== null;
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
    "mv-text-xs mv-font-semibold mv-leading-4 mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-place-items-center mv-h-4 mv-px-2.5 mv-rounded-lg",
    "group-hover/item:mv-bg-primary @lg:group-hover/item:mv-bg-primary-50 @lg:group-hover/itemlabel:mv-bg-white group-hover/item:mv-text-white @lg:group-hover/item:mv-text-primary",
    isActive
      ? "mv-text-white @lg:mv-text-primary mv-bg-primary @lg:mv-bg-white"
      : `${
          isDisabled
            ? "mv-bg-neutral-200 mv-text-neutral-700"
            : "mv-bg-primary-50 mv-text-primary"
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

  const match = useMatch(pathname);

  const isActive = match !== null;

  const classes = classNames(
    "mv-group/item mv-w-full mv-rounded",
    "mv-text-base mv-font-semibold",
    "mv-whitespace-normal",
    "mv-flex mv-gap-2 mv-items-center",
    "mv-grow mv-min-w-fit",
    isActive === false
      ? `${
          typeof isDropdownLabel === "undefined" || isDropdownLabel === false
            ? "hover:mv-bg-primary-50 @lg:hover:mv-bg-transparent @lg:focus-within:mv-bg-primary-100 @lg:focus-within:mv-bg-transparent"
            : ""
        }`
      : `mv-p-2 @lg:mv-p-0 ${
          typeof isDropdownLabel === "undefined" || isDropdownLabel === false
            ? "mv-bg-primary-50 @lg:mv-bg-transparent focus-within:mv-bg-primary-100 @lg:focus-within:mv-bg-transparent"
            : "mv-cursor-pointer"
        }`
  );

  const linkClasses = classNames(
    "mv-w-full @lg:mv-max-w-content mv-cursor-pointer mv-p-2 @lg:mv-p-0 mv-outline-none focus:mv-ring-primary-200 focus:mv-ring-2 mv-rounded-lg"
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
    "mv-group/itemlabel mv-w-full",
    "mv-flex mv-gap-3 @lg:mv-gap-2 mv-items-center mv-justify-between",
    "@lg:mv-px-4 @lg:mv-py-2",
    isActive
      ? "@lg:mv-bg-primary @lg:mv-text-white @lg:mv-border-transparent @lg:mv-cursor-default"
      : `@lg:mv-bg-white ${
          isDisabled ? "mv-text-neutral-400" : "mv-text-neutral-600"
        } hover:mv-text-neutral-700 @lg:hover:mv-bg-primary-50`,
    "@lg:mv-rounded-lg @lg:mv-border @lg:mv-border-neutral-100",
    "mv-text-base @lg:mv-text-sm mv-font-semibold",
    "mv-whitespace-normal"
  );

  return <span className={classes}>{props.children}</span>;
}

function EntitiesSelectLabel(props: React.PropsWithChildren) {
  const classes = classNames(
    "mv-w-full mv-py-1 mv-pr-4 mv-cursor-pointer",
    "mv-inline-flex @lg:mv-hidden mv-items-center mv-justify-between mv-cursor-pointer",
    "mv-bg-neutral-50 mv-rounded-lg mv-border mv-border-neutral-200",
    "group-has-[:focus-within]/dropdown-label:mv-bg-neutral-100 group-has-[:focus-within]/dropdown-label:mv-ring-2 group-has-[:focus-within]/dropdown-label:mv-ring-primary-200"
  );

  return (
    <div className="mv-group/dropdown-label">
      <label className={classes}>
        {props.children}
        <input type="checkbox" className="mv-h-0 mv-w-0 mv-opacity-0" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          className="mv-rotate-90 group-has-[:checked]:-mv-rotate-90 mv-shrink-0"
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
    <p className="mv-block @lg:mv-hidden mv-mb-2 mv-text-sm mv-font-semibold mv-text-neutral-700">
      {props.children}
    </p>
  );
}

function EntitiesSelectDropdown(props: React.PropsWithChildren) {
  const classes = classNames(
    "mv-absolute @lg:mv-relative mv-top-20 @lg:mv-top-0 mv-z-10 @lg:mv-z-0 mv-bg-white mv-w-full @lg:mv-max-w-full",
    "mv-mt-2 @lg:mv-m-0 mv-p-2 @lg:mv-p-6",
    "mv-hidden group-has-[:checked]:mv-flex @lg:mv-inline-flex @lg:mv-overflow-auto",
    "mv-flex-col @lg:mv-flex-row",
    "mv-gap-2 @lg:mv-gap-6",
    "mv-border mv-rounded-lg mv-border-neutral-200 @lg:mv-rounded-lg @lg:mv-border-0"
  );

  return <menu className={classes}>{props.children}</menu>;
}

function EntitiesSelect(props: React.PropsWithChildren) {
  const classes = classNames(
    "mv-relative mv-group mv-peer",
    "mv-w-full @lg:mv-max-w-fit"
  );

  return <div className={classes}>{props.children}</div>;
}

EntitiesSelect.Menu = EntitiesSelectDropdown;
EntitiesSelectDropdown.Item = EntitiesSelectDropdownItem;
EntitiesSelectDropdown.Label = EntitiesSelectDropdownLabel;
EntitiesSelectDropdownItem.Label = EntitiesSelectDropdownItemLabel;
EntitiesSelect.Label = EntitiesSelectLabel;
EntitiesSelect.Badge = Badge;

export { EntitiesSelect };
