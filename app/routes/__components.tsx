import { Avatar, Button } from "@mint-vernetzt/components";
import { Form, Link, useMatches, useSearchParams } from "@remix-run/react";
import { type RemixLinkProps } from "@remix-run/react/dist/components";
import classNames from "classnames";
import React from "react";
import { type CountUpProps, useCountUp } from "react-countup";
import { useTranslation } from "react-i18next";
import Search from "~/components/Search/Search";
import { type getFeatureAbilities } from "~/lib/utils/application";
import { HeaderLogo } from "~/root";

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
    "shadow-md mb-8",
    isSettings && "hidden md:block",
    navBarMenuIsOpen !== null &&
      navBarMenuIsOpen !== "false" &&
      "hidden lg:block"
  );

  const { t } = useTranslation(["meta"]);

  return (
    <header id="header" className={classes}>
      <div className="mv-flex mv-items-center mv-mr-4 lg:mv-mr-8 mv-my-4">
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
          {/* TODO: Implement menu opener */}
          <NavBarMenu.Opener className="mv-flex-shrink mv-block lg:mv-hidden">
            Menü
          </NavBarMenu.Opener>

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

function NavBarMenu(props: React.PropsWithChildren) {
  const [searchParams] = useSearchParams();
  const isOpen = searchParams.get("navbarmenu");

  return (
    <div
      id="navbarmenu"
      className={`${
        isOpen !== null && isOpen !== "false"
          ? "mv-block mv-mr-20 lg:mv-mr-0"
          : "mv-hidden lg:mv-block"
      } mv-w-full mv-min-w-full lg:mv-w-72 lg:mv-min-w-72 mv-h-screen mv-bg-yellow-300 lg:-mv-mt-8 mv-sticky mv-top-0`}
    >
      {props.children}
    </div>
  );
}

function Opener(
  props: React.PropsWithChildren & Pick<RemixLinkProps, "className">
) {
  const { children, className } = props;
  const [searchParams] = useSearchParams();
  if (!searchParams.has("navbarmenu")) {
    searchParams.append("navbarmenu", "");
  }

  if (children === undefined || children === null) {
    throw new Error("The NavBarMenu.Opener component must have children");
  }

  return (
    <Link className={className} to={`?${searchParams.toString()}`}>
      {children}
    </Link>
  );
}

NavBarMenu.Opener = Opener;

export { CountUp, NextNavBar, NavBarMenu };
