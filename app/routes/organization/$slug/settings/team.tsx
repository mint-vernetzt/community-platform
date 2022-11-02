import { LoaderFunction, useFetcher, useLoaderData, useParams } from "remix";
import { ArrayElement } from "~/lib/utils/types";
import {
  getMembersOfOrganization,
  getTeamMemberProfileDataFromOrganization,
  handleAuthorization,
} from "./utils.server";
import {
  ActionData as AddMemberActionData,
  addMemberSchema,
} from "./team/add-member";
import {
  ActionData as RemoveMemberActionData,
  removeMemberSchema,
} from "./team/remove-member";
import { Form } from "remix-forms";
import {
  ActionData as SetPrivilegeActionData,
  setPrivilegeSchema,
} from "./team/set-privilege";
import { getInitials } from "~/lib/profile/getInitials";
import { H3 } from "~/components/Heading/Heading";

export type Member = ArrayElement<
  Awaited<ReturnType<typeof getTeamMemberProfileDataFromOrganization>>
>;

type LoaderData = {
  userId: string;
  organizationId: string;
  slug: string;
  members: Member[];
};

export const loader: LoaderFunction = async (args) => {
  const { organization, currentUser } = await handleAuthorization(args);

  const members = await getMembersOfOrganization(organization.id);

  const enhancedMembers = getTeamMemberProfileDataFromOrganization(
    members,
    currentUser.id
  );

  return {
    members: enhancedMembers,
    userId: currentUser.id,
    organizationId: organization.id,
    slug: args.params.slug,
  };
};

function Index() {
  const { slug } = useParams();
  const loaderData = useLoaderData<LoaderData>();
  const addMemberFetcher = useFetcher<AddMemberActionData>();
  const removeMemberFetcher = useFetcher<RemoveMemberActionData>();
  const setPrivilegeFetcher = useFetcher<SetPrivilegeActionData>();

  return (
    <>
      <h1 className="mb-8">Das Team</h1>
      <p className="mb-8">
        Wer ist Teil Eurer Organisation? Füge hier weitere Teammitglieder hinzu
        oder entferne sie.
      </p>
      <div className="mb-8">
        {loaderData.members.map((profile, index) => {
          const initials = getInitials(profile);
          return (
            <div
              key={`team-member-${index}`}
              className="w-full flex items-center flex-row border-b border-neutral-400 p-4"
            >
              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-md overflow-hidden">
                {profile.avatar !== null && profile.avatar !== "" ? (
                  <img src={profile.avatar} alt={initials} />
                ) : (
                  <>{initials}</>
                )}
              </div>
              <div className="pl-4">
                <H3 like="h4" className="text-xl mb-1">
                  {profile.firstName} {profile.lastName}
                </H3>
                {profile.position && (
                  <p className="font-bold text-sm">{profile.position}</p>
                )}
              </div>
              <Form
                key={`set-privilege-${index}`}
                schema={setPrivilegeSchema}
                fetcher={setPrivilegeFetcher}
                action={`/organization/${slug}/settings/team/set-privilege`}
                hiddenFields={[
                  "userId",
                  "slug",
                  "teamMemberId",
                  "organizationId",
                  "isPrivileged",
                ]}
                values={{
                  userId: loaderData.userId,
                  slug: loaderData.slug,
                  teamMemberId: profile.id,
                  organizationId: loaderData.organizationId,
                  isPrivileged: !profile.isPrivileged,
                }}
              >
                {(props) => {
                  const { Field, Button } = props;
                  return (
                    <>
                      <Field name="userId" />
                      <Field name="slug" />
                      <Field name="teamMemberId" />
                      <Field name="organizationId" />
                      <Field name="isPrivileged" />
                      {profile.isCurrentUser === false && (
                        <div className="ml-2">
                          <Button
                            className="btn btn-outline-primary ml-auto btn-small"
                            title={
                              profile.isPrivileged
                                ? "Privileg entziehen"
                                : "Privileg hinzufügen"
                            }
                          >
                            {profile.isPrivileged
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
                method="post"
                key={`${profile.username}`}
                action={`/organization/${slug}/settings/team/remove-member`}
                schema={removeMemberSchema}
                hiddenFields={["teamMemberId", "organizationId", "userId"]}
                values={{
                  teamMemberId: profile.id,
                  organizationId: loaderData.organizationId,
                  userId: loaderData.userId,
                }}
                fetcher={removeMemberFetcher}
              >
                {({ Field, Button, Errors }) => {
                  return (
                    <>
                      {profile.isCurrentUser === false && (
                        <Button className="ml-auto btn-none" title="entfernen">
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
                      <Field name="userId" />
                      <Field name="teamMemberId" />
                      <Field name="organizationId" />
                      <Errors />
                    </>
                  );
                }}
              </Form>
            </div>
          );
        })}
      </div>
      <h4 className="mb-4 font-semibold">Teammitglied hinzufügen</h4>
      <p className="mb-8">
        Füge hier Eurer Organisation ein bereits bestehendes Profil hinzu.
      </p>
      <Form
        schema={addMemberSchema}
        fetcher={addMemberFetcher}
        action={`/organization/${slug}/settings/team/add-member`}
        hiddenFields={["slug", "userId", "organizationId"]}
        values={{
          slug,
          userId: loaderData.userId,
          organizationId: loaderData.organizationId,
        }}
        onTransition={({ reset, formState }) => {
          if (formState.isSubmitSuccessful) {
            reset();
          }
        }}
      >
        {({ Field, Errors, Button }) => {
          return (
            <div className="form-control w-full">
              <div className="flex flex-row items-center mb-2">
                <div className="flex-auto">
                  <label id="label-for-email" htmlFor="Email" className="label">
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
                  <Button className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-neutral-500 text-neutral-600 mt-0.5">
                    +
                  </Button>
                  <Errors />
                </div>
              </div>
              <Field name="slug" />
              <Field name="userId" />
              <Field name="organizationId" />
            </div>
          );
        }}
      </Form>
    </>
  );
}

export default Index;
