import { parseWithZod } from "@conform-to/zod-v1";
import {
  type ActionFunctionArgs,
  redirect,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { RichText } from "~/components/legacy/Richtext/RichText";
import List from "~/components/next/List";
import ListItemEvent from "~/components/next/ListItemEvent";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { getFeatureAbilities } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import {
  addProfileToParticipants,
  addProfileToWaitingList,
  removeProfileFromParticipants,
  removeProfileFromWaitingList,
} from "../detail.server";
import { getChildEventsOfEvent } from "./child-events.server";
import {
  getParticipationSchema,
  hasDescription,
  hasSubline,
} from "./child-events.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const { slug } = params;
  invariantResponse(typeof slug !== "undefined", "slug not found", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/detail/child-events"];

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const { submission, childEvents } = await getChildEventsOfEvent({
    slug,
    authClient,
    sessionUser,
    searchParams,
  });

  return { submission, childEvents, locales, language };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  if (sessionUser === null) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    return redirect(`/login?login_redirect=${encodeURIComponent(pathname)}`);
  }

  const abilities = await getFeatureAbilities(authClient, "next_event");
  if (abilities.next_event.hasAccess === false) {
    return redirect("/");
  }

  invariantResponse(typeof params.slug !== "undefined", "slug not found", {
    status: 400,
  });
  const formData = await request.formData();
  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(
    intent === "participate" ||
      intent === "withdrawParticipation" ||
      intent === "joinWaitingList" ||
      intent === "leaveWaitingList",
    "invalid intent",
    {
      status: 400,
    }
  );

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/detail/child-events"];

  const submission = await parseWithZod(formData, {
    schema: getParticipationSchema({
      ...locales.route.errors,
    }).transform(async (data, context) => {
      let result: { error?: unknown } = {};
      if (intent === "participate") {
        result = await addProfileToParticipants(sessionUser.id, data.eventId);
      } else if (intent === "withdrawParticipation") {
        result = await removeProfileFromParticipants(
          sessionUser.id,
          data.eventId
        );
      } else if (intent === "joinWaitingList") {
        result = await addProfileToWaitingList(sessionUser.id, data.eventId);
      } else {
        result = await removeProfileFromWaitingList(
          sessionUser.id,
          data.eventId
        );
      }
      if (typeof result.error !== "undefined") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: locales.route.errors[intent],
        });
        return z.NEVER;
      }
      return data;
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return redirectWithToast(request.url, {
      id: `update-participation-error-toast-${submission.payload.eventId}`,
      key: `${new Date().getTime()}`,
      message: locales.route.errors[intent],
      level: "negative",
    });
  }

  return redirectWithToast(request.url, {
    id: `update-participation-toast-${submission.value.eventId}`,
    key: `${new Date().getTime()}`,
    message: locales.route.success[intent],
  });
}

function ChildEvents() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-neutral-700 text-xl font-bold leading-6">
        {loaderData.locales.route.content.title}
      </h3>
      <List
        id="child-events-list"
        hideAfter={10}
        locales={loaderData.locales.route.content}
      >
        {loaderData.childEvents.map((event, index) => {
          return (
            <ListItemEvent
              key={event.id}
              index={index}
              to={`/event/${event.slug}`}
            >
              <ListItemEvent.Image
                alt={event.name}
                src={event.background}
                blurredSrc={event.blurredBackground}
              />
              <ListItemEvent.Info
                {...event}
                stage={event.stage}
                locales={{
                  stages: loaderData.locales.stages,
                  ...loaderData.locales.route.content,
                }}
                language={loaderData.language}
              ></ListItemEvent.Info>
              <ListItemEvent.Headline>{event.name}</ListItemEvent.Headline>
              {hasSubline(event) || hasDescription(event) ? (
                <ListItemEvent.Subline>
                  {hasSubline(event) ? (
                    event.subline
                  ) : (
                    <RichText html={event.description as string} />
                  )}
                </ListItemEvent.Subline>
              ) : null}
              {/* No condition needed here, because unpublished events are filtered out server-side */}
              <ListItemEvent.Flag
                canceled={event.canceled}
                published={event.published}
              />
              {event.mode === "canParticipate" ||
              event.mode === "participating" ||
              event.mode === "canWait" ||
              event.mode === "waiting" ? (
                <ListItemEvent.Control
                  eventId={event.id}
                  mode={event.mode}
                  locales={{ ...loaderData.locales.route.content }}
                />
              ) : null}
            </ListItemEvent>
          );
        })}
      </List>
    </div>
  );
}

export default ChildEvents;
