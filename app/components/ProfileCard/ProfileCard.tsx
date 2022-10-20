import { Link } from "remix";
import { H3 } from "../Heading/Heading";

export interface ProfileCardProps {
  id: string;
  link: string;
  name: string;
  initials: string;
  position?: string | null;
  avatar?: string | null;
}

function ProfileCard(props: ProfileCardProps) {
  return (
    <div
      key={`profile-${props.id}`}
      data-testid="gridcell"
      className="flex-100 lg:flex-1/2 px-3 mb-4"
    >
      <Link
        to={props.link}
        className="flex flex-wrap content-start items-start p-4 rounded-2xl hover:bg-neutral-200 border border-neutral-500"
      >
        <div className="w-full flex items-center flex-row">
          <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
            {props.avatar !== null && props.avatar !== "" ? (
              <img src={props.avatar} alt={props.name} />
            ) : (
              props.initials
            )}
          </div>
          <div className="pl-4">
            <H3 like="h4" className="text-xl mb-1">
              {props.name}
            </H3>
            {props.position && (
              <p className="font-bold text-sm">{props.position}</p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ProfileCard;
