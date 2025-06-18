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
    <div hidden={inputProps.hidden} className="mv-group/visibility">
      <input
        {...inputProps}
        className="mv-peer mv-fixed mv-w-0 mv-h-0 mv-opacity-0"
        title={locales.components.VisibilityCheckbox.ariaLabel}
        aria-label={locales.components.VisibilityCheckbox.ariaLabel}
      />
      <label
        htmlFor={inputProps.id}
        className="mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-place-items-center mv-py-2 mv-px-[10px] mv-rounded-lg mv-border mv-border-gray-300 hover:mv-bg-neutral-50 focus:mv-bg-neutral-50 active:mv-bg-neutral-100 peer-focus:mv-border-blue-400 peer-focus:mv-ring-2 peer-focus:mv-ring-blue-500 mv-cursor-pointer"
        title={locales.components.VisibilityCheckbox.ariaLabel}
        aria-label={locales.components.VisibilityCheckbox.ariaLabel}
      >
        {/* Visibility is currently private */}
        <PrivateVisibility
          className="group-has-[:checked]/visibility:mv-hidden"
          aria-hidden="true"
        />
        {/* Visibility is currently public */}
        <PublicVisibility
          className="mv-hidden group-has-[:checked]/visibility:mv-block"
          aria-hidden="true"
        />
      </label>
      {errorMessage !== undefined && (
        <div
          id={errorId}
          className="mv-text-sm mv-font-semibold mv-text-negative-600 mv-mt-2"
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
