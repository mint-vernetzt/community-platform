import { Form, Link, useLocation, useSearchParams } from "react-router";
import classNames from "classnames";
import { type RootLocales } from "~/root.server";
import { HeaderLogo } from "./HeaderLogo";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import Search from "~/components/Search/Search";
import { defaultLanguage } from "~/i18n.shared";
import { Icon } from "./icons/Icon";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";

type NavBarProps = {
  sessionUserInfo?: SessionUserInfo;
  openNavBarMenuKey: string;
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
  const navBarMenuIsOpen = searchParams.get(props.openNavBarMenuKey);

  const classes = classNames(
    "mv-sticky mv-top-0 mv-h-[76px] xl:mv-h-20 mv-z-10 mv-bg-white",
    navBarMenuIsOpen !== null &&
      navBarMenuIsOpen !== "false" &&
      "mv-hidden xl:mv-block"
  );

  return (
    <header id="header" className={classes}>
      <div className="mv-flex mv-h-full mv-items-center mv-mr-4 xl:mv-mr-8">
        <Link
          to={props.sessionUserInfo !== undefined ? "/dashboard" : "/"}
          className={`xl:mv-w-[300px] mv-pl-4 xl:mv-pl-6 mv-pr-2 xl:mv-pr-0 ${
            props.sessionUserInfo !== undefined ? "mv-hidden xl:mv-block" : ""
          }`}
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
                  : defaultLanguage === "de"
                  ? "Suche (min. 3 Zeichen)"
                  : "Search (min. 3 characters)"
              }
              name="search"
              query={query}
            />
          </Form>

          <div className="mv-flex-shrink mv-block xl:mv-hidden">
            <Opener openNavBarMenuKey="navbarmenu" />
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
                <Link to={`/login?login_redirect=${location.pathname}`}>
                  <Button variant="ghost">
                    <span className="mv-underline">
                      {props.locales !== undefined
                        ? props.locales.route.root.login
                        : defaultLanguage === "de"
                        ? "Anmelden"
                        : "Login"}
                    </span>
                  </Button>
                </Link>
              </div>
              <div>
                <Link to={`/register?login_redirect=${location.pathname}`}>
                  <Button>
                    {props.locales !== undefined
                      ? props.locales.route.root.register
                      : defaultLanguage === "de"
                      ? "Registrieren"
                      : "Register"}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Opener(props: { openNavBarMenuKey: string }) {
  const [searchParams] = useSearchParams();
  if (!searchParams.has(props.openNavBarMenuKey)) {
    searchParams.append(props.openNavBarMenuKey, "true");
  }

  return (
    <Link to={`?${searchParams.toString()}#top`}>
      <Icon type="menu" />
    </Link>
  );
}
