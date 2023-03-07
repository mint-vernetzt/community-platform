import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { createAuthClient } from "~/auth.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import type { ArrayElement } from "~/lib/utils/types";
import {
  getNetworkMembersOfOrganization,
  getNetworkMembersSuggestions,
  handleAuthorization,
} from "../utils.server";
import Add from "./add";
import { NetworkMemberRemoveForm } from "./remove";

export type NetworkMember = ArrayElement<
  Awaited<ReturnType<typeof getNetworkMembersOfOrganization>>
>;

export type NetworkMemberSuggestions =
  | Awaited<ReturnType<typeof getNetworkMembersSuggestions>>
  | undefined;

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const slug = getParamValueOrThrow(params, "slug");
  const { organization } = await handleAuthorization(authClient, slug);

  const networkMembers = await getNetworkMembersOfOrganization(
    authClient,
    organization.id
  );

  const url = new URL(request.url);
  const query = url.searchParams.get("query") || undefined;

  let networkMemberSuggestions;
  if (query !== undefined && query !== "") {
    const alreadyMemberSlugs = networkMembers.map((member) => {
      return member.networkMember.slug;
    });
    networkMemberSuggestions = await getNetworkMembersSuggestions(
      authClient,
      slug,
      alreadyMemberSlugs,
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
      <div className="mb-4">
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
      <Add networkMemberSuggestions={loaderData.networkMemberSuggestions} />
    </>
  );
}

export default Index;
