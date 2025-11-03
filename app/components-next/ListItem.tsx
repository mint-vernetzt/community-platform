import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Link, type LinkProps } from "react-router";

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
import {
  Children,
  isValidElement,
  type PropsWithChildren,
  type RefAttributes,
} from "react";
import { type MapLocales } from "~/routes/map.server";
import { type ExploreOrganizationsLocales } from "~/routes/explore/organizations.server";

export type ListOrganization = {
  logo: string | null;
  blurredLogo: string | undefined;
  name: string;
  slug: string;
  types: {
    slug: string;
  }[];
  networkTypes: {
    slug: string;
  }[];
};

type ListProfile = {
  avatar: string | null;
  blurredAvatar: string | undefined;
  academicTitle: string | null;
  firstName: string;
  lastName: string;
  username: string;
  position: string | null;
};

type ListProject = {
  logo: string | null;
  blurredLogo: string | undefined;
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
  | ProjectResponsibleOrganizationsSettingsLocales
  | MapLocales
  | ExploreOrganizationsLocales;

export function ListItem(
  props: PropsWithChildren<{
    entity: Entity;
    locales: Locales;
    listIndex?: number;
    hideAfter?: number;
    highlighted?: boolean;
  }> &
    Partial<LinkProps & RefAttributes<HTMLAnchorElement>>
) {
  const {
    entity,
    children,
    listIndex,
    hideAfter,
    locales,
    highlighted = false,
    ...linkProps
  } = props;

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
      id={
        "slug" in entity
          ? `list-item-${entity.slug}`
          : `list-item-${entity.username}`
      }
      className={
        hideAfter !== undefined &&
        listIndex !== undefined &&
        listIndex > hideAfter - 1
          ? "hidden group-has-[:checked]:block @container"
          : "block @container"
      }
    >
      <div
        className={`flex flex-col @lg:flex-row @lg:items-center gap-4 rounded-lg justify-between ring-1 ring-neutral-200 focus-within:ring-2 focus-within:ring-primary-200 hover:bg-neutral-100 active:bg-primary-50 ${
          highlighted ? "bg-primary-50" : "bg-white"
        }`}
      >
        <Link
          to={
            "academicTitle" in entity
              ? `/profile/${entity.username}`
              : "responsibleOrganizations" in entity
                ? `/project/${entity.slug}/detail/about`
                : `/organization/${entity.slug}/detail/about`
          }
          className={`w-full flex gap-2 @lg:gap-4 focus:outline-hidden items-center grow rounded-lg ${
            validChildren.length > 0
              ? `pb-0 pt-4 @lg:pr-0 @lg:pl-4 @lg:py-4 px-4`
              : "p-4"
          }`}
          {...linkProps}
        >
          <div className="h-[72px] w-[72px] min-h-[72px] min-w-[72px]">
            <Avatar size="full" {...entity} />
          </div>
          <div className={validChildren.length > 0 ? "min-w-[220px]" : ""}>
            <p className={`text-primary text-sm font-bold line-clamp-2`}>
              {"academicTitle" in entity
                ? `${entity.academicTitle ? `${entity.academicTitle} ` : ""}${
                    entity.firstName
                  } ${entity.lastName}`
                : entity.name}
            </p>
            <p className="text-neutral-700 text-sm line-clamp-1">
              {"academicTitle" in entity
                ? entity.position
                : "responsibleOrganizations" in entity
                  ? entity.responsibleOrganizations
                      .map((relation) => relation.organization.name)
                      .join(", ")
                  : [...entity.types, ...entity.networkTypes]
                      .map((relation) => {
                        let title;
                        if (relation.slug in locales.organizationTypes) {
                          type LocaleKey =
                            keyof typeof locales.organizationTypes;
                          title =
                            locales.organizationTypes[
                              relation.slug as LocaleKey
                            ].title;
                        } else if (relation.slug in locales.networkTypes) {
                          type LocaleKey = keyof typeof locales.networkTypes;
                          title =
                            locales.networkTypes[relation.slug as LocaleKey]
                              .title;
                        } else {
                          console.error(
                            `Organization or network type ${relation.slug} not found in locales`
                          );
                          title = relation.slug;
                        }
                        return title;
                      })
                      .join(", ")}
            </p>
          </div>
        </Link>
        {validChildren.length > 0 ? (
          <div className="px-4 pb-4 @lg:py-4 @lg:pr-4 @lg:pl-0 pt-0 shrink">
            {validChildren}
          </div>
        ) : null}
      </div>
    </li>
  );
}
