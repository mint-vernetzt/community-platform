import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import {
  Link,
  useLocation,
  useNavigation,
  useSearchParams,
} from "react-router";
import classNames from "classnames";
import { Children, isValidElement, useState } from "react";

export function ShowFiltersButton(props: React.PropsWithChildren) {
  const { children } = props;

  const [searchParams] = useSearchParams();
  searchParams.set("showFilters", "on");

  return (
    <div className="@lg:mv-hidden mv-text-center">
      <Link
        className="mv-inline-flex mv-items-center mv-font-semibold mv-whitespace-nowrap mv-px-6 mv-py-2.5 mv-border mv-rounded-lg mv-border-primary-500 mv-gap-2 mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700 mv-cursor-pointer"
        to={`./?${searchParams.toString()}#top`}
      >
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
      </Link>
    </div>
  );
}

function FiltersTitle(props: React.PropsWithChildren) {
  return <>{props.children}</>;
}

function ShowMoreButton(props: { showMore: string; showLess: string }) {
  const [checked, setChecked] = useState(false);

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

function FiltersFieldset(
  props: {
    showMore?: string;
    showLess?: string;
    hideAfter?: number;
  } & React.PropsWithChildren &
    React.HTMLAttributes<HTMLFieldSetElement>
) {
  const {
    children,
    className,
    showMore = "Show more",
    showLess = "Show less",
    hideAfter = 3,
    ...otherProps
  } = props;

  const childrenArray = Children.toArray(children);
  if (childrenArray.length < hideAfter + 1) {
    return (
      <fieldset {...otherProps} className={className}>
        {children}
      </fieldset>
    );
  }

  const firstChildren = childrenArray.slice(0, hideAfter);
  const restChildren = childrenArray.slice(hideAfter);

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

function FiltersResetButton(props: { to: string } & React.PropsWithChildren) {
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

function FiltersApplyButton(props: React.PropsWithChildren) {
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

type FiltersProps = {
  showFilters?: boolean;
  showFiltersName?: string;
} & React.PropsWithChildren;

export function Filters(props: FiltersProps) {
  const { showFilters = false, showFiltersName = "showFilters" } = props;

  const location = useLocation();

  const filterClasses = classNames(
    "mv-fixed mv-left-0 mv-top-0 mv-overflow-scroll @lg:mv-overflow-visible @lg:mv-relative mv-z-20 @lg:mv-z-10 mv-w-full mv-h-dvh @lg:mv-h-fit @lg:mv-justify-between mv-flex mv-flex-col @lg:mv-flex-row mv-bg-white @lg:mv-bg-transparent",
    showFilters === true ? "mv-flex" : "mv-hidden @lg:mv-flex"
  );

  const children = Children.toArray(props.children);

  const title = children.find((child) => {
    return isValidElement(child) && child.type === FiltersTitle;
  });

  const resetButton = children.find((child) => {
    return isValidElement(child) && child.type === FiltersResetButton;
  });

  const applyButton = children.find((child) => {
    return isValidElement(child) && child.type === FiltersApplyButton;
  });

  const fieldSets = children.filter((child) => {
    return isValidElement(child) && child.type === FiltersFieldset;
  });

  return (
    <>
      <input
        type="checkbox"
        name={showFiltersName}
        hidden
        defaultChecked={showFilters}
      />
      <div className={filterClasses}>
        <div className="mv-relative mv-flex mv-justify-between mv-items-center mv-py-5 @lg:mv-py-6 @lg:mv-hidden">
          <h2 className="mv-mb-0 mv-w-full @lg:mv-hidden mv-text-center mv-text-gray-700 mv-text-base">
            {title}
          </h2>
          <Link
            className="@lg:mv-hidden mv-absolute mv-right-4"
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
        <div className="mv-p-5 mv-max-h-full mv-flex mv-flex-col @lg:mv-flex-row mv-justify-between mv-gap-2 mv-border-t mv-border-gray @lg:mv-hidden">
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
