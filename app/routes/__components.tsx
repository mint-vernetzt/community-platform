import {
  Avatar,
  Button,
  LocaleSwitch,
  Link as MVLink,
} from "@mint-vernetzt/components";
import {
  Form,
  Link,
  NavLink,
  useLocation,
  useMatches,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import classNames from "classnames";
import React, { useEffect } from "react";
import { useCountUp, type CountUpProps } from "react-countup";
import { useTranslation } from "react-i18next";
import Search from "~/components/Search/Search";
import { type getFeatureAbilities } from "~/lib/utils/application";
import { HeaderLogo } from "~/root";
import { type Mode } from "~/utils.server";
import { createPortal } from "react-dom";
import Cookies from "js-cookie";

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
  openNavBarMenuKey: string;
};

type NextSessionUserInfo = {
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
};

function NextNavBar(props: NextNavBarProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query");
  const navBarMenuIsOpen = searchParams.get(props.openNavBarMenuKey);

  const matches = useMatches();
  let isSettings = false;
  if (matches[1] !== undefined) {
    isSettings = matches[1].id === "routes/project/$slug/settings";
  }

  const classes = classNames(
    "mv-sticky mv-top-0 mv-h-[76px] lg:mv-h-20 mv-z-10 mv-bg-white",
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
              to={
                props.sessionUserInfo !== undefined
                  ? `/profile/${props.sessionUserInfo.username}`
                  : "/"
              }
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
            <Opener openNavBarMenuKey="navbarmenu" />
          </div>

          {props.sessionUserInfo !== undefined ? (
            <div className="mv-flex-col mv-items-center mv-hidden lg:mv-flex">
              <Avatar
                size="xs"
                firstName={props.sessionUserInfo.firstName}
                lastName={props.sessionUserInfo.lastName}
                avatar={props.sessionUserInfo.avatar}
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
            <div className="mv-gap-4 mv-items-center mv-hidden lg:mv-flex">
              <div>
                <Link to={`/login?login_redirect=${location.pathname}`}>
                  <Button variant="ghost">
                    <span className="mv-underline">{t("root.login")}</span>
                  </Button>
                </Link>
              </div>
              <div>
                <Link to={`/register?login_redirect=${location.pathname}`}>
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

// TODO: i18n for NavBarMenu and all its contents
function NavBarMenu(
  props: React.PropsWithChildren & {
    mode: Mode;
    openNavBarMenuKey: string;
    username?: string;
  }
) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isOpen = searchParams.get(props.openNavBarMenuKey);

  const [activeTopicId, setActiveTopicId] = React.useState<string | null>(null);

  const { t } = useTranslation(["meta"]);

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

      <div className="lg:mv-hidden mv-flex mv-w-full mv-items-center mv-h-[75px] mv-min-h-[75px] mv-px-3 mv-flex-shrink">
        {props.mode === "anon" ? (
          <div className="mv-gap-x-4 mv-flex-grow mv-items-center mv-flex lg:mv-hidden mv-pl-4 lg:mv-pl-0">
            <div>
              <Link to={`/login?login_redirect=${location.pathname}`}>
                <Button>{t("root.login")}</Button>
              </Link>
            </div>
            <div className="mv-hidden sm:mv-block mv-font-semibold mv-text-primary-500">
              {t("root.or")}
            </div>
            <div>
              <Link to={`/register?login_redirect=${location.pathname}`}>
                <Button variant="outline">{t("root.register")}</Button>
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
                    {t("root.menu.overview")}
                  </div>
                </Item>
                <Item
                  to={`/profile/${props.username}`}
                  openNavBarMenuKey={props.openNavBarMenuKey}
                  setActiveTopicId={setActiveTopicId}
                >
                  {location.pathname === `/profile/${props.username}` ? (
                    <Icon type="person" />
                  ) : (
                    <Icon type="person-outline" />
                  )}
                  <div className="mv-font-semibold">
                    {t("root.menu.personalSpace.label")}
                  </div>
                </Item>

                {/* <Topic
                  id="personalSpace"
                  activeTopicId={activeTopicId}
                  setActiveTopicId={setActiveTopicId}
                > */}
                {/* <Label>
                    {location.pathname === `/profile/${props.username}` ? (
                      <Icon type="person" />
                    ) : (
                      <Icon type="person-outline" />
                    )}
                    <div className="mv-font-semibold">
                      {t("root.menu.personalSpace.label")}
                    </div>
                  </Label>

                  <TopicItem
                    to={`/profile/${props.username}`}
                    openNavBarMenuKey={props.openNavBarMenuKey}
                  >
                    {t("root.menu.personalSpace.profile")}
                  </TopicItem> */}

                {/* TODO: Link to organization overview route when its implemented */}
                {/* <TopicItem
                    to={`/profile/${props.username}#organizations`}
                    openNavBarMenuKey={props.openNavBarMenuKey}
                  >
                    {t("root.menu.personalSpace.organizations")}
                  </TopicItem> */}

                {/* TODO: Link to event overview route when its implemented */}
                {/* <TopicItem
                    to={`/profile/${props.username}#events`}
                    openNavBarMenuKey={props.openNavBarMenuKey}
                  >
                    {t("root.menu.personalSpace.events")}
                  </TopicItem> */}

                {/* TODO: Link to project overview route when its implemented */}
                {/* <TopicItem
                    to={`/profile/${props.username}#projects`}
                    openNavBarMenuKey={props.openNavBarMenuKey}
                  >
                    {t("root.menu.personalSpace.projects")}
                  </TopicItem> */}

                {/* TODO: Implement this when Network overview is implemented */}
                {/* <TopicItem
                    to={``}
                    openNavBarMenuKey={props.openNavBarMenuKey}
                  >
                    {t("root.menu.personalSpace.network")}
                  </TopicItem> */}

                {/* TODO: Implement this when bookmark feature is available */}
                {/* <TopicItem
                    to={``}
                    openNavBarMenuKey={props.openNavBarMenuKey}
                  >
                    {t("root.menu.personalSpace.bookmarks")}
                  </TopicItem> */}
                {/* </Topic> */}
              </>
            ) : null}

            <Topic
              id="resources"
              activeTopicId={activeTopicId}
              setActiveTopicId={setActiveTopicId}
            >
              <Label>
                <Icon type="briefcase-outline" />
                <div className="mv-font-semibold">
                  {t("root.menu.ressources.label")}
                </div>
              </Label>

              {/* TODO: Implement this when MINT-Sharepic is implemented */}
              {/* <TopicItem
                // TODO: Link to MINT-Sharepic when its available
                to=""
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {t("root.menu.ressources.sharepic")}
                <Icon type="box-arrow-up-right" />
                <NewFeatureBanner />
              </TopicItem> */}

              {/* TODO: Implement this when MINT-Bildarchiv is implemented */}
              {/* <TopicItem
                // TODO: Link to MINT-Bildarchiv when its available
                to=""
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {t("root.menu.ressources.imageArchive")}
                <Icon type="box-arrow-up-right" />
                <NewFeatureBanner />
              </TopicItem> */}

              <TopicItem
                to="https://mintcampus.org/"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {t("root.menu.ressources.campus")}
                <Icon type="box-arrow-up-right" />
              </TopicItem>

              <TopicItem
                to="https://mint-vernetzt.shinyapps.io/datalab/"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {t("root.menu.ressources.datalab")}
                <Icon type="box-arrow-up-right" />
              </TopicItem>

              <TopicItem
                to="https://mint-vernetzt.de"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {t("root.menu.ressources.website")}
                <Icon type="box-arrow-up-right" />
              </TopicItem>

              <TopicItem
                to="https://github.com/mint-vernetzt/community-platform"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {t("root.menu.ressources.github")}
                <Icon type="box-arrow-up-right" />
              </TopicItem>
            </Topic>

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
                  {t("root.menu.explore.label")}
                </div>
              </Label>

              <TopicItem
                to="/explore/profiles"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {t("root.menu.explore.profiles")}
              </TopicItem>

              <TopicItem
                to="/explore/organizations"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {t("root.menu.explore.organizations")}
              </TopicItem>

              <TopicItem
                to="/explore/projects"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {t("root.menu.explore.projects")}
              </TopicItem>

              <TopicItem
                to="/explore/events"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {t("root.menu.explore.events")}
              </TopicItem>

              <TopicItem
                to="/next/explore/fundings"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {t("root.menu.explore.fundings")}
              </TopicItem>
            </Topic>
          </TopMenu>
        </div>
        <div className="mv-flex-shrink">
          <BottomMenu>
            <div className="mv-pl-2 mv-py-4">
              <LocaleSwitch variant="dark" />
            </div>

            {/* TODO: Implement this when Help route is implemented */}
            {/* <Item
              to=""
              openNavBarMenuKey={props.openNavBarMenuKey}
              setActiveTopicId={setActiveTopicId}
            >
              <Icon type="life-preserver" />
              <div className="mv-font-semibold">{t("root.menu.help")}</div>
            </Item> */}

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
                    {t("root.menu.settings")}
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
                    {t("root.menu.logout")}
                  </div>
                </Item>
              </>
            ) : null}
          </BottomMenu>
        </div>
        <div className="mv-flex-shrink">
          <Footer>
            <NavLink
              className={({ isActive }) =>
                isActive ? "mv-underline" : "hover:mv-underline"
              }
              to="/imprint"
            >
              {t("root.menu.imprint")}
            </NavLink>
            <Link
              className="hover:mv-underline"
              target="_blank"
              to="https://mint-vernetzt.de/privacy-policy-community-platform/"
            >
              {t("root.menu.privacy")}
            </Link>
            <Link
              className="hover:mv-underline"
              target="_blank"
              to="https://mint-vernetzt.de/terms-of-use-community-platform/"
            >
              {t("root.menu.terms")}
            </Link>
          </Footer>
        </div>
      </div>
    </div>
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

function Footer(props: React.PropsWithChildren) {
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
        hidden
        checked={props.activeTopicId === props.id}
        onChange={() => {
          if (props.activeTopicId === props.id) {
            props.setActiveTopicId(null);
          } else {
            props.setActiveTopicId(props.id);
          }
        }}
      />
      {label}
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
  return external ? (
    <Link
      to={`${props.to}`}
      target="_blank"
      className="mv-relative mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-pl-10 mv-pr-2 mv-py-4 hover:mv-bg-blue-50 hover:mv-text-primary-500"
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

function Opener(props: { openNavBarMenuKey: string }) {
  const [searchParams] = useSearchParams();
  if (!searchParams.has(props.openNavBarMenuKey)) {
    searchParams.append(props.openNavBarMenuKey, "");
  }

  return (
    <Link to={`?${searchParams.toString()}`} preventScrollReset>
      <Icon type="menu" />
    </Link>
  );
}

function Closer(props: { openNavBarMenuKey: string }) {
  const [searchParams] = useSearchParams();
  searchParams.delete(props.openNavBarMenuKey);
  const searchParamsString = searchParams.toString();

  return (
    <Link
      to={`${searchParamsString.length > 0 ? `?${searchParamsString}` : "."}`}
      preventScrollReset
    >
      <Icon type="close-x" />
    </Link>
  );
}

// The names of the icons are derived from figma
type IconType =
  | "chevron-right"
  | "menu"
  | "close-x"
  | "grid"
  | "grid-outline"
  | "person"
  | "person-outline"
  | "briefcase"
  | "briefcase-outline"
  | "binoculars"
  | "binoculars-outline"
  | "life-preserver"
  | "life-preserver-outline"
  | "gear"
  | "gear-outline"
  | "door-closed"
  | "door-closed-outline"
  | "box-arrow-up-right";

// TODO: fill of the icons should be transparent and hover/focus:primary-500. Currently they are filled with the text color thats black on unfocused and primary-500 on hover/focus
function Icon(props: { type: IconType }) {
  let icon;
  if (props.type === "chevron-right") {
    icon = (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.12588 14.887C7.08598 14.8513 7.05432 14.8089 7.03272 14.7621C7.01112 14.7154 7 14.6653 7 14.6147C7 14.5642 7.01112 14.5141 7.03272 14.4673C7.05432 14.4206 7.08598 14.3782 7.12588 14.3425L11.9649 9.9999L7.12588 5.65733C7.08604 5.62158 7.05444 5.57913 7.03288 5.53241C7.01132 5.48569 7.00022 5.43562 7.00022 5.38506C7.00022 5.33449 7.01132 5.28442 7.03288 5.2377C7.05444 5.19098 7.08604 5.14854 7.12588 5.11278C7.16571 5.07702 7.21301 5.04866 7.26506 5.02931C7.3171 5.00996 7.37289 5 7.42923 5C7.48557 5 7.54135 5.00996 7.5934 5.02931C7.64545 5.04866 7.69274 5.07702 7.73258 5.11278L12.8741 9.72762C12.914 9.76335 12.9457 9.80578 12.9673 9.85251C12.9889 9.89923 13 9.94932 13 9.9999C13 10.0505 12.9889 10.1006 12.9673 10.1473C12.9457 10.194 12.914 10.2365 12.8741 10.2722L7.73258 14.887C7.69278 14.9228 7.6455 14.9512 7.59344 14.9706C7.54139 14.99 7.48559 15 7.42923 15C7.37287 15 7.31707 14.99 7.26501 14.9706C7.21296 14.9512 7.16568 14.9228 7.12588 14.887Z"
          fill="#454C5C"
        />
        <path
          d="M7.12588 14.887C7.08598 14.8513 7.05432 14.8089 7.03272 14.7621C7.01112 14.7154 7 14.6653 7 14.6147C7 14.5642 7.01112 14.5141 7.03272 14.4673C7.05432 14.4206 7.08598 14.3782 7.12588 14.3425L11.9649 9.9999L7.12588 5.65733C7.08604 5.62158 7.05444 5.57913 7.03288 5.53241C7.01132 5.48569 7.00022 5.43562 7.00022 5.38506C7.00022 5.33449 7.01132 5.28442 7.03288 5.2377C7.05444 5.19098 7.08604 5.14854 7.12588 5.11278C7.16571 5.07702 7.21301 5.04866 7.26506 5.02931C7.3171 5.00996 7.37289 5 7.42923 5C7.48557 5 7.54135 5.00996 7.5934 5.02931C7.64545 5.04866 7.69274 5.07702 7.73258 5.11278L12.8741 9.72762C12.914 9.76335 12.9457 9.80578 12.9673 9.85251C12.9889 9.89923 13 9.94932 13 9.9999C13 10.0505 12.9889 10.1006 12.9673 10.1473C12.9457 10.194 12.914 10.2365 12.8741 10.2722L7.73258 14.887C7.69278 14.9228 7.6455 14.9512 7.59344 14.9706C7.54139 14.99 7.48559 15 7.42923 15C7.37287 15 7.31707 14.99 7.26501 14.9706C7.21296 14.9512 7.16568 14.9228 7.12588 14.887Z"
          stroke="#454C5C"
        />
      </svg>
    );
  }
  if (props.type === "menu") {
    icon = (
      <svg
        width="28"
        height="36"
        viewBox="0 0 28 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.26172 11.25C4.26172 10.6287 4.65806 10.125 5.14696 10.125H22.8519C23.3408 10.125 23.7371 10.6287 23.7371 11.25C23.7371 11.8713 23.3408 12.375 22.8519 12.375H5.14696C4.65806 12.375 4.26172 11.8713 4.26172 11.25Z"
          fill="#3C4658"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.26172 18C4.26172 17.3787 4.65806 16.875 5.14696 16.875H22.8519C23.3408 16.875 23.7371 17.3787 23.7371 18C23.7371 18.6213 23.3408 19.125 22.8519 19.125H5.14696C4.65806 19.125 4.26172 18.6213 4.26172 18Z"
          fill="#3C4658"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.26172 24.7197C4.26172 24.0984 4.65806 23.5947 5.14696 23.5947H22.8519C23.3408 23.5947 23.7371 24.0984 23.7371 24.7197C23.7371 25.3411 23.3408 25.8447 22.8519 25.8447H5.14696C4.65806 25.8447 4.26172 25.3411 4.26172 24.7197Z"
          fill="#3C4658"
        />
      </svg>
    );
  }
  if (props.type === "close-x") {
    icon = (
      <svg
        width="35"
        height="36"
        viewBox="0 0 35 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10.1631 10.4533C10.2647 10.3485 10.3854 10.2654 10.5183 10.2087C10.6512 10.152 10.7936 10.1228 10.9375 10.1228C11.0814 10.1228 11.2238 10.152 11.3567 10.2087C11.4896 10.2654 11.6103 10.3485 11.7119 10.4533L17.5 16.4091L23.2881 10.4533C23.3898 10.3487 23.5105 10.2657 23.6434 10.2091C23.7763 10.1525 23.9187 10.1234 24.0625 10.1234C24.2063 10.1234 24.3487 10.1525 24.4816 10.2091C24.6145 10.2657 24.7352 10.3487 24.8369 10.4533C24.9386 10.5579 25.0192 10.6821 25.0743 10.8188C25.1293 10.9554 25.1576 11.1019 25.1576 11.2498C25.1576 11.3977 25.1293 11.5442 25.0743 11.6809C25.0192 11.8175 24.9386 11.9417 24.8369 12.0463L19.0466 17.9998L24.8369 23.9533C24.9386 24.0579 25.0192 24.1821 25.0743 24.3188C25.1293 24.4554 25.1576 24.6019 25.1576 24.7498C25.1576 24.8977 25.1293 25.0442 25.0743 25.1809C25.0192 25.3175 24.9386 25.4417 24.8369 25.5463C24.7352 25.6509 24.6145 25.7339 24.4816 25.7905C24.3487 25.8471 24.2063 25.8762 24.0625 25.8762C23.9187 25.8762 23.7763 25.8471 23.6434 25.7905C23.5105 25.7339 23.3898 25.6509 23.2881 25.5463L17.5 19.5906L11.7119 25.5463C11.6102 25.6509 11.4895 25.7339 11.3566 25.7905C11.2237 25.8471 11.0813 25.8762 10.9375 25.8762C10.7937 25.8762 10.6513 25.8471 10.5184 25.7905C10.3855 25.7339 10.2648 25.6509 10.1631 25.5463C10.0614 25.4417 9.98077 25.3175 9.92573 25.1809C9.8707 25.0442 9.84237 24.8977 9.84237 24.7498C9.84237 24.6019 9.8707 24.4554 9.92573 24.3188C9.98077 24.1821 10.0614 24.0579 10.1631 23.9533L15.9534 17.9998L10.1631 12.0463C10.0613 11.9418 9.98046 11.8177 9.92532 11.681C9.87018 11.5443 9.8418 11.3978 9.8418 11.2498C9.8418 11.1018 9.87018 10.9553 9.92532 10.8186C9.98046 10.682 10.0613 10.5578 10.1631 10.4533Z"
          fill="#3C4658"
        />
      </svg>
    );
  }
  if (props.type === "grid") {
    icon = (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 2.5C1 1.67157 1.67157 1 2.5 1L5.5 1C6.32843 1 7 1.67157 7 2.5V5.5C7 6.32843 6.32843 7 5.5 7H2.5C1.67157 7 1 6.32843 1 5.5L1 2.5ZM9 2.5C9 1.67157 9.67157 1 10.5 1L13.5 1C14.3284 1 15 1.67157 15 2.5V5.5C15 6.32843 14.3284 7 13.5 7H10.5C9.67157 7 9 6.32843 9 5.5V2.5ZM1 10.5C1 9.67157 1.67157 9 2.5 9H5.5C6.32843 9 7 9.67157 7 10.5V13.5C7 14.3284 6.32843 15 5.5 15H2.5C1.67157 15 1 14.3284 1 13.5L1 10.5ZM9 10.5C9 9.67157 9.67157 9 10.5 9H13.5C14.3284 9 15 9.67157 15 10.5V13.5C15 14.3284 14.3284 15 13.5 15H10.5C9.67157 15 9 14.3284 9 13.5V10.5Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (props.type === "grid-outline") {
    icon = (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 2.5C1 1.67157 1.67157 1 2.5 1L5.5 1C6.32843 1 7 1.67157 7 2.5V5.5C7 6.32843 6.32843 7 5.5 7H2.5C1.67157 7 1 6.32843 1 5.5L1 2.5ZM2.5 2C2.22386 2 2 2.22386 2 2.5V5.5C2 5.77614 2.22386 6 2.5 6H5.5C5.77614 6 6 5.77614 6 5.5V2.5C6 2.22386 5.77614 2 5.5 2H2.5ZM9 2.5C9 1.67157 9.67157 1 10.5 1L13.5 1C14.3284 1 15 1.67157 15 2.5V5.5C15 6.32843 14.3284 7 13.5 7H10.5C9.67157 7 9 6.32843 9 5.5V2.5ZM10.5 2C10.2239 2 10 2.22386 10 2.5V5.5C10 5.77614 10.2239 6 10.5 6H13.5C13.7761 6 14 5.77614 14 5.5V2.5C14 2.22386 13.7761 2 13.5 2H10.5ZM1 10.5C1 9.67157 1.67157 9 2.5 9H5.5C6.32843 9 7 9.67157 7 10.5V13.5C7 14.3284 6.32843 15 5.5 15H2.5C1.67157 15 1 14.3284 1 13.5L1 10.5ZM2.5 10C2.22386 10 2 10.2239 2 10.5V13.5C2 13.7761 2.22386 14 2.5 14H5.5C5.77614 14 6 13.7761 6 13.5V10.5C6 10.2239 5.77614 10 5.5 10H2.5ZM9 10.5C9 9.67157 9.67157 9 10.5 9H13.5C14.3284 9 15 9.67157 15 10.5V13.5C15 14.3284 14.3284 15 13.5 15H10.5C9.67157 15 9 14.3284 9 13.5V10.5ZM10.5 10C10.2239 10 10 10.2239 10 10.5V13.5C10 13.7761 10.2239 14 10.5 14H13.5C13.7761 14 14 13.7761 14 13.5V10.5C14 10.2239 13.7761 10 13.5 10H10.5Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (props.type === "person") {
    icon = (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.75 15.5C1.75 15.5 0.5 15.5 0.5 14.25C0.5 13 1.75 9.25 8 9.25C14.25 9.25 15.5 13 15.5 14.25C15.5 15.5 14.25 15.5 14.25 15.5H1.75Z"
          fill="currentColor"
        />
        <path
          d="M8 8C10.0711 8 11.75 6.32107 11.75 4.25C11.75 2.17893 10.0711 0.5 8 0.5C5.92893 0.5 4.25 2.17893 4.25 4.25C4.25 6.32107 5.92893 8 8 8Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (props.type === "person-outline") {
    icon = (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 8C10.0711 8 11.75 6.32107 11.75 4.25C11.75 2.17893 10.0711 0.5 8 0.5C5.92893 0.5 4.25 2.17893 4.25 4.25C4.25 6.32107 5.92893 8 8 8ZM10.5 4.25C10.5 5.63071 9.38071 6.75 8 6.75C6.61929 6.75 5.5 5.63071 5.5 4.25C5.5 2.86929 6.61929 1.75 8 1.75C9.38071 1.75 10.5 2.86929 10.5 4.25Z"
          fill="currentColor"
        />
        <path
          d="M15.5 14.25C15.5 15.5 14.25 15.5 14.25 15.5H1.75C1.75 15.5 0.5 15.5 0.5 14.25C0.5 13 1.75 9.25 8 9.25C14.25 9.25 15.5 13 15.5 14.25ZM14.25 14.2456C14.2482 13.9372 14.0578 13.0131 13.2099 12.1651C12.3945 11.3498 10.8614 10.5 7.99999 10.5C5.1386 10.5 3.60544 11.3498 2.79012 12.1651C1.94219 13.0131 1.75178 13.9372 1.75 14.2456H14.25Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (props.type === "briefcase") {
    icon = (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.59375 1.4375C5.81725 1.4375 5.1875 2.06672 5.1875 2.84352V3.3125H1.90625C1.1296 3.3125 0.5 3.9421 0.5 4.71875V6.01638L7.63766 7.91976C7.87507 7.98307 8.12493 7.98307 8.36234 7.91976L15.5 6.01638V4.71875C15.5 3.9421 14.8704 3.3125 14.0938 3.3125H10.8125V2.84352C10.8125 2.06672 10.1828 1.4375 9.40625 1.4375H6.59375ZM6.59375 2.375H9.40625C9.66528 2.375 9.875 2.58559 9.875 2.84433V3.3125H6.125V2.84352C6.125 2.58479 6.33472 2.375 6.59375 2.375Z"
          fill="currentColor"
        />
        <path
          d="M0.5 12.2188C0.5 12.9954 1.1296 13.625 1.90625 13.625H14.0938C14.8704 13.625 15.5 12.9954 15.5 12.2188V6.92112L8.12078 8.88891C8.04164 8.91002 7.95836 8.91002 7.87922 8.88891L0.5 6.92112V12.2188Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (props.type === "briefcase-outline") {
    icon = (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.59375 1.4375C5.81725 1.4375 5.1875 2.06672 5.1875 2.84352V3.3125H1.90625C1.1296 3.3125 0.5 3.9421 0.5 4.71875V12.2188C0.5 12.9954 1.1296 13.625 1.90625 13.625H14.0938C14.8704 13.625 15.5 12.9954 15.5 12.2188V4.71875C15.5 3.9421 14.8704 3.3125 14.0938 3.3125H10.8125V2.84352C10.8125 2.06672 10.1828 1.4375 9.40625 1.4375H6.59375ZM6.59375 2.375H9.40625C9.66528 2.375 9.875 2.58559 9.875 2.84433V3.3125H6.125V2.84352C6.125 2.58479 6.33472 2.375 6.59375 2.375ZM8.36234 8.85726L14.5625 7.20388V12.2188C14.5625 12.4776 14.3526 12.6875 14.0938 12.6875H1.90625C1.64737 12.6875 1.4375 12.4776 1.4375 12.2188V7.20388L7.63766 8.85726C7.87507 8.92057 8.12493 8.92057 8.36234 8.85726ZM1.90625 4.25H14.0938C14.3526 4.25 14.5625 4.45987 14.5625 4.71875V6.23362L8.12078 7.95141C8.04164 7.97252 7.95836 7.97252 7.87922 7.95141L1.4375 6.23362V4.71875C1.4375 4.45987 1.64737 4.25 1.90625 4.25Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (props.type === "binoculars") {
    icon = (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.71875 1.4375C3.9421 1.4375 3.3125 2.0671 3.3125 2.84375V3.3125H7.0625V2.84375C7.0625 2.0671 6.4329 1.4375 5.65625 1.4375H4.71875Z"
          fill="currentColor"
        />
        <path
          d="M7.0625 4.25V5.1875H8.9375V4.25H12.6875V5.07684C12.6875 5.25439 12.7878 5.4167 12.9466 5.49611L13.7851 5.91537C14.2616 6.15358 14.5625 6.64051 14.5625 7.17316V12.6875H8.9375V11.2813C8.9375 11.1569 8.98689 11.0377 9.07479 10.9498L9.875 10.1496V9.40625C9.875 9.14737 9.66513 8.9375 9.40625 8.9375H6.59375C6.33487 8.9375 6.125 9.14737 6.125 9.40625V10.1496L6.92521 10.9498C7.01311 11.0377 7.0625 11.1569 7.0625 11.2813V12.6875H1.4375V7.17316C1.4375 6.64051 1.73844 6.15358 2.21486 5.91537L3.05338 5.49611C3.21219 5.4167 3.3125 5.25439 3.3125 5.07684V4.25H7.0625Z"
          fill="currentColor"
        />
        <path
          d="M1.4375 13.625V14.0938C1.4375 14.8704 2.0671 15.5 2.84375 15.5H5.65625C6.4329 15.5 7.0625 14.8704 7.0625 14.0938V13.625H1.4375Z"
          fill="currentColor"
        />
        <path
          d="M8.9375 13.625V14.0938C8.9375 14.8704 9.5671 15.5 10.3438 15.5H13.1563C13.9329 15.5 14.5625 14.8704 14.5625 14.0938V13.625H8.9375Z"
          fill="currentColor"
        />
        <path
          d="M12.6875 3.3125H8.9375V2.84375C8.9375 2.0671 9.5671 1.4375 10.3438 1.4375H11.2813C12.0579 1.4375 12.6875 2.0671 12.6875 2.84375V3.3125Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (props.type === "binoculars-outline") {
    icon = (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3.3125 2.84375C3.3125 2.0671 3.9421 1.4375 4.71875 1.4375H5.65625C6.4329 1.4375 7.0625 2.0671 7.0625 2.84375V5.1875H8.9375V2.84375C8.9375 2.0671 9.5671 1.4375 10.3438 1.4375H11.2813C12.0579 1.4375 12.6875 2.0671 12.6875 2.84375V5.07684C12.6875 5.25439 12.7878 5.4167 12.9466 5.49611L13.7851 5.91537C14.2616 6.15358 14.5625 6.64051 14.5625 7.17316V14.0938C14.5625 14.8704 13.9329 15.5 13.1563 15.5H10.3438C9.5671 15.5 8.9375 14.8704 8.9375 14.0938V11.2813C8.9375 11.1569 8.98689 11.0377 9.07479 10.9498L9.875 10.1496V9.40625C9.875 9.14737 9.66513 8.9375 9.40625 8.9375H6.59375C6.33487 8.9375 6.125 9.14737 6.125 9.40625V10.1496L6.92521 10.9498C7.01311 11.0377 7.0625 11.1569 7.0625 11.2813V14.0938C7.0625 14.8704 6.4329 15.5 5.65625 15.5H2.84375C2.0671 15.5 1.4375 14.8704 1.4375 14.0938V7.17316C1.4375 6.64051 1.73844 6.15358 2.21486 5.91537L3.05338 5.49611C3.21219 5.4167 3.3125 5.25439 3.3125 5.07684V2.84375ZM4.71875 2.375C4.45987 2.375 4.25 2.58487 4.25 2.84375V3.3125H6.125V2.84375C6.125 2.58487 5.91513 2.375 5.65625 2.375H4.71875ZM6.125 4.25H4.25V5.07684C4.25 5.60949 3.94906 6.09642 3.47264 6.33463L2.63412 6.75389C2.47531 6.8333 2.375 6.99561 2.375 7.17316V12.6875H6.125V11.4754L5.32479 10.6752C5.23689 10.5873 5.1875 10.4681 5.1875 10.3438V9.40625C5.1875 8.6296 5.8171 8 6.59375 8H9.40625C10.1829 8 10.8125 8.6296 10.8125 9.40625V10.3438C10.8125 10.4681 10.7631 10.5873 10.6752 10.6752L9.875 11.4754V12.6875H13.625V7.17316C13.625 6.99561 13.5247 6.8333 13.3659 6.75389L12.5274 6.33463C12.0509 6.09642 11.75 5.60949 11.75 5.07684V4.25H9.875V5.65625C9.875 5.91513 9.66513 6.125 9.40625 6.125H6.59375C6.33487 6.125 6.125 5.91513 6.125 5.65625V4.25ZM9.875 3.3125H11.75V2.84375C11.75 2.58487 11.5401 2.375 11.2813 2.375H10.3438C10.0849 2.375 9.875 2.58487 9.875 2.84375V3.3125ZM13.625 13.625H9.875V14.0938C9.875 14.3526 10.0849 14.5625 10.3438 14.5625H13.1563C13.4151 14.5625 13.625 14.3526 13.625 14.0938V13.625ZM6.125 13.625H2.375V14.0938C2.375 14.3526 2.58487 14.5625 2.84375 14.5625H5.65625C5.91513 14.5625 6.125 14.3526 6.125 14.0938V13.625Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (props.type === "life-preserver") {
    icon = (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM14.4297 10.7719C13.723 12.4091 12.4091 13.723 10.7719 14.4297L9.65674 11.6418C10.5343 11.242 11.242 10.5343 11.6418 9.65674L14.4297 10.7719ZM5.2281 14.4297C3.59086 13.723 2.27703 12.4091 1.57026 10.7719L4.35815 9.65674C4.75801 10.5343 5.46571 11.242 6.34326 11.6418L5.2281 14.4297ZM14.4297 5.2281L11.6418 6.34326C11.242 5.46571 10.5343 4.75801 9.65674 4.35815L10.7719 1.57026C12.4091 2.27703 13.723 3.59086 14.4297 5.2281ZM6.34326 4.35815C5.46571 4.75801 4.75801 5.46571 4.35815 6.34326L1.57026 5.2281C2.27703 3.59086 3.59086 2.27703 5.2281 1.57026L6.34326 4.35815ZM8 11C6.34315 11 5 9.65685 5 8C5 6.34315 6.34315 5 8 5C9.65685 5 11 6.34315 11 8C11 9.65685 9.65685 11 8 11Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (props.type === "life-preserver-outline") {
    icon = (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="8" cy="8" r="7.5" stroke="currentColor" />
        <circle cx="8" cy="8" r="3.5" stroke="currentColor" />
        <path
          d="M15.25 1.25L11.25 1.25M4.75 1.25L0.75 1.25"
          stroke="currentColor"
        />
        <path d="M0.999997 0L0.999996 4M1 10.5L1 14.5" stroke="currentColor" />
      </svg>
    );
  }
  if (props.type === "gear") {
    icon = (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9.40466 1.05039C8.99186 -0.350129 7.00814 -0.350128 6.59534 1.05039L6.49523 1.39003C6.23147 2.2849 5.20935 2.70827 4.39008 2.26201L4.07913 2.09264C2.79692 1.39422 1.39422 2.79693 2.09264 4.07913L2.26201 4.39008C2.70827 5.20935 2.2849 6.23147 1.39003 6.49523L1.05039 6.59534C-0.350129 7.00814 -0.350128 8.99186 1.05039 9.40466L1.39003 9.50477C2.2849 9.76853 2.70827 10.7906 2.26201 11.6099L2.09264 11.9209C1.39422 13.2031 2.79692 14.6058 4.07913 13.9074L4.39008 13.738C5.20935 13.2917 6.23147 13.7151 6.49523 14.61L6.59534 14.9496C7.00814 16.3501 8.99186 16.3501 9.40466 14.9496L9.50477 14.61C9.76853 13.7151 10.7906 13.2917 11.6099 13.738L11.9209 13.9074C13.2031 14.6058 14.6058 13.2031 13.9074 11.9209L13.738 11.6099C13.2917 10.7906 13.7151 9.76853 14.61 9.50477L14.9496 9.40466C16.3501 8.99186 16.3501 7.00814 14.9496 6.59534L14.61 6.49523C13.7151 6.23147 13.2917 5.20935 13.738 4.39008L13.9074 4.07913C14.6058 2.79692 13.2031 1.39422 11.9209 2.09264L11.6099 2.26201C10.7906 2.70827 9.76853 2.2849 9.50477 1.39003L9.40466 1.05039ZM8 10.9288C6.38246 10.9288 5.07119 9.61754 5.07119 8C5.07119 6.38246 6.38246 5.07119 8 5.07119C9.61754 5.07119 10.9288 6.38246 10.9288 8C10.9288 9.61754 9.61754 10.9288 8 10.9288Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (props.type === "gear-outline") {
    icon = (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.00004 4.75421C6.20745 4.75421 4.75427 6.20739 4.75427 7.99997C4.75427 9.79256 6.20745 11.2457 8.00004 11.2457C9.79262 11.2457 11.2458 9.79256 11.2458 7.99997C11.2458 6.20739 9.79262 4.75421 8.00004 4.75421ZM5.75427 7.99997C5.75427 6.75967 6.75973 5.75421 8.00004 5.75421C9.24034 5.75421 10.2458 6.75967 10.2458 7.99997C10.2458 9.24027 9.24034 10.2457 8.00004 10.2457C6.75973 10.2457 5.75427 9.24027 5.75427 7.99997Z"
          fill="currentColor"
        />
        <path
          d="M9.79647 1.34338C9.26853 -0.447793 6.73147 -0.447791 6.20353 1.34338L6.10968 1.66179C5.95246 2.19519 5.34321 2.44755 4.85487 2.18155L4.56336 2.02276C2.9235 1.12953 1.12953 2.9235 2.02276 4.56336L2.18155 4.85487C2.44755 5.34321 2.19519 5.95246 1.66179 6.10968L1.34338 6.20353C-0.447793 6.73147 -0.447791 9.26853 1.34338 9.79647L1.66179 9.89032C2.19519 10.0475 2.44755 10.6568 2.18155 11.1451L2.02276 11.4366C1.12953 13.0765 2.92349 14.8705 4.56335 13.9772L4.85487 13.8184C5.34321 13.5524 5.95246 13.8048 6.10968 14.3382L6.20353 14.6566C6.73147 16.4478 9.26853 16.4478 9.79647 14.6566L9.89032 14.3382C10.0475 13.8048 10.6568 13.5524 11.1451 13.8184L11.4366 13.9772C13.0765 14.8705 14.8705 13.0765 13.9772 11.4366L13.8184 11.1451C13.5524 10.6568 13.8048 10.0475 14.3382 9.89032L14.6566 9.79647C16.4478 9.26853 16.4478 6.73147 14.6566 6.20353L14.3382 6.10968C13.8048 5.95246 13.5524 5.34321 13.8184 4.85487L13.9772 4.56335C14.8705 2.92349 13.0765 1.12953 11.4366 2.02276L11.1451 2.18155C10.6568 2.44755 10.0475 2.19519 9.89032 1.66179L9.79647 1.34338ZM7.16273 1.6261C7.40879 0.7913 8.59121 0.791301 8.83727 1.6261L8.93112 1.94451C9.26845 3.08899 10.5757 3.63046 11.6235 3.05972L11.915 2.90094C12.6793 2.48463 13.5154 3.32074 13.0991 4.08501L12.9403 4.37653C12.3695 5.42433 12.911 6.73155 14.0555 7.06888L14.3739 7.16273C15.2087 7.40879 15.2087 8.59121 14.3739 8.83727L14.0555 8.93112C12.911 9.26845 12.3695 10.5757 12.9403 11.6235L13.0991 11.915C13.5154 12.6793 12.6793 13.5154 11.915 13.0991L11.6235 12.9403C10.5757 12.3695 9.26845 12.911 8.93112 14.0555L8.83727 14.3739C8.59121 15.2087 7.40879 15.2087 7.16273 14.3739L7.06888 14.0555C6.73155 12.911 5.42433 12.3695 4.37653 12.9403L4.08501 13.0991C3.32074 13.5154 2.48463 12.6793 2.90093 11.915L3.05972 11.6235C3.63046 10.5757 3.089 9.26845 1.94452 8.93112L1.6261 8.83727C0.7913 8.59121 0.791301 7.40879 1.6261 7.16273L1.94451 7.06888C3.08899 6.73155 3.63046 5.42433 3.05972 4.37653L2.90093 4.08501C2.48463 3.32073 3.32074 2.48463 4.08501 2.90093L4.37653 3.05972C5.42432 3.63046 6.73155 3.089 7.06888 1.94452L7.16273 1.6261Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (props.type === "door-closed") {
    icon = (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 1C12.5523 1 13 1.44772 13 2V15H14.5C14.7761 15 15 15.2239 15 15.5C15 15.7761 14.7761 16 14.5 16H1.5C1.22386 16 1 15.7761 1 15.5C1 15.2239 1.22386 15 1.5 15H3V2C3 1.44772 3.44771 1 4 1H12ZM10 10C10.5523 10 11 9.55229 11 9C11 8.44772 10.5523 8 10 8C9.44772 8 9 8.44772 9 9C9 9.55229 9.44772 10 10 10Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (props.type === "door-closed-outline") {
    icon = (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 2C3 1.44771 3.44772 1 4 1H12C12.5523 1 13 1.44771 13 2V15H14.5C14.7761 15 15 15.2239 15 15.5C15 15.7761 14.7761 16 14.5 16H1.5C1.22386 16 1 15.7761 1 15.5C1 15.2239 1.22386 15 1.5 15H3V2ZM4 15H12V2H4V15Z"
          fill="currentColor"
        />
        <path
          d="M9 9C9 9.55229 9.44771 10 10 10C10.5523 10 11 9.55229 11 9C11 8.44772 10.5523 8 10 8C9.44771 8 9 8.44772 9 9Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (props.type === "box-arrow-up-right") {
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="w-4 h-4">
        <path
          fill="currentColor"
          fillRule="evenodd"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth=".3"
          d="M7.477 3.625a.375.375 0 0 0-.375-.375H2.125C1.504 3.25 1 3.754 1 4.375v7.5C1 12.496 1.504 13 2.125 13h7.5c.621 0 1.125-.504 1.125-1.125V6.898a.375.375 0 0 0-.75 0v4.977a.375.375 0 0 1-.375.375h-7.5a.375.375 0 0 1-.375-.375v-7.5c0-.207.168-.375.375-.375h4.977a.375.375 0 0 0 .375-.375Z"
          clipRule="evenodd"
        />
        <path
          fill="currentColor"
          fillRule="evenodd"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth=".3"
          d="M13 1.375A.375.375 0 0 0 12.625 1h-3.75a.375.375 0 1 0 0 .75h2.845L5.61 7.86a.375.375 0 0 0 .53.53l6.11-6.11v2.845a.375.375 0 0 0 .75 0v-3.75Z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return icon;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function NewFeatureBanner() {
  const { t } = useTranslation(["meta"]);
  return (
    <div className="mv-absolute mv-right-2 mv-top-2 mv-w-[35px] mv-h-[18px] mv-rounded-[4px] mv-bg-success mv-text-center mv-text-xs mv-font-semibold mv-text-white">
      {t("root.new")}
    </div>
  );
}

function NextFooter() {
  const { t } = useTranslation(["organisms/footer"]);

  return (
    <footer className="mv-flex mv-flex-col mv-gap-5 mv-px-8 mv-pt-6 mv-pb-2 mv-w-full">
      {/* CP logo and description */}
      <div className="mv-flex mv-gap-0 @sm:mv-gap-18 mv-items-center">
        <div className="mv-w-48 mv-flex mv-flex-col mv-gap-3">
          <MVLink
            to="/"
            variant="primary"
            className="mv-flex mv-flex-row mv-items-center hover:mv-no-underline"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="42"
              height="42"
              viewBox="0 0 56 56"
              aria-describedby="mint-title-header"
              role="img"
              className="mv-w-[42px] mv-h-[42px] @md:mv-w-auto @md:mv-h-auto"
            >
              <g fill="none">
                <path
                  fill="#154194"
                  d="M28 56c15.464 0 28-12.536 28-28S43.464 0 28 0 0 12.536 0 28s12.536 28 28 28"
                />
                <path
                  fill="#EFE8E6"
                  d="M41.354 25.24c-.43-.89-.998-1.614-1.703-2.17a6.664 6.664 0 0 0-2.447-1.202 11.356 11.356 0 0 0-2.916-.368c-1.358 0-2.532.174-3.524.524-.992.348-1.879.781-2.662 1.298a8.371 8.371 0 0 0-2.681-1.376 10.67 10.67 0 0 0-3.113-.446 14.397 14.397 0 0 0-3.973.543c-1.266.362-2.33.84-3.19 1.434-.523.362-.927.75-1.214 1.163-.288.414-.431.957-.431 1.628v11.98c0 1.085.26 1.816.783 2.19.522.374 1.37.562 2.545.562.573 0 1.096-.033 1.566-.097.47-.065.834-.136 1.096-.213V26.889c.355-.185.72-.347 1.096-.485a4.18 4.18 0 0 1 1.488-.252c.756 0 1.396.2 1.918.6.522.402.783 1.029.783 1.881v9.615c0 1.085.254 1.816.763 2.19.51.374 1.35.562 2.525.562.574 0 1.096-.033 1.566-.097.47-.065.848-.136 1.135-.213V27.897c0-.26-.026-.52-.078-.776a4.99 4.99 0 0 1 1.233-.697 3.95 3.95 0 0 1 1.468-.272c.809 0 1.449.2 1.918.6.47.402.705 1.029.705 1.881v9.615c0 1.085.255 1.816.763 2.19.51.374 1.351.562 2.526.562.573 0 1.096-.033 1.566-.097A9.51 9.51 0 0 0 42 40.69V28.478c0-1.266-.215-2.345-.646-3.237v-.001Z"
                />
                <path
                  fill="#B16FAB"
                  d="M18.967 17.982C19.612 18.66 20.457 19 21.5 19s1.887-.34 2.532-1.018c.645-.679.968-1.513.968-2.503 0-.961-.323-1.782-.968-2.46-.645-.68-1.49-1.019-2.532-1.019-1.044 0-1.888.34-2.533 1.018-.645.68-.967 1.5-.967 2.46 0 .991.322 1.825.967 2.504m12 0C31.612 18.66 32.457 19 33.5 19s1.887-.34 2.532-1.018c.645-.679.968-1.513.968-2.503 0-.961-.323-1.782-.968-2.46-.645-.68-1.49-1.019-2.532-1.019-1.044 0-1.888.34-2.533 1.018-.645.68-.967 1.5-.967 2.46 0 .991.322 1.825.967 2.504"
                />
              </g>
            </svg>
            <span className="mv-block mv-text-sm mv-font-bold mv-text-primary mv-ml-2">
              Community
            </span>
          </MVLink>
          <p className="mv-text-sm mv-text-primary mv-font-semibold mv-hidden @sm:mv-block">
            {t(
              "description",
              "Die Vernetzungsplattform für MINT-Akteurinnen und Akteure in Deutschland."
            )}
          </p>
        </div>
        {/* BMBF Logo */}
        <div className="mv-flex-grow mv-flex mv-justify-end mv-items-center">
          <MVLink to="https://www.bmbf.de/" isExternal>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 153 109"
              width="121px"
              height="85px"
              aria-describedby="bmbf-title"
              role="img"
            >
              <g fillRule="nonzero" fill="none">
                <path
                  d="M127.554 68.622c0-.52-.122-.888-.367-1.108a1.247 1.247 0 0 0-.864-.331c-.349 0-.65.11-.898.33-.25.22-.375.589-.375 1.11 0 .519.125.89.375 1.108.248.222.54.33.868.33.35 0 .648-.108.894-.33.245-.218.367-.59.367-1.109Zm-1.605 4.734c-.212 0-.394-.013-.554-.044-.091.049-.18.11-.263.18a1.29 1.29 0 0 0-.232.255c-.166.241-.25.53-.24.823 0 .772.424 1.156 1.274 1.156.73 0 1.267-.144 1.62-.429.348-.284.523-.611.523-.981 0-.348-.107-.595-.331-.742-.22-.146-.513-.218-.884-.218h-.913Zm3.34-6.024h-.898c.23.382.345.81.345 1.29 0 .38-.061.722-.187 1.027a2.179 2.179 0 0 1-.523.772c-.227.211-.491.37-.796.48-.302.11-.63.166-.981.166h-.196c-.06 0-.124-.007-.192-.018a1.5 1.5 0 0 0-.377.242.538.538 0 0 0-.193.433c0 .15.055.271.171.369.114.092.302.141.562.141h.913c.34 0 .656.034.945.106.29.068.541.179.758.335.214.155.381.352.5.59.12.243.183.532.183.871 0 .389-.084.745-.247 1.064-.17.324-.408.606-.699.826-.33.244-.7.426-1.094.54a4.99 4.99 0 0 1-1.438.193c-.77 0-1.354-.169-1.755-.504-.399-.331-.599-.814-.599-1.443 0-.27.047-.503.142-.698a2.2 2.2 0 0 1 .337-.51c.13-.145.264-.26.398-.344.134-.084.242-.154.32-.202v-.031c-.31-.23-.462-.564-.462-1.004 0-.19.036-.354.113-.494.121-.235.308-.43.538-.562a1.79 1.79 0 0 1 .216-.11v-.032c-.37-.172-.68-.45-.89-.8-.225-.365-.336-.833-.336-1.403 0-.4.064-.752.194-1.056a2.11 2.11 0 0 1 .524-.757c.222-.2.478-.35.772-.45a2.97 2.97 0 0 1 .95-.15c.343 0 .662.06.96.18h2.19l-.167.943Zm-8.18 6.25v-4.63c0-.61-.104-1.047-.308-1.312-.204-.264-.516-.396-.936-.396-.36 0-.66.088-.9.27-.21.152-.401.327-.57.523v5.545h-1.215v-7.194h1.11v.811h.031c.028-.061.094-.148.196-.262a1.78 1.78 0 0 1 .39-.33c.16-.106.347-.198.568-.278.24-.084.495-.125.75-.12.32 0 .61.048.869.14.26.098.479.251.66.46.178.21.318.482.42.817.098.334.147.747.147 1.237v4.719h-1.212Zm-5.784 0h-1.109v-.81h-.032c-.054.095-.12.183-.194.262-.112.127-.24.238-.383.33-.175.116-.364.21-.563.277a2.087 2.087 0 0 1-.733.122 2.42 2.42 0 0 1-.862-.144 1.57 1.57 0 0 1-.652-.457 2.175 2.175 0 0 1-.412-.815c-.095-.335-.142-.746-.142-1.235v-4.724h1.213v4.633c0 .6.098 1.025.292 1.279.196.254.5.382.907.382.35 0 .646-.087.884-.262.241-.174.431-.343.57-.515v-5.517h1.216v7.194Zm-8.065 0v-4.63c0-.61-.102-1.047-.306-1.312-.207-.264-.52-.396-.938-.396-.36 0-.657.088-.9.27-.208.152-.4.328-.568.523v5.545h-1.214V62.987l1.214-.135v4.272h.03c.059-.084.122-.164.189-.24.083-.1.2-.2.35-.3a2.297 2.297 0 0 1 1.306-.376c.63 0 1.127.205 1.496.616.37.41.556 1.09.556 2.04v4.718h-1.215Zm-5.709-5.799a1.702 1.702 0 0 0-.751-.472 1.556 1.556 0 0 0-.477-.067c-.262 0-.504.047-.727.14-.231.1-.433.258-.585.459a2.352 2.352 0 0 0-.39.817c-.095.334-.141.74-.141 1.221 0 .53.041.975.127 1.332.084.361.202.649.351.866.15.213.332.366.547.462.216.093.45.14.71.14.372 0 .653-.062.848-.192a2.8 2.8 0 0 0 .413-.316l.494.84c-.067.078-.14.15-.217.218a1.777 1.777 0 0 1-.368.245c-.149.08-.332.148-.546.203a3.03 3.03 0 0 1-.741.084c-.402 0-.775-.065-1.124-.197a2.205 2.205 0 0 1-.916-.643c-.259-.3-.463-.689-.612-1.167-.15-.479-.227-1.075-.227-1.782 0-.693.09-1.276.27-1.756.181-.48.415-.868.705-1.163.29-.293.613-.508.965-.644.342-.131.705-.2 1.072-.202.271 0 .508.026.713.075.205.05.378.113.524.187.148.076.265.155.36.24.095.085.172.158.233.218l-.51.854Zm-6.143.06a3.046 3.046 0 0 0-.436-.367c-.209-.157-.485-.232-.823-.232-.322 0-.566.073-.737.224a.699.699 0 0 0-.254.54.968.968 0 0 0 .234.667c.155.175.39.36.71.56l.45.273c.489.288.874.601 1.156.934.278.336.419.766.419 1.297a1.947 1.947 0 0 1-.594 1.44c-.394.387-.961.584-1.7.584-.288 0-.545-.031-.763-.09a3.395 3.395 0 0 1-.577-.21 1.884 1.884 0 0 1-.414-.264 2.823 2.823 0 0 1-.269-.262l.585-.958c.059.06.132.13.217.208.084.081.188.16.308.233.275.179.598.27.926.262.362 0 .637-.078.827-.24a.725.725 0 0 0 .283-.583c0-.169-.022-.317-.067-.443a1.033 1.033 0 0 0-.201-.336 1.829 1.829 0 0 0-.33-.284 14.645 14.645 0 0 0-.451-.3l-.449-.284c-.449-.292-.8-.595-1.056-.915-.256-.32-.381-.73-.381-1.23 0-.27.051-.517.157-.743.104-.222.251-.417.441-.583.19-.165.411-.294.667-.391.255-.093.527-.141.817-.141.279 0 .52.028.719.082.2.054.372.125.517.21.144.086.264.17.361.256.094.083.17.158.231.217l-.523.869Zm-4.241-.39a.982.982 0 0 0-.196-.076 1.545 1.545 0 0 0-.406-.045c-.378 0-.676.104-.89.308a1.785 1.785 0 0 0-.457.667v5.275h-1.214v-7.194h1.108v.976h.03c.05-.14.113-.278.195-.413.08-.134.18-.255.299-.358a1.36 1.36 0 0 1 .427-.25c.166-.059.362-.09.594-.09.168 0 .307.016.413.046.104.03.184.055.245.074l-.148 1.08Zm-5.952 2.533c0-.96-.138-1.656-.419-2.09-.28-.436-.67-.652-1.168-.652-.499 0-.887.216-1.163.652-.274.434-.411 1.13-.411 2.09s.14 1.649.42 2.067c.25.403.695.643 1.17.629.499 0 .885-.21 1.16-.63.275-.417.41-1.106.41-2.066Zm-4.42 0c0-.66.078-1.229.233-1.709.153-.48.364-.872.628-1.175a2.44 2.44 0 0 1 .916-.674 2.795 2.795 0 0 1 1.1-.22c.4 0 .77.074 1.11.22.339.144.634.368.884.674.25.303.447.695.592 1.175.145.48.217 1.05.217 1.709 0 .67-.074 1.246-.224 1.724-.15.477-.357.87-.623 1.175a2.385 2.385 0 0 1-.922.667c-.352.14-.728.212-1.108.211-.4 0-.77-.072-1.11-.21a2.241 2.241 0 0 1-.884-.668c-.248-.306-.447-.694-.592-1.168-.144-.473-.217-1.051-.217-1.731Zm-5.994 3.596v-10.34h5.08l-.09 1.033h-3.687v3.823h3.402v1.035h-3.402v4.449h-1.303Zm-7.854-.9c.445.009.873-.171 1.178-.495.074-.078.132-.148.172-.208v-4.436a1.84 1.84 0 0 0-.383-.18 1.666 1.666 0 0 0-.547-.074 2.148 2.148 0 0 0-.787.142 1.548 1.548 0 0 0-.638.471c-.178.22-.32.504-.426.855-.104.348-.157.78-.157 1.29 0 .499.043.915.128 1.252.085.334.201.603.352.807.15.204.32.351.509.44.19.09.39.136.599.136Zm-2.847-2.59c0-.73.095-1.34.285-1.83.19-.49.435-.885.734-1.183.284-.29.634-.509 1.02-.636a3.572 3.572 0 0 1 1.139-.19c.229 0 .43.02.599.054.17.034.31.077.42.128v-3.448l1.214-.135v10.73H68.4v-.764h-.03c-.12.222-.29.415-.494.563a2.054 2.054 0 0 1-.525.27c-.236.078-.484.117-.734.112-.34 0-.661-.068-.967-.205a2.105 2.105 0 0 1-.802-.642c-.229-.295-.411-.675-.546-1.139-.135-.465-.203-1.027-.203-1.685Zm-2.696 3.49v-4.63c0-.61-.103-1.047-.308-1.312-.206-.264-.517-.396-.938-.396-.359 0-.657.088-.899.27-.209.152-.4.328-.568.523v5.545h-1.214v-7.194h1.108v.811h.03c.148-.239.347-.441.584-.593.16-.105.35-.197.57-.277.22-.08.469-.12.75-.12.319 0 .61.048.869.14.26.098.479.251.66.46.179.21.318.482.419.817.1.334.15.747.15 1.237v4.719h-1.213Zm-5.787 0h-1.11v-.81h-.027c-.147.238-.344.44-.578.592-.175.116-.364.209-.562.277-.22.082-.464.122-.734.122-.32 0-.607-.047-.863-.144a1.566 1.566 0 0 1-.65-.457 2.131 2.131 0 0 1-.413-.815c-.096-.335-.142-.746-.142-1.235v-4.724h1.213v4.633c0 .6.097 1.025.292 1.279.196.254.497.382.908.382.349 0 .644-.087.883-.262.241-.174.43-.343.57-.515v-5.517h1.213v7.194Zm51.524-20.073c0-.519-.124-.89-.368-1.108a1.244 1.244 0 0 0-.862-.329c-.33-.007-.65.11-.898.329-.248.219-.376.589-.376 1.108 0 .52.128.89.376 1.11.249.22.54.329.87.329.348 0 .647-.11.89-.33.244-.219.368-.59.368-1.109Zm-1.604 4.736c-.209 0-.394-.014-.555-.046-.092.053-.18.113-.26.18-.191.16-.332.371-.406.608a1.48 1.48 0 0 0-.067.471c0 .77.425 1.155 1.273 1.155.731 0 1.27-.142 1.619-.426.35-.285.523-.613.523-.983 0-.351-.108-.596-.328-.741-.22-.146-.514-.218-.885-.218h-.914Zm3.342-6.025h-.899c.23.38.345.81.345 1.29 0 .38-.062.722-.187 1.025a2.142 2.142 0 0 1-.524.773c-.23.212-.5.376-.795.48a2.875 2.875 0 0 1-.98.164h-.198c-.064 0-.129-.006-.193-.016a1.594 1.594 0 0 0-.377.241.546.546 0 0 0-.192.435c0 .15.057.271.171.368.116.093.305.142.563.142h.914c.338 0 .652.035.945.103.288.072.542.184.754.337.216.155.384.353.504.592.12.242.18.53.18.87 0 .39-.084.746-.248 1.066a2.436 2.436 0 0 1-.697.823 3.38 3.38 0 0 1-1.093.54c-.468.134-.953.2-1.44.195-.77 0-1.354-.168-1.753-.502-.4-.336-.599-.817-.599-1.448a1.6 1.6 0 0 1 .141-.697c.096-.194.208-.364.34-.51.128-.144.26-.258.395-.343l.323-.202v-.031c-.311-.229-.465-.565-.465-1.005 0-.19.037-.354.112-.494.122-.235.31-.43.54-.56.095-.056.167-.094.218-.114v-.03a2.016 2.016 0 0 1-.892-.802c-.225-.364-.34-.832-.34-1.4 0-.401.068-.752.197-1.057.13-.304.305-.557.524-.757.223-.202.487-.355.773-.45.294-.099.611-.15.952-.15.34 0 .659.06.957.181h2.191l-.167.943Zm-8.182 6.25v-4.63c0-.61-.102-1.048-.31-1.312-.201-.265-.513-.397-.933-.397-.36 0-.661.09-.898.27-.211.15-.403.327-.571.524v5.545H96.77v-7.193h1.109v.81h.031c.054-.096.119-.184.194-.264a1.85 1.85 0 0 1 .391-.33c.178-.114.37-.207.569-.277.219-.08.47-.12.748-.12.321 0 .61.048.87.143.26.096.479.247.658.457.182.21.322.483.421.816.099.336.15.748.15 1.236v4.722h-1.214Zm-5.784 0h-1.11v-.808h-.03c-.056.093-.122.18-.195.261a2.042 2.042 0 0 1-.382.33 2.636 2.636 0 0 1-.563.277 2.108 2.108 0 0 1-.734.12c-.319 0-.604-.047-.86-.143a1.533 1.533 0 0 1-.652-.457c-.182-.21-.317-.482-.413-.817-.094-.335-.142-.745-.142-1.235v-4.72h1.215v4.629c0 .6.095 1.028.291 1.282.195.254.495.382.907.382.35 0 .642-.088.884-.262a2.99 2.99 0 0 0 .568-.518v-5.514h1.216v7.193Zm-9.457-.899c.19 0 .36-.026.51-.075.254-.082.483-.227.667-.421.076-.079.132-.148.172-.209V52.43a1.894 1.894 0 0 0-.382-.18 1.718 1.718 0 0 0-.547-.074c-.28 0-.543.046-.786.142a1.53 1.53 0 0 0-.638.472c-.18.22-.322.505-.426.854-.107.35-.159.78-.159 1.289 0 .499.043.917.127 1.252.085.334.203.603.353.808.15.206.32.353.509.443.19.09.39.135.6.135Zm-2.847-2.593c0-.728.094-1.34.284-1.829.19-.489.435-.884.735-1.183.283-.29.632-.51 1.018-.637a3.665 3.665 0 0 1 1.14-.188c.23 0 .43.017.599.053.17.035.311.077.42.128v-3.448l1.214-.135v10.73h-1.11v-.764h-.029a1.614 1.614 0 0 1-.164.25 1.786 1.786 0 0 1-.331.314 2.054 2.054 0 0 1-1.259.38c-.34 0-.662-.065-.966-.2a2.089 2.089 0 0 1-.802-.646c-.229-.294-.413-.674-.547-1.139-.135-.465-.202-1.026-.202-1.686Zm-1.887 1.813c0 .3.04.51.126.63.083.119.232.18.442.18a.986.986 0 0 0 .448-.09l.107.9c-.06.028-.17.069-.33.12-.16.05-.376.074-.645.074-.41 0-.74-.125-.99-.374-.249-.25-.374-.695-.374-1.335v-9.022l1.216-.135v9.052Zm-3.659-7.253c-.249 0-.449-.08-.599-.24-.15-.16-.225-.37-.225-.63 0-.248.075-.454.225-.614a.786.786 0 0 1 .6-.24c.24 0 .434.08.583.24a.863.863 0 0 1 .225.614c0 .26-.074.47-.225.63a.76.76 0 0 1-.584.24Zm-.614 8.933h1.214v-7.194H76.45v7.194Zm-2.998-2.893c0-.56-.182-1.001-.546-1.326-.364-.326-.887-.487-1.567-.487h-.883v3.626h.809c.768 0 1.326-.153 1.67-.456.346-.305.517-.758.517-1.357Zm-.194-4.766c0-.48-.17-.874-.51-1.184-.34-.31-.874-.465-1.603-.465h-.69v3.568h.676c.698 0 1.227-.17 1.588-.51.36-.34.539-.81.539-1.409Zm1.318-.045c0 .36-.044.675-.133.944a2.29 2.29 0 0 1-.368.697 1.882 1.882 0 0 1-.54.471c-.199.119-.413.21-.636.27v.032a2.36 2.36 0 0 1 1.79 1.55c.105.285.157.597.157.938 0 .408-.07.782-.208 1.122-.142.341-.36.635-.653.884-.294.25-.667.446-1.116.586-.45.14-.984.209-1.604.209h-2.112V48.13h1.992c.609 0 1.131.061 1.566.185.435.127.792.305 1.071.533.28.23.482.508.607.833.125.325.187.687.187 1.086Zm-9.71 1.573a.89.89 0 0 0-.194-.075 1.498 1.498 0 0 0-.406-.045c-.38 0-.677.102-.891.308a1.777 1.777 0 0 0-.457.667v5.275h-1.215v-7.193h1.11v.973h.03c.048-.14.114-.277.195-.41.08-.137.18-.257.298-.36.121-.107.263-.19.428-.249.19-.064.39-.094.592-.09.17 0 .308.015.412.046.105.029.187.054.248.074l-.15 1.08ZM59.17 49.21a.756.756 0 0 1-.21.554.701.701 0 0 1-.51.21.696.696 0 0 1-.509-.21.75.75 0 0 1-.21-.554.746.746 0 0 1 .21-.555.69.69 0 0 1 .51-.21.696.696 0 0 1 .51.21c.142.149.218.35.209.555Zm-2.308 0a.75.75 0 0 1-.21.554.696.696 0 0 1-.51.21.693.693 0 0 1-.508-.21.753.753 0 0 1-.211-.554.75.75 0 0 1 .21-.555.69.69 0 0 1 .51-.21c.2 0 .369.07.51.21.14.14.209.324.209.555Zm2.981 9.26h-1.108v-.807h-.03a1.98 1.98 0 0 1-.577.592 2.626 2.626 0 0 1-.562.276 2.12 2.12 0 0 1-.734.12 2.43 2.43 0 0 1-.862-.143 1.548 1.548 0 0 1-.651-.457 2.105 2.105 0 0 1-.413-.817c-.093-.335-.142-.745-.142-1.235v-4.72h1.214v4.629c0 .6.097 1.028.292 1.282.195.254.497.382.906.382.35 0 .645-.088.884-.262.24-.174.43-.347.57-.518v-5.514h1.213v7.193Zm-6.234-6.204h-1.468v6.205h-1.214v-6.205h-.87v-.81l.87-.165v-1.438c0-.388.055-.723.166-1.004.109-.279.254-.509.433-.688.181-.18.39-.31.63-.39.24-.081.495-.12.764-.12.26 0 .48.035.66.105.18.069.299.125.36.165l-.255 1.004a1.68 1.68 0 0 0-.255-.129 1.101 1.101 0 0 0-.405-.066c-.29 0-.51.09-.66.269-.15.18-.224.51-.224.99v1.29h1.619l-.15.987Zm94.4-8.908v-4.63c0-.59-.085-1.014-.256-1.274-.168-.26-.445-.39-.823-.39-.2 0-.377.025-.534.075-.154.05-.289.113-.41.187-.114.07-.22.153-.315.247a4.352 4.352 0 0 0-.224.24v5.545h-1.216v-7.194h1.11v.81h.03a2.12 2.12 0 0 1 1.124-.884c.2-.07.423-.105.675-.105.82 0 1.398.319 1.738.96.069-.1.165-.207.287-.324a2.31 2.31 0 0 1 1.617-.636c1.459 0 2.188.85 2.188 2.547v4.826h-1.214v-4.63c0-.59-.105-1.014-.314-1.274-.21-.26-.52-.39-.931-.39-.339 0-.62.083-.845.247a3.13 3.13 0 0 0-.532.472c.042.248.061.498.059.749v4.826h-1.215Zm-5.635 0h-1.108v-.81h-.031c-.055.095-.12.183-.193.263a1.987 1.987 0 0 1-.384.331 2.558 2.558 0 0 1-.562.276 2.14 2.14 0 0 1-.732.12 2.5 2.5 0 0 1-.866-.142 1.58 1.58 0 0 1-.651-.457 2.18 2.18 0 0 1-.413-.818 4.712 4.712 0 0 1-.142-1.235v-4.722h1.214v4.632c0 .6.1 1.028.293 1.28.196.256.497.384.908.384.35 0 .643-.087.883-.263a3.01 3.01 0 0 0 .57-.519v-5.514h1.214v7.194Zm-7.492-8.931c-.252 0-.45-.08-.602-.24-.15-.16-.225-.37-.225-.629 0-.25.075-.455.225-.615.152-.16.35-.24.602-.24a.77.77 0 0 1 .584.24.862.862 0 0 1 .224.615c0 .26-.073.47-.224.629a.767.767 0 0 1-.584.24Zm-.617 8.93h1.216v-7.193h-1.216v7.194Zm-1.197-6.128a.927.927 0 0 0-.194-.074 1.43 1.43 0 0 0-.405-.045c-.38 0-.678.102-.893.306-.2.185-.357.413-.457.667v5.275h-1.213v-7.194h1.108v.975h.029c.053-.143.118-.28.196-.412.08-.136.18-.254.3-.36.126-.107.27-.19.427-.247.165-.06.363-.09.593-.09.17 0 .306.014.411.046.104.029.187.054.246.073l-.148 1.08Zm-7.058-.255c-.43 0-.775.18-1.034.54-.261.359-.412.88-.452 1.557h2.623c.01-.05.02-.12.025-.216.005-.102.007-.205.008-.307 0-.5-.102-.887-.303-1.162-.2-.274-.489-.412-.867-.412Zm2.277 1.62c0 .309-.01.576-.031.801-.018.224-.04.422-.06.591h-3.672c.04.85.223 1.475.549 1.874.325.4.792.6 1.4.6.354.003.702-.085 1.011-.256.124-.069.232-.14.315-.21.086-.068.148-.125.189-.164l.448.854-.224.218c-.123.11-.26.206-.406.284-.198.107-.409.19-.626.247a3.33 3.33 0 0 1-.887.105c-.448 0-.854-.073-1.22-.225a2.328 2.328 0 0 1-.93-.696c-.254-.314-.452-.715-.592-1.2-.14-.484-.209-1.065-.209-1.745 0-.64.07-1.192.216-1.657.145-.463.344-.846.593-1.146a2.35 2.35 0 0 1 .868-.666 2.614 2.614 0 0 1 1.066-.218c.687 0 1.229.218 1.62.651.388.435.582 1.087.582 1.957Zm-5.89-1.44h-1.573v3.987c0 .51.064.855.194 1.04.13.185.35.28.66.28.18 0 .336-.027.465-.076.129-.05.224-.096.284-.136l.165.975a2.004 2.004 0 0 1-.36.187c-.19.084-.445.127-.763.127-.62 0-1.085-.172-1.395-.517-.31-.345-.465-.917-.465-1.716v-4.15h-.868v-.81l.868-.18.136-2.008h1.079v2.007h1.724l-.151.99Zm-5.217.465a2.895 2.895 0 0 0-.431-.367c-.212-.156-.487-.233-.825-.233-.321 0-.565.075-.736.226a.69.69 0 0 0-.254.538.968.968 0 0 0 .232.668c.156.174.39.361.712.56l.451.27c.488.29.873.603 1.152.938.28.335.42.767.42 1.296 0 .57-.198 1.049-.592 1.44-.395.389-.962.583-1.7.583-.29 0-.545-.03-.764-.09a3.127 3.127 0 0 1-.577-.21 1.886 1.886 0 0 1-.413-.26 2.842 2.842 0 0 1-.27-.265l.585-.958.217.21c.205.189.447.332.712.42.149.049.324.075.524.075.358 0 .635-.08.824-.24a.736.736 0 0 0 .285-.585c0-.17-.022-.317-.069-.443a.978.978 0 0 0-.2-.337c-.09-.1-.201-.194-.331-.284a14.202 14.202 0 0 0-.448-.3l-.45-.285c-.449-.29-.802-.594-1.058-.915-.254-.318-.381-.728-.381-1.227 0-.27.053-.518.156-.743.107-.223.252-.42.443-.585.19-.164.413-.294.667-.388.256-.096.528-.143.817-.143.282 0 .519.027.72.083.324.083.625.242.876.465.093.083.174.156.232.216l-.526.87Zm-5.559-3.192a.785.785 0 0 1-.599-.24c-.15-.16-.225-.37-.225-.629 0-.25.075-.455.225-.615a.788.788 0 0 1 .6-.24c.238 0 .435.08.587.24a.87.87 0 0 1 .222.615c0 .26-.074.47-.222.629a.776.776 0 0 1-.588.24Zm-.613 8.93h1.215v-7.193h-1.215v7.194Zm-3.028 0v-4.63c0-.609-.1-1.046-.306-1.31-.204-.266-.518-.398-.939-.398-.359 0-.658.09-.896.271-.242.179-.43.353-.572.524v5.544h-1.212v-7.194h1.109v.81h.03c.028-.061.095-.147.192-.262.1-.116.232-.225.391-.33.16-.104.35-.196.57-.277.22-.08.47-.12.75-.12.32 0 .608.047.868.143.26.094.479.247.66.456.179.21.321.482.421.817.098.335.147.746.147 1.237v4.72h-1.213Zm-6.385-8.93c-.249 0-.448-.08-.598-.24-.15-.16-.225-.37-.225-.629a.86.86 0 0 1 .225-.615.78.78 0 0 1 .598-.24c.24 0 .437.08.588.24.147.16.221.365.221.615 0 .26-.074.47-.221.629a.77.77 0 0 1-.588.24Zm-.612 8.93h1.213v-7.193h-1.213v7.194Zm-6.805 0v-4.63c0-.589-.085-1.013-.256-1.273-.17-.26-.444-.39-.824-.39a1.748 1.748 0 0 0-1.259.51 3.646 3.646 0 0 0-.224.24v5.544h-1.213v-7.194h1.107v.81h.032c.05-.08.123-.176.224-.292.244-.272.554-.476.9-.592a2.03 2.03 0 0 1 .673-.105c.82 0 1.4.319 1.739.96a2.353 2.353 0 0 1 1.902-.96c1.46 0 2.187.85 2.187 2.547v4.826h-1.213v-4.63c0-.59-.103-1.014-.314-1.274-.209-.26-.519-.39-.928-.39-.339 0-.621.083-.847.247a3.21 3.21 0 0 0-.532.472c.02.111.034.227.045.353.01.125.015.257.015.396v4.826h-1.214Zm-5.92-5.738a3.135 3.135 0 0 0-.434-.367c-.21-.156-.484-.233-.825-.233-.318 0-.564.075-.734.226a.693.693 0 0 0-.253.538c0 .272.075.491.232.668.154.174.39.361.71.56l.45.27c.49.29.874.603 1.154.938.28.335.42.767.42 1.296 0 .57-.198 1.049-.591 1.44-.395.389-.963.583-1.7.583-.292 0-.545-.03-.766-.09a3.193 3.193 0 0 1-.578-.21 1.901 1.901 0 0 1-.412-.26 2.968 2.968 0 0 1-.27-.265l.585-.958c.06.06.132.13.218.21.205.188.447.33.711.42.151.049.325.075.526.075.358 0 .634-.08.82-.24a.737.737 0 0 0 .289-.585c.002-.15-.021-.3-.069-.443a1.019 1.019 0 0 0-.202-.337 1.892 1.892 0 0 0-.33-.284c-.13-.089-.279-.19-.449-.3l-.449-.285c-.45-.29-.803-.594-1.057-.915-.255-.318-.383-.728-.383-1.227a1.72 1.72 0 0 1 .601-1.328c.189-.164.412-.294.666-.388.255-.096.528-.143.817-.143.28 0 .52.027.719.083.2.054.371.125.515.21.146.083.266.17.362.255.095.083.172.156.232.216l-.524.87Zm-6.999-.645c-.429 0-.774.18-1.033.54-.26.359-.41.88-.45 1.557H82.4c.01-.05.016-.12.021-.216.005-.095.008-.197.008-.307 0-.5-.1-.887-.3-1.162-.2-.274-.49-.412-.87-.412Zm2.28 1.62c0 .309-.012.576-.032.801-.02.224-.04.422-.058.591h-3.673c.04.85.223 1.475.547 1.874.325.4.793.6 1.401.6.354.002.702-.086 1.012-.256.125-.069.23-.14.316-.21.084-.068.146-.125.186-.164l.449.854-.224.218c-.123.11-.258.206-.404.284-.2.106-.411.19-.63.247-.289.075-.586.11-.884.105a3.157 3.157 0 0 1-1.222-.225 2.31 2.31 0 0 1-.929-.696c-.254-.314-.452-.715-.592-1.2-.14-.484-.21-1.065-.21-1.745 0-.64.072-1.192.218-1.657.144-.463.341-.846.591-1.146a2.36 2.36 0 0 1 .87-.666c.335-.147.698-.22 1.064-.218.69 0 1.23.218 1.619.651.389.435.585 1.087.585 1.957ZM74.5 42.458c.19 0 .36-.026.509-.075.151-.05.28-.112.39-.188.176-.118.328-.268.449-.442v-4.436a1.746 1.746 0 0 0-.382-.18 1.709 1.709 0 0 0-.546-.075c-.28 0-.543.048-.788.142a1.538 1.538 0 0 0-.636.471 2.511 2.511 0 0 0-.429.855c-.103.35-.156.78-.156 1.29 0 .499.043.916.128 1.251.085.334.202.603.351.81.15.205.32.351.511.442.189.09.389.135.6.135Zm-2.847-2.592c0-.73.094-1.34.285-1.83.19-.489.433-.883.733-1.184.285-.29.634-.508 1.02-.637a3.62 3.62 0 0 1 1.138-.188c.23 0 .43.018.6.054.17.034.31.076.419.128v-3.448l1.214-.135v10.73h-1.108v-.764h-.03c-.12.222-.29.414-.495.562-.16.116-.337.207-.524.27a2.19 2.19 0 0 1-.734.112c-.34 0-.662-.067-.968-.201a2.094 2.094 0 0 1-.801-.645c-.23-.295-.412-.675-.547-1.14-.134-.464-.202-1.026-.202-1.684Zm-2.699 3.49v-4.63c0-.61-.102-1.047-.306-1.312-.205-.265-.517-.397-.937-.397-.36 0-.66.09-.9.271-.21.15-.4.327-.568.524v5.544H65.03v-7.194h1.108v.81h.03c.03-.061.094-.147.196-.262.099-.116.229-.225.39-.33.178-.113.369-.206.568-.277.221-.08.47-.12.75-.12.32 0 .609.047.87.143.258.094.48.247.659.456.18.21.32.482.418.817.101.335.15.746.15 1.237v4.72h-1.214Zm-5.783 0h-1.11v-.81h-.03a1.42 1.42 0 0 1-.196.263c-.111.127-.24.238-.38.331a2.567 2.567 0 0 1-.564.276c-.218.08-.464.12-.734.12a2.471 2.471 0 0 1-.86-.142 1.58 1.58 0 0 1-.654-.457 2.121 2.121 0 0 1-.41-.818c-.096-.334-.144-.745-.144-1.235v-4.722h1.215v4.632c0 .6.098 1.028.291 1.28.196.256.499.384.907.384.35 0 .646-.087.885-.263.24-.175.43-.347.57-.519v-5.514h1.214v7.194Zm-8.034-2.892c0-.56-.182-1.001-.547-1.326-.364-.325-.887-.487-1.566-.487h-.884v3.627h.81c.77 0 1.326-.154 1.67-.456.345-.307.517-.759.517-1.358Zm-.194-4.767c0-.479-.17-.873-.51-1.184-.34-.308-.875-.464-1.604-.464h-.69v3.568h.675c.7 0 1.229-.17 1.589-.51.36-.34.54-.81.54-1.41Zm1.318-.044c0 .36-.044.675-.135.946-.09.268-.212.5-.366.696-.15.19-.333.35-.541.472-.2.117-.413.208-.635.27v.029a2.338 2.338 0 0 1 1.37.81c.175.21.315.455.42.74.105.287.157.599.157.939 0 .408-.07.783-.21 1.121-.139.341-.357.636-.652.886-.294.25-.666.445-1.116.585-.45.14-.985.209-1.603.209h-2.113v-10.34h1.992c.61 0 1.132.063 1.567.187.434.125.79.302 1.071.532.28.23.482.507.607.832.124.325.187.688.187 1.086Z"
                  fill="#1A1919"
                ></path>
                <path
                  fill="#F1CC1F"
                  d="M39.579 83.656h1.888v25.187H37.06V83.656h2.519"
                ></path>
                <path
                  fill="#D8232A"
                  d="M39.579 58.345h1.888v25.311H37.06V58.345h2.519"
                ></path>
                <path
                  d="M17.757 42.525c.035-.282.054-.573.054-.87 0-.163.002-.352-.018-.566 2.51-.035 4.712-1.842 4.712-3.923 0-1.058-.69-1.856-1.08-2.334.086-.017.174-.038.264-.06.367.318 1.41 1.455 1.41 2.89 0 2.496-2.493 4.811-5.342 4.863Zm-2.528-8.688a1.715 1.715 0 0 0-.314-.747c.007-.254.112-.497.523-.297-.223.227-.052.628-.052.628s.454-.21.36-.51c.673.162.19 1.064-.517.926Zm-.583 1.28a2.628 2.628 0 0 0-.525-1.043c-.221-.262-.589-.573-1.08-.573-.227 0-.604.106-.844.207-.092-.163-.265-.558-.265-.736 0-.182.307-.368.898-.368 1.299 0 2.077.587 2.077 1.574 0 .344-.137.66-.261.939Zm3.336 16.75a.78.78 0 0 1 .313.057c.374 1.019 1.816 2.938 1.876 3.02l.013.017.022-.005c.353-.057 1.256-.193 2.013-.193h.017c.081 0 .174 0 .234.058.048.05.072.135.072.258 0 .187-.078.508-.173.645-.265-.288-.696-.417-1.382-.417a2.522 2.522 0 0 0-.584.096l-.054.012-.062.016.397.397c.613.611 1.141 1.14 1.141 1.49 0 .213-.206.487-.395.611-.042-.645-.693-1.505-1.325-1.987l-.054-.041-.011.226c-.01.154-.022.386-.022.631 0 1.227-.124 1.412-.549 1.412a.766.766 0 0 1-.228-.042c.24-.296.334-.686.334-1.37l-.003-.318-.004-.254c0-.28.03-.489.052-.656l.012-.094-.067-.01a6.93 6.93 0 0 0-.85-.077c-.606 0-1.015.055-1.314.336-.195-.16-.397-.433-.397-.605 0-.256.16-.277.367-.277.106 0 .205.016.341.032.26.039.653.098 1.459.098h.05l-.014-.05c-.206-.586-.767-1.436-1.668-2.53.082-.294.161-.486.443-.486Zm-7.775 3.015-.016.05h.05c.807 0 1.2-.058 1.46-.097.136-.016.235-.032.34-.032.207 0 .368.02.368.277 0 .172-.203.446-.398.605-.297-.281-.709-.336-1.314-.336-.282 0-.652.05-.85.078l-.032.004-.035.005.012.094c.023.167.052.376.052.656l-.004.254-.003.317c0 .685.095 1.075.334 1.37a.758.758 0 0 1-.227.043c-.425 0-.55-.185-.55-1.412 0-.245-.012-.477-.021-.631L9.36 55.9l-.054.041c-.632.482-1.284 1.342-1.322 1.987-.19-.124-.397-.398-.397-.61 0-.351.53-.88 1.14-1.49l.352-.352.044-.046-.114-.028a2.512 2.512 0 0 0-.584-.096c-.687 0-1.116.129-1.38.417-.096-.137-.176-.458-.176-.645 0-.123.025-.208.071-.258.062-.058.155-.058.236-.058h.017c.757 0 1.66.136 2.013.193l.022.005.013-.017c.06-.082 1.503-2.001 1.877-3.02a.761.761 0 0 1 .31-.057c.285 0 .363.192.445.486-.901 1.094-1.462 1.944-1.667 2.53Zm-3.893-17.22c0-1.435 1.043-2.572 1.41-2.89.089.022.177.043.265.06-.39.478-1.08 1.276-1.08 2.334 0 2.1 2.245 3.924 4.786 3.924-.04.478-.031.959.023 1.435-2.875-.017-5.404-2.35-5.404-4.863Zm19.276 4.426c1.288 2.038 2.298 2.004 3.822 2.004-1.262-.966-2.096-2.204-2.492-2.837l-2.355-3.768a5.582 5.582 0 0 0-1.734-3.06c.302-.115.554-.236.707-.35-1.537 0-3.062-.782-3.9-.782-.54 0-.887.322-.887.748.035.474.523.958 1.427.958.252-.005.504-.03.753-.074.489.68.883 1.296.883 2.175 0 1.65-1.973 2.935-3.965 2.935a4.03 4.03 0 0 1-.33-.013c-.182-.408-.781-1.095-.781-1.877 0-1.309.854-2.38.854-3.678 0-.808-.393-1.307-.545-1.515.245-.227.513-.506.576-.696-.143.06-.31.069-.558.069-.955 0-1.732-.25-2.49-.25-.432 0-.55.135-.55.263 0 .046.008.094.02.116a2.67 2.67 0 0 0-.494-.137 3.85 3.85 0 0 0-.72-.064c-.922 0-1.25.385-1.25.717 0 .28.222.792.47 1.181.36-.18.792-.303.99-.303.487 0 .924.466 1.154 1.018-.33.04-.393.055-.725.055-.898 0-1.508-.322-1.634-.322-.012 0-.035.006-.035.026 0 .126.253.458.755.642.66.242 1.651.342 1.816.369 0 .03-.168.343-.354.401a.195.195 0 0 1-.118.005c-.69-.137-.883-.193-1.757-.526-.028-.01-.044.006-.044.034 0 .346.897 1.112 1.7 1.403-.671.858-1.51 1.734-1.905 3.07-.11.008-.22.012-.331.012-1.991 0-3.964-1.285-3.964-2.935 0-.879.394-1.494.883-2.175.249.044.5.069.753.074.902 0 1.392-.484 1.427-.958 0-.426-.347-.748-.888-.748-.838 0-2.36.782-3.9.782.153.114.405.235.707.35a5.58 5.58 0 0 0-1.733 3.06l-2.354 3.768c-.396.633-1.233 1.87-2.494 2.837 1.524 0 2.534.034 3.823-2.004l1.208-1.934c.089.252.2.496.329.735l-2.402 3.843c-.4.636-1.227 1.863-2.493 2.836 1.523 0 2.535.035 3.823-2.002l2.067-3.31c.156.164.317.326.49.479l-2.919 4.67c-.4.639-1.223 1.861-2.493 2.834 1.524 0 2.535.037 3.823-2.003L8.1 43.684c.188.118.38.234.578.34l-3.47 5.555c-.402.64-1.226 1.86-2.494 2.835 1.524 0 2.535.034 3.823-2.003l3.574-5.722c.212.082.427.159.645.23l-4.04 6.463c-.394.63-1.236 1.871-2.492 2.834 1.525 0 2.535.035 3.824-2.002l4.304-6.89.13.023c.117.374.2.72.2 1.067 0 2.164-1.422 4.077-3.125 5.552.107.049.297.064.474.064.35 0 .578-.017.739-.047-.397.897-1.246 2.058-1.673 2.658-.558-.1-1.37-.18-1.903-.18-.555 0-.619.327-.619.618 0 .505.236.907.512 1.13.102-.258.31-.603 1.339-.603.019 0 .055.003.104.006-.302.334-1.242 1.095-1.242 1.707 0 .405.444 1.014 1.031 1.014-.035-.13-.031-.252-.031-.341 0-.498.44-1.079.81-1.482-.01.121-.004.108-.004.248 0 1.173.106 1.712.85 1.712.365 0 .618-.2.704-.26-.483-.445-.509-.796-.509-1.453l.005-.57c.002-.15 0-.349-.025-.493.267-.036.375-.036.578-.036 0 0 1.058-.084 1.313.465.287-.264.703-.635.703-1.043 0-.272-.128-.578-.672-.578-.207 0-.856.127-1.397.127.145-.325.795-1.275 1.356-1.963.086.267.218.556.514.792.04-.443.3-1.844.992-2.663.082.553.19 1.122.19 2.319 0 2.914-.7 5.065-2.188 5.477.193.337.603.638 1.028.638.544 0 .841-.614 1.142-1.194.158.428.592 1.478 1.028 1.478.435 0 .87-1.05 1.028-1.478.302.58.598 1.194 1.143 1.194.424 0 .834-.301 1.028-.638-1.488-.412-2.189-2.563-2.189-5.477 0-1.197.108-1.766.189-2.319.694.82.954 2.22.994 2.663.295-.236.428-.525.515-.792.56.688 1.209 1.638 1.356 1.963-.543 0-1.192-.127-1.399-.127-.543 0-.672.306-.672.578 0 .408.417.78.703 1.043.255-.549 1.314-.465 1.314-.465.204 0 .311 0 .579.036a3.194 3.194 0 0 0-.026.493l.003.57c0 .657-.024 1.008-.507 1.452.087.061.339.26.704.26.744 0 .85-.538.85-1.71 0-.141.005-.128-.005-.249.371.403.81.984.81 1.482 0 .09.006.21-.03.34.587 0 1.033-.608 1.033-1.013 0-.612-.942-1.373-1.244-1.707.05-.003.084-.006.104-.006 1.028 0 1.236.345 1.34.603.274-.223.51-.625.51-1.13 0-.29-.062-.617-.618-.617-.533 0-1.344.078-1.903.18-.428-.601-1.277-1.762-1.673-2.659.16.03.388.047.74.047.176 0 .365-.015.474-.064-1.704-1.475-3.125-3.388-3.125-5.552 0-.347.081-.693.198-1.067l.13-.022 4.306 6.89c1.288 2.036 2.299 2.001 3.822 2.001-1.256-.963-2.098-2.203-2.491-2.834l-4.04-6.464c.219-.07.433-.147.645-.229l3.573 5.722c1.29 2.037 2.299 2.003 3.824 2.003-1.268-.975-2.092-2.196-2.493-2.835l-3.47-5.554c.197-.107.39-.223.576-.341l2.845 4.552c1.288 2.04 2.298 2.003 3.82 2.003-1.267-.973-2.09-2.195-2.492-2.834l-2.917-4.67c.172-.153.335-.315.49-.48l2.067 3.31c1.29 2.038 2.298 2.003 3.823 2.003-1.267-.973-2.093-2.2-2.493-2.836l-2.4-3.843c.127-.24.238-.483.327-.735l1.208 1.934ZM37.06 58.47h4.408V33.284H37.06V58.47Zm16.677-55.1c0-.75-.308-1.156-1.13-1.156-.255 0-1.172.044-1.172 1.377v2.154c0 1.394.404 1.746 1.173 1.746.583 0 .97-.158 1.138-.282V5.302h-1.174v-.705h1.986v3.099c-.52.282-1.13.475-1.95.475-1.35 0-2.003-.697-2.003-2.462V3.618c0-1.271.652-2.084 2.003-2.084 1.376 0 2.03.504 1.977 1.836h-.848m2.34 4.669V1.667h3.281v.706h-2.47V4.42h2.295v.707h-2.296v2.206h2.525v.706h-3.336m4.351 0V1.667h3.16v.706h-2.348V4.42h2.224v.707H61.24v2.912h-.812M66.754.917h.83V0h-.83v.917Zm.803 4.828V3.591c0-1.333-.918-1.377-1.173-1.377-.256 0-1.174.044-1.174 1.377v2.154c0 1.394.407 1.746 1.174 1.746.768 0 1.173-.352 1.173-1.746ZM65.202.917h.83V0h-.83v.917Zm-.822 4.792V3.618c0-1.271.654-2.084 2.004-2.084s2.003.813 2.003 2.084v2.09c0 1.766-.653 2.463-2.003 2.463s-2.004-.697-2.004-2.462Zm6.213-1.305h1.219c.581 0 .865-.504.865-1.06 0-.458-.23-.97-.857-.97h-1.227v2.03Zm0 .705v2.93h-.81V1.667h2.196c1.13 0 1.527.795 1.527 1.589 0 .75-.415 1.324-1.165 1.456v.017c.732.114.998.363 1.042 1.641.008.275.096 1.272.22 1.669h-.847c-.23-.441-.177-1.27-.247-2.119-.062-.776-.69-.811-.962-.811h-.954Zm4.943 2.224h.767c1.13 0 1.545-.424 1.545-1.906V4.138c0-1.289-.397-1.765-1.245-1.765h-1.067v4.96Zm-.813-5.666h1.96c.812 0 1.395.292 1.712.97.256.54.283 1.81.283 2.013 0 1.36-.124 2.145-.39 2.569-.343.546-.987.82-2.1.82h-1.465V1.667Zm5.375 6.372V1.667h3.283v.706h-2.47V4.42h2.294v.707H80.91v2.206h2.525v.706h-3.337m5.209-3.635h1.215c.583 0 .865-.504.865-1.06 0-.458-.229-.97-.857-.97h-1.223v2.03Zm0 .705v2.93h-.814V1.667h2.196c1.131 0 1.527.795 1.527 1.589 0 .75-.413 1.324-1.163 1.456v.017c.73.114.996.363 1.04 1.641.01.275.097 1.272.221 1.669h-.846c-.23-.441-.177-1.27-.248-2.119-.062-.776-.69-.811-.962-.811h-.951Zm7.684-3.442v.706h-1.676V8.04h-.812V2.373h-1.678v-.706h4.166m5.014 6.372h-.971L95.19 1.667h.88l1.458 5.605h.016l1.49-5.605h.833L98.005 8.04m5.84-2.294V3.591c0-1.333-.915-1.377-1.171-1.377s-1.174.044-1.174 1.377v2.154c0 1.394.405 1.746 1.174 1.746.766 0 1.172-.352 1.172-1.746Zm-3.175-.036V3.618c0-1.271.652-2.084 2.004-2.084 1.35 0 2 .813 2 2.084v2.09c0 1.766-.65 2.463-2 2.463-1.352 0-2.004-.697-2.004-2.462Zm6.185 2.33h-.758V1.667h1.314l1.606 5.349h.019l1.624-5.349H112V8.04h-.812V2.373h-.019L109.39 8.04h-.769l-1.746-5.666h-.019V8.04"
                  fill="#1A1919"
                ></path>
              </g>
            </svg>
          </MVLink>
        </div>
      </div>
      <div className="mv-flex mv-justify-between mv-w-full mv-pt-6 mv-pb-4">
        {/* Copyright */}
        <div className="mv-font-bold mv-text-xs">{t("meta.copyright")}</div>
        {/* SoMe icons */}
        <ul className="mv-flex mv-items-center mv-gap-6">
          <li>
            <MVLink
              as="a"
              to="https://www.github.com/mint-vernetzt"
              isExternal
              className=""
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C12.1381 15.0539 13.5182 14.0332 14.4958 12.6716C15.4735 11.3101 15.9996 9.6762 16 8C16 3.58 12.42 0 8 0Z"
                  fill="#454C5C"
                />
              </svg>
            </MVLink>
          </li>
          <li>
            <MVLink
              as="a"
              to="https://www.instagram.com/mintvernetzt"
              isExternal
              className=""
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.00075 0C5.82806 0 5.55539 0.00950025 4.70205 0.048334C3.85037 0.0873344 3.26903 0.222169 2.76036 0.420004C2.23419 0.62434 1.78785 0.897676 1.34318 1.34251C0.898176 1.78719 0.62484 2.23352 0.419838 2.75953C0.221502 3.26837 0.0865008 3.84987 0.0481671 4.70122C0.01 5.55456 0 5.82739 0 8.00008C0 10.1728 0.00966692 10.4446 0.048334 11.298C0.0875011 12.1496 0.222336 12.731 0.420004 13.2396C0.624507 13.7658 0.897843 14.2121 1.34268 14.6568C1.78719 15.1018 2.23352 15.3758 2.75936 15.5802C3.26837 15.778 3.84987 15.9128 4.70138 15.9518C5.55472 15.9907 5.82723 16.0002 7.99975 16.0002C10.1726 16.0002 10.4444 15.9907 11.2978 15.9518C12.1495 15.9128 12.7315 15.778 13.2405 15.5802C13.7665 15.3758 14.2121 15.1018 14.6567 14.6568C15.1017 14.2121 15.375 13.7658 15.58 13.2398C15.7767 12.731 15.9117 12.1495 15.9517 11.2981C15.99 10.4448 16 10.1728 16 8.00008C16 5.82739 15.99 5.55472 15.9517 4.70138C15.9117 3.84971 15.7767 3.26837 15.58 2.7597C15.375 2.23352 15.1017 1.78719 14.6567 1.34251C14.2116 0.897509 13.7666 0.624173 13.24 0.420004C12.73 0.222169 12.1483 0.0873344 11.2966 0.048334C10.4433 0.00950025 10.1716 0 7.99825 0H8.00075ZM7.28308 1.44168C7.49608 1.44135 7.73375 1.44168 8.00075 1.44168C10.1368 1.44168 10.3899 1.44935 11.2335 1.48768C12.0135 1.52335 12.4368 1.65368 12.7188 1.76319C13.0921 1.90819 13.3583 2.08152 13.6381 2.36152C13.9181 2.64153 14.0915 2.9082 14.2368 3.28153C14.3463 3.5632 14.4768 3.98654 14.5123 4.76655C14.5507 5.60989 14.559 5.86323 14.559 7.99825C14.559 10.1333 14.5507 10.3866 14.5123 11.2299C14.4767 12.01 14.3463 12.4333 14.2368 12.715C14.0918 13.0883 13.9181 13.3541 13.6381 13.634C13.3581 13.914 13.0923 14.0873 12.7188 14.2323C12.4371 14.3423 12.0135 14.4723 11.2335 14.508C10.3901 14.5463 10.1368 14.5547 8.00075 14.5547C5.86456 14.5547 5.61139 14.5463 4.76805 14.508C3.98804 14.472 3.5647 14.3416 3.28253 14.2321C2.9092 14.0871 2.64253 13.9138 2.36252 13.6338C2.08252 13.3538 1.90919 13.0878 1.76385 12.7143C1.65435 12.4326 1.52385 12.0093 1.48835 11.2293C1.45002 10.3859 1.44235 10.1326 1.44235 7.99625C1.44235 5.85989 1.45002 5.60789 1.48835 4.76455C1.52402 3.98454 1.65435 3.5612 1.76385 3.2792C1.90885 2.90586 2.08252 2.63919 2.36252 2.35919C2.64253 2.07919 2.9092 1.90585 3.28253 1.76052C3.56454 1.65052 3.98804 1.52052 4.76805 1.48468C5.50606 1.45135 5.79206 1.44135 7.28308 1.43968V1.44168ZM12.2711 2.77003C11.7411 2.77003 11.3111 3.19953 11.3111 3.72971C11.3111 4.25971 11.7411 4.68972 12.2711 4.68972C12.8011 4.68972 13.2311 4.25971 13.2311 3.72971C13.2311 3.1997 12.8011 2.7697 12.2711 2.7697V2.77003ZM8.00075 3.89171C5.73189 3.89171 3.89237 5.73123 3.89237 8.00008C3.89237 10.2689 5.73189 12.1076 8.00075 12.1076C10.2696 12.1076 12.1085 10.2689 12.1085 8.00008C12.1085 5.73123 10.2694 3.89171 8.00058 3.89171H8.00075ZM8.00075 5.33339C9.47343 5.33339 10.6674 6.52723 10.6674 8.00008C10.6674 9.47276 9.47343 10.6668 8.00075 10.6668C6.5279 10.6668 5.33406 9.47276 5.33406 8.00008C5.33406 6.52723 6.5279 5.33339 8.00075 5.33339Z"
                  fill="#454C5C"
                />
              </svg>
            </MVLink>
          </li>
          <li>
            <MVLink
              as="a"
              to="https://bs.linkedin.com/company/mintvernetzt"
              isExternal
              className=""
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 1.146C0 0.513 0.526 0 1.175 0H14.825C15.474 0 16 0.513 16 1.146V14.854C16 15.487 15.474 16 14.825 16H1.175C0.526 16 0 15.487 0 14.854V1.146ZM4.943 13.394V6.169H2.542V13.394H4.943ZM3.743 5.182C4.58 5.182 5.101 4.628 5.101 3.934C5.086 3.225 4.581 2.686 3.759 2.686C2.937 2.686 2.4 3.226 2.4 3.934C2.4 4.628 2.921 5.182 3.727 5.182H3.743ZM8.651 13.394V9.359C8.651 9.143 8.667 8.927 8.731 8.773C8.904 8.342 9.299 7.895 9.963 7.895C10.832 7.895 11.179 8.557 11.179 9.529V13.394H13.58V9.25C13.58 7.03 12.396 5.998 10.816 5.998C9.542 5.998 8.971 6.698 8.651 7.191V7.216H8.635C8.64031 7.20765 8.64564 7.19932 8.651 7.191V6.169H6.251C6.281 6.847 6.251 13.394 6.251 13.394H8.651Z"
                  fill="#454C5C"
                />
              </svg>
            </MVLink>
          </li>
        </ul>
      </div>
    </footer>
  );
}

function ModalSection(props: { children: React.ReactNode }) {
  return <div className="mv-w-full mv-text-sm mv-gap-2">{props.children}</div>;
}

function ModalClose(props: { route: string }) {
  return (
    <Link
      id="modal-close-top"
      className="mv-text-primary"
      to={props.route}
      preventScrollReset
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="19"
        height="18"
        viewBox="0 0 19 18"
        fill="none"
      >
        <path
          d="M1.12764 0.377644C1.24705 0.257936 1.3889 0.16296 1.54507 0.0981579C1.70123 0.0333554 1.86865 0 2.03773 0C2.20681 0 2.37423 0.0333554 2.5304 0.0981579C2.68656 0.16296 2.82841 0.257936 2.94782 0.377644L9.75034 7.18273L16.5529 0.377644C16.6724 0.258129 16.8143 0.163325 16.9704 0.0986446C17.1266 0.0339638 17.2939 0.000673011 17.4629 0.000673011C17.632 0.000673011 17.7993 0.0339638 17.9555 0.0986446C18.1116 0.163325 18.2535 0.258129 18.373 0.377644C18.4925 0.497158 18.5873 0.639042 18.652 0.795195C18.7167 0.951348 18.75 1.11871 18.75 1.28773C18.75 1.45675 18.7167 1.62411 18.652 1.78027C18.5873 1.93642 18.4925 2.0783 18.373 2.19782L11.5679 9.00034L18.373 15.8029C18.4925 15.9224 18.5873 16.0643 18.652 16.2204C18.7167 16.3766 18.75 16.5439 18.75 16.7129C18.75 16.882 18.7167 17.0493 18.652 17.2055C18.5873 17.3616 18.4925 17.5035 18.373 17.623C18.2535 17.7425 18.1116 17.8373 17.9555 17.902C17.7993 17.9667 17.632 18 17.4629 18C17.2939 18 17.1266 17.9667 16.9704 17.902C16.8143 17.8373 16.6724 17.7425 16.5529 17.623L9.75034 10.8179L2.94782 17.623C2.8283 17.7425 2.68642 17.8373 2.53027 17.902C2.37411 17.9667 2.20675 18 2.03773 18C1.86871 18 1.70135 17.9667 1.5452 17.902C1.38904 17.8373 1.24716 17.7425 1.12764 17.623C1.00813 17.5035 0.913325 17.3616 0.848645 17.2055C0.783964 17.0493 0.750673 16.882 0.750673 16.7129C0.750673 16.5439 0.783964 16.3766 0.848645 16.2204C0.913325 16.0643 1.00813 15.9224 1.12764 15.8029L7.93273 9.00034L1.12764 2.19782C1.00794 2.07841 0.91296 1.93656 0.848158 1.7804C0.783355 1.62423 0.75 1.45681 0.75 1.28773C0.75 1.11865 0.783355 0.951234 0.848158 0.795067C0.91296 0.638899 1.00794 0.49705 1.12764 0.377644Z"
          fill="currentColor"
        />
      </svg>
    </Link>
  );
}

function ModalCloseButton(props: React.PropsWithChildren<{ route?: string }>) {
  if (typeof props.route === "undefined") {
    return <>{props.children}</>;
  }

  return (
    <Link
      id="modal-close-bottom"
      to={props.route}
      className="mv-btn mv-text-primary hover:mv-text-primary-700 hover:mv-bg-neutral-50 focus:mv-text-primary-700 focus:mv-bg-neutral-50 active:mv-bg-neutral-100 mv-font-semibold mv-whitespace-nowrap mv-w-full mv-h-10 mv-text-sm mv-px-6 mv-py-2.5 mv-border"
      preventScrollReset
    >
      {props.children}
    </Link>
  );
}

function ModalSubmitButton(
  props: React.InputHTMLAttributes<HTMLButtonElement>
) {
  const { children, ...inputProps } = props;
  return (
    <button
      {...inputProps}
      type="submit"
      className="mv-btn mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700 mv-font-semibold mv-whitespace-nowrap mv-w-full mv-h-10 mv-text-sm mv-px-6 mv-py-2.5 mv-border"
    >
      {props.children}
    </button>
  );
}

function ModalTitle(props: { children: React.ReactNode }) {
  return (
    <h2 className="mv-text-3xl mv-text-primary mv-font-bold mv-m-0 mv-p-0">
      {props.children}
    </h2>
  );
}

function useRedirect(props: { searchParam: string }) {
  const [searchParams] = useSearchParams();
  const [redirect, setRedirect] = React.useState<string | null>(null);

  React.useEffect(() => {
    const searchParamsCopy = new URLSearchParams(searchParams.toString());
    searchParamsCopy.delete(props.searchParam);
    const params = searchParamsCopy.toString();
    let path = location.pathname;
    if (params) {
      path = `${path}?${params}`;
    }
    setRedirect(path);
  }, [searchParams]);

  return redirect;
}

function Modal(props: React.PropsWithChildren<{ searchParam: string }>) {
  const [searchParams] = useSearchParams();
  const [open, setOpen] = React.useState(false);
  const redirect = useRedirect({ searchParam: props.searchParam });

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      setOpen(searchParams.get(props.searchParam) === "true");
    }
  }, [props.searchParam, searchParams]);

  React.useEffect(() => {
    if (open) {
      // const modalCloseTop = document.getElementById("modal-close-top");
      // modalCloseTop?.focus();

      const modal = document.getElementById("modal");
      modal?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const children = React.Children.toArray(props.children);
  const title = children.find((child) => {
    return React.isValidElement(child) && child.type === ModalTitle;
  });
  const sections = children.filter((child) => {
    return React.isValidElement(child) && child.type === ModalSection;
  });
  const submitButton = children.find((child) => {
    return React.isValidElement(child) && child.type === ModalSubmitButton;
  });
  const closeButton = children.find((child) => {
    return React.isValidElement(child) && child.type === ModalCloseButton;
  });

  if (closeButton === null) {
    throw new Error("Modal requires a close button");
  }

  const closeButtonClone =
    typeof closeButton !== "undefined"
      ? React.cloneElement(closeButton as React.ReactElement, {
          route: redirect,
        })
      : null;

  return createPortal(
    <div className="mv-transition mv-fixed mv-inset-0 mv-bg-black mv-bg-opacity-50 mv-backdrop-blur-sm mv-flex mv-items-center mv-justify-center mv-z-20">
      <div
        id="modal"
        tabIndex={-1}
        className="mv-max-w-[31rem] mv-rounded-lg mv-bg-white mv-p-8 mv-flex mv-flex-col mv-gap-6"
      >
        <div className="mv-flex mv-justify-between mv-items-baseline mv-gap-4">
          {title}
          <ModalClose route={redirect ?? "."} />
        </div>
        {sections}
        {(submitButton !== null || closeButtonClone !== null) && (
          <ModalSection>
            {submitButton !== null && submitButton}
            {closeButtonClone !== null && closeButtonClone}
          </ModalSection>
        )}
      </div>
    </div>,
    document.getElementById("modal-root") as HTMLElement
  );
}

function ModalRoot() {
  return <div id="modal-root" />;
}

Modal.Root = ModalRoot;
Modal.Title = ModalTitle;
Modal.Section = ModalSection;
Modal.CloseButton = ModalCloseButton;
Modal.SubmitButton = ModalSubmitButton;

function LoginOrRegisterCTA(props: { isAnon?: Boolean }) {
  const { isAnon = false } = props;
  const location = useLocation();
  const submit = useSubmit();

  const { t } = useTranslation(["meta"]);

  const [hideLoginOrRegisterCookie, setHideLoginOrRegisterCookie] =
    React.useState(true);
  useEffect(() => {
    const cookie = Cookies.get("mv-hide-login-or-register-cta");
    if (cookie === "true") {
      setHideLoginOrRegisterCookie(true);
    } else {
      setHideLoginOrRegisterCookie(false);
    }
  }, []);

  if (isAnon === false || hideLoginOrRegisterCookie) {
    return null;
  }

  return (
    <div className="mv-flex mv-flex-col mv-gap-4 mv-w-full mv-px-6 mv-py-6 mv-text-primary mv-bg-primary-50">
      <div className="mv-flex mv-justify-between mv-w-full">
        <p className="mv-block mv-font-semibold">
          {t("root.loginOrRegisterCTA.info")}
        </p>
        <Form
          action={location.pathname}
          method="get"
          onSubmit={(event) => {
            Cookies.set("mv-hide-login-or-register-cta", "true", {
              expires: 1,
            });
            setHideLoginOrRegisterCookie(true);
            submit(event.currentTarget);
          }}
        >
          <button type="submit">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M5.80752 5.80752C5.86558 5.74931 5.93454 5.70314 6.01048 5.67163C6.08641 5.64012 6.16781 5.6239 6.25002 5.6239C6.33223 5.6239 6.41363 5.64012 6.48956 5.67163C6.56549 5.70314 6.63446 5.74931 6.69252 5.80752L10 9.11627L13.3075 5.80752C13.3656 5.74941 13.4346 5.70331 13.5105 5.67186C13.5865 5.64042 13.6678 5.62423 13.75 5.62423C13.8322 5.62423 13.9136 5.64042 13.9895 5.67186C14.0654 5.70331 14.1344 5.74941 14.1925 5.80752C14.2506 5.86563 14.2967 5.93461 14.3282 6.01054C14.3596 6.08646 14.3758 6.16784 14.3758 6.25002C14.3758 6.3322 14.3596 6.41357 14.3282 6.4895C14.2967 6.56542 14.2506 6.63441 14.1925 6.69252L10.8838 10L14.1925 13.3075C14.2506 13.3656 14.2967 13.4346 14.3282 13.5105C14.3596 13.5865 14.3758 13.6678 14.3758 13.75C14.3758 13.8322 14.3596 13.9136 14.3282 13.9895C14.2967 14.0654 14.2506 14.1344 14.1925 14.1925C14.1344 14.2506 14.0654 14.2967 13.9895 14.3282C13.9136 14.3596 13.8322 14.3758 13.75 14.3758C13.6678 14.3758 13.5865 14.3596 13.5105 14.3282C13.4346 14.2967 13.3656 14.2506 13.3075 14.1925L10 10.8838L6.69252 14.1925C6.63441 14.2506 6.56542 14.2967 6.4895 14.3282C6.41357 14.3596 6.3322 14.3758 6.25002 14.3758C6.16784 14.3758 6.08646 14.3596 6.01054 14.3282C5.93461 14.2967 5.86563 14.2506 5.80752 14.1925C5.74941 14.1344 5.70331 14.0654 5.67186 13.9895C5.64042 13.9136 5.62423 13.8322 5.62423 13.75C5.62423 13.6678 5.64042 13.5865 5.67186 13.5105C5.70331 13.4346 5.74941 13.3656 5.80752 13.3075L9.11627 10L5.80752 6.69252C5.74931 6.63446 5.70314 6.56549 5.67163 6.48956C5.64012 6.41363 5.6239 6.33223 5.6239 6.25002C5.6239 6.16781 5.64012 6.08641 5.67163 6.01048C5.70314 5.93454 5.74931 5.86558 5.80752 5.80752Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </Form>
      </div>
      <div className="mv-flex mv-w-full mv-gap-4 mv-items-baseline">
        <Link
          to={`/login?login_redirect=${location.pathname}`}
          className="text-primary font-semibold hover:underline mv-flex-grow @sm:mv-flex-grow-0"
        >
          <Button variant="outline" fullSize>
            {t("root.loginOrRegisterCTA.login")}
          </Button>
        </Link>
        <p className="mv-text-xs mv-flex-grow-0">
          {t("root.loginOrRegisterCTA.or")}
        </p>
        <Link
          to={`/register?login_redirect=${location.pathname}`}
          className="text-primary font-semibold hover:underline mv-flex-grow @sm:mv-flex-grow-0"
        >
          <Button fullSize>{t("root.loginOrRegisterCTA.register")}</Button>
        </Link>
      </div>
    </div>
  );
}

export {
  CountUp,
  Modal,
  NavBarMenu,
  NextNavBar,
  NextFooter,
  LoginOrRegisterCTA,
};
