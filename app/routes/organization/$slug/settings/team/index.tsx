import { Profile } from "@prisma/client";
import { LoaderFunction, useLoaderData, useParams } from "remix";
import { prismaClient } from "~/prisma";
import {
  getMembersOfOrganization,
  handleAuthorization,
} from "./../utils.server";
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

  const members = await getMembersOfOrganization(organization.id);
};

function Index() {
  const { slug } = useParams();
  const loaderData = useLoaderData<LoaderData>();

  return (
    <>
      <h1 className="mb-8">Das Team</h1>
      <p className="mb-8">
        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy
        eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
        voluptua. BUH!
      </p>
      <div className="mb-8">
        {loaderData.map((member) => {
          return (
            <MemberRemoveForm
              key={member.profile.username}
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
