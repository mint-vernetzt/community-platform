import React from "react";
import Chip from "~/components/Chip/Chip";

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
          <img
            src="https://picsum.photos/id/433/132/132"
            className="rounded-full border-2 border-neutral-50"
            alt="Name"
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
        <div className="card-footer p-4 pt-2">
          <hr className="h-0 border-t border-neutral-200 m-0 mb-4" />
          <div className="flex gap-2">
            <div className="">
              <img
                src="https://picsum.photos/id/433/32/32"
                className="rounded-full border-2 border-neutral-50"
                alt="Name"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfileCard;
