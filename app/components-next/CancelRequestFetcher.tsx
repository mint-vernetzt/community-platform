import { useSearchParams, type useFetcher } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import {
  AddToOrganizationRequest,
  type action,
} from "~/routes/my/organizations/requests";
import { i18nNS as organizationsI18nNS } from "~/routes/my/organizations";
import { GetOrganizationsToAdd } from "~/routes/my/organizations/get-organizations-to-add";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";

export function CancelRequestFetcher(props: {
  fetcher: ReturnType<typeof useFetcher<typeof action>>;
  organizationId: string;
}) {
  const { fetcher, organizationId } = props;
  const { t } = useTranslation(organizationsI18nNS);

  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get(GetOrganizationsToAdd.SearchParam) ?? "";

  return (
    <fetcher.Form
      preventScrollReset
      method="post"
      className="mv-w-full @sm:mv-w-fit @sm:mv-min-w-fit"
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
        name={GetOrganizationsToAdd.SearchParam}
        value={searchQuery}
      />
      <input
        type="hidden"
        name="intent"
        value={AddToOrganizationRequest.Cancel}
      />
      <Button
        variant="outline"
        fullSize
        type="submit"
        disabled={fetcher.state === "submitting"}
      >
        {t("addOrganization.cancelRequest")}
      </Button>
    </fetcher.Form>
  );
}
