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

export const loader: LoaderFunction = async (args) => {
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

  const { profile, isPrivileged, organizationId, slug } = props;
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
          <>
            <p>
              {initials}, {profile.firstName}, {profile.lastName} {isPrivileged}
            </p>
            <Field name="profileId" />
            <Field name="organizationId" />
            <Errors />
            <Button>X</Button>
          </>
        );
      }}
    </Form>
  );
}
