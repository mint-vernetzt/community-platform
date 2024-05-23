import { Avatar, Button } from "@mint-vernetzt/components";
import {
  Form,
  Link,
  NavLink,
  useLocation,
  useMatches,
  useSearchParams,
} from "@remix-run/react";
import classNames from "classnames";
import React from "react";
import { useCountUp, type CountUpProps } from "react-countup";
import { useTranslation } from "react-i18next";
import Search from "~/components/Search/Search";
import { type getFeatureAbilities } from "~/lib/utils/application";
import { HeaderLogo } from "~/root";
import { type Mode } from "~/utils.server";

function CountUp(props: CountUpProps) {
  const ref = React.useRef(null);
  useCountUp({
    ref,
    ...props,
  });

  return <span ref={ref}></span>;
}

type NextNavBarProps = {
  sessionUserInfo?: NextSessionUserInfo;
  abilities: Awaited<ReturnType<typeof getFeatureAbilities>>;
};

type NextSessionUserInfo = {
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
};

function NextNavBar(props: NextNavBarProps) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query");
  const navBarMenuIsOpen = searchParams.get("navbarmenu");

  const matches = useMatches();
  let isSettings = false;
  if (matches[1] !== undefined) {
    isSettings = matches[1].id === "routes/project/$slug/settings";
  }

  const classes = classNames(
    "mv-mb-8 mv-sticky mv-top-0 mv-h-[76px] lg:mv-h-20 mv-z-10 mv-bg-white",
    isSettings && "mv-hidden md:mv-block",
    navBarMenuIsOpen !== null &&
      navBarMenuIsOpen !== "false" &&
      "mv-hidden lg:mv-block"
  );

  const { t } = useTranslation(["meta"]);

  return (
    <header id="header" className={classes}>
      <div className="mv-flex mv-h-full mv-items-center mv-mr-4 lg:mv-mr-8">
        <Link
          to={props.sessionUserInfo !== undefined ? "/dashboard" : "/"}
          className={`lg:mv-w-[300px] mv-pl-4 lg:mv-pl-6 mv-pr-2 lg:mv-pr-0 ${
            props.sessionUserInfo !== undefined ? "mv-hidden lg:mv-block" : ""
          }`}
        >
          <HeaderLogo />
        </Link>
        {props.sessionUserInfo !== undefined && (
          <div
            className={`${
              props.sessionUserInfo !== undefined
                ? "mv-mx-4 mv-block lg:mv-hidden"
                : ""
            }`}
          >
            <Avatar
              size="sm"
              firstName={props.sessionUserInfo.firstName}
              lastName={props.sessionUserInfo.lastName}
              avatar={props.sessionUserInfo.avatar}
              to={props.sessionUserInfo !== undefined ? "/dashboard" : "/"}
            />
          </div>
        )}

        <div className="mv-flex mv-gap-2 lg:mv-gap-4 mv-flex-grow mv-items-center">
          <Form className="mv-flex-grow" method="get" action="/search">
            <Search
              placeholder={t("root.search.placeholder")}
              name="query"
              query={query}
            />
          </Form>

          <div className="mv-flex-shrink mv-block lg:mv-hidden">
            <NavBarMenu.Opener openSearchParamKey="navbarmenu" />
          </div>

          {props.sessionUserInfo !== undefined ? (
            <div className="mv-flex-col mv-items-center mv-hidden lg:mv-flex">
              <Avatar
                size="xs"
                firstName={props.sessionUserInfo.firstName}
                lastName={props.sessionUserInfo.lastName}
                avatar={props.sessionUserInfo.avatar}
                to={props.sessionUserInfo !== undefined ? "/dashboard" : "/"}
              />

              <div className="mv-text-sm mv-font-semibold mv-text-primary mv-cursor-default">
                {props.sessionUserInfo.firstName}{" "}
                {props.sessionUserInfo.lastName}
              </div>
            </div>
          ) : (
            <div className="mv-gap-4 mv-items-center mv-hidden lg:mv-flex">
              <div>
                <Link to="/login">
                  <Button variant="ghost">
                    <span className="mv-underline">{t("root.login")}</span>
                  </Button>
                </Link>
              </div>
              <div>
                <Link to="/register">
                  <Button>{t("root.register")}</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NavBarMenu(
  props: React.PropsWithChildren & { mode: Mode; openSearchParamKey: string }
) {
  const children = React.Children.toArray(props.children);
  const closer = children.find(
    (child) => React.isValidElement(child) && child.type === Closer
  );
  if (closer === undefined) {
    throw new Error("Closer for NavBarMenu is missing");
  }
  const topMenu = children.find(
    (child) => React.isValidElement(child) && child.type === TopMenu
  );
  if (topMenu === undefined) {
    throw new Error("TopMenu for NavBarMenu is missing");
  }
  const bottomMenu = children.find(
    (child) => React.isValidElement(child) && child.type === BottomMenu
  );
  if (bottomMenu === undefined) {
    throw new Error("BottomMenu for NavBarMenu is missing");
  }
  const footer = children.find(
    (child) => React.isValidElement(child) && child.type === Footer
  );
  if (footer === undefined) {
    throw new Error("Footer for NavBarMenu is missing");
  }

  const [searchParams] = useSearchParams();
  const isOpen = searchParams.get(props.openSearchParamKey);

  return (
    <div
      id="navbarmenu"
      className={`${
        isOpen !== null && isOpen !== "false"
          ? "mv-flex mv-flex-col mv-mr-20 lg:mv-mr-0"
          : "mv-hidden lg:mv-flex lg:mv-flex-col"
      } mv-w-full mv-min-w-full lg:mv-w-[300px] lg:mv-min-w-[300px] mv-h-screen mv-sticky mv-top-0 lg:-mv-mt-28 mv-bg-white mv-z-10`}
    >
      <Link
        to={props.mode !== "anon" ? "/dashboard" : "/"}
        className="lg:mv-py-3 lg:mv-w-full mv-pl-4 lg:mv-pl-6 mv-pr-2 lg:mv-pr-0 mv-hidden lg:mv-block mv-flex-shrink"
      >
        <HeaderLogo />
      </Link>
      <div className="lg:mv-hidden mv-flex mv-w-full mv-justify-end mv-items-center mv-h-[76px] mv-px-11 mv-flex-shrink">
        {closer}
      </div>
      <div className="mv-flex mv-flex-col mv-w-full mv-flex-grow mv-pb-2 mv-overflow-y-auto">
        <div className="mv-flex-grow">{topMenu}</div>
        <div className="mv-flex-shrink">{bottomMenu}</div>
        <div className="mv-flex-shrink">{footer}</div>
      </div>
    </div>
  );
}

function TopMenu(props: React.PropsWithChildren) {
  const children = React.Children.toArray(props.children);

  return (
    <div className="mv-grid mv-grid-cols-1 mv-place-items-start mv-pt-4 mv-px-6 mv-select-none">
      {children}
    </div>
  );
}

function BottomMenu(props: React.PropsWithChildren) {
  const children = React.Children.toArray(props.children);

  return (
    <div className="mv-grid mv-grid-cols-1 mv-place-items-start mv-pt-6 mv-px-6 mv-select-none">
      {children}
    </div>
  );
}

function Footer(props: React.PropsWithChildren) {
  const children = React.Children.toArray(props.children);

  return (
    <div className="mv-grid mv-grid-cols-1 mv-place-items-start mv-pt-[15px] mv-px-6 mv-select-none">
      <div className="mv-flex mv-items-center mv-gap-4 mv-w-full mv-px-2 mv-py-4 mv-text-xs mv-border-t mv-border-gray-200">
        {children}
      </div>
    </div>
  );
}

function Item(
  props: React.PropsWithChildren & { to: string; method?: "get" | "post" }
) {
  const children = React.Children.toArray(props.children);

  const [searchParams] = useSearchParams();
  return props.method === "post" ? (
    <>
      <Form id={props.to} method="post" action={props.to} hidden />
      <button
        form={props.to}
        type="submit"
        className="mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg hover:mv-bg-blue-50"
      >
        {children}
      </button>
    </>
  ) : (
    <NavLink
      to={`${props.to}?${searchParams.toString()}`}
      className={({ isActive, isPending, isTransitioning }) => {
        const baseClasses =
          "mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg";
        if (isActive || isPending || isTransitioning) {
          return `${baseClasses} mv-bg-blue-50`;
        }
        return `${baseClasses} hover:mv-bg-blue-50`;
      }}
    >
      {children}
    </NavLink>
  );
}

function Topic(
  props: React.PropsWithChildren & {
    openSearchParamKey: string;
    openSearchParamValue: string;
  }
) {
  const children = React.Children.toArray(props.children);
  const label = children.find(
    (child) => React.isValidElement(child) && child.type === Label
  );
  if (label === undefined) {
    throw new Error("Label for NavBarMenu.Topic is missing");
  }
  const topicItems = children.filter(
    (child) => React.isValidElement(child) && child.type === TopicItem
  );
  if (topicItems.length === 0) {
    throw new Error("Provide at least one TopicItem for NavBarMenu.Topic");
  }

  const [searchParams] = useSearchParams();
  const openTopicId = searchParams.get(props.openSearchParamKey);
  const isOpen = openTopicId === props.openSearchParamValue;

  return (
    <div className="mv-w-full mv-flex mv-flex-col">
      {label}
      {isOpen ? topicItems : null}
    </div>
  );
}

function Label(
  props: React.PropsWithChildren & {
    openSearchParamKey: string;
    openSearchParamValue: string;
  }
) {
  const children = React.Children.toArray(props.children);

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const openTopicId = searchParams.get(props.openSearchParamKey);
  const isOpen = openTopicId === props.openSearchParamValue;

  const extendedSearchParams = new URLSearchParams(searchParams.toString());
  if (isOpen) {
    extendedSearchParams.delete(props.openSearchParamKey);
  } else {
    extendedSearchParams.set(
      props.openSearchParamKey,
      props.openSearchParamValue
    );
  }

  return (
    <Link
      to={`${location.pathname}?${extendedSearchParams.toString()}`}
      className="mv-flex mv-items-center mv-justify-between mv-gap-2 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg hover:mv-bg-blue-50"
    >
      <div
        className={`mv-flex mv-items-center mv-gap-2 mv-flex-grow ${
          isOpen ? "mv-text-primary-500" : ""
        }`}
      >
        {children}
      </div>
      <div
        className={`mv-flex-shrink mv-cursor-pointer ${
          isOpen ? "mv-rotate-180" : ""
        }`}
      >
        ^
      </div>
    </Link>
  );
}

function TopicItem(
  props: React.PropsWithChildren & {
    to: string;
  }
) {
  const external = props.to.startsWith("http");
  const children = React.Children.toArray(props.children);
  const [searchParams] = useSearchParams();
  return external ? (
    <Link
      to={`${props.to}`}
      target="_blank"
      className="mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-pl-10 mv-pr-2 mv-py-4 hover:mv-bg-blue-50"
    >
      {children}
    </Link>
  ) : (
    <NavLink
      to={`${props.to}?${searchParams.toString()}`}
      className={({ isActive, isPending, isTransitioning }) => {
        const baseClasses =
          "mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-pl-10 mv-pr-2 mv-py-4";
        if (isActive || isPending || isTransitioning) {
          return `${baseClasses} mv-bg-blue-50`;
        }
        return `${baseClasses} hover:mv-bg-blue-50`;
      }}
    >
      {children}
    </NavLink>
  );
}

function Opener(props: { openSearchParamKey: string }) {
  const [searchParams] = useSearchParams();
  if (!searchParams.has(props.openSearchParamKey)) {
    searchParams.append(props.openSearchParamKey, "");
  }

  return (
    // TODO: Implement menu opener icon
    <Link to={`?${searchParams.toString()}`}>Menü</Link>
  );
}

function Closer(props: { openSearchParamKey: string }) {
  const [searchParams] = useSearchParams();
  searchParams.delete(props.openSearchParamKey);

  return (
    // TODO: Implement menu closer icon
    <Link to={`?${searchParams.toString()}`}>X</Link>
  );
}

// The names of the icons are derived from figma
type IconType =
  | "grid"
  | "grid-fill"
  | "person"
  | "person-fill"
  | "briefcase"
  | "briefcase-fill"
  | "binoculars"
  | "binoculars-fill"
  | "life-preserver"
  | "life-preserver_outline"
  | "door-closed"
  | "door-closed-fill"
  | "box-arrow-up-right_s_angedickt";

function Icon(props: { type: IconType }) {
  // TODO: Implement icons
  return <div>Icon</div>;
}

NavBarMenu.TopMenu = TopMenu;
NavBarMenu.BottomMenu = BottomMenu;
NavBarMenu.Footer = Footer;
NavBarMenu.Item = Item;
NavBarMenu.Topic = Topic;
NavBarMenu.Label = Label;
NavBarMenu.TopicItem = TopicItem;
NavBarMenu.Opener = Opener;
NavBarMenu.Closer = Closer;

export { CountUp, Icon, NavBarMenu, NextNavBar };
