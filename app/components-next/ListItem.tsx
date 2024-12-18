import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Link } from "@remix-run/react";
import React from "react";
import { type MyOrganizationsLocales } from "~/routes/my/organizations.server";
import { type OrganizationAdminSettingsLocales } from "~/routes/next/organization/$slug/settings/admins.server";
import { type OrganizationTeamSettingsLocales } from "~/routes/next/organization/$slug/settings/team.server";
import { type CreateOrganizationLocales } from "~/routes/next/organization/create.server";

type ListOrganization = {
  logo: string | null;
  name: string;
  slug: string;
  types: {
    organizationType: {
      slug: string;
    };
  }[];
};

type ListProfile = {
  avatar: string | null;
  academicTitle: string | null;
  firstName: string;
  lastName: string;
  username: string;
  position: string | null;
};

type ListProject = {
  logo: string | null;
  name: string;
  slug: string;
  responsibleOrganizations: {
    organization: {
      name: string;
      slug: string;
    };
  }[];
};

type Entity = ListOrganization | ListProfile | ListProject;

export function ListItem(
  props: React.PropsWithChildren<{
    entity: Entity;
    locales:
      | MyOrganizationsLocales
      | OrganizationAdminSettingsLocales
      | OrganizationTeamSettingsLocales
      | CreateOrganizationLocales;
    listIndex?: number;
    hideAfter?: number;
  }>
) {
  const { entity, children, listIndex, hideAfter, locales } = props;

  const validChildren = React.Children.toArray(children).filter((child) => {
    return React.isValidElement(child);
  });

  if (listIndex === undefined && hideAfter !== undefined) {
    console.error(
      "ListItem: Property `listIndex` is required when property `hideAfter` is set to hide list items after a specific number."
    );
  }

  return (
    <li
      className={
        hideAfter !== undefined &&
        listIndex !== undefined &&
        listIndex > hideAfter - 1
          ? "mv-hidden group-has-[:checked]:mv-block"
          : "mv-block"
      }
    >
      <div className="mv-flex mv-flex-col @sm:mv-flex-row mv-gap-4 mv-border mv-border-neutral-200 mv-rounded-2xl mv-justify-between mv-items-center">
        <Link
          to={
            "academicTitle" in entity
              ? `/profile/${entity.username}`
              : "responsibleOrganizations" in entity
              ? `/project/${entity.slug}`
              : `/organization/${entity.slug}`
          }
          className="mv-flex mv-gap-2 @sm:mv-gap-4 mv-items-center mv-w-full mv-grow mv-pb-0 mv-pt-4 mv-px-4 @sm:mv-pr-0 @sm:mv-pl-4 @sm:mv-py-4"
        >
          <div className="mv-h-[72px] mv-w-[72px] mv-min-h-[72px] mv-min-w-[72px]">
            <Avatar size="full" {...entity} />
          </div>
          <div>
            <p className="mv-text-primary mv-text-sm mv-font-bold mv-line-clamp-2">
              {"academicTitle" in entity
                ? `${entity.academicTitle ? `${entity.academicTitle} ` : ""}${
                    entity.firstName
                  } ${entity.lastName}`
                : entity.name}
            </p>
            <p className="mv-text-neutral-700 mv-text-sm mv-line-clamp-1">
              {"academicTitle" in entity
                ? entity.position
                : "responsibleOrganizations" in entity
                ? entity.responsibleOrganizations
                    .map((relation) => relation.organization.name)
                    .join(", ")
                : entity.types
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
          </div>
        </Link>
        {validChildren.length > 0 ? (
          <div className="mv-w-full mv-grow @sm:mv-shrink @sm:mv-w-fit mv-px-4 mv-pb-4 mv-pt-0 @sm:mv-py-4 @sm:mv-pr-4 @sm:mv-pl-0">
            {validChildren}
          </div>
        ) : null}
      </div>
    </li>
  );
}
