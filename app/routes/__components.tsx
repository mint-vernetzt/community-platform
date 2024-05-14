import { Avatar, Button } from "@mint-vernetzt/components";
import { Form, Link, useMatches, useSearchParams } from "@remix-run/react";
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
    "mv-shadow-md mv-mb-8 mv-sticky mv-top-0 mv-h-[76px] lg:mv-h-20 mv-z-10 mv-bg-white",
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
          className={`lg:mv-w-72 mv-pl-4 lg:mv-pl-6 mv-pr-2 lg:mv-pr-0 ${
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
          {/* TODO: Implement menu opener icon */}
          {/* Use a div to style the opener */}
          <div className="mv-flex-shrink mv-block lg:mv-hidden">
            <NavBarMenu.Opener />
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

function NavBarMenu(props: React.PropsWithChildren & { mode: Mode }) {
  const [searchParams] = useSearchParams();
  const isOpen = searchParams.get("navbarmenu");

  const children = React.Children.toArray(props.children);
  const closerIndex = children.findIndex((child) => {
    return React.isValidElement(child) && child.type === NavBarMenu.Closer;
  });
  const closer = children.splice(closerIndex, 1);
  if (closer === undefined) {
    throw new Error("NavBarMenu must contain a Closer component");
  }

  return (
    <div
      id="navbarmenu"
      className={`${
        isOpen !== null && isOpen !== "false"
          ? "mv-block mv-mr-20 lg:mv-mr-0"
          : "mv-hidden lg:mv-block"
      } mv-w-full mv-min-w-full lg:mv-w-72 lg:mv-min-w-72 mv-h-screen mv-absolute mv-sticky mv-top-0 lg:-mv-mt-28 mv-bg-yellow-300 mv-z-10`}
    >
      <Link
        to={props.mode !== "anon" ? "/dashboard" : "/"}
        className="lg:mv-py-2.5 lg:mv-w-full mv-pl-4 lg:mv-pl-6 mv-pr-2 lg:mv-pr-0 mv-hidden lg:mv-block"
      >
        <HeaderLogo />
      </Link>
      <div className="lg:mv-hidden mv-flex mv-w-full mv-justify-end mv-items-center mv-h-[76px] mv-px-11 mv-bg-blue-300">
        {closer}
      </div>

      {children}
    </div>
  );
}

function Opener() {
  const [searchParams] = useSearchParams();
  if (!searchParams.has("navbarmenu")) {
    searchParams.append("navbarmenu", "");
  }

  return (
    // TODO: Implement menu opener icon
    <Link to={`?${searchParams.toString()}`}>Menü</Link>
  );
}

function Closer() {
  const [searchParams] = useSearchParams();
  searchParams.delete("navbarmenu");

  return (
    // TODO: Implement menu closer icon
    <Link to={`?${searchParams.toString()}`}>X</Link>
  );
}

NavBarMenu.Opener = Opener;
NavBarMenu.Closer = Closer;

export { CountUp, NavBarMenu, NextNavBar };
