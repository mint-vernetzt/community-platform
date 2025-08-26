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
      className="mv-w-full mv-px-3 mv-mb-4"
    >
      <Link
        to={props.link}
        className="mv-w-full mv-flex mv-flex-wrap mv-content-start mv-items-start mv-p-4 mv-rounded-2xl hover:mv-bg-neutral-200 mv-border mv-border-neutral-500"
      >
        <div className="mv-w-full mv-flex mv-items-center mv-flex-row">
          {props.image !== "" && props.image !== null ? (
            <div className="mv-h-16 mv-w-16 mv-flex mv-items-center mv-justify-center mv-relative mv-shrink-0 mv-rounded-full mv-overflow-hidden mv-border">
              <Avatar
                logo={props.image}
                blurredLogo={props.blurredImage}
                name={props.name}
                size="full"
              />
            </div>
          ) : (
            <div className="mv-h-16 mv-w-16 mv-bg-neutral-600 mv-text-white mv-text-3xl mv-flex mv-items-center mv-justify-center mv-rounded-full mv-overflow-hidden mv-shrink-0 mv-border">
              {getInitialsOfName(props.name)}
            </div>
          )}
          <div className="mv-pl-4">
            <H3 like="h4" className="mv-text-xl mv-mb-1">
              {props.name}
            </H3>
            {props.types && props.types.length > 0 && (
              <p className="mv-font-bold mv-text-sm">
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
