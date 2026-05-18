import {
  Form,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import {
  getEventIdBySlug,
  getInvitedProfilesToParticipateOnEvent,
  revokeInviteOfProfileToParticipateOnEvent,
} from "./invites.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { parseWithZod } from "@conform-to/zod";
import {
  createRevokeInviteOfProfileToParticipateOnEventSchema,
  createSearchInvitedProfilesToParticipateOnEventSchema,
  INVITED_PROFILES_SEARCH_PARAM,
  PROFILE_ID,
} from "./invites.shared";
import { captureException } from "@sentry/node";
import { redirectWithToast } from "~/toast.server";
import { useEffect, useState } from "react";
import TitleSection from "~/components/next/TitleSection";
import List from "~/components/next/List";
import ListItemPersonOrg from "~/components/next/ListItemPersonOrg";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "Invalid slug", {
    status: 400,
  });

  const { authClient } = createAuthClient(request);
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/participants/invites"
    ];

  const eventId = await getEventIdBySlug(params.slug);
  invariantResponse(eventId !== null, "Event not found", { status: 404 });

  const { submission, profiles } = await getInvitedProfilesToParticipateOnEvent(
    {
      request,
      eventId,
      authClient,
      locales: locales.route.search,
    }
  );

  if (profiles.length === 0) {
    return redirect(`/next/event/${params.slug}/settings/participants/add`);
  }

  return { locales, language, profiles, submission };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "Invalid slug", {
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
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const event = await getEventIdBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/participants/invites"
    ];

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: createRevokeInviteOfProfileToParticipateOnEventSchema(),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    await revokeInviteOfProfileToParticipateOnEvent({
      eventId: event,
      profileId: submission.value[PROFILE_ID],
      locales: {
        mail: locales.route.mail.revokeInviteToParticipateOnEvent,
      },
    });
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "revoke-invite-to-participate-on-event-error",
      key: `revoke-invite-to-participate-on-event-error-${Date.now()}`,
      message: locales.route.errors.revokeInviteToParticipateOnEvent,
      level: "negative",
    });
  }

  return redirectWithToast(request.url, {
    id: "revoke-invite-to-participate-on-event-success",
    key: `revoke-invite-to-participate-on-event-success-${Date.now()}`,
    message: locales.route.success.revokeInviteToParticipateOnEvent,
    level: "positive",
  });
}

function ParticipantsInvites() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language } = loaderData;

  const [profiles, setProfiles] = useState(loaderData.profiles);

  useEffect(() => {
    setProfiles(loaderData.profiles);
  }, [loaderData.profiles]);

  return (
    <>
      <TitleSection>
        <TitleSection.Headline>{locales.route.title}</TitleSection.Headline>
        <TitleSection.Subline>{locales.route.subline}</TitleSection.Subline>
      </TitleSection>
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
          schema={createSearchInvitedProfilesToParticipateOnEventSchema(
            locales.route.search
          )}
          hideLabel={false}
        />
        {profiles.map((profile, index) => {
          return (
            <ListItemPersonOrg
              key={profile.id}
              index={index}
              // to={`/profile/${profile.username}`} // TODO: link and controls currently not supported by component
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
                {insertParametersIntoLocale(locales.route.list.item.invitedAt, {
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
                  <input type="hidden" name={PROFILE_ID} value={profile.id} />
                  <Button type="submit" variant="outline">
                    {locales.route.list.item.revoke}
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

export default ParticipantsInvites;
