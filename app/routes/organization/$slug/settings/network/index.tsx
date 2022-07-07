import { LoaderFunction, useLoaderData } from "remix";
import { prismaClient } from "~/prisma";
import { handleAuthorization } from "../utils.server";
import Add from "./add";

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
  const loaderData = useLoaderData<LoaderData>();

  return (
    <>
      <h1>Das Netzwerk</h1>
      <p>
        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy
        eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
        voluptua.
      </p>
      <ul>
        {loaderData.map((member) => {
          return (
            <li key={member.networkMember.id}>{member.networkMember.name}</li>
          );
        })}
      </ul>
      <Add />
    </>
  );
}

export default Index;
