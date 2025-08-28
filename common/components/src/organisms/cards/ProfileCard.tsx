import type React from "react";
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
import { getFullName } from "./../../utils";
import { Image } from "./../../molecules/Image";
import { type ExploreProfilesLocales } from "~/routes/explore/profiles.server";
import { type DashboardLocales } from "~/routes/dashboard.server";
import { Heading } from "~/components/Heading/Heading";
import { type LinkProps } from "react-router";

type ProfileCardProps = {
  match?: number;
  publicAccess?: boolean;
  locales: ExploreProfilesLocales | DashboardLocales;
  profile: {
    academicTitle?: string | null;
    username: string;
    firstName: string;
    lastName: string;
    position?: string | null;
    avatar?: string | null;
    blurredAvatar?: string;
    background?: string | null;
    blurredBackground?: string;
    memberOf: {
      name: string;
      slug: string;
      logo?: string | null;
    }[];
    areas: string[];
    offers: string[];
  };
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  prefetch?: LinkProps["prefetch"];
};

function ProfileCard(
  props: React.ButtonHTMLAttributes<HTMLDivElement> & ProfileCardProps
) {
  const { profile, publicAccess = false, locales, as = "h4", prefetch } = props;

  const fullName = getFullName(profile);

  const emptyMessage = publicAccess
    ? locales.profileCard.nonPublic
    : locales.profileCard.nonStated;

  return (
    <Card to={`/profile/${profile.username}`} prefetch={prefetch}>
      <CardHeader>
        <Avatar {...profile} size="xl" />
        {profile.background && (
          <Image
            alt={fullName}
            src={profile.background}
            blurredSrc={profile.blurredBackground}
          />
        )}
        {props.match !== undefined && (
          <CardStatus>
            {props.match}% {locales.profileCard.match}
          </CardStatus>
        )}
      </CardHeader>
      <CardBody>
        {
          <div className="mv-mt-[30px] mv-min-h-[80px]">
            {/* TODO: */}
            {/* Issue with combination of line clamp with ellipsis (truncate) */}
            {/* Maybe find a better solution */}
            <div className="mv-max-h-10 mv-overflow-hidden">
              <Heading
                as={as}
                className="mv-text-primary mv-text-base mv-leading-5 mv-font-bold mv-mb-0 mv-text-ellipsis mv-overflow-hidden"
              >
                {fullName}
              </Heading>
            </div>
            <div className="mv-h-5 mv-overflow-hidden">
              {profile.position && (
                <p className="mv-text-neutral-700 mv-text-sm mv-leading-5 mv-font-bold mv-truncate">
                  {profile.position}
                </p>
              )}
            </div>
          </div>
        }
        <CardBodySection
          title={locales.profileCard.areasOfActivity}
          emptyMessage={emptyMessage}
        >
          {profile.areas.length > 0 ? profile.areas.join("/") : ""}
        </CardBodySection>
        <CardBodySection
          title={locales.profileCard.offer}
          emptyMessage={emptyMessage}
        >
          {profile.offers.length === 0 ? (
            ""
          ) : (
            <ChipContainer maxRows={2}>
              {profile.offers.map((offer) => {
                let title;
                if (offer in locales.offers) {
                  type LocaleKey = keyof typeof locales.offers;
                  title = locales.offers[offer as LocaleKey].title;
                } else {
                  console.error(`No locale found for offer ${offer}`);
                  title = offer;
                }
                return (
                  <Chip key={offer} color="secondary">
                    {title}
                  </Chip>
                );
              })}
            </ChipContainer>
          )}
        </CardBodySection>
      </CardBody>
      <CardFooter>
        <AvatarList
          visibleAvatars={2}
          moreIndicatorProps={{
            to: `/profile/${profile.username}/#organizations`,
            prefetch: prefetch,
          }}
        >
          {profile.memberOf.map((organization) => {
            return (
              <Avatar
                key={organization.slug}
                {...organization}
                size="sm"
                to={`/organization/${organization.slug}/detail/about`}
                prefetch={prefetch}
              />
            );
          })}
        </AvatarList>
      </CardFooter>
    </Card>
  );
}

export { ProfileCard };
