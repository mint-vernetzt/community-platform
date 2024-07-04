import { Button } from "@mint-vernetzt/components";
import { Link, useLocation, useNavigation } from "@remix-run/react";
import classNames from "classnames";
import React, { type FormEvent, type InputHTMLAttributes } from "react";

export function Checkbox(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <>
      <input
        {...props}
        type="checkbox"
        className="mv-h-0 mv-w-0 mv-opacity-0"
      />
      <div className="mv-w-5 mv-h-5 mv-relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          viewBox="0 0 20 20"
          className="mv-block group-has-[:checked]:mv-hidden"
        >
          <path
            fill="currentColor"
            d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
          />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="none"
          viewBox="0 0 20 20"
          className="mv-hidden group-has-[:checked]:mv-block"
        >
          <path
            fill="currentColor"
            d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
          />
          <path
            fill="currentColor"
            d="M13.712 6.212a.937.937 0 0 1 1.34 1.312l-4.991 6.238a.938.938 0 0 1-1.349.026L5.404 10.48A.938.938 0 0 1 6.73 9.154l2.617 2.617 4.34-5.53a.3.3 0 0 1 .025-.029Z"
          />
        </svg>
      </div>
    </>
  );
}

export function Radio(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <>
      <input
        {...props}
        type="radio"
        className="mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
      />
      <div className="mv-w-5 mv-h-5 mv-relative">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mv-block group-has-[:checked]:mv-hidden"
        >
          <rect
            x="0.6"
            y="0.6"
            width="18.8"
            height="18.8"
            rx="9.4"
            fill="white"
          />
          <rect
            x="0.6"
            y="0.6"
            width="18.8"
            height="18.8"
            rx="9.4"
            stroke="#3C4658"
            strokeWidth="1.2"
          />
        </svg>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mv-hidden group-has-[:checked]:mv-block"
        >
          <rect
            x="0.6"
            y="0.6"
            width="18.8"
            height="18.8"
            rx="9.4"
            fill="white"
          />
          <rect
            x="0.6"
            y="0.6"
            width="18.8"
            height="18.8"
            rx="9.4"
            stroke="#3C4658"
            strokeWidth="1.2"
          />
          <rect
            x="3.5"
            y="3.5"
            width="13"
            height="13"
            rx="6.5"
            fill="#3C4658"
          />
          <rect
            x="3.5"
            y="3.5"
            width="13"
            height="13"
            rx="6.5"
            stroke="#3C4658"
          />
        </svg>
      </div>
    </>
  );
}

export function FormControlLabelInfo(props: React.PropsWithChildren) {
  return (
    <span className="mv-text-sm mv-hidden peer-has-[:checked]">
      {props.children}
    </span>
  );
}

export function FormControlLabel(props: React.PropsWithChildren) {
  return <>{props.children}</>;
}

export function FromControlInfo(
  props: { id: string } & React.PropsWithChildren
) {
  const { children, ...otherProps } = props;

  return (
    <>
      <input
        {...otherProps}
        type="checkbox"
        className="mv-peer mv-h-0 mv-w-0 mv-opacity-0 mv-hidden"
        onChange={(event) => {
          event.stopPropagation();
        }}
      />
      <span className="mv-px-4 mv-pb-2.5 mv-hidden peer-[:checked]:mv-block mv-text-sm mv-whitespace-normal">
        {props.children}
      </span>
    </>
  );
}

export function FormControlCounter(props: React.PropsWithChildren) {
  return <span className="mv-ml-auto">{props.children}</span>;
}

