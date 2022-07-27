import { ActionFunction, LoaderFunction, redirect, useFetcher } from "remix";
import { makeDomainFunction } from "remix-domains";
import { Form, performMutation } from "remix-forms";
import { z } from "zod";
import { getInitials } from "~/lib/profile/getInitials";
import { Member } from ".";
import {
  disconnectProfileFromOrganization,
  getMembers,
  handleAuthorization,
} from "././../utils.server";
import { H3 } from "~/components/Heading/Heading";

export const schema = z.object({
  profileId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

const mutation = makeDomainFunction(schema)(async (values) => {
  const { profileId, organizationId } = values;
  const members = await getMembers(organizationId);

  // Prevent self deletion
  const privilegedMembersWithoutToRemove = members.filter((member) => {
    return member.isPrivileged && member.profileId !== profileId;
  });

  if (privilegedMembersWithoutToRemove.length > 0) {
    await disconnectProfileFromOrganization(profileId, organizationId);
  } else {
    throw "Unable to remove member - last privileged member.";
  }

  return values;
});

export const loader: LoaderFunction = async () => {
  return redirect(".");
};

export const action: ActionFunction = async (args) => {
  const { request } = args;

  await handleAuthorization(args);

  const result = await performMutation({ request, schema, mutation });

  return result;
};

export function MemberRemoveForm(props: Member & { slug: string }) {
  const fetcher = useFetcher();

  const { profile, organizationId, slug } = props;
  const initials = getInitials(profile);

  return (
    <Form
      method="post"
      key={`${profile.username}`}
      action={`/organization/${slug}/settings/team/remove`}
      schema={schema}
      hiddenFields={["profileId", "organizationId"]}
      values={{ profileId: profile.id, organizationId }}
      fetcher={fetcher}
    >
      {({ Field, Button, Errors }) => {
        return (
          <div className="w-full flex items-center flex-row border-b border-neutral-400 p-4">
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
            <Field name="profileId" />
            <Field name="organizationId" />
            <Errors />
          </div>
        );
      }}
    </Form>
  );
}
