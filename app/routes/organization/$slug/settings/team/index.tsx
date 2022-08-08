import { LoaderFunction, useLoaderData, useParams } from "remix";
import { ArrayElement } from "~/lib/utils/types";
import {
  getMembersOfOrganization,
  handleAuthorization,
} from "./../utils.server";
import Add from "./add";
import { MemberRemoveForm } from "./remove";

export type Member = ArrayElement<
  Awaited<ReturnType<typeof getMembersOfOrganization>>
>;

type LoaderData = {
  members: Member[];
};

export const loader: LoaderFunction = async (args) => {
  const { organization } = await handleAuthorization(args);

  const members = await getMembersOfOrganization(organization.id);

  return { members };
};

function Index() {
  const { slug } = useParams();
  const loaderData = useLoaderData<LoaderData>();

  return (
    <>
      <h1 className="mb-8">Das Team</h1>
      <p className="mb-8">
        Wer ist Teil Eurer Organisation? Füge hier weitere Teammitglieder hinzu
        oder entferne sie.
      </p>
      <div className="mb-8">
        {loaderData.members.map((member) => {
          return (
            <MemberRemoveForm
              key={member.profile.username}
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