export function FormControl(
  props: React.InputHTMLAttributes<HTMLInputElement> & React.PropsWithChildren
) {
  const { children, ...otherProps } = props;

  const childrenArray = React.Children.toArray(props.children);

  const label = childrenArray.find((child) => {
    return React.isValidElement(child) && child.type === FormControlLabel;
  });

  const counter = childrenArray.find((child) => {
    return React.isValidElement(child) && child.type === FormControlCounter;
  });

  const info = childrenArray.find((child) => {
    return React.isValidElement(child) && child.type === FromControlInfo;
  }) as React.ReactElement | undefined;

  const classes = classNames(
    "mv-group mv-px-4 mv-py-2.5 mv-flex mv-justify-between mv-items-center mv-cursor-pointer mv-gap-1 mv-transition",
    props.disabled && "mv-text-gray-400 mv-cursor-not-allowed"
  );

  return (
    <>
      <label className={classes}>
        <span className="mv-whitespace-normal">{label}</span>
        {typeof info !== "undefined" && (
          <label
            htmlFor={info.props.id}
            className="mv-h-[20px] hover:mv-text-primary focus:mv-text-primary"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mv-rounded-full mv-border mv-border-neutral-50"
            >
              <rect
                x="0.5"
                y="0.5"
                width="19"
                height="19"
                rx="9.5"
                stroke="currentColor"
              />
              <rect
                x="9"
                y="8"
                width="2"
                height="7"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="9"
                y="5"
                width="2"
                height="2"
                rx="1"
                fill="currentColor"
              />
            </svg>
          </label>
        )}
        {counter}
        {props.type === "checkbox" && <Checkbox {...otherProps} />}
        {props.type === "radio" && <Radio {...otherProps} />}
      </label>
      <span className={props.disabled ? "mv-text-gray-400" : ""}>{info}</span>
    </>
  );
}

FormControl.Label = FormControlLabel;
FormControl.Info = FromControlInfo;
FormControl.Counter = FormControlCounter;

