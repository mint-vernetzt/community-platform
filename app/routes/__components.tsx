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
  openNavBarMenuKey: string;
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
  const navBarMenuIsOpen = searchParams.get(props.openNavBarMenuKey);

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
            <Opener openNavBarMenuKey="navbarmenu" />
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

function NavBarMenu(
  props: React.PropsWithChildren & {
    mode: Mode;
    openNavBarMenuKey: string;
    openNavBarMenuTopicKey: string;
    username?: string;
  }
) {
  const [searchParams] = useSearchParams();
  const isOpen = searchParams.get(props.openNavBarMenuKey);

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

      <div className="lg:mv-hidden mv-flex mv-w-full mv-items-center mv-h-[75px] mv-min-h-[75px] mv-px-3 mv-flex-shrink mv-border-b">
        {props.mode === "anon" ? (
          <div className="mv-gap-x-4 mv-flex-grow mv-items-center mv-flex lg:mv-hidden">
            <div>
              <Link to="/login">
                <Button>Anmelden</Button>
              </Link>
            </div>
            <div className="mv-hidden sm:mv-block mv-font-semibold mv-text-primary-500">
              oder
            </div>
            <div>
              <Link to="/register">
                <Button variant="outline">Registrieren</Button>
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
                  to="/next/dashboard"
                  openNavBarMenuKey={props.openNavBarMenuKey}
                >
                  <Icon type="grid" />
                  <div className="mv-font-semibold">Überblick</div>
                </Item>

                <Topic
                  openNavBarMenuTopicKey={props.openNavBarMenuTopicKey}
                  openNavBarMenuTopicValue="personalSpace"
                >
                  <Label
                    openNavBarMenuTopicKey={props.openNavBarMenuTopicKey}
                    openNavBarMenuTopicValue="personalSpace"
                  >
                    <Icon type="person" />
                    <div className="mv-font-semibold">Mein MINT-Bereich</div>
                  </Label>

                  <TopicItem
                    to={`/next/profile/${props.username}`}
                    openNavBarMenuKey={props.openNavBarMenuKey}
                  >
                    Mein Profil
                  </TopicItem>
                  <TopicItem
                    to={`/next/overview/organizations/${props.username}`}
                    openNavBarMenuKey={props.openNavBarMenuKey}
                  >
                    Meine Organisationen
                  </TopicItem>
                  <TopicItem
                    to={`/next/overview/events/${props.username}`}
                    openNavBarMenuKey={props.openNavBarMenuKey}
                  >
                    Meine Events
                  </TopicItem>
                  <TopicItem
                    to={`/next/overview/projects/${props.username}`}
                    openNavBarMenuKey={props.openNavBarMenuKey}
                  >
                    Meine Projekte
                  </TopicItem>
                  <TopicItem
                    to={`/next/overview/networks/${props.username}`}
                    openNavBarMenuKey={props.openNavBarMenuKey}
                  >
                    Mein Netzwerk
                  </TopicItem>
                  <TopicItem
                    to={`/next/overview/bookmarks/${props.username}`}
                    openNavBarMenuKey={props.openNavBarMenuKey}
                  >
                    Gemerkte Inhalte
                  </TopicItem>
                </Topic>
              </>
            ) : null}

            <Topic
              openNavBarMenuTopicKey={props.openNavBarMenuTopicKey}
              openNavBarMenuTopicValue="resources"
            >
              <Label
                openNavBarMenuTopicKey={props.openNavBarMenuTopicKey}
                openNavBarMenuTopicValue="resources"
              >
                <Icon type="briefcase" />
                <div className="mv-font-semibold">Ressourcen</div>
              </Label>

              <TopicItem
                // TODO: Link to MINT-Sharepic when its available
                to="https://mint-vernetzt.de"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {/* TODO: Add logo to public/images and logo src to Avatar */}
                <Avatar name="MINT-Sharepic" size="xxs" textSize="xxs" />
                MINT-Sharepic
                <Icon type="box-arrow-up-right" />
                <NewFeatureBanner />
              </TopicItem>
              <TopicItem
                // TODO: Link to MINT-Bildarchiv when its available
                to="https://mint-vernetzt.de"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                {/* TODO: Add logo to public/images and logo src to Avatar */}
                <Avatar name="MINT-Bildarchiv" size="xxs" textSize="xxs" />
                MINT-Bildarchiv
                <Icon type="box-arrow-up-right" />
                <NewFeatureBanner />
              </TopicItem>
              <TopicItem
                to="https://mintcampus.org/"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                <Avatar
                  name="MINT-Campus"
                  size="xxs"
                  textSize="xxs"
                  logo={"/images/mint-campus-logo.png"}
                />
                MINT-Campus
                <Icon type="box-arrow-up-right" />
              </TopicItem>
              <TopicItem
                to="https://mint-vernetzt.shinyapps.io/datalab/"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                <Avatar
                  name="MINT-DataLab"
                  size="xxs"
                  textSize="xxs"
                  logo={"/images/mint-vernetzt_shortlogo.png"}
                />
                MINT-DataLab
                <Icon type="box-arrow-up-right" />
              </TopicItem>
              <TopicItem
                to="https://mint-vernetzt.de"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                <Avatar
                  name="MINTvernetzt Webseite"
                  size="xxs"
                  textSize="xxs"
                  logo={"/images/mint-vernetzt_shortlogo.png"}
                />
                MINTvernetzt Webseite
                <Icon type="box-arrow-up-right" />
              </TopicItem>
              <TopicItem
                to="https://github.com/mint-vernetzt/community-platform"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                <Avatar
                  name="MINTvernetzt GitHub"
                  size="xxs"
                  textSize="xxs"
                  logo={"/images/github-logo.svg"}
                />
                MINTvernetzt GitHub
                <Icon type="box-arrow-up-right" />
              </TopicItem>
            </Topic>

            <Topic
              openNavBarMenuTopicKey={props.openNavBarMenuTopicKey}
              openNavBarMenuTopicValue="explore"
            >
              <Label
                openNavBarMenuTopicKey={props.openNavBarMenuTopicKey}
                openNavBarMenuTopicValue="explore"
              >
                <Icon type="binoculars" />
                <div className="mv-font-semibold">Entdecken</div>
              </Label>

              <TopicItem
                to="/explore/profiles"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                Personen
              </TopicItem>
              <TopicItem
                to="/explore/organizations"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                Organisationen
              </TopicItem>
              <TopicItem
                to="/explore/projects"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                Projekte
              </TopicItem>
              <TopicItem
                to="/explore/events"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                Events
              </TopicItem>
              <TopicItem
                to="next/explore/subsidies"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                Förderungen
              </TopicItem>
            </Topic>
          </TopMenu>
        </div>
        <div className="mv-flex-shrink">
          <BottomMenu>
            <div className="mv-pl-2 mv-py-4">
              {/* TODO: Text color of LocaleSwitch */}
              <LocaleSwitch />
            </div>

            <Item to="/next/help" openNavBarMenuKey={props.openNavBarMenuKey}>
              <Icon type="life-preserver" />
              <div className="mv-font-semibold">Hilfe</div>
            </Item>

            {props.mode === "authenticated" ? (
              <Item
                to="/logout"
                method="post"
                openNavBarMenuKey={props.openNavBarMenuKey}
              >
                <Icon type="door-closed" />
                <div className="mv-font-semibold">Ausloggen</div>
              </Item>
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
      <div className="mv-flex mv-items-center mv-gap-4 mv-w-full mv-px-2 mv-py-4 mv-text-xs mv-border-t mv-border-gray-200">
        {children}
      </div>
    </div>
  );
}

function Item(
  props: React.PropsWithChildren & {
    to: string;
    openNavBarMenuKey: string;
    method?: "get" | "post";
  }
) {
  const children = React.Children.toArray(props.children);

  const [searchParams] = useSearchParams();
  const extendedSearchParams = new URLSearchParams(searchParams.toString());
  extendedSearchParams.delete(props.openNavBarMenuKey);
  return props.method === "post" ? (
    <>
      <Form id={props.to} method="post" action={props.to} hidden />
      <button
        form={props.to}
        type="submit"
        className="mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg hover:mv-bg-blue-50 hover:mv-text-primary-500"
      >
        {children}
      </button>
    </>
  ) : (
    <NavLink
      to={`${props.to}?${extendedSearchParams.toString()}`}
      className={({ isActive, isPending, isTransitioning }) => {
        const baseClasses =
          "mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg";
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
    openNavBarMenuTopicKey: string;
    openNavBarMenuTopicValue: string;
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

  const [searchParams] = useSearchParams();
  const openTopicId = searchParams.get(props.openNavBarMenuTopicKey);
  const isOpen = openTopicId === props.openNavBarMenuTopicValue;

  return (
    <div className="mv-w-full mv-flex mv-flex-col">
      {label}
      <div className={`${isOpen ? "" : "mv-hidden"}`}>{topicItems}</div>
    </div>
  );
}

function Label(
  props: React.PropsWithChildren & {
    openNavBarMenuTopicKey: string;
    openNavBarMenuTopicValue: string;
  }
) {
  const children = React.Children.toArray(props.children);

  const [searchParams] = useSearchParams();
  const openTopicId = searchParams.get(props.openNavBarMenuTopicKey);
  const isOpen = openTopicId === props.openNavBarMenuTopicValue;

  const extendedSearchParams = new URLSearchParams(searchParams.toString());
  if (isOpen) {
    extendedSearchParams.delete(props.openNavBarMenuTopicKey);
  } else {
    extendedSearchParams.set(
      props.openNavBarMenuTopicKey,
      props.openNavBarMenuTopicValue
    );
  }

  return (
    <Link
      to={`?${extendedSearchParams.toString()}`}
      preventScrollReset
      className="mv-flex mv-items-center mv-justify-between mv-gap-2 mv-w-full mv-cursor-pointer mv-px-2 mv-py-4 mv-rounded-lg hover:mv-bg-blue-50 hover:mv-text-primary-500"
    >
      <div
        className={`mv-flex mv-items-center mv-gap-2 mv-flex-grow ${
          isOpen ? "mv-text-primary-500" : ""
        }`}
      >
        {children}
      </div>
      <div
        className={`mv-flex-shrink mv-cursor-pointer ${
          isOpen ? "mv-rotate-90" : ""
        }`}
      >
        <Icon type="chevron-right" />
      </div>
    </Link>
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
  const [searchParams] = useSearchParams();
  const extendedSearchParams = new URLSearchParams(searchParams.toString());
  extendedSearchParams.delete(props.openNavBarMenuKey);
  return external ? (
    <Link
      to={`${props.to}`}
      target="_blank"
      className="mv-relative mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-pl-8 mv-pr-2 mv-py-4 hover:mv-bg-blue-50 hover:mv-text-primary-500"
    >
      {children}
    </Link>
  ) : (
    <NavLink
      to={`${props.to}?${extendedSearchParams.toString()}`}
      className={({ isActive, isPending, isTransitioning }) => {
        const baseClasses =
          "mv-relative mv-flex mv-items-center mv-gap-2 mv-w-full mv-cursor-pointer mv-pl-8 mv-pr-2 mv-py-4";
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
    <Link to={`?${searchParams.toString()}`}>
      <Icon type="menu" />
    </Link>
  );
}

function Closer(props: { openNavBarMenuKey: string }) {
  const [searchParams] = useSearchParams();
  searchParams.delete(props.openNavBarMenuKey);

  return (
    <Link to={`?${searchParams.toString()}`}>
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
  | "person"
  | "briefcase"
  | "binoculars"
  | "life-preserver"
  | "door-closed"
  | "box-arrow-up-right";

// TODO: fill of the icons should be transparent and hover/focus:primary-500. Currently they are filled with the text color thats black on unfocused and primary-500 on hover/focus
function Icon(props: { type: IconType }) {
  let icon;
  if (props.type === "chevron-right") {
    icon = (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.62065 4.61518L5.62064 4.61517C5.57712 4.5761 5.54181 4.52902 5.51744 4.47621C5.49305 4.42336 5.48028 4.36617 5.48028 4.30804C5.48028 4.24992 5.49305 4.19273 5.51744 4.13988C5.54181 4.08707 5.57712 4.03999 5.62064 4.00092C5.66414 3.96188 5.7151 3.9315 5.77032 3.91097C5.82554 3.89044 5.88435 3.88 5.94348 3.88C6.00261 3.88 6.06142 3.89044 6.11664 3.91097C6.17186 3.9315 6.22282 3.96188 6.26632 4.00092L10.3794 7.69269C10.3795 7.69273 10.3795 7.69276 10.3796 7.6928C10.4231 7.73181 10.4584 7.77887 10.4828 7.83165C10.5073 7.88452 10.5201 7.94175 10.5201 7.99992C10.5201 8.05809 10.5073 8.11532 10.4828 8.16819C10.4584 8.22102 10.423 8.26811 10.3794 8.30714M5.62065 4.61518L10.2994 8.21774M5.62065 4.61518L9.39237 7.99992L5.62076 11.3846L5.7008 11.474L5.62065 11.3847L5.62075 11.3846C5.57715 11.4236 5.54177 11.4707 5.51735 11.5235C5.4929 11.5764 5.4801 11.6336 5.4801 11.6918C5.4801 11.75 5.4929 11.8072 5.51735 11.8601C5.54177 11.9129 5.57715 11.96 5.62076 11.999L5.7008 11.9096L5.62053 11.9988C5.66401 12.0379 5.71498 12.0684 5.77022 12.089C5.82547 12.1095 5.88431 12.12 5.94348 12.12C6.00265 12.12 6.06149 12.1095 6.11673 12.089C6.17198 12.0684 6.22295 12.0379 6.26643 11.9988M5.62065 4.61518L6.18616 11.9096M10.3794 8.30714L10.2994 8.21774M10.3794 8.30714L10.3796 8.30704L10.2994 8.21774M10.3794 8.30714L6.26643 11.9988M10.2994 8.21774L6.18616 11.9096M6.26643 11.9988L6.18616 11.9096M6.26643 11.9988L6.26632 11.9989L6.18616 11.9096"
          fill="#3C4658"
          stroke="#3C4658"
          strokeWidth="0.24"
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

function NewFeatureBanner() {
  // TODO: i18n
  return (
    <div className="mv-absolute mv-right-2 mv-top-2 mv-w-[35px] mv-h-[18px] mv-rounded-[4px] mv-bg-success mv-text-center mv-text-xs mv-font-semibold mv-text-white">
      Neu
    </div>
  );
}

export { CountUp, NavBarMenu, NextNavBar };
