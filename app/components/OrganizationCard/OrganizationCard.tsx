import { Link } from "remix";
import { H3 } from "../Heading/Heading";
import { getOrganizationInitials } from "~/lib/organization/getOrganizationInitials";

export interface OrganizationCardProps {
  id: string;
  link: string;
  name: string;
  image?: string | null;
  types?: string | null;
}

function OrganizationCard(props: OrganizationCardProps) {
  return (
    <div
      key={props.id}
      data-testid="gridcell"
      className="flex-100 md:flex-1/2 px-3 mb-4"
    >
      <Link
        to={props.link}
        className="flex flex-wrap content-start items-start p-4 rounded-2xl hover:bg-neutral-200 border border-neutral-500"
      >
        <div className="w-full flex items-center flex-row">
          {props.image !== "" && props.image !== null ? (
            <div className="h-16 w-16 flex items-center justify-center relative shrink-0 rounded-full overflow-hidden">
              <img
                className="max-w-full w-auto max-h-16 h-auto"
                src={props.image}
                alt={props.name}
              />
            </div>
          ) : (
            <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
              {getOrganizationInitials(props.name)}
            </div>
          )}
          <div className="pl-4">
            <H3 like="h4" className="text-xl mb-1">
              {props.name}
            </H3>
            {props.types && props.types.length > 0 && (
              <p className="font-bold text-sm">
                {props.types
                  .map(({ organizationType }) => organizationType.title)
                  .join(", ")}
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default OrganizationCard;
