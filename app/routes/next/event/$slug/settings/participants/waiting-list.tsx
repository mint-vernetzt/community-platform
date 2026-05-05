import {
  type ActionFunctionArgs,
  Form,
  Link,
  redirect,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import {
  getEventBySlug,
  getWaitingListOfEvent,
  moveToParticipants,
} from "./waiting-list.server";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { Deep } from "~/lib/utils/searchParams";
import { useEffect, useState } from "react";
import TitleSection from "~/components/next/TitleSection";
import Hint from "~/components/next/Hint";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import List from "~/components/next/List";
import {
  getMoveToParticipantsSchema,
  getSearchWaitingListSchema,
  PROFILE_ID,
  SEARCH_WAITING_LIST_SEARCH_PARAM,
} from "./waiting-list.shared";
import ListItemPersonOrg from "~/components/next/ListItemPersonOrg";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { parseWithZod } from "@conform-to/zod";
import { captureException } from "@sentry/node";
import { redirectWithToast } from "~/toast.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "Invalid slug", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/participants/waiting-list"
    ];

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const { authClient } = createAuthClient(request);

  const result = await getWaitingListOfEvent({
    eventId: event.id,
    authClient,
    searchParams,
  });
  const { submission, waitingList } = result;

  if (waitingList.length === 0) {
    return redirect(`../participants?${Deep}=true`);
  }

  return {
    locales,
    language,
    waitingList,
    submission,
    moveUpToParticipants: event.moveUpToParticipants,
  };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;

  const { slug } = params;
  invariantResponse(typeof slug === "string", "Invalid slug", { status: 400 });

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

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/participants/waiting-list"
    ];

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const formData = await request.formData();
  const submission = parseWithZod(formData, {
    schema: getMoveToParticipantsSchema(),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    await moveToParticipants({
      profileId: submission.value[PROFILE_ID],
      eventId: event.id,
      locales: {
        mail: {
          subject: locales.route.mail.moveToParticipants.subject,
        },
      },
    });
    return redirectWithToast(request.url, {
      id: "move-to-participants-success",
      key: `move-to-participants-success-${Date.now()}`,
      message: locales.route.success.moveToParticipants,
      level: "positive",
    });
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "move-to-participants-error",
      key: `move-to-participants-error-${Date.now()}`,
      message: locales.route.errors.moveToParticipants,
      level: "negative",
    });
  }
}

function ParticipantsWaitingList() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language } = loaderData;

  const [waitingList, setWaitingList] = useState(loaderData.waitingList);

  useEffect(() => {
    setWaitingList(loaderData.waitingList);
  }, [loaderData.waitingList]);

  let hint: string = locales.route.hints.automaticallyMoveToParticipants;
  if (loaderData.moveUpToParticipants === false) {
    hint = locales.route.hints.manuallyMoveToParticipants;
  }

  return (
    <>
      <TitleSection>
        <TitleSection.Headline>{locales.route.title}</TitleSection.Headline>
        <TitleSection.Subline>{locales.route.subline}</TitleSection.Subline>
      </TitleSection>
      <Hint>
        {insertComponentsIntoLocale(hint, [
          <span key="semibold" className="font-semibold" />,
          <Link
            key="link"
            to={`./../../registration/limit?${Deep}=true`}
            className="underline font-semibold"
            preventScrollReset
          />,
        ])}
      </Hint>
      <List id="waiting-list" hideAfter={4} locales={locales.route.list}>
        <List.Search
          defaultItems={loaderData.waitingList}
          setValues={setWaitingList}
          searchParam={SEARCH_WAITING_LIST_SEARCH_PARAM}
          locales={{
            placeholder: locales.route.search.placeholder,
          }}
          hideUntil={4}
          label={locales.route.search.label}
          submission={loaderData.submission}
          schema={getSearchWaitingListSchema()}
        />
        {waitingList.map((profile, index) => {
          const date = new Date(profile.createdAt);

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
                {insertParametersIntoLocale(locales.route.list.item.subline, {
                  date: `${date.toLocaleDateString(language, {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })} ${date.toLocaleTimeString(language, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`,
                })}
              </ListItemPersonOrg.Subline>
              <ListItemPersonOrg.Controls>
                <Button
                  variant="outline"
                  type="submit"
                  form={`move-to-participants-form-${profile.id}`}
                >
                  {locales.route.list.item.add}
                </Button>
                <Form
                  id={`move-to-participants-form-${profile.id}`}
                  method="POST"
                  preventScrollReset
                  hidden
                >
                  <input name={PROFILE_ID} defaultValue={profile.id} />
                </Form>
              </ListItemPersonOrg.Controls>
            </ListItemPersonOrg>
          );
        })}
      </List>
    </>
  );
}

export default ParticipantsWaitingList;
