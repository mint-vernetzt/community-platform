import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { LocaleSwitch } from "@mint-vernetzt/components/src/organisms/buttons/LocaleSwitch";
import classNames from "classnames";
import { Children, isValidElement, useState } from "react";
import {
  Form,
  type FormProps,
  Link,
  type LinkProps,
  NavLink,
  useLocation,
  useSearchParams,
} from "react-router";
import {
  DEFAULT_LANGUAGE,
  type SUPPORTED_COOKIE_LANGUAGES,
} from "~/i18n.shared";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { type ArrayElement } from "~/lib/utils/types";
import { type RootLocales } from "~/root.server";
import { type getFeatureAbilities } from "~/routes/feature-access.server";
import { type Mode } from "~/utils.server";
import { HeaderLogo } from "./HeaderLogo";
import { Icon } from "./icons/Icon";

export function MainMenu(
  props: React.PropsWithChildren & {
    mode: Mode;
    openMainMenuKey: string;
    username?: string;
    abilities?: Awaited<ReturnType<typeof getFeatureAbilities>>;
    currentLanguage: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>;
    locales?: RootLocales;
    preferredExploreOrganizationsView?: "list" | "map";
  }
) {
  const {
    mode,
    openMainMenuKey,
    username,
    currentLanguage,
    locales,
    preferredExploreOrganizationsView,
  } = props;

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isOpen = searchParams.get(openMainMenuKey);

  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  return (
    <nav
      id="mainMenu"
      className={`${
        isOpen !== null && isOpen !== "false"
          ? "flex flex-col mr-20 xl:mr-0"
          : "hidden xl:flex xl:flex-col"
      } w-full min-w-full xl:w-[300px] xl:min-w-[300px] overflow-hidden h-dvh sticky top-0 bg-white`}
    >
      <a
        id="main-menu-start"
        href="#main-menu-end"
        className="w-0 h-0 opacity-0 pointer-events-none focus:pointer-events-auto focus:w-fit focus:h-fit focus:opacity-100 focus:m-2 focus:px-1"
      >
        {locales !== undefined
          ? locales.route.root.skipMainMenu.start
          : DEFAULT_LANGUAGE === "de"
            ? "Hauptmenü überspringen"
            : "Skip main menu"}
      </a>
      <Link
        to={mode !== "anon" ? "/dashboard" : "/"}
        className="my-4 w-fit ml-6 hidden xl:block shrink"
        aria-label={
          locales !== undefined
            ? mode === "anon"
              ? locales.route.root.toLandingPage
              : mode === "authenticated"
                ? locales.route.root.toDashboard
                : DEFAULT_LANGUAGE === "de" && mode === "anon"
                  ? "Zur Startseite"
                  : DEFAULT_LANGUAGE === "de" && mode !== "anon"
                    ? "Zum Dashboard"
                    : mode === "anon"
                      ? "To the start page"
                      : "To the dashboard"
            : ""
        }
        prefetch="intent"
      >
        <HeaderLogo />
      </Link>
      <div className="xl:hidden flex w-full items-center h-[75px] min-h-[75px] px-6 shrink">
        {mode === "anon" ? (
          <div className="gap-x-4 grow items-center flex xl:hidden">
            <div>
              <Button
                as="link"
                to={`/login?login_redirect=${location.pathname}`}
                prefetch="intent"
              >
                {locales !== undefined
                  ? locales.route.root.login
                  : DEFAULT_LANGUAGE === "de"
                    ? "Anmelden"
                    : "Login"}
              </Button>
            </div>
            <div className="hidden sm:block font-semibold text-primary-500">
              {locales !== undefined
                ? locales.route.root.or
                : DEFAULT_LANGUAGE === "de"
                  ? "oder"
                  : "or"}
            </div>
            <div>
              <Button
                as="link"
                to={`/register?login_redirect=${location.pathname}`}
                variant="outline"
                prefetch="intent"
              >
                {locales !== undefined
                  ? locales.route.root.register
                  : DEFAULT_LANGUAGE === "de"
                    ? "Registrieren"
                    : "Register"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grow"> </div>
        )}
        <Closer openMainMenuKey={openMainMenuKey} locales={locales} />
      </div>
      <div className="flex flex-col w-full grow pb-2 overflow-y-auto">
        <div className="grow">
          <TopMenu>
            {mode === "authenticated" && username !== undefined ? (
              <>
                <Item
                  to="/dashboard"
                  setActiveTopicId={setActiveTopicId}
                  prefetch="intent"
                >
                  <IconWrapper>
                    {location.pathname === "/dashboard" ? (
                      <Icon type="grid" aria-hidden="true" />
                    ) : (
                      <Icon type="grid-outline" aria-hidden="true" />
                    )}
                  </IconWrapper>
                  <div className="font-semibold">
                    {locales !== undefined
                      ? locales.route.root.menu.overview
                      : DEFAULT_LANGUAGE === "de"
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
                    <IconWrapper orientation="left">
                      {location.pathname === `/profile/${username}` ||
                      location.pathname === "/my/organizations" ||
                      location.pathname === "/organization/create" ||
                      location.pathname === "/my/events" ||
                      location.pathname === "/event/create" ||
                      location.pathname === "/my/projects" ||
                      location.pathname === "/project/create" ? (
                        <Icon type="person" aria-hidden="true" />
                      ) : (
                        <Icon type="person-outline" aria-hidden="true" />
                      )}
                    </IconWrapper>
                    <div className="font-semibold">
                      {locales !== undefined
                        ? locales.route.root.menu.personalSpace.label
                        : DEFAULT_LANGUAGE === "de"
                          ? "Mein MINT-Bereich"
                          : "My space"}
                    </div>
                  </Label>

                  <TopicItem to={`/profile/${username}`} prefetch="intent">
                    {locales !== undefined
                      ? locales.route.root.menu.personalSpace.myProfile
                      : DEFAULT_LANGUAGE === "de"
                        ? "Mein Profil"
                        : "My profile"}
                  </TopicItem>

                  <TopicItem to={`/my/organizations`} prefetch="intent">
                    {locales !== undefined
                      ? locales.route.root.menu.personalSpace.myOrganizations
                      : DEFAULT_LANGUAGE === "de"
                        ? "Meine Organisationen"
                        : "My organizations"}
                  </TopicItem>

                  <TopicItem to={`/my/events`} prefetch="intent">
                    {locales !== undefined
                      ? locales.route.root.menu.personalSpace.myEvents
                      : DEFAULT_LANGUAGE === "de"
                        ? "Meine Events"
                        : "My events"}
                  </TopicItem>

                  <TopicItem to={`/my/projects`} prefetch="intent">
                    {locales !== undefined
                      ? locales.route.root.menu.personalSpace.myProjects
                      : DEFAULT_LANGUAGE === "de"
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
                <IconWrapper className="-ml-1">
                  <Icon type="search" aria-hidden="true" />
                </IconWrapper>
                <div className="font-semibold ml-1">
                  {locales !== undefined
                    ? locales.route.root.menu.explore.label
                    : DEFAULT_LANGUAGE === "de"
                      ? "Entdecken"
                      : "Explore"}
                </div>
              </Label>

              <TopicItem to="/explore/all" prefetch="intent">
                {locales !== undefined
                  ? locales.route.root.menu.explore.index
                  : DEFAULT_LANGUAGE === "de"
                    ? "Alle Inhalte"
                    : "All content"}
              </TopicItem>

              <TopicItem to="/explore/profiles" prefetch="intent">
                {locales !== undefined
                  ? locales.route.root.menu.explore.profiles
                  : DEFAULT_LANGUAGE === "de"
                    ? "Personen"
                    : "Persons"}
              </TopicItem>

              <TopicItem
                to={`/explore/organizations/${preferredExploreOrganizationsView}`}
                prefetch="intent"
              >
                {locales !== undefined
                  ? locales.route.root.menu.explore.organizations
                  : DEFAULT_LANGUAGE === "de"
                    ? "Organisationen"
                    : "Organizations"}
              </TopicItem>

              <TopicItem to="/explore/projects" prefetch="intent">
                {locales !== undefined
                  ? locales.route.root.menu.explore.projects
                  : DEFAULT_LANGUAGE === "de"
                    ? "Projekte"
                    : "Projects"}
              </TopicItem>

              <TopicItem to="/explore/events" prefetch="intent">
                {locales !== undefined
                  ? locales.route.root.menu.explore.events
                  : DEFAULT_LANGUAGE === "de"
                    ? "Events"
                    : "Events"}
              </TopicItem>

              <TopicItem to="/explore/fundings" prefetch="intent">
                {locales !== undefined
                  ? locales.route.root.menu.explore.fundings
                  : DEFAULT_LANGUAGE === "de"
                    ? "Förderungen"
                    : "Fundings"}
              </TopicItem>
            </Topic>

            <Item
              to="/resources"
              setActiveTopicId={setActiveTopicId}
              prefetch="intent"
            >
              <IconWrapper>
                {location.pathname === "/resources" ? (
                  <Icon type="briefcase" aria-hidden="true" />
                ) : (
                  <Icon type="briefcase-outline" aria-hidden="true" />
                )}
              </IconWrapper>
              <div className="font-semibold">
                {locales !== undefined
                  ? locales.route.root.menu.resources.label
                  : DEFAULT_LANGUAGE === "de"
                    ? "Ressourcen"
                    : "Resources"}
              </div>
            </Item>
          </TopMenu>
        </div>
        <div className="shrink">
          <BottomMenu>
            <div className="pl-2 py-4">
              <LocaleSwitch
                variant="dark"
                currentLanguage={currentLanguage}
                locales={locales}
              />
            </div>

            <Item
              to="/help"
              setActiveTopicId={setActiveTopicId}
              prefetch="intent"
            >
              <IconWrapper>
                {location.pathname === "/help" ? (
                  <Icon type="life-preserver" aria-hidden="true" />
                ) : (
                  <Icon type="life-preserver-outline" aria-hidden="true" />
                )}
              </IconWrapper>
              <div className="font-semibold">
                {locales !== undefined
                  ? locales.route.root.menu.help
                  : DEFAULT_LANGUAGE === "de"
                    ? "Hilfe"
                    : "Help"}
              </div>
            </Item>

            {mode === "authenticated" ? (
              <>
                <Item
                  to={`/profile/${username}/settings/general`}
                  setActiveTopicId={setActiveTopicId}
                  prefetch="intent"
                >
                  <IconWrapper>
                    {location.pathname.startsWith(
                      `/profile/${username}/settings`
                    ) ? (
                      <Icon type="gear" aria-hidden="true" />
                    ) : (
                      <Icon type="gear-outline" aria-hidden="true" />
                    )}
                  </IconWrapper>
                  <div className="font-semibold">
                    {locales !== undefined
                      ? locales.route.root.menu.settings
                      : DEFAULT_LANGUAGE === "de"
                        ? "Einstellungen"
                        : "Settings"}
                  </div>
                </Item>

                <Item
                  action="/logout"
                  method="post"
                  setActiveTopicId={setActiveTopicId}
                >
                  <IconWrapper>
                    <Icon type="door-closed-outline" aria-hidden="true" />
                  </IconWrapper>
                  <div className="font-semibold">
                    {locales !== undefined
                      ? locales.route.root.menu.logout
                      : DEFAULT_LANGUAGE === "de"
                        ? "Ausloggen"
                        : "Logout"}
                  </div>
                </Item>
              </>
            ) : null}
          </BottomMenu>
        </div>
        <div className="shrink">
          <FooterMenu>
            <NavLink
              className={({ isActive }) =>
                isActive ? "underline" : "hover:underline"
              }
              to="/imprint"
              prefetch="intent"
            >
              {locales !== undefined
                ? locales.route.root.menu.imprint
                : DEFAULT_LANGUAGE === "de"
                  ? "Impressum"
                  : "Imprint"}
            </NavLink>
            <Link
              className="hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              to="https://mint-vernetzt.de/privacy-policy-community-platform/"
            >
              {locales !== undefined
                ? locales.route.root.menu.privacy
                : DEFAULT_LANGUAGE === "de"
                  ? "Datenschutz"
                  : "Privacy policy"}
            </Link>
            <Link
              className="hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              to="https://mint-vernetzt.de/terms-of-use-community-platform/"
            >
              {locales !== undefined
                ? locales.route.root.menu.terms
                : DEFAULT_LANGUAGE === "de"
                  ? "Nutzungsbedingungen"
                  : "Terms of use"}
            </Link>
            <NavLink
              className={({ isActive }) =>
                isActive ? "underline" : "hover:underline"
              }
              to="/accessibility-statement"
              prefetch="intent"
            >
              {locales !== undefined
                ? locales.route.root.menu.accessibilityStatement
                : DEFAULT_LANGUAGE === "de"
                  ? "Barrierefreiheit"
                  : "Accessibility"}
            </NavLink>
          </FooterMenu>
        </div>
      </div>
      <a
        id="main-menu-end"
        href="#main-menu-start"
        className="w-0 h-0 opacity-0 pointer-events-none focus:pointer-events-auto focus:w-fit focus:h-fit focus:opacity-100 focus:mx-2 focus:mb-6 focus:px-1"
      >
        {locales !== undefined
          ? locales.route.root.skipMainMenu.end
          : DEFAULT_LANGUAGE === "de"
            ? "Zurück zum Anfang des Hauptmenüs"
            : "Back to the start of the main menu"}
      </a>
    </nav>
  );
}

function IconWrapper(
  props: React.PropsWithChildren & {
    orientation?: "left" | "center" | "right";
    className?: string;
  }
) {
  const { orientation = "center", className } = props;

  const classes = classNames(
    "w-5 h-5 flex items-center",
    orientation === "left" && "justify-start",
    orientation === "right" && "justify-end",
    orientation === "center" && "justify-center",
    className
  );

  return <div className={classes}>{props.children}</div>;
}

function TopMenu(props: React.PropsWithChildren) {
  const children = Children.toArray(props.children);

  return (
    <div className="grid grid-cols-1 place-items-start pt-2 px-6 select-none">
      {children}
    </div>
  );
}

function BottomMenu(props: React.PropsWithChildren) {
  const children = Children.toArray(props.children);

  return (
    <div className="grid grid-cols-1 place-items-start pt-6 px-6 select-none">
      {children}
    </div>
  );
}

function FooterMenu(props: React.PropsWithChildren) {
  const children = Children.toArray(props.children);

  return (
    <div className="grid grid-cols-1 place-items-start pt-[15px] px-6 select-none">
      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2 w-full px-2.5 pb-4 pt-6 text-xs">
        <div className="absolute top-0 left-0 px-4 w-full">
          <div className="w-full border-t border-gray-200" />
        </div>
        {children}
      </div>
    </div>
  );
}

function Item(
  props: React.PropsWithChildren & {
    setActiveTopicId: (id: string | null) => void;
  } & (
      | (LinkProps & React.RefAttributes<HTMLAnchorElement>)
      | (FormProps & React.RefAttributes<HTMLFormElement>)
    )
) {
  const { children, setActiveTopicId, ...linkOrFormProps } = props;
  const childs = Children.toArray(children);
  const isSubmitting = useIsSubmitting(
    "action" in linkOrFormProps ? linkOrFormProps.action : undefined
  );

  return "method" in linkOrFormProps && linkOrFormProps.method === "post" ? (
    <>
      <Form
        id={linkOrFormProps.action}
        method="post"
        action={linkOrFormProps.action}
        hidden
        {...linkOrFormProps}
      />
      <button
        onClick={() => {
          setActiveTopicId(null);
        }}
        form={linkOrFormProps.action}
        type="submit"
        className="flex items-center gap-2 w-full cursor-pointer px-2 py-4 rounded-sm hover:bg-blue-50 hover:text-primary-500"
        disabled={isSubmitting}
      >
        {childs}
      </button>
    </>
  ) : "to" in linkOrFormProps ? (
    <NavLink
      onClick={() => {
        setActiveTopicId(null);
      }}
      className={({ isActive, isPending, isTransitioning }) => {
        const baseClasses =
          "flex items-center gap-2.5 w-full cursor-pointer px-2 py-4 rounded-sm";
        if (isActive || isPending || isTransitioning) {
          return `${baseClasses} bg-blue-50 text-primary-500`;
        }
        return `${baseClasses} hover:bg-blue-50 hover:text-primary-500`;
      }}
      {...linkOrFormProps}
    >
      {childs}
    </NavLink>
  ) : null;
}

function Topic(
  props: React.PropsWithChildren & {
    id: string;
    activeTopicId: string | null;
    setActiveTopicId: (id: string | null) => void;
  }
) {
  const children = Children.toArray(props.children);
  const label = children.find(
    (child) => isValidElement(child) && child.type === Label
  );
  if (label === undefined) {
    throw new Error("Label for MainMenu.Topic is missing");
  }
  const topicItems = children.filter(
    (child) => isValidElement(child) && child.type === TopicItem
  );
  if (topicItems.length === 0) {
    throw new Error("Provide at least one TopicItem for MainMenu.Topic");
  }

  return (
    <label htmlFor={props.id} className="w-full flex flex-col group">
      <input
        id={props.id}
        name="open-topic"
        type="checkbox"
        className="w-0 h-0 opacity-0 peer"
        checked={props.activeTopicId === props.id}
        onChange={() => {
          if (props.activeTopicId === props.id) {
            props.setActiveTopicId(null);
          } else {
            props.setActiveTopicId(props.id);
          }
        }}
      />
      <span className="peer-[:focus]:text-primary-500 peer-[:focus]:border-blue-500 border-2 border-transparent rounded-sm">
        {label}
      </span>
      <div className="hidden group-has-[:checked]:block">{topicItems}</div>
    </label>
  );
}

function Label(props: React.PropsWithChildren) {
  const children = Children.toArray(props.children);

  return (
    <div className="flex items-center gap-2 w-full cursor-pointer px-2 py-4 rounded-sm hover:bg-blue-50 hover:text-primary-500">
      <div className="flex items-center gap-2 grow group-has-[:checked]:text-primary-500">
        {children}
      </div>
      <div className="shrink cursor-pointer rotate-90 group-has-[:checked]:-rotate-90">
        <Icon type="chevron-right" aria-hidden="true" />
      </div>
    </div>
  );
}

function TopicItem(
  props: React.PropsWithChildren &
    LinkProps &
    React.RefAttributes<HTMLAnchorElement>
) {
  const { children, ...linkProps } = props;
  const external =
    typeof linkProps.to === "string" ? linkProps.to.startsWith("http") : false;
  const childs = Children.toArray(children);

  const classes = classNames(
    "relative flex items-center gap-2 w-full cursor-pointer pl-10 pr-2 py-4 hover:bg-blue-50 hover:text-primary-500"
  );

  return external ? (
    <Link
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
      {...linkProps}
    >
      {childs}
    </Link>
  ) : (
    <NavLink
      end
      className={({ isActive, isPending, isTransitioning }) => {
        const baseClasses =
          "relative flex items-center gap-2 w-full cursor-pointer pl-[38px] pr-2 py-4";
        if (isActive || isPending || isTransitioning) {
          return `${baseClasses} bg-blue-50 text-primary-500`;
        }
        return `${baseClasses} hover:bg-blue-50 hover:text-primary-500`;
      }}
      {...linkProps}
    >
      {childs}
    </NavLink>
  );
}

function Closer(props: { openMainMenuKey: string; locales?: RootLocales }) {
  const [searchParams] = useSearchParams();
  searchParams.delete(props.openMainMenuKey);
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
      aria-label={
        props.locales !== undefined
          ? props.locales.route.root.menu.close
          : DEFAULT_LANGUAGE === "de"
            ? "Hauptmenü schließen"
            : "Close main menu"
      }
    >
      <Icon type="close-x" aria-hidden="true" />
    </Link>
  );
}
