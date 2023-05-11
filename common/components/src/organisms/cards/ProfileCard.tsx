import React from "react";
import Chip from "../../../../../app/components/Chip/Chip";
import Avatar from "../../molecules/Avatar";
import { Card, CardFooter, CardHeader, CardImage, CardStatus } from "./Card";
import { getFullName } from "../../utils";

export type ProfileCardProps = {
  match?: number;
  profile: {
    academicTitle?: string;
    firstName: string;
    lastName: string;
    position?: string;
    memberOf: {
      name: string;
      slug: string;
      logo?: string;
    }[];
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
        {/* Component MatchingHeader Start */}

        <Avatar {...profile} size="xl" />
        <CardImage src="https://picsum.photos/id/431/304/160" alt="Name" />
        {props.match !== undefined && (
          <CardStatus>{props.match}% Match</CardStatus>
        )}
        {/* Component MatchingHeader End */}
      </CardHeader>

      {/* Component Avatar Start */}

      {/* Component Avatar End */}
      {/* Component CardImgae Start */}
      <div className="card-header px-4 pt-0 pb-6">
        <h4 className="text-primary text-base leading-5 font-bold mb-0">
          {fullName}
        </h4>
        <p className="text-neutral-700 text-sm leading-5 font-bold">
          {profile.position}
        </p>
      </div>
      <div className="card-body p-4 pt-2 gap-0">
        <div className="text-xxs leading-4 mb-1">Aktivitätsgebiete</div>
        <div className="text-xs leading-4 mb-6">Hamburg / Bundesweit</div>

        <div className="text-xxs leading-4 mb-1">Ich biete</div>
        <div className="text-xs leading-4 mb-1">
          <Chip title={"Wirkungsorientierung/Qualitätsentwicklung"} slug={""} />
        </div>
      </div>
      <CardFooter>
        {profile.memberOf.slice(0, 2).map((organization) => {
          return <Avatar key={organization.slug} {...organization} size="sm" />;
        })}
        {profile.memberOf.length > 2 && (
          <>{`+${profile.memberOf.length - 2}`}</>
        )}
      </CardFooter>
    </Card>
  );
}

export default ProfileCard;
