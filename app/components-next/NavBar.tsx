import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import classNames from "classnames";
import { Form, Link, useLocation, useSearchParams } from "react-router";
import Search from "~/components/Search/Search";
import { DEFAULT_LANGUAGE } from "~/i18n.shared";
import { type RootLocales } from "~/root.server";
import { Icon } from "./icons/Icon";
import { HeaderLogo } from "./HeaderLogo";
import { useEffect, useState } from "react";

type NavBarProps = {
  sessionUserInfo?: SessionUserInfo;
  openMainMenuKey: string;
  locales?: RootLocales;
  hideSearchBar?: {
    untilScrollY: number;
    afterBreakpoint: "@md" | "@lg";
  };
};

type SessionUserInfo = {
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  blurredAvatar?: string;
};

export function NavBar(props: NavBarProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("search");
  const navBarMenuIsOpen = searchParams.get(props.openMainMenuKey);

  const classes = classNames(
    "mv-w-full mv-h-[76px] xl:mv-h-20 mv-bg-white mv-overflow-hidden",
    navBarMenuIsOpen !== null &&
      navBarMenuIsOpen !== "false" &&
      "mv-hidden xl:mv-block"
  );

  const [hideSearchBar, setHideSearchBar] = useState(
    typeof props.hideSearchBar !== "undefined" ? true : false
  );

  useEffect(() => {
    if (typeof props.hideSearchBar !== "undefined") {
      const handleScroll = () => {
        if (typeof props.hideSearchBar !== "undefined") {
          const { scrollY } = window;
          if (scrollY > props.hideSearchBar.untilScrollY) {
            setHideSearchBar(false);
          } else {
            setHideSearchBar(true);
          }
        }
      };
      document.addEventListener("scroll", handleScroll);
      handleScroll();
      return () => {
        document.removeEventListener("scroll", handleScroll);
      };
    }
  });

  return (
    <div className="mv-flex mv-w-full mv-overflow-hidden">
      <div className="mv-h-[76px] xl:mv-h-20 mv-flex mv-items-center focus-within:mv-px-2">
        <a
          id="nav-bar-start"
          href="#nav-bar-end"
          className="mv-w-0 mv-h-0 mv-opacity-0 mv-pointer-events-none focus:mv-pointer-events-auto focus:mv-w-fit focus:mv-h-fit focus:mv-opacity-100 focus:mv-mx-1 focus:mv-px-1 mv-text-nowrap"
        >
          {props.locales !== undefined
            ? props.locales.route.root.skipNavBar.start
            : DEFAULT_LANGUAGE === "de"
            ? "Navigationsleiste überspringen"
            : "Skip navigation bar"}
        </a>
      </div>
      <header id="header" className={classes}>
        <div className="mv-flex mv-h-full mv-w-full mv-items-center mv-pr-4 xl:mv-pr-6 mv-overflow-hidden">
          <Link
            to={props.sessionUserInfo !== undefined ? "/dashboard" : "/"}
            className={`mv-ml-4 mv-mr-2 ${
              props.sessionUserInfo !== undefined
                ? "mv-hidden"
                : "mv-block xl:mv-hidden"
            }`}
            aria-label={
              props.locales !== undefined
                ? props.sessionUserInfo === undefined
                  ? props.locales.route.root.toLandingPage
                  : props.sessionUserInfo !== undefined
                  ? props.locales.route.root.toDashboard
                  : DEFAULT_LANGUAGE === "de" &&
                    props.sessionUserInfo === undefined
                  ? "Zur Startseite"
                  : DEFAULT_LANGUAGE === "de" &&
                    props.sessionUserInfo !== undefined
                  ? "Zum Dashboard"
                  : props.sessionUserInfo === undefined
                  ? "To the start page"
                  : "To the dashboard"
                : ""
            }
          >
            <HeaderLogo locales={props.locales} />
          </Link>
          {props.sessionUserInfo !== undefined && (
            <div
              className={`${
                props.sessionUserInfo !== undefined
                  ? "mv-mx-4 mv-block xl:mv-hidden"
                  : ""
              }`}
            >
              <Avatar
                size="sm"
                firstName={props.sessionUserInfo.firstName}
                lastName={props.sessionUserInfo.lastName}
                avatar={props.sessionUserInfo.avatar}
                blurredAvatar={props.sessionUserInfo.blurredAvatar}
                to={
                  props.sessionUserInfo !== undefined
                    ? `/profile/${props.sessionUserInfo.username}`
                    : "/"
                }
              />
            </div>
          )}

          <div className="mv-flex mv-gap-2 xl:mv-gap-4 mv-w-full mv-items-center">
            <div className="mv-flex-grow">
              <Form
                className={
                  hideSearchBar === true &&
                  typeof props.hideSearchBar !== "undefined"
                    ? `mv-block ${props.hideSearchBar.afterBreakpoint}:mv-hidden`
                    : "mv-w-full"
                }
                method="get"
                action="/explore/all"
              >
                <Search
                  inputProps={{
                    id: "search-bar",
                    placeholder:
                      typeof props.locales === "undefined"
                        ? DEFAULT_LANGUAGE === "de"
                          ? "Suche..."
                          : "Search..."
                        : props.locales.route.root.search.placeholder.default,
                    name: "search",
                  }}
                  query={query}
                  locales={
                    typeof props.locales === "undefined"
                      ? undefined
                      : props.locales.route.root.search
                  }
                >
                  <label className="mv-line-clamp-1">
                    {typeof props.locales === "undefined" ? (
                      DEFAULT_LANGUAGE === "de" ? (
                        "Suche..."
                      ) : (
                        "Search..."
                      )
                    ) : (
                      <div className="mv-mt-3">
                        <span className="xl:mv-hidden">
                          {props.locales.route.root.search.placeholder.default}
                        </span>
                        <span className="mv-hidden xl:mv-inline">
                          {props.locales.route.root.search.placeholder.xl}
                        </span>
                      </div>
                    )}
                  </label>
                </Search>
              </Form>
            </div>

            <div className="mv-flex-shrink mv-block xl:mv-hidden">
              <Opener openMainMenuKey="mainMenu" locales={props.locales} />
            </div>

            {props.sessionUserInfo !== undefined ? (
              <div className="mv-w-12 mv-h-12 mv-hidden xl:mv-block">
                <Avatar
                  size="full"
                  firstName={props.sessionUserInfo.firstName}
                  lastName={props.sessionUserInfo.lastName}
                  avatar={props.sessionUserInfo.avatar}
                  blurredAvatar={props.sessionUserInfo.blurredAvatar}
                  to={
                    props.sessionUserInfo !== undefined
                      ? `/profile/${props.sessionUserInfo.username}`
                      : "/"
                  }
                />
              </div>
            ) : (
              <div className="mv-gap-4 mv-items-center mv-hidden xl:mv-flex">
                <div>
                  <Button
                    to={`/login?login_redirect=${location.pathname}`}
                    as="link"
                    variant="outline"
                  >
                    {props.locales !== undefined
                      ? props.locales.route.root.login
                      : DEFAULT_LANGUAGE === "de"
                      ? "Anmelden"
                      : "Login"}
                  </Button>
                </div>
                <div>
                  <Button
                    to={`/register?login_redirect=${location.pathname}`}
                    as="link"
                  >
                    {props.locales !== undefined
                      ? props.locales.route.root.register
                      : DEFAULT_LANGUAGE === "de"
                      ? "Registrieren"
                      : "Register"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="mv-h-[76px] xl:mv-h-20 mv-flex mv-items-center focus-within:mv-px-2">
        <a
          id="nav-bar-end"
          href="#nav-bar-start"
          className="mv-w-0 mv-h-0 mv-opacity-0 mv-pointer-events-none focus:mv-pointer-events-auto focus:mv-w-fit focus:mv-h-fit focus:mv-opacity-100 focus:mv-ml-4 focus:mv-px-1 mv-text-nowrap"
        >
          {props.locales !== undefined
            ? props.locales.route.root.skipNavBar.end
            : DEFAULT_LANGUAGE === "de"
            ? "Zurück zum Anfang der Suchleiste"
            : "Back to the start of the search bar"}
        </a>
      </div>
    </div>
  );
}

function Opener(props: { openMainMenuKey: string; locales?: RootLocales }) {
  const [searchParams] = useSearchParams();
  if (!searchParams.has(props.openMainMenuKey)) {
    searchParams.append(props.openMainMenuKey, "true");
  }

  return (
    <Link
      to={`?${searchParams.toString()}#top`}
      aria-label={
        props.locales !== undefined
          ? props.locales.route.root.menu.open
          : DEFAULT_LANGUAGE === "de"
          ? "Hauptmenü öffnen"
          : "Open main menu"
      }
    >
      <Icon type="menu" />
    </Link>
  );
}
