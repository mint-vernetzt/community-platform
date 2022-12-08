import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { createAuthClient } from "~/auth.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import type { ArrayElement } from "~/lib/utils/types";
import {
  getNetworkMembersOfOrganization,
  handleAuthorization,
} from "../utils.server";
import Add from "./add";
import { NetworkMemberRemoveForm } from "./remove";

export type NetworkMember = ArrayElement<
  Awaited<ReturnType<typeof getNetworkMembersOfOrganization>>
>;

type LoaderData = { networkMembers: NetworkMember[] };

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const slug = getParamValueOrThrow(params, "slug");
  const { organization } = await handleAuthorization(authClient, slug);

  const networkMembers = await getNetworkMembersOfOrganization(
    authClient,
    organization.id
  );

  return json<LoaderData>({ networkMembers }, { headers: response.headers });
};

function Index() {
  const { slug } = useParams();
  const loaderData = useLoaderData<LoaderData>();

  return (
    <>
      <h1 className="mb-8">Euer Netzwerk</h1>
      <p className="mb-8">
        Wer ist Teil Eures Netzwerks? Füge hier weitere Organisationen hinzu
        oder entferne sie.
      </p>
      <div className="mb-8">
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
      <Add />
    </>
  );
}

export default Index;
