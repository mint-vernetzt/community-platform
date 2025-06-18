import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import classNames from "classnames";
import { Form, Link, useLocation, useSearchParams } from "react-router";
import Search from "~/components/Search/Search";
import { DEFAULT_LANGUAGE } from "~/i18n.shared";
import { type RootLocales } from "~/root.server";
import { Icon } from "./icons/Icon";
import { HeaderLogo } from "./HeaderLogo";

type NavBarProps = {
  sessionUserInfo?: SessionUserInfo;
  openMainMenuKey: string;
  locales?: RootLocales;
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
    "mv-sticky mv-top-0 mv-h-[76px] xl:mv-h-20 mv-z-10 mv-bg-white",
    navBarMenuIsOpen !== null &&
      navBarMenuIsOpen !== "false" &&
      "mv-hidden xl:mv-block"
  );

  return (
    <header id="header" className={classes}>
      <div className="mv-flex mv-h-full mv-items-center mv-mr-4 xl:mv-mr-8">
        <div className="mv-hidden xl:mv-block mv-w-[300px] mv-h-14" />
        <a
          id="nav-bar-start"
          href="#nav-bar-end"
          className="mv-w-0 mv-h-0 mv-opacity-0 focus:mv-w-fit focus:mv-h-fit focus:mv-opacity-100 focus:mv-mx-1 focus:mv-px-1"
        >
          {props.locales !== undefined
            ? props.locales.route.root.skipNavBar.start
            : DEFAULT_LANGUAGE === "de"
            ? "Suchleiste überspringen"
            : "Skip search bar"}
        </a>
        <Link
          to={props.sessionUserInfo !== undefined ? "/dashboard" : "/"}
          className={`mv-mx-2 mv-pl-2 ${
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

        <div className="mv-flex mv-gap-2 xl:mv-gap-4 mv-flex-grow mv-items-center">
          <Form className="mv-flex-grow" method="get" action="/explore/all">
            <Search
              placeholder={
                props.locales !== undefined
                  ? props.locales.route.root.search.placeholder
                  : DEFAULT_LANGUAGE === "de"
                  ? "Suche (min. 3 Zeichen)"
                  : "Search (min. 3 characters)"
              }
              name="search"
              query={query}
              locales={props.locales}
            />
          </Form>

          <div className="mv-flex-shrink mv-block xl:mv-hidden">
            <Opener openMainMenuKey="mainMenu" locales={props.locales} />
          </div>

          {props.sessionUserInfo !== undefined ? (
            <div className="mv-flex-col mv-items-center mv-hidden xl:mv-flex">
              <Avatar
                size="xs"
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

              <div className="mv-text-sm mv-font-semibold mv-text-primary mv-cursor-default">
                {props.sessionUserInfo.firstName}{" "}
                {props.sessionUserInfo.lastName}
              </div>
            </div>
          ) : (
            <div className="mv-gap-4 mv-items-center mv-hidden xl:mv-flex">
              <div>
                <Button
                  to={`/login?login_redirect=${location.pathname}`}
                  as="link"
                  variant="ghost"
                >
                  <span className="mv-underline">
                    {props.locales !== undefined
                      ? props.locales.route.root.login
                      : DEFAULT_LANGUAGE === "de"
                      ? "Anmelden"
                      : "Login"}
                  </span>
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
        <a
          id="nav-bar-end"
          href="#nav-bar-start"
          className="mv-w-0 mv-h-0 mv-opacity-0 focus:mv-w-fit focus:mv-h-fit focus:mv-opacity-100 focus:mv-ml-4 focus:mv-px-1"
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
    >
      <Icon type="menu" />
    </Link>
  );
}
