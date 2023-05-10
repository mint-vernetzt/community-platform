import React from "react";
import Chip from "../../../../../app/components/Chip/Chip";
import Avatar from "../../molecules/Avatar";
import { CardFooter } from "./Card";

export type ProfileCardProps = {};

function ProfileCard(
  props: React.ButtonHTMLAttributes<HTMLDivElement> & ProfileCardProps
) {
  const { ...otherProps } = props;

  return (
    <>
      <div className="card bg-neutral-50 shadow-xl rounded-3xl relative overflow-hidden">
        {/* Component MatchingHeader Start */}
        <div className="absolute top-0 inset-x-0 text-center text-primary bg-primary-100 px-4 py-2 font-base leading-5 font-semibold">
          21% Match
        </div>
        {/* Component MatchingHeader End */}

        {/* Component CardImage Start */}
        <div className="bg-green-500 h-40">
          <figure>
            <img
              src="https://picsum.photos/id/431/304/160"
              className="w-full h-40 object-cover"
              alt="Name"
            />
          </figure>
        </div>
        {/* Component CardImage End */}

        {/* Component Avatar Start */}
        <div className="flex justify-center -mt-24">
          <Avatar
            name="Name"
            src="https://picsum.photos/id/433/500/500"
            size="xl"
          />
        </div>
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
            <Chip
              title={"Wirkungsorientierung/Qualitätsentwicklung"}
              slug={""}
            />
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
          <Avatar
            name="Name"
            src="https://picsum.photos/id/431/500/500"
            size="sm"
          />
        </CardFooter>
      </div>
    </>
  );
}

export default ProfileCard;
