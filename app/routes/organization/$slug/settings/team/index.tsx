import { Profile } from "@prisma/client";
import { LoaderFunction, useLoaderData, useParams } from "remix";
import { prismaClient } from "~/prisma";
import { handleAuthorization } from "./../utils.server";
import Add from "./add";
import { MemberRemoveForm } from "./remove";

type ProfileData = Pick<
  Profile,
  "id" | "username" | "firstName" | "lastName" | "avatar" | "position"
>;

export type Member = {
  isPrivileged: boolean;
  organizationId: string;
  profile: ProfileData;
};

type LoaderData = Member[];

export const loader: LoaderFunction = async (args) => {
  const { organization } = await handleAuthorization(args);

  const members = await prismaClient.memberOfOrganization.findMany({
    select: {
      isPrivileged: true,
      organizationId: true,
      profile: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          position: true,
        },
      },
    },
    where: {
      organizationId: organization.id,
    },
  });

  return members;
};

function Index() {
  const { slug } = useParams();
  const loaderData = useLoaderData<LoaderData>();

  return (
    <>
      <h1>Das Team</h1>
      <p>
        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy
        eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
        voluptua.
      </p>
      {loaderData.map((member) => {
        return (
          <MemberRemoveForm
            key={member.profile.username}
            {...member}
            slug={slug as string}
          />
        );
      })}
      <Add />
    </>
  );
}

export default Index;
