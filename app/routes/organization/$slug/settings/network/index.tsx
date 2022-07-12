import { LoaderFunction, useLoaderData, useParams } from "remix";
import { prismaClient } from "~/prisma";
import { handleAuthorization } from "../utils.server";
import Add from "./add";
import { NetworkMemberRemoveForm } from "./remove";

export type NetworkMember = {
  networkId: string;
  networkMember: {
    id: string;
    slug: string;
    name: string;
    logo: string | null;
    types: {
      organizationType: {
        title: string;
      };
    }[];
  };
};

type LoaderData = NetworkMember[];

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { organization } = await handleAuthorization(args);

  const networkMembers = await prismaClient.memberOfNetwork.findMany({
    select: {
      networkId: true,
      networkMember: {
        select: {
          id: true,
          slug: true,
          name: true,
          logo: true,
          types: {
            select: {
              organizationType: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      },
    },
    where: {
      networkId: organization.id,
    },
  });

  return networkMembers;
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
        {loaderData.map((member) => {
          return (
            <NetworkMemberRemoveForm
              key={member.networkMember.id}
              {...member}
              slug={slug as string}
            />
          );
        })}
      </div>
      <Add />
    </>
  );
}

export default Index;