export function DropdownLabel(
  props: React.PropsWithChildren & { listRef?: React.RefObject<HTMLDivElement> }
) {
  const [checked, setChecked] = React.useState(false);
  const ref = React.useRef<HTMLLabelElement>(null);

  const handleChange = (event: FormEvent<HTMLInputElement>) => {
    event.stopPropagation();
    setChecked(!checked);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        ref.current !== null &&
        ref.current.contains(target) === false &&
        typeof props.listRef !== "undefined" &&
        props.listRef.current !== null &&
        props.listRef.current.contains(target) === false
      ) {
        setChecked(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [props.listRef]);

  return (
    <label
      ref={ref}
      className="mv-peer mv-group mv-w-full @lg:mv-w-fit @lg:mv-min-w-content mv-inline-flex @lg:mv-flex mv-justify-between mv-items-center mv-gap-3 mv-cursor-pointer mv-p-6 @lg:mv-px-4 @lg:mv-py-2.5 @lg:mv-rounded-lg @lg:mv-border @lg:mv-border-gray-100 mv-font-semibold mv-text-gray-700 hover:mv-bg-gray-100 group-has-[:focus-within]/dropdown:mv-bg-gray-100 mv-transition mv-bg-white"
    >
      <span>{props.children}</span>
      <input
        type="checkbox"
        className="mv-h-0 mv-w-0 mv-opacity-0"
        checked={checked}
        onChange={handleChange}
      />
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
  );
}

export function DropDownListLegend(props: React.PropsWithChildren) {
  return (
    <legend className="mt-2 mx-4 mv-text-neutral-700 mv-text-sm mv-font-semibold">
      {props.children}
    </legend>
  );
}

export function DropdownListDivider() {
  return <hr className="mv-mx-4 my-2 mv-border-t mv-border-gray-200" />;
}

export function DropdownListCategory(props: React.PropsWithChildren) {
  return (
    <p className="mv-mx-4 my-2 mv-uppercase mv-whitespace-normal">
      {props.children}
    </p>
  );
}

export const DropdownList = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren & { orientation?: "left" | "right" }
>((props, ref) => {
  const orientation = props.orientation || "left";

  const classes = classNames(
    "@lg:mv-w-72 @lg:mv-h-fit @lg:mv-max-h-72 mv-overflow-auto @lg:mv-absolute @lg:mv-top-[calc(100%+0.5rem)] mv-py-2 @lg:mv-rounded-lg @lg:mv-shadow-xl mv-hidden peer-has-[:checked]:mv-block peer-has-[:checked]:mv-z-10 mv-bg-white",
    orientation === "left" && "mv-left-0",
    orientation === "right" && "mv-right-0"
  );

  return (
    <div ref={ref} className={classes}>
      <ul>
        {React.Children.map(props.children, (child) => {
          const classes = classNames(
            React.isValidElement(child) &&
              child.type !== DropdownListDivider &&
              child.type !== DropDownListLegend &&
              child.type !== DropdownListCategory &&
              child.type !== "div" &&
              child.type !== "p" &&
              "hover:mv-bg-gray-100 focus-within:mv-bg-gray-100"
          );

          return <li className={classes}>{child}</li>;
        })}
      </ul>
    </div>
  );
});

export function Dropdown(
  props: React.PropsWithChildren & {
    orientation?: "left" | "right";
    className?: string;
  }
) {
  const orientation = props.orientation || "left";
  const children = React.Children.toArray(props.children);

  const list = children.find((child) => {
    return React.isValidElement(child) && child.type === DropdownList;
  });
  const listRef = React.useRef();
  const listClone =
    typeof list !== "undefined"
      ? React.cloneElement(list as React.ReactElement, {
          ref: listRef,
          orientation,
        })
      : null;

  const label = children.find((child) => {
    return React.isValidElement(child) && child.type === DropdownLabel;
  });
  const labelClone =
    typeof label !== "undefined"
      ? React.cloneElement(label as React.ReactElement, {
          listRef,
        })
      : null;

  const classes = classNames(
    props.className,
    "mv-relative mv-group/dropdown mv-w-full @lg:mv-w-fit @lg:mv-whitespace-nowrap"
  );

  return (
    <div className={classes}>
      {labelClone}
      {listClone}
      <hr className="@lg:mv-hidden mv-border-b mv-border-gray-200" />
    </div>
  );
}

Dropdown.Label = DropdownLabel;
Dropdown.List = DropdownList;
Dropdown.Divider = DropdownListDivider;
Dropdown.Legend = DropDownListLegend;
Dropdown.Category = DropdownListCategory;

export function ShowFiltersButton(
  props: InputHTMLAttributes<HTMLInputElement>
) {
  const { children, ...otherProps } = props;
  return (
    <div className="@lg:mv-hidden mv-text-center">
      <label className="mv-inline-flex mv-items-center mv-font-semibold mv-whitespace-nowrap mv-px-6 mv-py-2.5 mv-border mv-rounded-lg mv-border-primary-500 mv-gap-2 mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700 mv-cursor-pointer">
        {children}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.125 6.75C13.125 5.57639 14.0764 4.625 15.25 4.625C16.4236 4.625 17.375 5.57639 17.375 6.75C17.375 7.92361 16.4236 8.875 15.25 8.875C14.0764 8.875 13.125 7.9236 13.125 6.75Z"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
          <path
            d="M13 6.75L2 6.75"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
          <path
            d="M6.875 13.25C6.875 14.4236 5.9236 15.375 4.75 15.375C3.5764 15.375 2.625 14.4236 2.625 13.25C2.625 12.0764 3.57639 11.125 4.75 11.125C5.9236 11.125 6.875 12.0764 6.875 13.25Z"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
          <path
            d="M7 13.25L18 13.25"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>

        <input {...otherProps} className="mv-hidden" />
      </label>
    </div>
  );
}

export function FiltersTitle(props: React.PropsWithChildren) {
  return <>{props.children}</>;
}

function ShowMoreButton(props: { showMore: string; showLess: string }) {
  const [checked, setChecked] = React.useState(false);

  return (
    <label className="mv-hidden @lg:mv-block mv-peer mv-cursor-pointer mv-rounded-lg mv-font-semibold mv-h-12 mv-text-sm mv-px-6 mv-py-2.5 mv-border mv-border-transparent mv-text-primary hover:mv-text-primary-700 hover:mv-bg-neutral-50 focus:mv-text-primary-700 focus:mv-bg-neutral-50 active:mv-bg-neutral-100">
      <input
        type="checkbox"
        className="mv-peer mv-h-0 mv-w-0 mv-opacity-0"
        onChange={(event) => {
          event.stopPropagation();
          setChecked(!checked);
        }}
        checked={checked}
      />
      <span className="peer-[:checked]:mv-hidden">{props.showMore}</span>
      <span className="mv-hidden peer-[:checked]:mv-inline">
        {props.showLess}
      </span>
    </label>
  );
}

export function FiltersFieldset(
  props: { showMore?: string; showLess?: string } & React.PropsWithChildren &
    React.FieldsetHTMLAttributes<HTMLFieldSetElement>
) {
  const {
    children,
    className,
    showMore = "Show more",
    showLess = "Show less",
    ...otherProps
  } = props;

  const childrenArray = React.Children.toArray(children);
  if (childrenArray.length < 4) {
    return <fieldset {...props} />;
  }

  const firstChildren = childrenArray.slice(0, 3);
  const restChildren = childrenArray.slice(3);

  const classes = classNames(className, "mv-flex mv-flex-col @lg:mv-flex-row");

  return (
    <fieldset {...otherProps} className={classes}>
      {firstChildren}
      <ShowMoreButton showMore={showMore} showLess={showLess} />
      <div className="@lg:mv-hidden @lg:peer-has-[:checked]:mv-flex mv-gap-4 @lg:mv-w-full">
        {restChildren}
      </div>
    </fieldset>
  );
}

export function FiltersResetButton(
  props: { to: string } & React.PropsWithChildren
) {
  const navigation = useNavigation();

  return (
    <Link className="mv-grow" to={props.to} preventScrollReset>
      <Button
        variant="outline"
        size="large"
        loading={navigation.state === "loading"}
        disabled={navigation.state === "loading"}
        fullSize
      >
        {props.children}
      </Button>
    </Link>
  );
}

export function FiltersApplyButton(props: React.PropsWithChildren) {
  const location = useLocation();

  return (
    <Link
      className="mv-grow"
      to={`./${location.search
        .replace("showFilters=on", "")
        .replace("&&", "&")
        .replace("?&", "?")}`}
      preventScrollReset
    >
      <Button fullSize size="large">
        {props.children}
      </Button>
    </Link>
  );
}

export type FiltersProps = {
  showFilters?: boolean;
} & React.PropsWithChildren;

export function Filters(props: FiltersProps) {
  const { showFilters = false } = props;

  const location = useLocation();

  const filterClasses = classNames(
    "mv-fixed mv-left-0 mv-top-0 mv-overflow-scroll @lg:mv-overflow-visible @lg:mv-relative mv-z-20 @lg:mv-z-10 mv-w-full mv-h-dvh @lg:mv-h-fit @lg:mv-justify-between mv-flex mv-flex-col @lg:mv-flex-row mv-bg-white @lg:mv-bg-transparent",
    showFilters === true ? "mv-flex" : "mv-hidden @lg:mv-flex"
  );

  const children = React.Children.toArray(props.children);

  const title = children.find((child) => {
    return React.isValidElement(child) && child.type === FiltersTitle;
  });

  const resetButton = children.find((child) => {
    return React.isValidElement(child) && child.type === FiltersResetButton;
  });

  const applyButton = children.find((child) => {
    return React.isValidElement(child) && child.type === FiltersApplyButton;
  });

  const fieldSets = children.filter((child) => {
    return React.isValidElement(child) && child.type === FiltersFieldset;
  });

  return (
    <>
      <div className={filterClasses}>
        <div className="mv-flex mv-justify-between mv-items-center mv-px-4 mv-py-5 lg:mv-py-6 @lg:mv-hidden">
          <h2 className="mv-mb-0 -mv-mr-[33px] mv-w-full @lg:mv-hidden mv-text-center mv-text-gray-700 mv-text-base">
            {title}
          </h2>
          <Link
            className="@lg:mv-hidden"
            to={`./${location.search
              .replace("showFilters=on", "")
              .replace("&&", "&")
              .replace("?&", "?")}`}
            preventScrollReset
            aria-label="Close filters"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="33"
              height="33"
              viewBox="0 0 33 33"
              fill="none"
            >
              <path
                d="M9.58226 9.58226C9.67806 9.48623 9.79186 9.41003 9.91715 9.35804C10.0424 9.30606 10.1767 9.2793 10.3124 9.2793C10.448 9.2793 10.5823 9.30606 10.7076 9.35804C10.8329 9.41003 10.9467 9.48623 11.0425 9.58226L16.4999 15.0417L21.9573 9.58226C22.0531 9.48638 22.167 9.41033 22.2922 9.35844C22.4175 9.30654 22.5518 9.27984 22.6874 9.27984C22.823 9.27984 22.9573 9.30654 23.0825 9.35844C23.2078 9.41033 23.3216 9.48638 23.4175 9.58226C23.5134 9.67815 23.5895 9.79197 23.6413 9.91725C23.6932 10.0425 23.7199 10.1768 23.7199 10.3124C23.7199 10.448 23.6932 10.5823 23.6413 10.7075C23.5895 10.8328 23.5134 10.9466 23.4175 11.0425L17.9581 16.4999L23.4175 21.9573C23.5134 22.0531 23.5895 22.167 23.6413 22.2922C23.6932 22.4175 23.7199 22.5518 23.7199 22.6874C23.7199 22.823 23.6932 22.9573 23.6413 23.0825C23.5895 23.2078 23.5134 23.3216 23.4175 23.4175C23.3216 23.5134 23.2078 23.5895 23.0825 23.6413C22.9573 23.6932 22.823 23.7199 22.6874 23.7199C22.5518 23.7199 22.4175 23.6932 22.2922 23.6413C22.167 23.5895 22.0531 23.5134 21.9573 23.4175L16.4999 17.9581L11.0425 23.4175C10.9466 23.5134 10.8328 23.5895 10.7075 23.6413C10.5823 23.6932 10.448 23.7199 10.3124 23.7199C10.1768 23.7199 10.0425 23.6932 9.91725 23.6413C9.79197 23.5895 9.67815 23.5134 9.58226 23.4175C9.48638 23.3216 9.41033 23.2078 9.35844 23.0825C9.30654 22.9573 9.27984 22.823 9.27984 22.6874C9.27984 22.5518 9.30654 22.4175 9.35844 22.2922C9.41033 22.167 9.48638 22.0531 9.58226 21.9573L15.0417 16.4999L9.58226 11.0425C9.48623 10.9467 9.41003 10.8329 9.35804 10.7076C9.30606 10.5823 9.2793 10.448 9.2793 10.3124C9.2793 10.1767 9.30606 10.0424 9.35804 9.91715C9.41003 9.79186 9.48623 9.67806 9.58226 9.58226Z"
                fill="#3C4658"
              />
            </svg>
          </Link>
        </div>
        <div className="mv-flex mv-flex-col-reverse mv-grow @lg:mv-flex-row @lg:mv-justify-between">
          {fieldSets}
        </div>
        <div className="mv-p-5 mv-max-h-full mv-flex mv-flex-col @md:mv-flex-row mv-justify-between mv-gap-2 mv-border-t mv-border-gray @lg:mv-hidden">
          {resetButton}
          {applyButton}
        </div>
      </div>
      {/* <noscript>
        <Button>{t("filter.apply")}</Button>
      </noscript> */}
    </>
  );
}

Filters.Title = FiltersTitle;
Filters.Fieldset = FiltersFieldset;
Filters.ResetButton = FiltersResetButton;
Filters.ApplyButton = FiltersApplyButton;
