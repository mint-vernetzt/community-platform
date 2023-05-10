import React from "react";
import Chip from "../../../../../app/components/Chip/Chip";
import Avatar from "../../molecules/Avatar";
import { Card, CardFooter, CardHeader, CardImage, CardStatus } from "./Card";

export type ProfileCardProps = {};

function ProfileCard(
  props: React.ButtonHTMLAttributes<HTMLDivElement> & ProfileCardProps
) {
  const { ...otherProps } = props;

  return (
    <Card>
      <CardHeader>
        {/* Component MatchingHeader Start */}
        <Avatar
          name="Name"
          src="https://picsum.photos/id/433/500/500"
          size="xl"
        />
        <CardImage src="https://picsum.photos/id/431/304/160" alt="Name" />
        <CardStatus>21% Match</CardStatus>
        {/* Component MatchingHeader End */}
      </CardHeader>

      {/* Component Avatar Start */}

      {/* Component Avatar End */}
      {/* Component CardImgae Start */}
      <div className="card-header px-4 pt-0 pb-6">
        <h4 className="text-primary text-base leading-5 font-bold mb-0">
          Ines Kurz
        </h4>
        <p className="text-neutral-700 text-sm leading-5 font-bold">
          Projektleiterin matrix gGmbH
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
        <Avatar
          name="Name"
          src="https://picsum.photos/id/433/500/500"
          size="sm"
        />
        <Avatar
          name="Name"
          src="https://picsum.photos/id/432/500/500"
          size="sm"
        />
      </CardFooter>
    </Card>
  );
}

export default ProfileCard;
