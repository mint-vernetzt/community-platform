import { Avatar, Button, LocaleSwitch } from "@mint-vernetzt/components";
import {
  Form,
  Link,
  NavLink,
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

function NavBarMenu(props: { mode: Mode; username: string | undefined }) {
  const [searchParams] = useSearchParams();
  const isOpen = searchParams.get("navbarmenu");

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
        <Closer />
      </div>
      {/* TODO: Define gap between different sections here */}
      <div className="mv-flex mv-flex-col mv-w-full mv-flex-grow mv-pb-2 mv-overflow-y-auto">
        <div className="mv-flex-grow">
          <TopMenu mode={props.mode} username={props.username} />
        </div>
        <div className="mv-flex-shrink">
          <BottomMenu mode={props.mode} />
        </div>
        <div className="mv-flex-shrink">
          <Footer />
        </div>
      </div>
    </div>
  );
}

function TopMenu(props: { mode: Mode; username: string | undefined }) {
  const personalSpaceTopicRef = React.useRef<HTMLInputElement>(null);
  const resourcesTopicRef = React.useRef<HTMLInputElement>(null);
  const exploreTopicRef = React.useRef<HTMLInputElement>(null);
  const inputRefs = [personalSpaceTopicRef, resourcesTopicRef, exploreTopicRef];
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    for (const inputRef of inputRefs) {
      if (inputRef.current !== null && inputRef.current !== event.target) {
        inputRef.current.checked = false;
      }
    }
  };
  // TODO: Look at the gaps between the items and check the focus state
  // TODO: i18n and icons
  return (
    <div className="mv-grid mv-grid-cols-1 mv-place-items-start mv-pt-4 mv-px-6 mv-select-none">
      {props.mode === "authenticated" && props.username !== undefined ? (
        <>
          <Item to="/next/dashboard" icon="grid">
            Überblick
          </Item>

          {/* Topic personalSpace */}
          <div className="mv-w-full mv-flex mv-flex-col">
            <label
              htmlFor="personalSpace"
              className="mv-flex mv-flex-row-reverse mv-items-center mv-justify-between mv-gap-2 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg hover:mv-bg-blue-50 mv-peer"
            >
              <input
                id="personalSpace"
                name="personalSpace"
                className="mv-flex-shrink mv-cursor-pointer mv-peer"
                type="checkbox"
                ref={personalSpaceTopicRef}
                onChange={handleCheckboxChange}
              />
              <div className="mv-flex mv-items-center mv-gap-2 mv-flex-grow peer-checked:mv-text-primary-500">
                <Icon type="person-fill" />
                <div className="mv-font-semibold">Mein MINT-Bereich</div>
              </div>
            </label>

            <TopicItem to={`/next/profile/${props.username}`}>
              Mein Profil
            </TopicItem>

            <TopicItem to={`/next/overview/organizations/${props.username}`}>
              Meine Organisationen
            </TopicItem>

            <TopicItem to={`/next/overview/events/${props.username}`}>
              Meine Events
            </TopicItem>

            <TopicItem to={`/next/overview/projects/${props.username}`}>
              Meine Projekte
            </TopicItem>

            <TopicItem to={`/next/overview/networks/${props.username}`}>
              Mein Netzwerk
            </TopicItem>

            <TopicItem to={`/next/overview/bookmarks/${props.username}`}>
              Gemerkte Inhalte
            </TopicItem>
          </div>
        </>
      ) : null}

      {/* Topic resources */}
      <div className="mv-w-full mv-flex mv-flex-col">
        <label
          htmlFor="resources"
          className="mv-flex mv-flex-row-reverse mv-items-center mv-justify-between mv-gap-2 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg hover:mv-bg-blue-50 mv-peer"
        >
          <input
            id="resources"
            name="resources"
            className="mv-flex-shrink mv-cursor-pointer mv-peer"
            type="checkbox"
            ref={resourcesTopicRef}
            onChange={handleCheckboxChange}
          />
          <div className="mv-flex mv-items-center mv-gap-2 mv-flex-grow peer-checked:mv-text-primary-500">
            <Icon type="briefcase" />
            <div className="mv-font-semibold">Ressourcen</div>
          </div>
        </label>

        <TopicItem
          to="https://mint-vernetzt.de"
          icon="sharepic"
          external
          newFeature
        >
          MINT-Sharepic
        </TopicItem>

        <TopicItem
          to="https://mint-vernetzt.de"
          icon="imageArchive"
          external
          newFeature
        >
          MINT-Bildarchiv
        </TopicItem>

        <TopicItem to="https://mintcampus.org/" icon="mintCampus" external>
          MINT-Campus
        </TopicItem>

        <TopicItem
          to="https://mint-vernetzt.shinyapps.io/datalab/"
          icon="mintVernetzt"
          external
        >
          MINT-DataLab
        </TopicItem>

        <TopicItem to="https://mint-vernetzt.de" icon="mintVernetzt" external>
          MINTvernetzt Webseite
        </TopicItem>

        <TopicItem
          to="https://github.com/mint-vernetzt/community-platform"
          icon="github"
          external
        >
          MINTvernetzt GitHub
        </TopicItem>
      </div>

      {/* Topic explore */}
      <div className="mv-w-full mv-flex mv-flex-col">
        <label
          htmlFor="explore"
          className="mv-flex mv-flex-row-reverse mv-items-center mv-justify-between mv-gap-2 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg hover:mv-bg-blue-50 mv-peer"
        >
          <input
            id="explore"
            name="explore"
            className="mv-flex-shrink mv-cursor-pointer mv-peer"
            type="checkbox"
            ref={exploreTopicRef}
            onChange={handleCheckboxChange}
          />
          <div className="mv-flex mv-items-center mv-gap-2 mv-flex-grow peer-checked:mv-text-primary-500">
            <Icon type="binoculars" />
            <div className="mv-font-semibold">Entdecken</div>
          </div>
        </label>

        <TopicItem to="/explore/profiles">Personen</TopicItem>

        <TopicItem to="/explore/organizations">Organisationen</TopicItem>

        <TopicItem to="/explore/projects">Projekte</TopicItem>

        <TopicItem to="/explore/events">Events</TopicItem>

        <TopicItem to="next/explore/subsidies">Förderungen</TopicItem>
      </div>
    </div>
  );
}

