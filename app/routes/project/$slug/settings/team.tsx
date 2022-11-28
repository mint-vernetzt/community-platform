import { LoaderFunction } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { Form } from "remix-forms";
import { getUserByRequestOrThrow } from "~/auth.server";
import { H3 } from "~/components/Heading/Heading";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getProjectBySlugOrThrow } from "../utils.server";
import {
  ActionData as AddMemberActionData,
  addMemberSchema,
} from "./team/add-member";
import {
  ActionData as RemoveMemberActionData,
  removeMemberSchema,
} from "./team/remove-member";
import {
  ActionData as SetPrivilegeActionData,
  setPrivilegeSchema,
} from "./team/set-privilege";
import {
  checkOwnershipOrThrow,
  getTeamMemberProfileDataFromProject,
} from "./utils.server";

type LoaderData = {
  userId: string;
  projectId: string;
  teamMembers: ReturnType<typeof getTeamMemberProfileDataFromProject>;
};

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");
  const currentUser = await getUserByRequestOrThrow(request);
  const project = await getProjectBySlugOrThrow(slug);
  await checkOwnershipOrThrow(project, currentUser);

  const teamMembers = getTeamMemberProfileDataFromProject(
    project,
    currentUser.id
  );

  return { userId: currentUser.id, projectId: project.id, teamMembers };
};

function Team() {
  const { slug } = useParams();
  const loaderData = useLoaderData<LoaderData>();
  const addMemberFetcher = useFetcher<AddMemberActionData>();
  const removeMemberFetcher = useFetcher<RemoveMemberActionData>();
  const setPrivilegeFetcher = useFetcher<SetPrivilegeActionData>();

  return (
    <>
      <div className="mb-8">
        <h3>Teammitglieder</h3>
        <ul>
          {loaderData.teamMembers.map((teamMember) => {
            return (
              <div
                key={`team-member-${teamMember.id}`}
                className="w-full flex items-center flex-row border-b border-neutral-400 p-4"
              >
                <div className="pl-4">
                  <H3 like="h4" className="text-xl mb-1">
                    <Link
                      className="underline hover:no-underline"
                      to={`/profile/${teamMember.username}`}
                    >
                      {teamMember.firstName} {teamMember.lastName}
                    </Link>
                  </H3>
                </div>
                <Form
                  schema={setPrivilegeSchema}
                  fetcher={setPrivilegeFetcher}
                  action={`/project/${slug}/settings/team/set-privilege`}
                  hiddenFields={[
                    "userId",
                    "projectId",
                    "teamMemberId",
                    "isPrivileged",
                  ]}
                  values={{
                    userId: loaderData.userId,
                    projectId: loaderData.projectId,
                    teamMemberId: teamMember.id,
                    isPrivileged: !teamMember.isPrivileged,
                  }}
                >
                  {(props) => {
                    const { Field, Button } = props;
                    return (
                      <>
                        <Field name="userId" />
                        <Field name="projectId" />
                        <Field name="teamMemberId" />
                        <Field name="isPrivileged" />
                        {teamMember.isCurrentUser === false && (
                          <div className="ml-2">
                            <Button
                              className="btn btn-outline-primary ml-auto btn-small"
                              title={
                                teamMember.isPrivileged
                                  ? "Privileg entziehen"
                                  : "Privileg hinzufügen"
                              }
                            >
                              {teamMember.isPrivileged
                                ? "Privileg entziehen"
                                : "Privileg hinzufügen"}
                            </Button>
                          </div>
                        )}
                      </>
                    );
                  }}
                </Form>
                <Form
                  schema={removeMemberSchema}
                  fetcher={removeMemberFetcher}
                  action={`/project/${slug}/settings/team/remove-member`}
                  hiddenFields={["userId", "projectId", "teamMemberId"]}
                  values={{
                    userId: loaderData.userId,
                    projectId: loaderData.projectId,
                    teamMemberId: teamMember.id,
                  }}
                >
                  {(props) => {
                    const { Field, Button } = props;
                    return (
                      <>
                        <Field name="userId" />
                        <Field name="projectId" />
                        <Field name="teamMemberId" />
                        {teamMember.isCurrentUser === false && (
                          <Button
                            className="ml-auto btn-none"
                            title="entfernen"
                          >
                            <svg
                              viewBox="0 0 10 10"
                              width="10px"
                              height="10px"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M.808.808a.625.625 0 0 1 .885 0L5 4.116 8.308.808a.626.626 0 0 1 .885.885L5.883 5l3.31 3.308a.626.626 0 1 1-.885.885L5 5.883l-3.307 3.31a.626.626 0 1 1-.885-.885L4.116 5 .808 1.693a.625.625 0 0 1 0-.885Z"
                                fill="currentColor"
                              />
                            </svg>
                          </Button>
                        )}
                      </>
                    );
                  }}
                </Form>
              </div>
            );
          })}
        </ul>
      </div>
      <h4 className="mb-4 font-semibold">Teammitglied hinzufügen</h4>
      <p className="mb-8">
        Füge hier Deiner Veranstaltung ein bereits bestehendes Profil hinzu.
      </p>
      <Form
        schema={addMemberSchema}
        fetcher={addMemberFetcher}
        action={`/project/${slug}/settings/team/add-member`}
        hiddenFields={["projectId", "userId"]}
        values={{ projectId: loaderData.projectId, userId: loaderData.userId }}
        onTransition={({ reset, formState }) => {
          if (formState.isSubmitSuccessful) {
            reset();
          }
        }}
      >
        {({ Field, Errors, Button }) => {
          return (
            <>
              <Field name="projectId" />
              <Field name="userId" />
              <div className="form-control w-full">
                <div className="flex flex-row items-center mb-2">
                  <div className="flex-auto">
                    <label
                      id="label-for-email"
                      htmlFor="Email"
                      className="label"
                    >
                      E-Mail
                    </label>
                  </div>
                </div>

                <div className="flex flex-row">
                  <Field name="email" className="flex-auto">
                    {({ Errors }) => (
                      <>
                        <input
                          id="email"
                          name="email"
                          className="input input-bordered w-full"
                        />
                        <Errors />
                      </>
                    )}
                  </Field>
                  <div className="ml-2">
                    <Button className="btn btn-outline-primary ml-auto btn-small">
                      Hinzufügen
                    </Button>
                    <Errors />
                  </div>
                </div>
              </div>
            </>
          );
        }}
      </Form>
    </>
  );
}

export default Team;
