import {
  ActionFunctionArgs,
  Form,
  redirect,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { detectLanguage } from "~/root.server";
import { languageModuleMap } from "~/locales/.server";
import { getEventIdBySlug } from "../admins.server";
import {
  getInvitedProfilesToJoinEventAsAdmin,
  revokeInviteOfProfileToJoinEventAsAdmin,
} from "./invites.server";
import { useEffect, useState } from "react";
import {
  createRevokeInviteOfProfileToJoinEventAsAdminSchema,
  createSearchInvitedProfilesSchema,
  INVITED_PROFILES_SEARCH_PARAM,
  PROFILE_ID_FIELD,
} from "./invites.shared";
import List from "~/components/next/List";
import ListItemPersonOrg from "~/components/next/ListItemPersonOrg";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { parseWithZod } from "@conform-to/zod";
import { captureException } from "@sentry/node";
import { redirectWithToast } from "~/toast.server";

export async function loader(args: LoaderFunctionArgs) {
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

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/admins/invites"];

  const event = await getEventIdBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const { submission, profiles } = await getInvitedProfilesToJoinEventAsAdmin({
    request,
    eventId: event,
    authClient,
    locales: locales.route.search,
  });

  if (profiles.length === 0) {
    return redirect(`/next/event/${params.slug}/settings/admins/add`);
  }

  return { locales, profiles, submission };
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
    languageModuleMap[language]["next/event/$slug/settings/admins/invites"];

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: createRevokeInviteOfProfileToJoinEventAsAdminSchema(),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    await revokeInviteOfProfileToJoinEventAsAdmin({
      eventId: event,
      profileId: submission.value[PROFILE_ID_FIELD],
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

function Invites() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  const [profiles, setProfiles] = useState(loaderData.profiles);

  useEffect(() => {
    setProfiles(loaderData.profiles);
  }, [loaderData.profiles]);

  return (
    <>
      <h3 className="text-primary text-2xl font-bold leading-6.5 mt-2 mb-1">
        {locales.route.title}
      </h3>
      <List id="participants-list" locales={locales.route.list}>
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

export default Invites;
