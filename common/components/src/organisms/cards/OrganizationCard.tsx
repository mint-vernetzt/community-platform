import { type DashboardLocales } from "~/routes/dashboard.server";
import { type ExploreOrganizationsLocales } from "~/routes/explore/organizations.server";
import { type MyOrganizationsLocales } from "~/routes/my/organizations.server";
import { type SearchOrganizationsLocales } from "~/routes/search/organizations.server";
import { Avatar, AvatarList } from "./../../molecules/Avatar";
import { Chip, ChipContainer } from "./../../molecules/Chip";
import { Image } from "./../../molecules/Image";
import {
  Card,
  CardBody,
  CardBodySection,
  CardFooter,
  CardHeader,
  CardStatus,
} from "./Card";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const OrganizationCardContext = createContext<OrganizationCardProps | null>(
  null
);

function useOrganizationCard() {
  const context = useContext(OrganizationCardContext);
  if (context === null) {
    throw new Error("Missing OrganizationCardContext.Provider");
  }
  return context;
}

function ContextMenu(props: React.PropsWithChildren) {
  const { children } = props;
  const childrenArray = Children.toArray(children);
  const listItems = childrenArray.filter(
    (child) =>
      isValidElement(child) &&
      (child.type === ContextMenuListItem || child.type === ContextMenuDivider)
  );
  const { organization, locales } = useOrganizationCard();
  const [checked, setChecked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    setChecked(!checked);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        inputRef.current !== null &&
        inputRef.current.contains(target) === false &&
        typeof listRef !== "undefined" &&
        listRef.current !== null &&
        listRef.current.contains(target) === false
      ) {
        setChecked(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className="mv-absolute mv-top-4 mv-right-4">
      <label
        htmlFor={`organization-context-menu-${organization.slug}`}
        className="mv-p-2 mv-w-8 mv-h-8 mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-place-items-center mv-rounded-lg mv-border mv-border-primary mv-bg-neutral-50 mv-cursor-pointer"
        aria-description={`Organization context menu for ${organization.name}`}
        aria-label={locales.organizationCard.contextMenu}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 9.5C2.17157 9.5 1.5 8.82843 1.5 8C1.5 7.17157 2.17157 6.5 3 6.5C3.82843 6.5 4.5 7.17157 4.5 8C4.5 8.82843 3.82843 9.5 3 9.5ZM8 9.5C7.17157 9.5 6.5 8.82843 6.5 8C6.5 7.17157 7.17157 6.5 8 6.5C8.82843 6.5 9.5 7.17157 9.5 8C9.5 8.82843 8.82843 9.5 8 9.5ZM13 9.5C12.1716 9.5 11.5 8.82843 11.5 8C11.5 7.17157 12.1716 6.5 13 6.5C13.8284 6.5 14.5 7.17157 14.5 8C14.5 8.82843 13.8284 9.5 13 9.5Z"
            fill="black"
          />
        </svg>
      </label>
      <input
        ref={inputRef}
        type="checkbox"
        id={`organization-context-menu-${organization.slug}`}
        className="mv-w-0 mv-h-0 mv-appearance-none mv-opacity-0 mv-peer mv-absolute"
        onChange={handleChange}
        checked={checked}
      />
      <ul
        ref={listRef}
        className="mv-absolute mv-right-0 mv-top-0 mv-bg-white mv-rounded-lg mv-p-2 mv-hidden peer-[:checked]:mv-flex mv-flex-col mv-gap-4 mv-text-neutral-700 mv-leading-[19px] mv-text-nowrap"
      >
        {listItems}
      </ul>
    </div>
  );
}

function ContextMenuListItem(
  props: React.PropsWithChildren & React.HTMLProps<HTMLLIElement>
) {
  const { children, ...rest } = props;
  return (
    <li
      {...rest}
      className="mv-rounded-lg hover:mv-bg-primary-50 focus:mv-bg-primary-50 active:mv-bg-primary-100"
    >
      {children}
    </li>
  );
}

function ContextMenuDivider() {
  return (
    <div
      key="divider"
      className="mv-w-full mv-h-0 mv-border-b mv-border-neutral-200"
    />
  );
}

type OrganizationCardProps = {
  match?: number;
  publicAccess?: boolean;
  locales:
    | DashboardLocales
    | ExploreOrganizationsLocales
    | SearchOrganizationsLocales
    | MyOrganizationsLocales;
  organization: {
    slug: string;
    name: string;
    logo?: string | null;
    blurredLogo?: string;
    background?: string | null;
    blurredBackground?: string;
    focuses: string[];
    areas: string[];
    types: string[];
    networkTypes: string[];
    teamMembers: {
      firstName: string;
      lastName: string;
      avatar?: string | null;
      username: string;
    }[];
  };
};

function OrganizationCard(
  props: React.ButtonHTMLAttributes<HTMLDivElement> &
    OrganizationCardProps & {
      children?: React.ReactNode;
    }
) {
  const { organization, publicAccess = false, locales, children } = props;

  const childrenArray =
    props.children !== undefined ? Children.toArray(children) : [];
  const menu = childrenArray.filter(
    (child) => isValidElement(child) && child.type === ContextMenu
  );

  const emptyMessage = publicAccess
    ? locales.organizationCard.nonPublic
    : locales.organizationCard.nonStated;

  return (
    <OrganizationCardContext.Provider value={props}>
      <div className="mv-relative mv-w-full mv-h-full">
        <Card to={`/organization/${organization.slug}`}>
          <CardHeader>
            <Avatar {...organization} size="xl" />
            {organization.background && (
              <Image
                alt={organization.name}
                src={organization.background}
                blurredSrc={organization.blurredBackground}
              />
            )}
            {props.match !== undefined && (
              <CardStatus>
                {props.match}% {locales.organizationCard.match}
              </CardStatus>
            )}
          </CardHeader>
          <CardBody>
            {
              <div className="mv-mt-[30px] mv-min-h-[80px]">
                <div className="mv-max-h-10 mv-overflow-hidden">
                  <h4 className="mv-text-primary mv-text-base mv-leading-5 mv-font-bold mv-mb-0 mv-text-ellipsis mv-overflow-hidden">
                    {organization.name}
                  </h4>
                </div>
                <div className="mv-overflow-hidden">
                  {(organization.types.length > 0 ||
                    organization.networkTypes.length > 0) && (
                    <p className="mv-text-neutral-700 mv-text-sm mv-leading-5 mv-font-bold mv-truncate mv-line-clamp-2 mv-text-wrap">
                      {organization.types
                        .map((type) => {
                          if (type in locales.organizationTypes === false) {
                            console.error(
                              `No locale found for organization type ${type}`
                            );
                            return type;
                          }
                          type LocaleKey =
                            keyof typeof locales.organizationTypes;
                          return locales.organizationTypes[type as LocaleKey]
                            .title;
                        })
                        .join(", ")}
                      {organization.networkTypes.length > 0 ? ", " : null}
                      {organization.networkTypes
                        .map((type) => {
                          if (type in locales.networkTypes === false) {
                            console.error(
                              `No locale found for network type ${type}`
                            );
                            return type;
                          }
                          type LocaleKey = keyof typeof locales.networkTypes;
                          return locales.networkTypes[type as LocaleKey].title;
                        })
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>
            }
            <CardBodySection
              title={locales.organizationCard.areasOfActivity}
              emptyMessage={emptyMessage}
            >
              {organization.areas.length > 0
                ? organization.areas.join("/")
                : ""}
            </CardBodySection>
            <CardBodySection
              title={locales.organizationCard.focus}
              emptyMessage={emptyMessage}
            >
              {organization.focuses.length === 0 ? (
                ""
              ) : (
                <ChipContainer maxRows={2}>
                  {organization.focuses.map((focus) => {
                    let title;
                    if (focus in locales.focuses) {
                      type LocaleKey = keyof typeof locales.focuses;
                      title = locales.focuses[focus as LocaleKey].title;
                    } else {
                      console.error(`No locale found for focus ${focus}`);
                      title = focus;
                    }
                    return <Chip key={focus}>{title}</Chip>;
                  })}
                </ChipContainer>
              )}
            </CardBodySection>
          </CardBody>
          <CardFooter>
            <AvatarList
              visibleAvatars={2}
              moreIndicatorProps={{
                to: `/organization/${organization.slug}/#team-members`,
              }}
            >
              {organization.teamMembers.map((profile) => {
                return (
                  <Avatar
                    key={profile.username}
                    {...profile}
                    size="sm"
                    to={`/profile/${profile.username}`}
                  />
                );
              })}
            </AvatarList>
          </CardFooter>
        </Card>
        {menu.length > 0 ? menu : null}
      </div>
    </OrganizationCardContext.Provider>
  );
}

ContextMenu.ListItem = ContextMenuListItem;
ContextMenu.Divider = ContextMenuDivider;
OrganizationCard.ContextMenu = ContextMenu;

export { OrganizationCard };
