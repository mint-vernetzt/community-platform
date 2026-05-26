import {
  type ActionFunctionArgs,
  Form,
  redirect,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import BasicStructure from "~/components/next/BasicStructure";
import Hint from "~/components/next/Hint";
import TitleSection from "~/components/next/TitleSection";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import List from "~/components/next/List";
import ListItemEvent from "~/components/next/ListItemEvent";
import { hasContent } from "~/utils.shared";
import { RichText } from "~/components/legacy/Richtext/RichText";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import {
  addParentEvent,
  getEventBySlug,
  getEventBySlugForAction,
  getParentEventsToAdd,
  removeParentEvent,
} from "./parent-event.server";
import {
  createAuthClient,
  getSessionUser,
  getSessionUserOrThrow,
} from "~/auth.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import {
  ADD_PARENT_EVENT_INTENT,
  createAddParentEventSchema,
  PARENT_EVENT_ID,
  REMOVE_PARENT_EVENT_INTENT,
} from "./parent-event.shared";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { parseWithZod } from "@conform-to/zod";
import { captureException } from "@sentry/node";
import { redirectWithToast } from "~/toast.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  invariantResponse(sessionUser !== null, "Unauthorized", { status: 401 }); // Needed for type narrowing

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/related-events/parent-event"
    ];

  const event = await getEventBySlug({
    authClient,
    sessionUser,
    slug: params.slug,
  });

  invariantResponse(event !== null, "Event not found", { status: 404 });

  const parentEventsToAdd = await getParentEventsToAdd({
    userId: sessionUser.id,
    authClient,
    event,
  });

  return {
    locales,
    language,
    event,
    parentEventsToAdd,
  };
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

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/related-events/parent-event"
    ];

  const formData = await request.formData();
  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(
    intent === ADD_PARENT_EVENT_INTENT || intent === REMOVE_PARENT_EVENT_INTENT,
    "unknown intent",
    {
      status: 400,
    }
  );

  const event = await getEventBySlugForAction(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (intent === ADD_PARENT_EVENT_INTENT) {
    const submission = await parseWithZod(formData, {
      schema: createAddParentEventSchema(),
    });
    if (submission.status !== "success") {
      return submission.reply();
    }
    try {
      await addParentEvent({
        userId: sessionUser.id,
        event,
        parentEventId: submission.value[PARENT_EVENT_ID],
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "add-parent-event-error",
        key: `add-parent-event-error-${Date.now()}`,
        message: locales.route.errors.addParentEvent,
        level: "negative",
      });
    }
    return redirectWithToast(request.url, {
      id: "add-parent-event-success",
      key: `add-parent-event-success-${Date.now()}`,
      message: locales.route.success.addParentEvent,
      level: "positive",
    });
  } else if (intent === REMOVE_PARENT_EVENT_INTENT) {
    try {
      await removeParentEvent({
        event,
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "remove-parent-event-error",
        key: `remove-parent-event-error-${Date.now()}`,
        message: locales.route.errors.removeParentEvent,
        level: "negative",
      });
    }
    return redirectWithToast(request.url, {
      id: "remove-parent-event-success",
      key: `remove-parent-event-success-${Date.now()}`,
      message: locales.route.success.removeParentEvent,
      level: "positive",
    });
  }
}

