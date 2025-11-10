import { type GeneralOrganizationSettingsLocales } from "~/routes/organization/$slug/settings/general.server";
import { type OrganizationWebAndSocialLocales } from "~/routes/organization/$slug/settings/web-social.server";
import { PrivateVisibility } from "./icons/PrivateVisibility";
import { PublicVisibility } from "./icons/PublicVisibility";

type VisibilityCheckboxProps = {
  locales: GeneralOrganizationSettingsLocales | OrganizationWebAndSocialLocales;
  errorMessage?: string;
  errorId?: string;
};

export function VisibilityCheckbox(
  props: VisibilityCheckboxProps & React.InputHTMLAttributes<HTMLInputElement>
) {
  const { locales, errorMessage, errorId, ...inputProps } = props;

  return (
    <div hidden={inputProps.hidden} className="group/visibility">
      <input
        {...inputProps}
        className="peer fixed w-0 h-0 opacity-0"
        title={locales.components.VisibilityCheckbox.ariaLabel}
        aria-label={locales.components.VisibilityCheckbox.ariaLabel}
      />
      <label
        htmlFor={inputProps.id}
        className="grid grid-cols-1 grid-rows-1 place-items-center py-2 px-[10px] rounded-lg border border-gray-300 hover:bg-neutral-50 focus:bg-neutral-50 active:bg-neutral-100 peer-focus:border-blue-400 peer-focus:ring-2 peer-focus:ring-blue-500 cursor-pointer"
        title={locales.components.VisibilityCheckbox.ariaLabel}
        aria-label={locales.components.VisibilityCheckbox.ariaLabel}
      >
        {/* Visibility is currently private */}
        <PrivateVisibility
          className="group-has-[:checked]/visibility:hidden"
          aria-hidden="true"
        />
        {/* Visibility is currently public */}
        <PublicVisibility
          className="hidden group-has-[:checked]/visibility:block"
          aria-hidden="true"
        />
      </label>
      {errorMessage !== undefined && (
        <div
          id={errorId}
          className="text-sm font-semibold text-negative-700 mt-2"
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
