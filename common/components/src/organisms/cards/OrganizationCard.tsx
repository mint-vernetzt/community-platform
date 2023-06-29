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

export type OrganizationCardProps = {
  match?: number;
  publicAccess?: boolean;
  organization: {
    slug: string;
    name: string;
    position?: string | null;
    logo?: string | null;
    background?: string | null;
    focuses: string[];
    areaNames: string[];
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
  const { organization, publicAccess = false } = props;

  const emptyMessage = publicAccess
    ? "-nicht öffentlich-"
    : "-nicht angegeben-";

  return (
    <Card to={`/organization/${organization.slug}`}>
      <CardHeader>
        <Avatar {...organization} size="xl" />
        {organization.background && <CardImage src={organization.background} />}
        {props.match !== undefined && (
          <CardStatus>{props.match}% Match</CardStatus>
        )}
      </CardHeader>
      <CardBody>
        {
          <div className="mv-min-h-[80px]">
            <div className="mv-max-h-10 mv-overflow-hidden">
              <h4 className="mv-text-primary mv-text-base mv-leading-5 mv-font-bold mv-mb-0 mv-text-ellipsis mv-overflow-hidden">
                {organization.name}
              </h4>
            </div>
            <div className="mv-h-5 mv-overflow-hidden">
              {organization.types.length > 0 && (
                <p className="mv-text-neutral-700 mv-text-sm mv-leading-5 mv-font-bold mv-truncate">
                  {organization.types.join("/")}
                </p>
              )}
            </div>
          </div>
        }
        <CardBodySection title="Aktivitätsgebiete" emptyMessage={emptyMessage}>
          {organization.areaNames.length > 0
            ? organization.areaNames.join("/")
            : ""}
        </CardBodySection>
        <CardBodySection title="Schwerpunkte" emptyMessage={emptyMessage}>
          {organization.focuses.length === 0 ? (
            ""
          ) : (
            <ChipContainer maxRows={2}>
              {organization.focuses.map((focus) => {
                return <Chip key={focus}>{focus}</Chip>;
              })}
            </ChipContainer>
          )}
        </CardBodySection>
      </CardBody>
      <CardFooter
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
      </CardFooter>
    </Card>
  );
}

export default OrganizationCard;
