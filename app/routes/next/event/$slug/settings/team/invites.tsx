import { parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { captureException } from "@sentry/node";
import { useEffect, useState } from "react";
import {
  Form,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import List from "~/components/next/List";
import ListItemPersonOrg from "~/components/next/ListItemPersonOrg";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import {
  getEventIdBySlug,
  getInvitedProfilesToJoinEventAsTeamMember,
  revokeInviteOfProfileToJoinEventAsTeamMember,
} from "./invites.server";
import {
  createRevokeInviteOfProfileToJoinEventAsTeamMemberSchema,
  createSearchInvitedProfilesSchema,
  INVITED_PROFILES_SEARCH_PARAM,
  PROFILE_ID_FIELD,
} from "./invites.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;

  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const { authClient } = createAuthClient(request);
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/team/invites"];

  const eventId = await getEventIdBySlug(params.slug);
  invariantResponse(eventId !== null, "Event not found", { status: 404 });

  const { submission, profiles } =
    await getInvitedProfilesToJoinEventAsTeamMember({
      request,
      eventId,
      authClient,
      locales: locales.route.search,
    });

  if (profiles.length === 0) {
    return redirect(`/next/event/${params.slug}/settings/team/add`);
  }

  return { locales, language, profiles, submission };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;

  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const event = await getEventIdBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/team/invites"];

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: createRevokeInviteOfProfileToJoinEventAsTeamMemberSchema(),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    await revokeInviteOfProfileToJoinEventAsTeamMember({
      eventId: event,
      profileId: submission.value[PROFILE_ID_FIELD],
      locales: {
        mail: locales.route.mail.cancelledInvitation,
      },
    });
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "revoke-invite-error",
      key: `revoke-invite-error-${Date.now()}`,
      message: locales.route.errors.revokeInviteFailed,
      level: "negative",
    });
  }

  return redirectWithToast(request.url, {
    id: "revoke-invite-success",
    key: `revoke-invite-success-${Date.now()}`,
    message: locales.route.success.revokeInvite,
    level: "positive",
  });
}

function TeamInvites() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language } = loaderData;

  const [profiles, setProfiles] = useState(loaderData.profiles);

  useEffect(() => {
    setProfiles(loaderData.profiles);
  }, [loaderData.profiles]);
  return (
    <>
      <h3 className="text-primary text-2xl font-bold leading-6.5 mt-2 mb-1">
        {locales.route.title}
      </h3>
      <List id="invites-list" locales={locales.route.list}>
        <List.Search
          defaultItems={loaderData.profiles}
          setValues={setProfiles}
          searchParam={INVITED_PROFILES_SEARCH_PARAM}
          locales={{
            placeholder: locales.route.search.placeholder,
            label: locales.route.search.label,
          }}
          hideUntil={8}
          label={locales.route.search.label}
          submission={loaderData.submission}
          schema={createSearchInvitedProfilesSchema(locales.route.search)}
          hideLabel={false}
        />
        {profiles.map((profile, index) => {
          return (
            <ListItemPersonOrg
              key={profile.id}
              index={index}
              // to={`/profile/${admin.username}`} // TODO: link and controls currently not supported by component
            >
              <ListItemPersonOrg.Avatar size="full" {...profile} />
              <ListItemPersonOrg.Headline>
                {profile.academicTitle !== null &&
                profile.academicTitle.length > 0
                  ? `${profile.academicTitle} `
                  : ""}
                {profile.firstName} {profile.lastName}
              </ListItemPersonOrg.Headline>
              <ListItemPersonOrg.Subline>
                {insertParametersIntoLocale(locales.route.listItem.invitedAt, {
                  date: profile.invitedAt.toLocaleDateString(language, {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  }),
                })}
              </ListItemPersonOrg.Subline>
              <ListItemPersonOrg.Controls>
                <Form
                  id={`revoke-invite-form-${profile.id}`}
                  method="post"
                  preventScrollReset
                >
                  <input
                    type="hidden"
                    name={PROFILE_ID_FIELD}
                    value={profile.id}
                  />
                  <Button type="submit" variant="outline">
                    {locales.route.list.revoke}
                  </Button>
                </Form>
              </ListItemPersonOrg.Controls>
            </ListItemPersonOrg>
          );
        })}
      </List>
    </>
  );
}

export default TeamInvites;