function BottomMenu(props: { mode: Mode }) {
  return (
    <div className="mv-grid mv-grid-cols-1 mv-place-items-start mv-pt-6 mv-px-6 mv-select-none">
      <div className="mv-pl-2 mv-py-4">
        <LocaleSwitch />
      </div>

      <Item to="/next/help" icon="life-preserver_outline">
        Hilfe
      </Item>

      {props.mode === "authenticated" ? (
        <>
          <Form id="logout-form" method="post" action="/logout" hidden />
          <button
            id="logout-button"
            form="logout-form"
            type="submit"
            className="mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg hover:mv-bg-blue-50"
          >
            <Icon type="door-closed" />
            Ausloggen
          </button>
        </>
      ) : null}
    </div>
  );
}

function Footer() {
  return (
    <div className="mv-grid mv-grid-cols-1 mv-place-items-start mv-pt-[15px] mv-px-6 mv-select-none">
      {/* Item */}
      <div className="mv-flex mv-items-center mv-gap-4 mv-w-full mv-px-2 mv-py-4 mv-text-xs mv-border-t mv-border-gray-200">
        <NavLink
          className={({ isActive }) =>
            isActive ? "mv-underline" : "hover:mv-underline"
          }
          to="/imprint"
        >
          Impressum
        </NavLink>
        <Link
          className="hover:mv-underline"
          target="_blank"
          to="https://mint-vernetzt.de/privacy-policy-community-platform/"
        >
          Datenschutz
        </Link>
        <Link
          className="hover:mv-underline"
          target="_blank"
          to="https://mint-vernetzt.de/terms-of-use-community-platform/"
        >
          AGB
        </Link>
      </div>
    </div>
  );
}

function Item(props: React.PropsWithChildren & { to: string; icon: IconType }) {
  const children = React.Children.toArray(props.children);
  const label = children.find((child) => typeof child === "string");
  if (label === undefined || typeof label !== "string") {
    throw new Error("Label is missing");
  }
  return (
    <NavLink
      id={label}
      to={props.to}
      className={({ isActive, isPending, isTransitioning }) => {
        const baseClasses =
          "mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg";
        if (isActive || isPending || isTransitioning) {
          return `${baseClasses} mv-bg-blue-50`;
        }
        return `${baseClasses} hover:mv-bg-blue-50`;
      }}
    >
      <Icon type={props.icon} />
      <div>{label}</div>
    </NavLink>
  );
}

function TopicItem(
  props: React.PropsWithChildren & {
    to: string;
    icon?: IconType;
    external?: boolean;
    newFeature?: boolean;
  }
) {
  const children = React.Children.toArray(props.children);
  const label = children.find((child) => typeof child === "string");
  if (label === undefined || typeof label !== "string") {
    throw new Error("Label is missing");
  }
  return props.external ? (
    <Link
      id={label}
      to={props.to}
      target="_blank"
      className="peer-has-[:checked]:mv-flex mv-hidden mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-pl-10 mv-pr-2 mv-py-4 hover:mv-bg-blue-50"
    >
      {props.icon ? <Icon type={props.icon} /> : null}
      <div>{label}</div>
      <div>Ext</div>
      {props.newFeature ? <div>New</div> : null}
    </Link>
  ) : (
    <NavLink
      id={label}
      to={props.to}
      className={({ isActive, isPending, isTransitioning }) => {
        const baseClasses =
          "peer-has-[:checked]:mv-flex mv-hidden mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-pl-10 mv-pr-2 mv-py-4";
        if (isActive || isPending || isTransitioning) {
          return `${baseClasses} mv-bg-blue-50`;
        }
        return `${baseClasses} hover:mv-bg-blue-50`;
      }}
    >
      {props.icon ? <Icon type={props.icon} /> : null}
      <div>{label}</div>
      {props.newFeature ? <div>New</div> : null}
    </NavLink>
  );
}

type IconType =
  | "grid"
  | "person-fill"
  | "briefcase"
  | "binoculars"
  | "life-preserver_outline"
  | "door-closed"
  | "sharepic"
  | "imageArchive"
  | "mintCampus"
  | "mintVernetzt"
  | "github";

function Icon(props: { type: IconType }) {
  // TODO: Implement icons
  return <div>Icon</div>;
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

export { CountUp, NavBarMenu, NextNavBar };
