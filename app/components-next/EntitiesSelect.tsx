import classNames from "classnames";
import { createContext, useContext } from "react";
import { NavLink, useMatch, useSearchParams } from "react-router";

const EntitiesSelectMenuItemContext =
  createContext<DropDownMenuItemProps | null>(null);

function useIsActive() {
  const context = useContext(EntitiesSelectMenuItemContext);
  if (context === null) {
    throw new Error(
      "useIsActive must be used within a EntitiesSelectMenuItemContext"
    );
  }
  const { to } = context;
  const match = useMatch(to);
  return match !== null;
}

function Badge(props: React.PropsWithChildren) {
  const isActive = useIsActive();

  const classes = classNames(
    "mv-text-xs mv-font-semibold mv-leading-4 mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-place-items-center mv-h-4 mv-px-2.5 mv-rounded-lg",
    "mv-text-white mv-bg-primary",
    isActive
      ? "@lg:mv-text-primary @lg:mv-bg-white"
      : "@lg:mv-bg-primary-50 @lg:mv-text-primary"
  );
  return <span className={classes}>{props.children}</span>;
}

type DropDownMenuItemProps = React.PropsWithChildren & {
  to: string;
  origin: string;
  end?: boolean;
};

function EntitiesSelectDropdownItem(props: DropDownMenuItemProps) {
  const { to, origin, children, ...otherProps } = props;

  const [searchParams] = useSearchParams();
  const match = useMatch(to);

  const url = new URL(to, origin);

  url.search = searchParams.toString();
  url.searchParams.delete("prfAreaSearch");
  url.searchParams.delete("orgAreaSearch");
  url.searchParams.delete("evtAreaSearch");
  url.searchParams.delete("prjAreaSearch");

  const isActive = match !== null;

  const classes = classNames(
    "mv-w-full",
    "mv-text-base mv-font-semibold",
    "mv-whitespace-normal",
    "mv-flex mv-gap-2 mv-items-center",
    "mv-grow mv-min-w-fit"
  );

  const linkClasses = classNames(
    "mv-w-full @lg:mv-max-w-content",
    "hover:mv-bg-gray-100 focus-within:mv-bg-gray-100 @lg:hover:mv-bg-transparent focus-within:mv-bg-transparent"
  );

  return (
    <EntitiesSelectMenuItemContext.Provider
      value={{ to, origin, end: otherProps.end }}
    >
      {isActive ? (
        <li className={classes}>{children}</li>
      ) : (
        <li className={classes}>
          <NavLink
            className={linkClasses}
            {...otherProps}
            to={url.toString()}
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

  const classes = classNames(
    "mv-w-full",
    "mv-flex mv-gap-2 mv-items-center",
    "mv-mx-4 mv-my-2 @lg:mv-mx-0",
    "@lg:mv-px-4 @lg:mv-py-2",
    isActive
      ? "@lg:mv-bg-primary @lg:mv-text-white @lg:mv-border-transparent"
      : "@lg:mv-bg-white mv-text-neutral-700 @lg:hover:mv-bg-neutral-200",
    "@lg:mv-rounded-lg @lg:mv-border @lg:mv-border-neutral-100",
    "mv-text-base @lg:mv-text-sm mv-font-semibold",
    "mv-whitespace-normal"
  );

  return <span className={classes}>{props.children}</span>;
}

function EntitiesSelectLabel(props: React.PropsWithChildren) {
  const classes = classNames(
    "mv-w-full mv-py-1 mv-pr-4",
    "mv-inline-flex @lg:mv-hidden mv-items-center mv-justify-between mv-cursor-pointer",
    "mv-bg-neutral-50 mv-rounded-lg mv-border mv-border-neutral-200",
    "group-has-[:focus-within]/dropdown-label:mv-bg-gray-100",
    "group-has-[:focus-within]/dropdown-label:mv-border-blue-500 group-has-[:focus-within]/dropdown-label:mv-ring-1 group-has-[:focus-within]/dropdown-label:mv-ring-blue-500"
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
    <p className="mv-block @lg:mv-hidden mv-mb-2 mv-text-sm mv-font-semibold mv-text-neutral-500">
      {props.children}
    </p>
  );
}

function EntitiesSelectDropdown(props: React.PropsWithChildren) {
  const classes = classNames(
    "mv-w-full @lg:mv-max-w-full",
    "mv-mt-2 @lg:mv-m-0 @lg:mv-py-2 @lg:mv-px-2",
    "mv-hidden group-has-[:checked]:mv-flex @lg:mv-inline-flex @lg:mv-overflow-auto",
    "mv-flex-col @lg:mv-flex-row",
    "mv-gap-2 @lg:mv-gap-6",
    // "mv-bg-white @lg:mv-bg-neutral-100",
    "mv-border mv-rounded-lg mv-border-neutral-200 @lg:mv-rounded-lg @lg:mv-border-0"
  );

  return <menu className={classes}>{props.children}</menu>;
}

function EntitiesSelect(props: React.PropsWithChildren) {
  const classes = classNames("mv-group mv-peer", "mv-w-full @lg:mv-max-w-fit");

  return <div className={classes}>{props.children}</div>;
}

EntitiesSelect.Menu = EntitiesSelectDropdown;
EntitiesSelectDropdown.Item = EntitiesSelectDropdownItem;
EntitiesSelectDropdown.Label = EntitiesSelectDropdownLabel;
EntitiesSelectDropdownItem.Label = EntitiesSelectDropdownItemLabel;
EntitiesSelect.Label = EntitiesSelectLabel;
EntitiesSelect.Badge = Badge;

export { EntitiesSelect };
