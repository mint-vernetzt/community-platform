import { useSearchParams, type useFetcher } from "react-router";
import {
  AddMemberToOrganizationRequest,
  type action,
} from "~/routes/my/organizations/requests";
import { GetOrganizationsToAdd } from "~/routes/my/organizations/get-organizations-to-add";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { type MyOrganizationsLocales } from "~/routes/my/organizations.server";

export function CancelRequestFetcher(props: {
  fetcher: ReturnType<typeof useFetcher<typeof action>>;
  organizationId: string;
  locales: MyOrganizationsLocales;
}) {
  const { fetcher, organizationId, locales } = props;

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
        value={AddMemberToOrganizationRequest.Cancel}
      />
      <Button
        variant="outline"
        fullSize
        type="submit"
        disabled={fetcher.state === "submitting"}
      >
        {locales.route.addOrganization.cancelRequest}
      </Button>
    </fetcher.Form>
  );
}
