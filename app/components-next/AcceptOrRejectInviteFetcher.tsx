import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { type useFetcher } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import {
  i18nNS as organizationsI18nNS,
  type action,
} from "~/routes/my/organizations";

export function AcceptOrRejectInviteFetcher(props: {
  inviteFetcher: ReturnType<typeof useFetcher<typeof action>>;
  organizationId: string;
  tabKey: string;
}) {
  const { inviteFetcher, organizationId, tabKey } = props;
  const { t } = useTranslation(organizationsI18nNS);

  return (
    <inviteFetcher.Form
      id={`invite-form-${organizationId}`}
      method="post"
      className="mv-grid mv-grid-cols-2 mv-grid-rows-1 mv-gap-4 mv-w-full @sm:mv-w-fit @sm:mv-min-w-fit"
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
      >
        {t("invites.decline")}
      </Button>
      <Button
        id={`accept-invite-${organizationId}`}
        fullSize
        type="submit"
        name="intent"
        value="accepted"
        aria-describedby={`invites-headline tab-description-${tabKey} accept-invite-${organizationId} invites-subline`}
      >
        {t("invites.accept")}
      </Button>
    </inviteFetcher.Form>
  );
}
