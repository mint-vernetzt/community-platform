import React from "react";
import Chip, { ChipContainer } from "../../molecules/Chip";
import Avatar from "../../molecules/Avatar";
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

export type ProfileCardProps = {
  match?: number;
  profile: {
    academicTitle?: string;
    firstName: string;
    lastName: string;
    position?: string;
    background?: string;
    memberOf: {
      name: string;
      slug: string;
      logo?: string;
    }[];
    areaNames: string[];
    offers: string[];
  };
};

function ProfileCard(
  props: React.ButtonHTMLAttributes<HTMLDivElement> & ProfileCardProps
) {
  const { profile } = props;

  const fullName = getFullName(profile);

  return (
    <Card>
      <CardHeader>
        <Avatar {...profile} size="xl" />
        {profile.background && <CardImage src={profile.background} />}
        {props.match !== undefined && (
          <CardStatus>{props.match}% Match</CardStatus>
        )}
      </CardHeader>
      <CardBody>
        {
          <div className="mv-min-h-[80px]">
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
        <CardBodySection title="Aktivitätsgebiete">
          {profile.areaNames.length > 0 ? profile.areaNames.join("/") : ""}
        </CardBodySection>
        <CardBodySection title="Ich biete">
          {profile.offers.length === 0 ? (
            ""
          ) : (
            <ChipContainer maxRows={2}>
              {profile.offers.map((offer) => {
                return (
                  <Chip key={offer} color="secondary">
                    {offer}
                  </Chip>
                );
              })}
            </ChipContainer>
          )}
        </CardBodySection>
      </CardBody>
      <CardFooter>
        {profile.memberOf.map((organization) => {
          return <Avatar key={organization.slug} {...organization} size="sm" />;
        })}
      </CardFooter>
    </Card>
  );
}

export default ProfileCard;
