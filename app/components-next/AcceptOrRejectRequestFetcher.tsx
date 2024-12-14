import { type useFetcher } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import {
  AddToOrganizationRequest,
  type action,
} from "~/routes/my/organizations/requests";
import { i18nNS as organizationsI18nNS } from "~/routes/my/organizations";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";

export function AcceptOrRejectRequestFetcher(props: {
  fetcher: ReturnType<typeof useFetcher<typeof action>>;
  profileId: string;
  organizationId: string;
  tabKey: string;
}) {
  const { fetcher, profileId, organizationId, tabKey } = props;
  const { t } = useTranslation(organizationsI18nNS);

  return (
    <fetcher.Form
      preventScrollReset
      method="post"
      className="mv-grid mv-grid-cols-2 mv-grid-rows-1 mv-gap-4 mv-w-full @sm:mv-w-fit @sm:mv-min-w-fit"
      action="/my/organizations/requests"
    >
      <input
        type="hidden"
        required
        readOnly
        name="organizationId"
        defaultValue={organizationId}
      />
      <input
        type="hidden"
        required
        readOnly
        name="profileId"
        defaultValue={profileId}
      />
      <Button
        id={`reject-request-${profileId}-${organizationId}`}
        variant="outline"
        fullSize
        type="submit"
        name="intent"
        value={AddToOrganizationRequest.Reject}
        aria-describedby={`requests-headline tab-description-${tabKey} reject-request-${profileId}-${organizationId} requests-subline`}
      >
        {t("requests.decline")}
      </Button>
      <Button
        id={`accept-request-${profileId}-${organizationId}`}
        fullSize
        type="submit"
        name="intent"
        value={AddToOrganizationRequest.Accept}
        aria-describedby={`requests-headline tab-description-${tabKey} accept-request-${profileId}-${organizationId} requests-subline`}
      >
        {t("requests.accept")}
      </Button>
    </fetcher.Form>
  );
}
