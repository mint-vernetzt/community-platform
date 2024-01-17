import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import type { ArrayElement } from "~/lib/utils/types";
import { getOrganizationSuggestionsForAutocomplete } from "~/routes/utils.server";
import { deriveOrganizationMode } from "../../utils.server";
import {
  getNetworkMembersOfOrganization,
  getOrganizationIdBySlug,
} from "../utils.server";
import Add from "./add";
import { NetworkMemberRemoveForm } from "./remove";

export type NetworkMember = ArrayElement<
  Awaited<ReturnType<typeof getNetworkMembersOfOrganization>>
>;

export type NetworkMemberSuggestions =
  | Awaited<ReturnType<typeof getOrganizationSuggestionsForAutocomplete>>
  | undefined;

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const { authClient, response } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });
  const organization = await getOrganizationIdBySlug(slug);
  invariantResponse(organization, "Organization not found", { status: 404 });

  const networkMembers = await getNetworkMembersOfOrganization(
    authClient,
    organization.id
  );

  const url = new URL(request.url);
  const suggestionsQuery =
    url.searchParams.get("autocomplete_query") || undefined;
  let networkMemberSuggestions;
  if (suggestionsQuery !== undefined && suggestionsQuery !== "") {
    const query = suggestionsQuery.split(" ");
    const alreadyMemberSlugs = networkMembers.map((member) => {
      return member.networkMember.slug;
    });
    networkMemberSuggestions = await getOrganizationSuggestionsForAutocomplete(
      authClient,
      [...alreadyMemberSlugs, slug],
      query
    );
  }

  return json(
    { networkMembers, networkMemberSuggestions },
    { headers: response.headers }
  );
};

function Index() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      <h1 className="mb-8">Euer Netzwerk</h1>
      <p className="mb-8">
        Wer ist Teil Eures Netzwerks? Füge hier weitere Organisationen hinzu
        oder entferne sie.
      </p>
      <Add networkMemberSuggestions={loaderData.networkMemberSuggestions} />
      <h4 className="mb-4 mt-16 font-semibold">Aktuelle Netzwerkmitglieder</h4>
      <p className="mb-8">
        Hier siehst du alle Organisationen, die Teil eures Netzwerkes sind, auf
        einen Blick.{" "}
      </p>
      <div className="mb-4 md:max-h-[630px] overflow-auto">
        {loaderData.networkMembers.map((member) => {
          return (
            <NetworkMemberRemoveForm
              key={member.networkMember.id}
              {...member}
              slug={slug || ""}
            />
          );
        })}
      </div>
    </>
  );
}

export default Index;
