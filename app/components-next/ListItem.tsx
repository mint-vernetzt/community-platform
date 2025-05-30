import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Link } from "react-router";

import { type MyOrganizationsLocales } from "~/routes/my/organizations.server";
import { type OrganizationAdminSettingsLocales } from "~/routes/organization/$slug/settings/admins.server";
import { type ManageOrganizationSettingsLocales } from "~/routes/organization/$slug/settings/manage.server";
import { type OrganizationTeamSettingsLocales } from "~/routes/organization/$slug/settings/team.server";
import { type CreateOrganizationLocales } from "~/routes/organization/create.server";
import { type OrganizationNetworkLocales } from "~/routes/organization/$slug/detail/network.server";
import { type OrganizationProjectsLocales } from "~/routes/organization/$slug/detail/projects.server";
import { type OrganizationTeamLocales } from "~/routes/organization/$slug/detail/team.server";
import { type ProjectAdminSettingsLocales } from "~/routes/project/$slug/settings/admins.server";
import { type ProjectTeamSettingsLocales } from "~/routes/project/$slug/settings/team.server";
import { type ProjectResponsibleOrganizationsSettingsLocales } from "~/routes/project/$slug/settings/responsible-orgs.server";
import { Children, isValidElement } from "react";

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

type Locales =
  | MyOrganizationsLocales
  | OrganizationAdminSettingsLocales
  | OrganizationTeamSettingsLocales
  | OrganizationNetworkLocales
  | OrganizationProjectsLocales
  | OrganizationTeamLocales
  | ManageOrganizationSettingsLocales
  | CreateOrganizationLocales
  | ProjectAdminSettingsLocales
  | ProjectTeamSettingsLocales
  | ProjectResponsibleOrganizationsSettingsLocales;

export function ListItem(
  props: React.PropsWithChildren<{
    entity: Entity;
    locales: Locales;
    listIndex?: number;
    hideAfter?: number;
  }>
) {
  const { entity, children, listIndex, hideAfter, locales } = props;

  const validChildren = Children.toArray(children).filter((child) => {
    return isValidElement(child);
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
          className={`mv-flex mv-gap-2 @sm:mv-gap-4 mv-items-center mv-w-full mv-grow ${
            validChildren.length > 0
              ? "mv-pb-0 mv-pt-4 mv-px-4 @sm:mv-pr-0 @sm:mv-pl-4 @sm:mv-py-4"
              : "mv-p-4"
          }`}
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
