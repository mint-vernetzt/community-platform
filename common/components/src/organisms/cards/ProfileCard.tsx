import React from "react";
import Chip, { ChipContainer } from "../../molecules/Chip";
import Avatar from "../../molecules/Avatar";
import {
  Card,
  CardBody,
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
        {/* Component MatchingHeader Start */}

        <Avatar {...profile} size="xl" />
        {profile.background && <CardImage src={profile.background} />}
        {props.match !== undefined && (
          <CardStatus>{props.match}% Match</CardStatus>
        )}
        {/* Component MatchingHeader End */}
      </CardHeader>

      {/* Component Avatar Start */}

      {/* Component Avatar End */}
      {/* Component CardImgae Start */}
      <CardBody>
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

        <div className="">
          <div className="text-xs font-semibold leading-4 mb-[2px]">
            Aktivitätsgebiete
          </div>
          <p className="text-base font-semibold leading-4 mb-6 min-h-6 truncate">
            {profile.areaNames.length > 0 ? profile.areaNames.join("/") : "-"}
          </p>

          <div className="text-xs font-semibold leading-4 mb-2">Ich biete</div>
          <ChipContainer maxRows={2}>
            {profile.offers.map((offer) => {
              return <Chip key={offer}>{offer}</Chip>;
            })}
          </ChipContainer>
        </div>
      </CardBody>
      <CardFooter>
        {profile.memberOf.slice(0, 2).map((organization) => {
          return <Avatar key={organization.slug} {...organization} size="sm" />;
        })}
        {profile.memberOf.length > 2 && (
          <div className="w-[30px] h-[30px] bg-gray-200 text-gray-700 font-semibold rounded-full text-center">
            <span className="inline-block align-middle">{`+${
              profile.memberOf.length - 2
            }`}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export default ProfileCard;
