import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { Form, Link, useLocation, useSearchParams } from "react-router";
import Search from "~/components/legacy/Search/Search";
import { DEFAULT_LANGUAGE } from "~/i18n.shared";
import { type RootLocales } from "~/root.server";
import { HeaderLogo } from "./HeaderLogo";
import { Icon } from "./icons/Icon";

type NavBarProps = {
  sessionUserInfo?: SessionUserInfo;
  openMainMenuKey: string;
  locales?: RootLocales;
  hideSearchBar?:
    | {
        untilScrollY: number;
        afterBreakpoint: "@md" | "@lg";
      }
    | boolean;
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
  const navBarMenuIsOpen = searchParams.get(props.openMainMenuKey);

  const classes = classNames(
    "w-full h-[76px] xl:h-20 bg-white",
    "flex items-center",
    navBarMenuIsOpen !== null &&
      navBarMenuIsOpen !== "false" &&
      "hidden xl:block"
  );

  const [hideSearchBar, setHideSearchBar] = useState(
    typeof props.hideSearchBar !== "undefined" ? true : false
  );

  useEffect(() => {
    if (
      typeof props.hideSearchBar !== "undefined" &&
      typeof props.hideSearchBar === "object"
    ) {
      const handleScroll = () => {
        if (
          typeof props.hideSearchBar !== "undefined" &&
          typeof props.hideSearchBar === "object"
        ) {
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
    <header id="header" className={classes}>
      <div className="w-0 h-0 focus-within:w-fit focus-within:h-[76px] focus-within:xl:h-20 focus-within:px-2 overflow-hidden flex items-center">
        <a
          id="nav-bar-start"
          href="#nav-bar-end"
          className="pointer-events-none focus:pointer-events-auto text-wrap w-fit h-fit text-xs md:text-sm lg:text-base"
        >
          {props.locales !== undefined
            ? props.locales.route.root.skipNavBar.start
            : DEFAULT_LANGUAGE === "de"
              ? "Navigationsleiste überspringen"
              : "Skip navigation bar"}
        </a>
      </div>
      <div className="flex h-full w-full items-center pr-4 xl:pr-6">
        <Link
          to={props.sessionUserInfo !== undefined ? "/dashboard" : "/"}
          className={`ml-4 mr-2 ${
            props.sessionUserInfo !== undefined ? "hidden" : "block xl:hidden"
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
          prefetch="intent"
        >
          <HeaderLogo locales={props.locales} aria-hidden="true" />
        </Link>
        {props.sessionUserInfo !== undefined && (
          <div
            className={`${
              props.sessionUserInfo !== undefined ? "mx-4 block xl:hidden" : ""
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
              prefetch="intent"
            />
          </div>
        )}

        <div className="flex gap-2 xl:gap-4 w-full items-center">
          <div className="grow">
            <Form
              className={
                hideSearchBar === true &&
                typeof props.hideSearchBar !== "undefined" &&
                typeof props.hideSearchBar === "object"
                  ? `block ${props.hideSearchBar.afterBreakpoint}:hidden`
                  : typeof props.hideSearchBar === "boolean" &&
                      props.hideSearchBar === true
                    ? "hidden"
                    : "w-full"
              }
              method="get"
              action={
                location.pathname.startsWith("/explore")
                  ? location.pathname
                  : "/explore/all"
              }
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
                locales={
                  typeof props.locales === "undefined"
                    ? undefined
                    : props.locales.route.root.search
                }
              >
                <label className="line-clamp-1 text-neutral-700 font-normal">
                  {typeof props.locales === "undefined" ? (
                    DEFAULT_LANGUAGE === "de" ? (
                      "Suche..."
                    ) : (
                      "Search..."
                    )
                  ) : (
                    <div className="mt-3">
                      <span className="xl:hidden">
                        {props.locales.route.root.search.placeholder.default}
                      </span>
                      <span className="hidden xl:inline">
                        {props.locales.route.root.search.placeholder.xl}
                      </span>
                    </div>
                  )}
                </label>
              </Search>
            </Form>
          </div>

          <div className="shrink block xl:hidden">
            <Opener openMainMenuKey="mainMenu" locales={props.locales} />
          </div>

          {props.sessionUserInfo !== undefined ? (
            <div className="w-12 h-12 hidden xl:block">
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
                prefetch="intent"
              />
            </div>
          ) : (
            <div className="gap-4 items-center hidden xl:flex">
              <div>
                <Button
                  to={`/login?login_redirect=${location.pathname}`}
                  as="link"
                  variant="outline"
                  prefetch="intent"
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
                  prefetch="intent"
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
      <div className="w-0 h-0 focus-within:w-fit focus-within:h-[76px] focus-within:xl:h-20 focus-within:px-2 overflow-hidden flex items-center">
        <a
          id="nav-bar-end"
          href="#nav-bar-start"
          className="pointer-events-none focus:pointer-events-auto text-wrap w-fit h-fit text-xs md:text-sm lg:text-base"
        >
          {props.locales !== undefined
            ? props.locales.route.root.skipNavBar.end
            : DEFAULT_LANGUAGE === "de"
              ? "Zurück zum Anfang der Suchleiste"
              : "Back to the start of the search bar"}
        </a>
      </div>
    </header>
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
      prefetch="intent"
    >
      <Icon type="menu" />
    </Link>
  );
}
