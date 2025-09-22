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
          ? "mv-flex mv-flex-col mv-mr-20 xl:mv-mr-0"
          : "mv-hidden xl:mv-flex xl:mv-flex-col"
      } mv-w-full mv-min-w-full xl:mv-w-[300px] xl:mv-min-w-[300px] mv-overflow-hidden mv-h-dvh mv-sticky mv-top-0 mv-bg-white`}
    >
      <a
        id="main-menu-start"
        href="#main-menu-end"
        className="mv-w-0 mv-h-0 mv-opacity-0 mv-pointer-events-none focus:mv-pointer-events-auto focus:mv-w-fit focus:mv-h-fit focus:mv-opacity-100 focus:mv-m-2 focus:mv-px-1"
      >
        {locales !== undefined
          ? locales.route.root.skipMainMenu.start
          : DEFAULT_LANGUAGE === "de"
          ? "Hauptmenü überspringen"
          : "Skip main menu"}
      </a>
      <Link
        to={mode !== "anon" ? "/dashboard" : "/"}
        className="mv-my-4 mv-w-fit mv-ml-6 mv-hidden xl:mv-block mv-shrink"
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
      <div className="xl:mv-hidden mv-flex mv-w-full mv-items-center mv-h-[75px] mv-min-h-[75px] mv-px-6 mv-shrink">
        {mode === "anon" ? (
          <div className="mv-gap-x-4 mv-grow mv-items-center mv-flex xl:mv-hidden">
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
            <div className="mv-hidden sm:mv-block mv-font-semibold mv-text-primary-500">
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
          <div className="mv-grow"> </div>
        )}
        <Closer openMainMenuKey={openMainMenuKey} locales={locales} />
      </div>
      <div className="mv-flex mv-flex-col mv-w-full mv-grow mv-pb-2 mv-overflow-y-auto">
        <div className="mv-grow">
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
                  <div className="mv-font-semibold">
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
                    <div className="mv-font-semibold">
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
                <IconWrapper className="mv--ml-1">
                  <Icon type="search" aria-hidden="true" />
                </IconWrapper>
                <div className="mv-font-semibold mv-ml-1">
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
              <div className="mv-font-semibold">
                {locales !== undefined
                  ? locales.route.root.menu.resources.label
                  : DEFAULT_LANGUAGE === "de"
                  ? "Ressourcen"
                  : "Resources"}
              </div>
            </Item>
          </TopMenu>
        </div>
        <div className="mv-shrink">
          <BottomMenu>
            <div className="mv-pl-2 mv-py-4">
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
              <div className="mv-font-semibold">
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
                  <div className="mv-font-semibold">
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
                  <div className="mv-font-semibold">
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
        <div className="mv-shrink">
          <FooterMenu>
            <NavLink
              className={({ isActive }) =>
                isActive ? "mv-underline" : "hover:mv-underline"
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
              className="hover:mv-underline"
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
              className="hover:mv-underline"
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
                isActive ? "mv-underline" : "hover:mv-underline"
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
        className="mv-w-0 mv-h-0 mv-opacity-0 mv-pointer-events-none focus:mv-pointer-events-auto focus:mv-w-fit focus:mv-h-fit focus:mv-opacity-100 focus:mv-mx-2 focus:mv-mb-6 focus:mv-px-1"
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
    "mv-w-5 mv-h-5 mv-flex mv-items-center",
    orientation === "left" && "mv-justify-start",
    orientation === "right" && "mv-justify-end",
    orientation === "center" && "mv-justify-center",
    className
  );

  return <div className={classes}>{props.children}</div>;
}

function TopMenu(props: React.PropsWithChildren) {
  const children = Children.toArray(props.children);

  return (
    <div className="mv-grid mv-grid-cols-1 mv-place-items-start mv-pt-2 mv-px-6 mv-select-none">
      {children}
    </div>
  );
}

function BottomMenu(props: React.PropsWithChildren) {
  const children = Children.toArray(props.children);

  return (
    <div className="mv-grid mv-grid-cols-1 mv-place-items-start mv-pt-6 mv-px-6 mv-select-none">
      {children}
    </div>
  );
}

function FooterMenu(props: React.PropsWithChildren) {
  const children = Children.toArray(props.children);

  return (
    <div className="mv-grid mv-grid-cols-1 mv-place-items-start mv-pt-[15px] mv-px-6 mv-select-none">
      <div className="mv-relative mv-flex mv-flex-wrap mv-items-center mv-gap-x-4 mv-gap-y-2 mv-w-full mv-px-2.5 mv-pb-4 mv-pt-6 mv-text-xs">
        <div className="mv-absolute mv-top-0 mv-left-0 mv-px-4 mv-w-full">
          <div className="mv-w-full mv-border-t mv-border-gray-200" />
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
        className="mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg hover:mv-bg-blue-50 hover:mv-text-primary-500"
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
          "mv-flex mv-items-center mv-gap-2.5 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg";
        if (isActive || isPending || isTransitioning) {
          return `${baseClasses} mv-bg-blue-50 mv-text-primary-500`;
        }
        return `${baseClasses} hover:mv-bg-blue-50 hover:mv-text-primary-500`;
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
  const children = Children.toArray(props.children);

  return (
    <div className="mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg hover:mv-bg-blue-50 hover:mv-text-primary-500">
      <div className="mv-flex mv-items-center mv-gap-2 mv-grow group-has-[:checked]:mv-text-primary-500">
        {children}
      </div>
      <div className="mv-shrink mv-cursor-pointer mv-rotate-90 group-has-[:checked]:-mv-rotate-90">
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
    "mv-relative mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-pl-10 mv-pr-2 mv-py-4 hover:mv-bg-blue-50 hover:mv-text-primary-500"
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
          "mv-relative mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-pl-[38px] mv-pr-2 mv-py-4";
        if (isActive || isPending || isTransitioning) {
          return `${baseClasses} mv-bg-blue-50 mv-text-primary-500`;
        }
        return `${baseClasses} hover:mv-bg-blue-50 hover:mv-text-primary-500`;
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
