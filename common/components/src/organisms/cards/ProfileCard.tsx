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
  console.log(profile.areaNames);

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
          <div className="min-h-[80px]">
            {/* TODO: */}
            {/* Issue with combination of line clamp with ellipsis (truncate) */}
            {/* Maybe find a better solution */}
            <div className="max-h-10 overflow-hidden">
              <h4 className="text-primary text-base leading-5 font-bold mb-0 text-ellipsis overflow-hidden">
                {fullName}
              </h4>
            </div>
            <div className="h-5 overflow-hidden">
              {profile.position && (
                <p className="text-neutral-700 text-sm leading-5 font-bold truncate">
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
                return <Chip key={offer}>{offer}</Chip>;
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
