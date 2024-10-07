import React from "react";
import Chip, { ChipContainer } from "../../molecules/Chip";
import Avatar, { AvatarList } from "../../molecules/Avatar";
import {
  Card,
  CardBody,
  CardBodySection,
  CardFooter,
  CardHeader,
  CardImage,
  CardStatus,
} from "./Card";
import { getFullName } from "../../utils";
import { useTranslation } from "react-i18next";

export type ProfileCardProps = {
  match?: number;
  publicAccess?: boolean;
  profile: {
    academicTitle?: string | null;
    username: string;
    firstName: string;
    lastName: string;
    position?: string | null;
    avatar?: string | null;
    background?: string | null;
    memberOf: {
      name: string;
      slug: string;
      logo?: string | null;
    }[];
    areas: string[];
    offers: string[];
  };
};

function ProfileCard(
  props: React.ButtonHTMLAttributes<HTMLDivElement> & ProfileCardProps
) {
  const { profile, publicAccess = false } = props;

  const { t } = useTranslation([
    "organisms/cards/profile-card",
    "datasets/offers",
  ]);

  const fullName = getFullName(profile);

  const emptyMessage = publicAccess
    ? t("nonPublic", "-nicht öffentlich-")
    : t("nonStated", "-nicht angegeben-");

  return (
    <Card to={`/profile/${profile.username}`}>
      <CardHeader>
        <Avatar {...profile} size="xl" />
        {profile.background && <CardImage src={profile.background} />}
        {props.match !== undefined && (
          <CardStatus>
            {props.match}% {t("match")}
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
              <h4 className="mv-text-primary mv-text-base mv-leading-5 mv-font-bold mv-mb-0 mv-text-ellipsis mv-overflow-hidden">
                {fullName}
              </h4>
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
          title={t("areasOfActivity")}
          emptyMessage={emptyMessage}
        >
          {profile.areas.length > 0 ? profile.areas.join("/") : ""}
        </CardBodySection>
        <CardBodySection title={t("offer")} emptyMessage={emptyMessage}>
          {profile.offers.length === 0 ? (
            ""
          ) : (
            <ChipContainer maxRows={2}>
              {profile.offers.map((offer) => {
                return (
                  <Chip key={offer} color="secondary">
                    {t(`${offer}.title`, { ns: "datasets/offers" })}
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
          }}
        >
          {profile.memberOf.map((organization) => {
            return (
              <Avatar
                key={organization.slug}
                {...organization}
                size="sm"
                to={`/organization/${organization.slug}`}
              />
            );
          })}
        </AvatarList>
      </CardFooter>
    </Card>
  );
}

export default ProfileCard;