function ParentEvent() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language, event, parentEventsToAdd } = loaderData;

  return event._count.childEvents > 0 ? (
    <>
      <TitleSection>
        <TitleSection.Headline>
          {locales.route.add.headline}
        </TitleSection.Headline>
      </TitleSection>
      <Hint>
        <Hint.InfoIcon />
        {locales.route.add.hasChildEventsHint}
      </Hint>
    </>
  ) : event.published === true || event.parentEvent !== null ? (
    <>
      <>
        <TitleSection>
          <TitleSection.Headline>
            {locales.route.current.headline}
          </TitleSection.Headline>
        </TitleSection>
        {event.published === false ? (
          <Form
            id="remove-parent-form"
            method="POST"
            hidden
            preventScrollReset
          />
        ) : null}
        {event.parentEvent !== null ? (
          <ListItemEvent
            index={0}
            to={`/event/${event.parentEvent.slug}/detail/about`}
          >
            <ListItemEvent.Image
              alt={event.parentEvent.name}
              src={event.parentEvent.background}
              blurredSrc={event.parentEvent.blurredBackground}
            />
            <ListItemEvent.Info
              {...event.parentEvent}
              stage={event.parentEvent.stage}
              locales={{
                stages: locales.stages,
                ...loaderData.locales.route.list,
              }}
              participantCount={event.parentEvent._count.participants}
              language={language}
            ></ListItemEvent.Info>
            <ListItemEvent.Headline>
              {event.parentEvent.name}
            </ListItemEvent.Headline>
            {hasContent(event.parentEvent.subline) ||
            hasContent(event.parentEvent.description) ? (
              <ListItemEvent.Subline>
                {hasContent(event.parentEvent.subline) ? (
                  event.parentEvent.subline
                ) : (
                  <RichText html={event.parentEvent.description as string} />
                )}
              </ListItemEvent.Subline>
            ) : null}
            {event.published === false ? (
              <ListItemEvent.Controls>
                <Button
                  type="submit"
                  form="remove-parent-form"
                  name={INTENT_FIELD_NAME}
                  value={REMOVE_PARENT_EVENT_INTENT}
                  variant="outline"
                  size="small"
                  fullSize
                >
                  {locales.route.current.cta}
                </Button>
              </ListItemEvent.Controls>
            ) : null}
          </ListItemEvent>
        ) : null}
        {event.published === false ? (
          <Hint>
            <Hint.InfoIcon />
            {event.parentEvent !== null && event.parentEvent.isAdmin
              ? locales.route.current.hint.unpublishedSameAdmin
              : locales.route.current.hint.unpublishedDifferentAdmin}
          </Hint>
        ) : (
          <Hint>
            <Hint.InfoIcon />
            {locales.route.current.hint.published}
          </Hint>
        )}
      </>
    </>
  ) : (
    <>
      {/* published false & parentEvent === null */}
      <TitleSection>
        <TitleSection.Headline>
          {locales.route.add.headline}
        </TitleSection.Headline>
        <TitleSection.Subline>{locales.route.add.subline}</TitleSection.Subline>
      </TitleSection>
      {parentEventsToAdd.length > 0 ? (
        <Hint>
          <Hint.InfoIcon />
          {locales.route.add.timePeriodHint}
        </Hint>
      ) : null}
      <BasicStructure.Container
        deflatedUntil={false}
        gaps={{ base: "gap-4", md: "gap-4", xl: "gap-4" }}
        padding="p-4"
        rounded="rounded-lg"
      >
        <div className="flex gap-4 items-center">
          <div className="flex  items-center justify-center w-12 h-12 rounded-full bg-neutral-100">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect width="24" height="24" rx="8" fill="#F4F5F6" />
              <path
                d="M12 6C12.1989 6 12.3897 6.07902 12.5303 6.21967C12.671 6.36032 12.75 6.55109 12.75 6.75V11.25H17.25C17.4489 11.25 17.6397 11.329 17.7803 11.4697C17.921 11.6103 18 11.8011 18 12C18 12.1989 17.921 12.3897 17.7803 12.5303C17.6397 12.671 17.4489 12.75 17.25 12.75H12.75V17.25C12.75 17.4489 12.671 17.6397 12.5303 17.7803C12.3897 17.921 12.1989 18 12 18C11.8011 18 11.6103 17.921 11.4697 17.7803C11.329 17.6397 11.25 17.4489 11.25 17.25V12.75H6.75C6.55109 12.75 6.36032 12.671 6.21967 12.5303C6.07902 12.3897 6 12.1989 6 12C6 11.8011 6.07902 11.6103 6.21967 11.4697C6.36032 11.329 6.55109 11.25 6.75 11.25H11.25V6.75C11.25 6.55109 11.329 6.36032 11.4697 6.21967C11.6103 6.07902 11.8011 6 12 6V6Z"
                fill="#4D5970"
              />
            </svg>
          </div>
          <span>{locales.route.add.label}</span>
        </div>
        {parentEventsToAdd.length > 0 ? (
          <List
            id="parent-events-to-add-list"
            hideAfter={4}
            locales={locales.route.list}
          >
            {parentEventsToAdd.map((parentEvent, index) => {
              return (
                <div key={parentEvent.id}>
                  <Form
                    id={`add-parent-form-${parentEvent.id}`}
                    method="POST"
                    hidden
                    preventScrollReset
                  >
                    <input
                      name={PARENT_EVENT_ID}
                      defaultValue={parentEvent.id}
                    />
                  </Form>
                  <ListItemEvent
                    index={index}
                    to={`/event/${parentEvent.slug}/detail/about`}
                  >
                    <ListItemEvent.Image
                      alt={parentEvent.name}
                      src={parentEvent.background}
                      blurredSrc={parentEvent.blurredBackground}
                    />
                    <ListItemEvent.Info
                      {...parentEvent}
                      stage={parentEvent.stage}
                      locales={{
                        stages: locales.stages,
                        ...loaderData.locales.route.list,
                      }}
                      participantCount={parentEvent._count.participants}
                      language={language}
                    ></ListItemEvent.Info>
                    <ListItemEvent.Headline>
                      {parentEvent.name}
                    </ListItemEvent.Headline>
                    {hasContent(parentEvent.subline) ||
                    hasContent(parentEvent.description) ? (
                      <ListItemEvent.Subline>
                        {hasContent(parentEvent.subline) ? (
                          parentEvent.subline
                        ) : (
                          <RichText html={parentEvent.description as string} />
                        )}
                      </ListItemEvent.Subline>
                    ) : null}
                    <ListItemEvent.Controls>
                      {parentEvent.parentEventId !== null ? (
                        <>{locales.route.list.hasParentEvent}</>
                      ) : (
                        <Button
                          type="submit"
                          form={`add-parent-form-${parentEvent.id}`}
                          name={INTENT_FIELD_NAME}
                          value={ADD_PARENT_EVENT_INTENT}
                          size="small"
                          fullSize
                        >
                          {locales.route.add.cta}
                        </Button>
                      )}
                    </ListItemEvent.Controls>
                  </ListItemEvent>
                </div>
              );
            })}
          </List>
        ) : (
          <Hint>
            <Hint.InfoIcon />
            {locales.route.add.blankStateHint}
          </Hint>
        )}
      </BasicStructure.Container>
    </>
  );
}

export default ParentEvent;
