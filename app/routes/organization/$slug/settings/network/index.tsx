import { LoaderFunction, useLoaderData, useParams } from "remix";
import { ArrayElement } from "~/lib/utils/typeHelper";
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

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { organization } = await handleAuthorization(args);

  const networkMembers = await getNetworkMembersOfOrganization(organization.id);

  return { networkMembers };
};

function Index() {
  const { slug } = useParams();
  const loaderData = useLoaderData<LoaderData>();

  return (
    <>
      <h1 className="mb-8">Das Netzwerk</h1>
      <p className="mb-8">
        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy
        eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
        voluptua.
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
