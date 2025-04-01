import { type useFetcher } from "react-router";
import {
  AddMemberToOrganizationRequest,
  type action,
} from "~/routes/my/organizations/requests";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { type MyOrganizationsLocales } from "~/routes/my/organizations.server";

export function AcceptOrRejectRequestFetcher(props: {
  fetcher: ReturnType<typeof useFetcher<typeof action>>;
  profileId: string;
  organizationId: string;
  tabKey: string;
  locales: MyOrganizationsLocales;
}) {
  const { fetcher, profileId, organizationId, tabKey, locales } = props;

  return (
    <fetcher.Form
      preventScrollReset
      method="post"
      className="mv-flex mv-items-center mv-gap-4 mv-w-full @sm:mv-w-fit @sm:mv-min-w-fit"
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
        value={AddMemberToOrganizationRequest.Reject}
        aria-describedby={`requests-headline tab-description-${tabKey} reject-request-${profileId}-${organizationId} requests-subline`}
        className="mv-text-wrap @sm:mv-text-nowrap"
      >
        {locales.route.organizationMemberRequests.decline}
      </Button>
      <Button
        id={`accept-request-${profileId}-${organizationId}`}
        fullSize
        type="submit"
        name="intent"
        value={AddMemberToOrganizationRequest.Accept}
        aria-describedby={`requests-headline tab-description-${tabKey} accept-request-${profileId}-${organizationId} requests-subline`}
        className="mv-text-wrap @sm:mv-text-nowrap"
      >
        {locales.route.organizationMemberRequests.accept}
      </Button>
    </fetcher.Form>
  );
}
