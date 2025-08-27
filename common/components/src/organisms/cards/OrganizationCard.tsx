import { Children, isValidElement } from "react";
import { Heading } from "~/components/Heading/Heading";
import { type DashboardLocales } from "~/routes/dashboard.server";
import { type ExploreOrganizationsLocales } from "~/routes/explore/organizations.server";
import { type MyOrganizationsLocales } from "~/routes/my/organizations.server";
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
  CardControls,
} from "./Card";

type OrganizationCardProps = {
  match?: number;
  publicAccess?: boolean;
  locales:
    | DashboardLocales
    | ExploreOrganizationsLocales
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
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};

function OrganizationCard(
  props: React.ButtonHTMLAttributes<HTMLDivElement> &
    OrganizationCardProps & {
      children?: React.ReactNode;
    }
) {
  const { organization, publicAccess = false, locales, as = "h4" } = props;

  const children = Children.toArray(props.children);

  const controls = children.find((child) => {
    return isValidElement(child) && child.type === CardControls;
  });

  const emptyMessage = publicAccess
    ? locales.organizationCard.nonPublic
    : locales.organizationCard.nonStated;

  return (
    <div className="mv-relative mv-w-full mv-h-full">
      <Card to={`/organization/${organization.slug}/detail/about`}>
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
                <Heading
                  as={as}
                  className="mv-text-primary mv-text-base mv-leading-5 mv-font-bold mv-mb-0 mv-text-ellipsis mv-overflow-hidden"
                >
                  {organization.name}
                </Heading>
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
                        type LocaleKey = keyof typeof locales.organizationTypes;
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
              to: `/organization/${organization.slug}/detail/team`,
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
        {typeof controls !== "undefined" ? controls : null}
      </Card>
    </div>
  );
}

OrganizationCard.Controls = CardControls;

export { OrganizationCard };
