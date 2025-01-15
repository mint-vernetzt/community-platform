import React from "react";
import { Chip, ChipContainer } from "./../../molecules/Chip";
import { Avatar, AvatarList } from "./../../molecules/Avatar";
import {
  Card,
  CardBody,
  CardBodySection,
  CardFooter,
  CardHeader,
  CardStatus,
} from "./Card";
import { Link, type useFetcher } from "@remix-run/react";
import { type action as quitAction } from "~/routes/my/organizations/quit";
import { Image } from "./../../molecules/Image";
import { type DashboardLocales } from "~/routes/dashboard.server";
import { type ExploreOrganizationsLocales } from "~/routes/explore/organizations.server";
import { type MyOrganizationsLocales } from "~/routes/my/organizations.server";
import { type SearchOrganizationsLocales } from "~/routes/search/organizations.server";

export type OrganizationCardProps = {
  match?: number;
  publicAccess?: boolean;
  locales:
    | DashboardLocales
    | ExploreOrganizationsLocales
    | SearchOrganizationsLocales
    | MyOrganizationsLocales;
  menu?: {
    mode: "admin" | "teamMember";
    quitOrganizationFetcher: ReturnType<typeof useFetcher<typeof quitAction>>;
  };
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
    teamMembers: {
      firstName: string;
      lastName: string;
      avatar?: string | null;
      username: string;
    }[];
  };
};

function OrganizationCard(
  props: React.ButtonHTMLAttributes<HTMLDivElement> & OrganizationCardProps
) {
  const { organization, publicAccess = false, menu, locales } = props;

  const emptyMessage = publicAccess
    ? locales.organizationCard.nonPublic
    : locales.organizationCard.nonStated;

  const [checked, setChecked] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    setChecked(!checked);
  };

  React.useEffect(() => {
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
              <div className="mv-h-5 mv-overflow-hidden">
                {organization.types.length > 0 && (
                  <p className="mv-text-neutral-700 mv-text-sm mv-leading-5 mv-font-bold mv-truncate">
                    {organization.types
                      .map((type) => {
                        if (type in locales.organizationTypes === false) {
                          console.error(
                            `No locale found for organization type ${type}`
                          );
                          return type;
                        }
                        type LocaleKey = keyof typeof locales.organizationTypes;
                        return locales.organizationTypes[type as LocaleKey]
                          .title;
                      })
                      .join("/")}
                  </p>
                )}
              </div>
            </div>
          }
          <CardBodySection
            title={locales.organizationCard.areasOfActivity}
            emptyMessage={emptyMessage}
          >
            {organization.areas.length > 0 ? organization.areas.join("/") : ""}
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
      {menu !== undefined ? (
        <div className="mv-absolute mv-top-4 mv-right-4">
          <label
            htmlFor={`organization-context-menu-${organization.slug}`}
            className="mv-p-2 mv-w-8 mv-h-8 mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-place-items-center mv-rounded-lg mv-border mv-border-primary mv-bg-neutral-50 mv-cursor-pointer"
            aria-description={`Organization context menu for ${organization.name}`}
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
            className="mv-absolute mv-right-0 mv-top-0 mv-bg-white mv-rounded-lg mv-p-4 mv-hidden peer-[:checked]:mv-flex mv-flex-col mv-gap-4 mv-text-neutral-700 mv-leading-[19px] mv-text-nowrap"
          >
            {menu.mode === "admin" ? (
              <>
                <li key={`edit-organization-${organization.slug}`}>
                  <Link
                    className="mv-w-full mv-h-full mv-flex mv-gap-3 mv-py-2"
                    to={`/organization/${organization.slug}/settings`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15.1831 0.183058C15.4272 -0.0610194 15.8229 -0.0610194 16.067 0.183058L19.817 3.93306C20.061 4.17714 20.061 4.57286 19.817 4.81694L7.31696 17.3169C7.25711 17.3768 7.18573 17.4239 7.10714 17.4553L0.857137 19.9553C0.625002 20.0482 0.359866 19.9937 0.183076 19.8169C0.00628736 19.6402 -0.0481339 19.375 0.0447203 19.1429L2.54472 12.8929C2.57616 12.8143 2.62323 12.7429 2.68308 12.6831L15.1831 0.183058ZM14.0089 3.125L16.875 5.99112L18.4911 4.375L15.625 1.50888L14.0089 3.125ZM15.9911 6.875L13.125 4.00888L5.00002 12.1339V12.5H5.62502C5.9702 12.5 6.25002 12.7798 6.25002 13.125V13.75H6.87502C7.2202 13.75 7.50002 14.0298 7.50002 14.375V15H7.86613L15.9911 6.875ZM3.78958 13.3443L3.65767 13.4762L1.74693 18.2531L6.52379 16.3423L6.6557 16.2104C6.41871 16.1216 6.25002 15.893 6.25002 15.625V15H5.62502C5.27984 15 5.00002 14.7202 5.00002 14.375V13.75H4.37502C4.10701 13.75 3.87841 13.5813 3.78958 13.3443Z"
                        fill="CurrentColor"
                      />
                    </svg>
                    <span>{locales.organizationCard.edit}</span>
                  </Link>
                </li>
                <div
                  key="divider"
                  className="mv-w-full mv-h-0 mv-border-b mv-border-neutral-200"
                />
              </>
            ) : null}
            <li key={`quit-organization-${organization.slug}`}>
              <label
                htmlFor={`quit-organization-${organization.slug}`}
                className="mv-w-full mv-h-full mv-flex mv-gap-3 mv-cursor-pointer mv-py-2"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.625 12.5C10.2798 12.5 10 11.9404 10 11.25C10 10.5596 10.2798 10 10.625 10C10.9702 10 11.25 10.5596 11.25 11.25C11.25 11.9404 10.9702 12.5 10.625 12.5Z"
                    fill="CurrentColor"
                  />
                  <path
                    d="M13.5345 0.152845C13.6714 0.271556 13.75 0.443822 13.75 0.625004V1.25H14.375C15.4105 1.25 16.25 2.08947 16.25 3.125V18.75H18.125C18.4702 18.75 18.75 19.0298 18.75 19.375C18.75 19.7202 18.4702 20 18.125 20H1.875C1.52982 20 1.25 19.7202 1.25 19.375C1.25 19.0298 1.52982 18.75 1.875 18.75H3.75V1.875C3.75 1.56397 3.97871 1.30027 4.28661 1.25629L13.0366 0.00628568C13.216 -0.0193374 13.3976 0.0341345 13.5345 0.152845ZM14.375 2.5H13.75V18.75H15V3.125C15 2.77983 14.7202 2.5 14.375 2.5ZM5 2.41706V18.75H12.5V1.34564L5 2.41706Z"
                    fill="CurrentColor"
                  />
                </svg>
                <button
                  id={`quit-organization-${organization.slug}`}
                  form={`quit-organization-${organization.slug}-form`}
                  className="mv-appearance-none"
                  type="submit"
                >
                  {locales.organizationCard.quit}
                </button>
              </label>
            </li>
          </ul>
          <menu.quitOrganizationFetcher.Form
            id={`quit-organization-${organization.slug}-form`}
            method="post"
            action="/my/organizations/quit"
            preventScrollReset
            className="mv-hidden"
          >
            <input type="hidden" name="slug" value={organization.slug} />
          </menu.quitOrganizationFetcher.Form>
        </div>
      ) : null}
    </div>
  );
}

export { OrganizationCard };
