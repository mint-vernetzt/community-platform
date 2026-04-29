import { parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { captureException } from "@sentry/node";
import { useEffect, useState } from "react";
import {
  type ActionFunctionArgs,
  Form,
  redirect,
  useLoaderData,
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
  getEventBySlug,
  getSpeakersOfEvent,
  removeSpeakerFromEvent,
} from "./list.server";
import {
  getRemoveSpeakerSchema,
  getSearchSpeakersSchema,
  SEARCH_SPEAKERS_SEARCH_PARAM,
} from "./list.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const { authClient } = createAuthClient(request);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/speakers/list"];

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const { submission, speakers } = await getSpeakersOfEvent({
    slug: params.slug,
    authClient,
    searchParams,
  });

  if (speakers.length === 0) {
    return redirect(`/next/event/${params.slug}/settings/speakers/add`);
  }

  return { locales, submission, speakers };
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

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/speakers/list"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: getRemoveSpeakerSchema(),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    await removeSpeakerFromEvent({
      speakerId: submission.value.speakerId,
      eventId: event.id,
      locales: locales.route,
    });
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "remove-speaker-error",
      key: `remove-speaker-error-${Date.now()}`,
      message: locales.route.errors.removeSpeakerFailed,
      level: "negative",
    });
  }

  return redirectWithToast(request.url, {
    id: "remove-speaker-success",
    key: `remove-speaker-success-${Date.now()}`,
    message: locales.route.success.removeSpeaker,
    level: "positive",
  });
}

function SpeakerList() {
  const loaderData = useLoaderData<typeof loader>();

  const { locales } = loaderData;
  const [speakers, setSpeakers] = useState(loaderData.speakers);

  useEffect(() => {
    setSpeakers(loaderData.speakers);
  }, [loaderData.speakers]);

  return (
    <>
      <h3 className="text-primary text-2xl font-bold leading-6.5 mt-2 mb-1">
        {locales.route.title}
      </h3>
      <List id="speakers-list" hideAfter={4} locales={locales.route.list}>
        <List.Search
          defaultItems={loaderData.speakers}
          setValues={setSpeakers}
          searchParam={SEARCH_SPEAKERS_SEARCH_PARAM}
          locales={{
            placeholder: locales.route.list.searchPlaceholder,
          }}
          hideUntil={4}
          label={locales.route.list.searchPlaceholder}
          submission={loaderData.submission}
          schema={getSearchSpeakersSchema()}
        />
        {speakers.map((speaker, index) => {
          return (
            <ListItemPersonOrg
              key={speaker.id}
              index={index}
              //to={`/profile/${speaker.username}`} // TODO: link and controls currently not supported by component
            >
              <ListItemPersonOrg.Avatar size="full" {...speaker} />
              <ListItemPersonOrg.Headline>
                {speaker.academicTitle !== null &&
                speaker.academicTitle.length > 0
                  ? `${speaker.academicTitle} `
                  : ""}
                {speaker.firstName} {speaker.lastName}
              </ListItemPersonOrg.Headline>
              <ListItemPersonOrg.Controls>
                <Form
                  id={`remove-speaker-form-${speaker.id}`}
                  method="POST"
                  preventScrollReset
                >
                  <input type="hidden" name="speakerId" value={speaker.id} />
                  <Button type="submit" variant="outline">
                    {locales.route.list.remove}
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

export default SpeakerList;
