import {
  Form,
  Link,
  NavLink,
  useLocation,
  useSearchParams,
} from "react-router";
import React from "react";
import { defaultLanguage, type supportedCookieLanguages } from "~/i18n.shared";
import { type getFeatureAbilities } from "~/lib/utils/application";
import { type ArrayElement } from "~/lib/utils/types";
import { type RootLocales } from "~/root.server";
import { type Mode } from "~/utils.server";
import { HeaderLogo } from "./HeaderLogo";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Icon } from "./icons/Icon";
import { LocaleSwitch } from "@mint-vernetzt/components/src/organisms/buttons/LocaleSwitch";
import classNames from "classnames";

export function MainMenu(
  props: React.PropsWithChildren & {
    mode: Mode;
    openNavBarMenuKey: string;
    username?: string;
    abilities?: Awaited<ReturnType<typeof getFeatureAbilities>>;
    currentLanguage: ArrayElement<typeof supportedCookieLanguages>;
    locales?: RootLocales;
  }
) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isOpen = searchParams.get(props.openNavBarMenuKey);

  const [activeTopicId, setActiveTopicId] = React.useState<string | null>(null);

  return (
    <nav
      id="navbarmenu"
      className={`${
        isOpen !== null && isOpen !== "false"
          ? "mv-flex mv-flex-col mv-mr-20 xl:mv-mr-0"
          : "mv-hidden xl:mv-flex xl:mv-flex-col"
      } mv-w-full mv-min-w-full xl:mv-w-[300px] xl:mv-min-w-[300px] mv-h-dvh mv-max-h-dvh mv-sticky mv-top-0 xl:-mv-mt-28 mv-bg-white mv-z-10`}
    >
      <Link
        to={props.mode !== "anon" ? "/dashboard" : "/"}
        className="xl:mv-py-3 xl:mv-w-full mv-pl-4 xl:mv-pl-6 mv-pr-2 xl:mv-pr-0 mv-hidden xl:mv-block mv-flex-shrink"
      >
        <HeaderLogo />
      </Link>

      <div className="xl:mv-hidden mv-flex mv-w-full mv-items-center mv-h-[75px] mv-min-h-[75px] mv-px-6 mv-flex-shrink">
        {props.mode === "anon" ? (
          <div className="mv-gap-x-4 mv-flex-grow mv-items-center mv-flex xl:mv-hidden">
            <div>
              <Link to={`/login?login_redirect=${location.pathname}`}>
                <Button>
                  {props.locales !== undefined
                    ? props.locales.route.root.login
                    : defaultLanguage === "de"
                    ? "Anmelden"
                    : "Login"}
                </Button>
              </Link>
            </div>
            <div className="mv-hidden sm:mv-block mv-font-semibold mv-text-primary-500">
              {props.locales !== undefined
                ? props.locales.route.root.or
                : defaultLanguage === "de"
                ? "oder"
                : "or"}
            </div>
            <div>
              <Link to={`/register?login_redirect=${location.pathname}`}>
                <Button variant="outline">
                  {props.locales !== undefined
                    ? props.locales.route.root.register
                    : defaultLanguage === "de"
                    ? "Registrieren"
                    : "Register"}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mv-flex-grow"> </div>
        )}
        <Closer openNavBarMenuKey={props.openNavBarMenuKey} />
      </div>
      <div className="mv-flex mv-flex-col mv-w-full mv-flex-grow mv-pb-2 mv-overflow-y-auto">
        <div className="mv-flex-grow">
          <TopMenu>
            {props.mode === "authenticated" && props.username !== undefined ? (
              <>
                <Item
                  to="/dashboard"
                  openNavBarMenuKey={props.openNavBarMenuKey}
                  setActiveTopicId={setActiveTopicId}
                >
                  {location.pathname === "/dashboard" ? (
                    <Icon type="grid" />
                  ) : (
                    <Icon type="grid-outline" />
                  )}
                  <div className="mv-font-semibold">
                    {props.locales !== undefined
                      ? props.locales.route.root.menu.overview
                      : defaultLanguage === "de"
                      ? "Überblick"
                      : "Overview"}
                  </div>
                </Item>

                <Topic
                  id="personalSpace"
                  activeTopicId={activeTopicId}
                  setActiveTopicId={setActiveTopicId}
                >
                  <Label>
                    {location.pathname === `/profile/${props.username}` ||
                    location.pathname === "/my/organizations" ||
                    location.pathname === "/organization/create" ||
                    location.pathname === "/my/events" ||
                    location.pathname === "/event/create" ||
                    location.pathname === "/my/projects" ||
                    location.pathname === "/project/create" ? (
                      <Icon type="person" />
                    ) : (
                      <Icon type="person-outline" />
                    )}
                    <div className="mv-font-semibold">
                      {props.locales !== undefined
                        ? props.locales.route.root.menu.personalSpace.label
                        : defaultLanguage === "de"
                        ? "Mein MINT-Bereich"
                        : "My space"}
                    </div>
                  </Label>

                  <TopicItem
                    to={`/profile/${props.username}`}
                    openNavBarMenuKey={props.openNavBarMenuKey}
                  >
                    {props.locales !== undefined
                      ? props.locales.route.root.menu.personalSpace.myProfile
                      : defaultLanguage === "de"
                      ? "Mein Profil"
                      : "My profile"}
                  </TopicItem>

                  <TopicItem
                    to={`/my/organizations`}
                    openNavBarMenuKey={props.openNavBarMenuKey}
                  >
                    {props.locales !== undefined
                      ? props.locales.route.root.menu.personalSpace
                          .myOrganizations
                      : defaultLanguage === "de"
                      ? "Meine Organisationen"
                      : "My organizations"}
                  </TopicItem>

                  <TopicItem
                    to={`/my/events`}
                    openNavBarMenuKey={props.openNavBarMenuKey}
                  >
                    {props.locales !== undefined
                      ? props.locales.route.root.menu.personalSpace.myEvents
                      : defaultLanguage === "de"
                      ? "Meine Veranstaltungen"
                      : "My events"}
                  </TopicItem>

                  <TopicItem
                    to={`/my/projects`}
                    openNavBarMenuKey={props.openNavBarMenuKey}
                  >
                    {props.locales !== undefined
                      ? props.locales.route.root.menu.personalSpace.myProjects
                      : defaultLanguage === "de"
                      ? "Meine Projekte"
                      : "My projects"}
                  </TopicItem>
                </Topic>
              </>
            ) : null}

            <Topic
              id="explore"
              activeTopicId={activeTopicId}
              setActiveTopicId={setActiveTopicId}
            >
              <Label>
                {location.pathname.includes("/explore") ? (
                  <Icon type="binoculars" />
                ) : (
                  <Icon type="binoculars-outline" />
                )}
                <div className="mv-font-semibold">
                  {props.locales !== undefined
                    ? props.locales.route.root.menu.explore.label
                    : defaultLanguage === "de"
                    ? "Entdecken"
                    : "Explore"}
                </div>
              </Label>

              <TopicItem
                to="/explore/profiles"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {props.locales !== undefined
                  ? props.locales.route.root.menu.explore.profiles
                  : defaultLanguage === "de"
                  ? "Profile"
                  : "Profiles"}
              </TopicItem>

              <TopicItem
                to="/explore/organizations"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {props.locales !== undefined
                  ? props.locales.route.root.menu.explore.organizations
                  : defaultLanguage === "de"
                  ? "Organisationen"
                  : "Organizations"}
              </TopicItem>

              <TopicItem
                to="/explore/projects"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {props.locales !== undefined
                  ? props.locales.route.root.menu.explore.projects
                  : defaultLanguage === "de"
                  ? "Projekte"
                  : "Projects"}
              </TopicItem>

              <TopicItem
                to="/explore/events"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {props.locales !== undefined
                  ? props.locales.route.root.menu.explore.events
                  : defaultLanguage === "de"
                  ? "Veranstaltungen"
                  : "Events"}
              </TopicItem>

              <TopicItem
                to="/explore/fundings"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {props.locales !== undefined
                  ? props.locales.route.root.menu.explore.fundings
                  : defaultLanguage === "de"
                  ? "Förderungen"
                  : "Fundings"}
                <span className="mv-text-white mv-text-xs mv-pt-[4px] mv-px-[5px] mv-bg-secondary mv-rounded mv-leading-none mv-h-[20px] mv-absolute mv-top-2 mv-right-2 mv-font-semibold">
                  BETA
                </span>
              </TopicItem>
            </Topic>

            <Topic
              id="resources"
              activeTopicId={activeTopicId}
              setActiveTopicId={setActiveTopicId}
            >
              <Label>
                <Icon type="briefcase-outline" />
                <div className="mv-font-semibold">
                  {props.locales !== undefined
                    ? props.locales.route.root.menu.ressources.label
                    : defaultLanguage === "de"
                    ? "Ressourcen"
                    : "Ressources"}
                </div>
              </Label>
              <TopicItem
                to="https://mediendatenbank.mint-vernetzt.de"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {props.locales !== undefined
                  ? props.locales.route.root.menu.ressources.imageArchive
                  : defaultLanguage === "de"
                  ? "MINT-Mediendatenbank"
                  : "MINT-Mediendatenbank"}
                <Icon type="box-arrow-up-right" />
              </TopicItem>
              {props.abilities?.sharepic?.hasAccess && (
                <TopicItem
                  to="https://mint.sharepicgenerator.de/"
                  openNavBarMenuKey={props.openNavBarMenuKey}
                >
                  {props.locales !== undefined
                    ? props.locales.route.root.menu.ressources.sharepic
                    : defaultLanguage === "de"
                    ? "MINT-Sharepic Generator"
                    : "MINT-Sharepic Generator"}
                  <Icon type="box-arrow-up-right" />
                </TopicItem>
              )}

              <TopicItem
                to="https://mint-vernetzt.de"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {props.locales !== undefined
                  ? props.locales.route.root.menu.ressources.website
                  : defaultLanguage === "de"
                  ? "MINTvernetzt Webseite"
                  : "MINTvernetzt Website"}
                <Icon type="box-arrow-up-right" />
              </TopicItem>

              <TopicItem
                to="https://mint-vernetzt.shinyapps.io/datalab/"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {props.locales !== undefined
                  ? props.locales.route.root.menu.ressources.datalab
                  : defaultLanguage === "de"
                  ? "MINT-DataLab"
                  : "MINT-DataLab"}
                <Icon type="box-arrow-up-right" />
              </TopicItem>

              <TopicItem
                to="https://mintcampus.org/"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {props.locales !== undefined
                  ? props.locales.route.root.menu.ressources.campus
                  : defaultLanguage === "de"
                  ? "MINT-Campus"
                  : "MINT-Campus"}
                <Icon type="box-arrow-up-right" />
              </TopicItem>

              <TopicItem
                to="https://github.com/mint-vernetzt/community-platform"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {props.locales !== undefined
                  ? props.locales.route.root.menu.ressources.github
                  : defaultLanguage === "de"
                  ? "MINTvernetzt GitHub"
                  : "MINTvernetzt GitHub"}
                <Icon type="box-arrow-up-right" />
              </TopicItem>
            </Topic>
          </TopMenu>
        </div>
        <div className="mv-flex-shrink">
          <BottomMenu>
            <div className="mv-pl-2 mv-py-4">
              <LocaleSwitch
                variant="dark"
                currentLanguage={props.currentLanguage}
              />
            </div>

            <Item
              to="/help"
              openNavBarMenuKey={props.openNavBarMenuKey}
              setActiveTopicId={setActiveTopicId}
            >
              {location.pathname === "/help" ? (
                <Icon type="life-preserver" />
              ) : (
                <Icon type="life-preserver-outline" />
              )}
              <div className="mv-font-semibold">
                {props.locales !== undefined
                  ? props.locales.route.root.menu.help
                  : defaultLanguage === "de"
                  ? "Hilfe"
                  : "Help"}
              </div>
            </Item>

            {props.mode === "authenticated" ? (
              <>
                <Item
                  to={`/profile/${props.username}/settings`}
                  openNavBarMenuKey={props.openNavBarMenuKey}
                  setActiveTopicId={setActiveTopicId}
                >
                  {location.pathname.startsWith(
                    `/profile/${props.username}/settings`
                  ) ? (
                    <Icon type="gear" />
                  ) : (
                    <Icon type="gear-outline" />
                  )}
                  <div className="mv-font-semibold">
                    {props.locales !== undefined
                      ? props.locales.route.root.menu.settings
                      : defaultLanguage === "de"
                      ? "Einstellungen"
                      : "Settings"}
                  </div>
                </Item>

                <Item
                  to="/logout"
                  method="post"
                  openNavBarMenuKey={props.openNavBarMenuKey}
                  setActiveTopicId={setActiveTopicId}
                >
                  <Icon type="door-closed-outline" />
                  <div className="mv-font-semibold">
                    {props.locales !== undefined
                      ? props.locales.route.root.menu.logout
                      : defaultLanguage === "de"
                      ? "Ausloggen"
                      : "Logout"}
                  </div>
                </Item>
              </>
            ) : null}
          </BottomMenu>
        </div>
        <div className="mv-flex-shrink">
          <FooterMenu>
            <NavLink
              className={({ isActive }) =>
                isActive ? "mv-underline" : "hover:mv-underline"
              }
              to="/imprint"
            >
              {props.locales !== undefined
                ? props.locales.route.root.menu.imprint
                : defaultLanguage === "de"
                ? "Impressum"
                : "Imprint"}
            </NavLink>
            <Link
              className="hover:mv-underline"
              target="_blank"
              rel="noopener noreferrer"
              to="https://mint-vernetzt.de/privacy-policy-community-platform/"
            >
              {props.locales !== undefined
                ? props.locales.route.root.menu.privacy
                : defaultLanguage === "de"
                ? "Datenschutz"
                : "Privacy policy"}
            </Link>
            <Link
              className="hover:mv-underline mv-w-full"
              target="_blank"
              rel="noopener noreferrer"
              to="https://mint-vernetzt.de/terms-of-use-community-platform/"
            >
              {props.locales !== undefined
                ? props.locales.route.root.menu.terms
                : defaultLanguage === "de"
                ? "Nutzungsbedingungen"
                : "Terms of use"}
            </Link>
          </FooterMenu>
        </div>
      </div>
    </nav>
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

function FooterMenu(props: React.PropsWithChildren) {
  const children = React.Children.toArray(props.children);

  return (
    <div className="mv-grid mv-grid-cols-1 mv-place-items-start mv-pt-[15px] mv-px-6 mv-select-none">
      <div className="mv-flex mv-flex-wrap mv-items-center mv-gap-x-4 mv-gap-y-2 mv-w-full mv-px-2 mv-py-4 mv-text-xs mv-border-t mv-border-gray-200">
        {children}
      </div>
    </div>
  );
}

function Item(
  props: React.PropsWithChildren & {
    to: string;
    openNavBarMenuKey: string;
    setActiveTopicId: (id: string | null) => void;
    method?: "get" | "post";
  }
) {
  const children = React.Children.toArray(props.children);

  return props.method === "post" ? (
    <>
      <Form id={props.to} method="post" action={props.to} hidden />
      <button
        onClick={() => {
          props.setActiveTopicId(null);
        }}
        form={props.to}
        type="submit"
        className="mv-flex mv-items-center mv-gap-4 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg hover:mv-bg-blue-50 hover:mv-text-primary-500"
      >
        {children}
      </button>
    </>
  ) : (
    <NavLink
      onClick={() => {
        props.setActiveTopicId(null);
      }}
      to={`${props.to}`}
      className={({ isActive, isPending, isTransitioning }) => {
        const baseClasses =
          "mv-flex mv-items-center mv-gap-4 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg";
        if (isActive || isPending || isTransitioning) {
          return `${baseClasses} mv-bg-blue-50 mv-text-primary-500`;
        }
        return `${baseClasses} hover:mv-bg-blue-50 hover:mv-text-primary-500`;
      }}
    >
      {children}
    </NavLink>
  );
}

function Topic(
  props: React.PropsWithChildren & {
    id: string;
    activeTopicId: string | null;
    setActiveTopicId: (id: string | null) => void;
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

  return (
    <label
      htmlFor={props.id}
      className="mv-w-full mv-flex mv-flex-col mv-group"
    >
      <input
        id={props.id}
        name="open-topic"
        type="checkbox"
        className="mv-w-0 mv-h-0 mv-opacity-0 mv-peer"
        checked={props.activeTopicId === props.id}
        onChange={() => {
          if (props.activeTopicId === props.id) {
            props.setActiveTopicId(null);
          } else {
            props.setActiveTopicId(props.id);
          }
        }}
      />
      <span className="peer-[:focus]:mv-text-primary-500 peer-[:focus]:mv-border-blue-500 mv-border-2 mv-border-transparent mv-rounded-lg">
        {label}
      </span>
      <div className="mv-hidden group-has-[:checked]:mv-block">
        {topicItems}
      </div>
    </label>
  );
}

function Label(props: React.PropsWithChildren) {
  const children = React.Children.toArray(props.children);

  return (
    <div className="mv-flex mv-items-center mv-justify-between mv-gap-2 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg hover:mv-bg-blue-50 hover:mv-text-primary-500">
      <div className="mv-flex mv-items-center mv-gap-4 mv-flex-grow group-has-[:checked]:mv-text-primary-500">
        {children}
      </div>
      <div className="mv-flex-shrink mv-cursor-pointer mv-rotate-90 group-has-[:checked]:-mv-rotate-90">
        <Icon type="chevron-right" />
      </div>
    </div>
  );
}

function TopicItem(
  props: React.PropsWithChildren & {
    to: string;
    openNavBarMenuKey: string;
  }
) {
  const external = props.to.startsWith("http");
  const children = React.Children.toArray(props.children);

  const classes = classNames(
    "mv-relative mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-pl-10 mv-pr-2 mv-py-4 hover:mv-bg-blue-50 hover:mv-text-primary-500"
  );

  return external ? (
    <Link
      to={`${props.to}`}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
    >
      {children}
    </Link>
  ) : (
    <NavLink
      end
      to={`${props.to}`}
      className={({ isActive, isPending, isTransitioning }) => {
        const baseClasses =
          "mv-relative mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-pl-10 mv-pr-2 mv-py-4";
        if (isActive || isPending || isTransitioning) {
          return `${baseClasses} mv-bg-blue-50 mv-text-primary-500`;
        }
        return `${baseClasses} hover:mv-bg-blue-50 hover:mv-text-primary-500`;
      }}
    >
      {children}
    </NavLink>
  );
}

function Closer(props: { openNavBarMenuKey: string }) {
  const [searchParams] = useSearchParams();
  searchParams.delete(props.openNavBarMenuKey);
  const searchParamsString = searchParams.toString();

  const location = useLocation();

  return (
    <Link
      to={`${
        searchParamsString.length > 0
          ? `${location.pathname}?${searchParamsString}`
          : location.pathname
      }`}
      preventScrollReset
    >
      <Icon type="close-x" />
    </Link>
  );
}
