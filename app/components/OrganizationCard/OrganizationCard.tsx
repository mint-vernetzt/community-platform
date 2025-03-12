import type { OrganizationType } from "@prisma/client";
import { Link } from "react-router";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { H3 } from "../Heading/Heading";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { type ProfileDetailLocales } from "~/routes/profile/$username/index.server";

export interface OrganizationCardProps {
  id: string;
  link: string;
  name: string;
  image?: string | null;
  blurredImage?: string;
  types?: {
    organizationType: Pick<OrganizationType, "slug">;
  }[];
  locales: ProfileDetailLocales;
}

function OrganizationCard(props: OrganizationCardProps) {
  const { locales } = props;
  return (
    <div
      key={props.id}
      data-testid="gridcell"
      className="flex-100 @md:mv-flex-1/2 px-3 mb-4"
    >
      <Link
        to={props.link}
        className="flex flex-wrap content-start items-start p-4 rounded-2xl hover:bg-neutral-200 border border-neutral-500"
      >
        <div className="w-full flex items-center flex-row">
          {props.image !== "" && props.image !== null ? (
            <div className="h-16 w-16 flex items-center justify-center relative shrink-0 rounded-full overflow-hidden border">
              <Avatar
                logo={props.image}
                blurredLogo={props.blurredImage}
                name={props.name}
                size="full"
              />
            </div>
          ) : (
            <div className="h-16 w-16 mv-bg-neutral-600 text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
              {getInitialsOfName(props.name)}
            </div>
          )}
          <div className="pl-4">
            <H3 like="h4" className="text-xl mb-1">
              {props.name}
            </H3>
            {props.types && props.types.length > 0 && (
              <p className="font-bold text-sm">
                {props.types
                  .map((relation) => {
                    let title;
                    if (
                      relation.organizationType.slug in
                      locales.organizationTypes
                    ) {
                      type LocaleKey = keyof typeof locales.organizationTypes;
                      title =
                        locales.organizationTypes[
                          relation.organizationType.slug as LocaleKey
                        ].title;
                    } else {
                      console.error(
                        `Focus ${relation.organizationType.slug} not found in locales`
                      );
                      title = relation.organizationType.slug;
                    }
                    return title;
                  })
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
