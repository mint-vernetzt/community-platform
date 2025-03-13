import { type GeneralOrganizationSettingsLocales } from "~/routes/organization/$slug/settings/general.server";
import { type OrganizationWebAndSocialLocales } from "~/routes/organization/$slug/settings/web-social.server";

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
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="group-has-[:checked]/visibility:mv-hidden"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.18618 6.83879C4.18662 6.8384 4.18706 6.83801 4.1875 6.83762L4.18625 6.83887L4.18618 6.83879ZM4.18618 6.83879L3.30125 5.95262C1.17375 7.84887 0 10.0001 0 10.0001C0 10.0001 3.75 16.8751 10 16.8751C11.2005 16.871 12.3874 16.6208 13.4875 16.1401L12.525 15.1751C11.7375 15.4589 10.895 15.6251 10 15.6251C7.35125 15.6251 5.15125 14.1651 3.54 12.5539C2.74625 11.7601 2.1275 10.9601 1.70875 10.3601L1.465 10.0001C2.0694 9.08153 2.76456 8.22598 3.54 7.44637C3.74585 7.24052 3.96165 7.03841 4.18618 6.83879ZM2.0575 2.94262L17.0575 17.9426L17.9425 17.0576L2.9425 2.05762L2.0575 2.94262ZM16.6987 14.0476C18.825 12.1501 20 10.0001 20 10.0001C20 10.0001 16.25 3.12512 10 3.12512C8.79949 3.12925 7.61256 3.3794 6.5125 3.86012L7.475 4.82387C8.28429 4.52906 9.13868 4.37722 10 4.37512C12.65 4.37512 14.8487 5.83512 16.46 7.44637C17.2354 8.22598 17.9306 9.08153 18.535 10.0001C18.4625 10.1089 18.3825 10.2289 18.2912 10.3601C17.8725 10.9601 17.2537 11.7601 16.46 12.5539C16.2537 12.7601 16.0387 12.9639 15.8137 13.1614L16.6987 14.0476ZM14.1212 11.4701C14.4002 10.6899 14.4518 9.84655 14.2702 9.03814C14.0886 8.22973 13.6811 7.48953 13.0952 6.90364C12.5093 6.31776 11.7691 5.91029 10.9607 5.72866C10.1523 5.54702 9.30895 5.59868 8.52875 5.87762L9.5575 6.90637C10.0379 6.83761 10.5277 6.88167 10.9881 7.03507C11.4485 7.18847 11.8668 7.44699 12.21 7.79013C12.5531 8.13328 12.8116 8.55163 12.965 9.01203C13.1184 9.47243 13.1625 9.96223 13.0937 10.4426L14.1212 11.4701ZM10.4425 13.0939L11.47 14.1214C10.6898 14.4003 9.84643 14.452 9.03802 14.2703C8.22962 14.0887 7.48941 13.6812 6.90352 13.0953C6.31764 12.5095 5.91018 11.7693 5.72854 10.9608C5.5469 10.1524 5.59856 9.30907 5.8775 8.52887L6.90625 9.55762C6.83749 10.038 6.88156 10.5278 7.03495 10.9882C7.18835 11.4486 7.44687 11.867 7.79001 12.2101C8.13316 12.5533 8.55151 12.8118 9.01191 12.9652C9.47231 13.1186 9.96211 13.1626 10.4425 13.0939Z"
            fill="#3C4658"
          />
        </svg>
        {/* Visibility is currently public */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mv-hidden group-has-[:checked]/visibility:mv-block"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 3.125C16.25 3.125 20 10 20 10C20 10 16.25 16.875 10 16.875C3.75 16.875 0 10 0 10C0 10 3.75 3.125 10 3.125ZM3.54125 7.44625C2.7658 8.22586 2.07064 9.0814 1.46625 10H1.465C2.0694 10.9186 2.76456 11.7741 3.54 12.5538C5.15125 14.165 7.35 15.625 10 15.625C12.6488 15.625 14.8488 14.165 16.46 12.5538C17.2538 11.76 17.8725 10.96 18.2913 10.36C18.3825 10.2288 18.4625 10.1088 18.535 10L18.535 10C17.9306 9.0814 17.2354 8.22586 16.46 7.44625C14.8488 5.835 12.65 4.375 10 4.375C7.35 4.375 5.15 5.835 3.54125 7.44625ZM7.79029 7.79029C8.37634 7.20424 9.1712 6.875 10 6.875C10.8288 6.875 11.6237 7.20424 12.2097 7.79029C12.7958 8.37634 13.125 9.1712 13.125 10C13.125 10.8288 12.7958 11.6237 12.2097 12.2097C11.6237 12.7958 10.8288 13.125 10 13.125C9.1712 13.125 8.37634 12.7958 7.79029 12.2097C7.20424 11.6237 6.875 10.8288 6.875 10C6.875 9.1712 7.20424 8.37634 7.79029 7.79029ZM6.90641 6.90641C6.08594 7.72688 5.625 8.83968 5.625 10C5.625 11.1603 6.08594 12.2731 6.90641 13.0936C7.72688 13.9141 8.83968 14.375 10 14.375C11.1603 14.375 12.2731 13.9141 13.0936 13.0936C13.9141 12.2731 14.375 11.1603 14.375 10C14.375 8.83968 13.9141 7.72688 13.0936 6.90641C12.2731 6.08594 11.1603 5.625 10 5.625C8.83968 5.625 7.72688 6.08594 6.90641 6.90641Z"
            fill="#3C4658"
          />
        </svg>
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
