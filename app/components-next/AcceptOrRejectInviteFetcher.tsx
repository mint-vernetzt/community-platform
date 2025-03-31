import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { type useFetcher } from "react-router";
import { type action } from "~/routes/my/organizations";
import { type MyOrganizationsLocales } from "~/routes/my/organizations.server";

export function AcceptOrRejectInviteFetcher(props: {
  inviteFetcher: ReturnType<typeof useFetcher<typeof action>>;
  organizationId: string;
  tabKey: string;
  locales: MyOrganizationsLocales;
}) {
  const { inviteFetcher, organizationId, tabKey, locales } = props;

  return (
    <inviteFetcher.Form
      id={`invite-form-${organizationId}`}
      method="post"
      className="mv-flex mv-items-center mv-gap-4 mv-w-full @sm:mv-w-fit @sm:mv-min-w-fit"
      preventScrollReset
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
        name="role"
        defaultValue={tabKey === "teamMember" ? "member" : "admin"}
      />
      <Button
        id={`reject-invite-${organizationId}`}
        variant="outline"
        fullSize
        type="submit"
        name="intent"
        value="rejected"
        aria-describedby={`invites-headline tab-description-${tabKey} reject-invite-${organizationId} invites-subline`}
        className="mv-text-wrap @sm:mv-text-nowrap"
      >
        {locales.route.invites.decline}
      </Button>
      <Button
        id={`accept-invite-${organizationId}`}
        fullSize
        type="submit"
        name="intent"
        value="accepted"
        aria-describedby={`invites-headline tab-description-${tabKey} accept-invite-${organizationId} invites-subline`}
        className="mv-text-wrap @sm:mv-text-nowrap"
      >
        {locales.route.invites.accept}
      </Button>
    </inviteFetcher.Form>
  );
}
