import { type MyEventsLocales } from "~/routes/my/events.server";
import { Icon } from "./icons/Icon";
import { type MyOrganizationsLocales } from "~/routes/my/organizations.server";
import { type OrganizationAdminSettingsLocales } from "~/routes/organization/$slug/settings/admins.server";
import { type OrganizationTeamSettingsLocales } from "~/routes/organization/$slug/settings/team.server";
import { type CreateOrganizationLocales } from "~/routes/organization/create.server";
import { type OrganizationEventsLocales } from "~/routes/organization/$slug/detail/events.server";
import { type OrganizationNetworkLocales } from "~/routes/organization/$slug/detail/network.server";
import { type OrganizationProjectsLocales } from "~/routes/organization/$slug/detail/projects.server";
import { type OrganizationTeamLocales } from "~/routes/organization/$slug/detail/team.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { type ManageOrganizationSettingsLocales } from "~/routes/organization/$slug/settings/manage.server";
import { type ProjectAdminSettingsLocales } from "~/routes/project/$slug/settings/admins.server";
import { type ProjectTeamSettingsLocales } from "~/routes/project/$slug/settings/team.server";
import { type ProjectResponsibleOrganizationsSettingsLocales } from "~/routes/project/$slug/settings/responsible-orgs.server";

type Locales =
  | MyEventsLocales
  | MyOrganizationsLocales
  | OrganizationAdminSettingsLocales
  | OrganizationTeamSettingsLocales
  | CreateOrganizationLocales
  | OrganizationEventsLocales
  | OrganizationNetworkLocales
  | ManageOrganizationSettingsLocales
  | OrganizationProjectsLocales
  | OrganizationTeamLocales
  | ProjectAdminSettingsLocales
  | ProjectTeamSettingsLocales
  | ProjectResponsibleOrganizationsSettingsLocales;

export function ListContainer(
  props: React.PropsWithChildren<{
    listKey?: string;
    hideAfter?: number;
    locales: Locales;
  }>
) {
  const { children, listKey, hideAfter, locales } = props;

  if (listKey === undefined && hideAfter !== undefined) {
    console.error(
      "ListItem: Property `listKey` is required when property `hideAfter` is set to hide list items after a specific number."
    );
  }

  return (
    <ul className="flex flex-col gap-4 group">
      {children}
      {children !== undefined &&
      Array.isArray(children) &&
      hideAfter !== undefined &&
      children.length > hideAfter ? (
        <div
          key={`show-more-${listKey}-container`}
          className="w-full flex justify-center pt-2 text-sm text-neutral-600 font-semibold leading-5 justify-self-center"
        >
          <label
            htmlFor={`show-more-${listKey}`}
            className="flex gap-2 cursor-pointer w-fit"
          >
            <div className="group-has-[:checked]:hidden">
              {insertParametersIntoLocale(
                locales.components.ListContainer.more,
                {
                  count: children.length - 3,
                }
              )}
            </div>
            <div className="hidden group-has-[:checked]:block">
              {insertParametersIntoLocale(
                locales.components.ListContainer.less,
                {
                  count: children.length - 3,
                }
              )}
            </div>
            <div className="rotate-90 group-has-[:checked]:-rotate-90">
              <Icon type="chevron-right" />
            </div>
          </label>
          <input
            id={`show-more-${listKey}`}
            type="checkbox"
            className="w-0 h-0 opacity-0"
          />
        </div>
      ) : null}
    </ul>
  );
}
