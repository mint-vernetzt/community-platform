import {
  ActionFunctionArgs,
  Form,
  redirect,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import {
  createAuthClient,
  getSessionUser,
  getSessionUserOrThrow,
} from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import {
  addChildEvent,
  getChildEventsToAdd,
  getEventBySlug,
  getEventBySlugForAction,
  removeChildEvent,
} from "./child-events.server";
import TitleSection from "~/components/next/TitleSection";
import Hint from "~/components/next/Hint";
import BasicStructure from "~/components/next/BasicStructure";
import List from "~/components/next/List";
import ListItemEvent from "~/components/next/ListItemEvent";
import {
  ADD_CHILD_EVENT_INTENT,
  EVENT_ID,
  createAddOrRemoveChildEventSchema,
  REMOVE_CHILD_EVENT_INTENT,
} from "./child-events.shared";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { RichText } from "~/components/legacy/Richtext/RichText";
import { hasContent } from "~/utils.shared";
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
      "next/event/$slug/settings/related-events/child-events"
    ];

  const event = await getEventBySlug({
    authClient,
    sessionUser,
    slug: params.slug,
  });

  invariantResponse(event !== null, "Event not found", { status: 404 });

  const childEventsToAdd = await getChildEventsToAdd({
    userId: sessionUser.id,
    authClient,
    event,
  });

  const enhancedChildEventsToAdd = childEventsToAdd.map((childEvent) => {
    return {
      ...childEvent,
      alreadyAdded: event.id === childEvent.parentEventId,
    };
  });

  return {
    language,
    locales,
    event,
    childEventsToAdd: enhancedChildEventsToAdd,
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
      "next/event/$slug/settings/related-events/child-events"
    ];

  const formData = await request.formData();
  const intent = formData.get(INTENT_FIELD_NAME);

  invariantResponse(
    intent === ADD_CHILD_EVENT_INTENT || intent === REMOVE_CHILD_EVENT_INTENT,
    "unknown intent",
    {
      status: 400,
    }
  );

  const event = await getEventBySlugForAction(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const submission = await parseWithZod(formData, {
    schema: createAddOrRemoveChildEventSchema(),
  });
  if (submission.status !== "success") {
    return submission.reply();
  }

  if (intent === ADD_CHILD_EVENT_INTENT) {
    try {
      await addChildEvent({
        userId: sessionUser.id,
        event,
        childEventId: submission.value[EVENT_ID],
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "add-child-event-error",
        key: `add-child-event-error-${Date.now()}`,
        message: locales.route.errors.addChildEvent,
        level: "negative",
      });
    }
    return redirectWithToast(request.url, {
      id: "add-child-event-success",
      key: `add-child-event-success-${Date.now()}`,
      message: locales.route.success.addChildEvent,
      level: "positive",
    });
  } else if (intent === REMOVE_CHILD_EVENT_INTENT) {
    try {
      await removeChildEvent({
        event,
        childEventId: submission.value[EVENT_ID],
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "remove-child-event-error",
        key: `remove-child-event-error-${Date.now()}`,
        message: locales.route.errors.removeChildEvent,
        level: "negative",
      });
    }
    return redirectWithToast(request.url, {
      id: "remove-child-event-success",
      key: `remove-child-event-success-${Date.now()}`,
      message: locales.route.success.removeChildEvent,
      level: "positive",
    });
  }
}

function ChildEvents() {
  const loaderData = useLoaderData<typeof loader>();
  const { language, locales, event, childEventsToAdd } = loaderData;

  return (
    <>
      {event.childEvents.length > 0 ? (
        <>
          <TitleSection>
            <TitleSection.Headline>
              {locales.route.current.headline}
            </TitleSection.Headline>
          </TitleSection>
          <List
            id="current-child-events-list"
            hideAfter={3}
            locales={locales.route.list}
          >
            {event.childEvents.map((event, index) => {
              return (
                <div key={event.id}>
                  <Form
                    id={`remove-child-form-${event.id}`}
                    method="POST"
                    hidden
                    preventScrollReset
                  >
                    <input name={EVENT_ID} defaultValue={event.id} />
                  </Form>
                  <ListItemEvent
                    index={index}
                    to={`/event/${event.slug}/detail/about`}
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
                        stages: locales.stages,
                        ...loaderData.locales.route.list,
                      }}
                      participantCount={event._count.participants}
                      language={language}
                    ></ListItemEvent.Info>
                    <ListItemEvent.Headline>
                      {event.name}
                    </ListItemEvent.Headline>
                    {hasContent(event.subline) ||
                    hasContent(event.description) ? (
                      <ListItemEvent.Subline>
                        {hasContent(event.subline) ? (
                          event.subline
                        ) : (
                          <RichText html={event.description as string} />
                        )}
                      </ListItemEvent.Subline>
                    ) : null}
                    <ListItemEvent.Controls>
                      {event.published === true ? (
                        <>{locales.route.list.alreadyPublished}</>
                      ) : (
                        <Button
                          type="submit"
                          form={`remove-child-form-${event.id}`}
                          name={INTENT_FIELD_NAME}
                          value={REMOVE_CHILD_EVENT_INTENT}
                          variant="outline"
                          size="small"
                          fullSize
                        >
                          {locales.route.current.cta}
                        </Button>
                      )}
                    </ListItemEvent.Controls>
                    <ListItemEvent.Flag
                      canceled={event.canceled}
                      locales={locales.route.list}
                    />
                  </ListItemEvent>
                </div>
              );
            })}
          </List>
        </>
      ) : null}
      {event.parentEventId !== null ? (
        <>
          <TitleSection>
            <TitleSection.Headline>
              {locales.route.addOrCreate.headline}
            </TitleSection.Headline>
          </TitleSection>
          <Hint>
            <Hint.InfoIcon />
            {locales.route.addOrCreate.hasParentEventHint}
          </Hint>
        </>
      ) : (
        <>
          <TitleSection>
            <TitleSection.Headline>
              {locales.route.addOrCreate.headline}
            </TitleSection.Headline>
            <TitleSection.Subline>
              {locales.route.addOrCreate.subline}
            </TitleSection.Subline>
          </TitleSection>
          <Hint>
            <Hint.InfoIcon />
            {locales.route.addOrCreate.timePeriodHint}
          </Hint>
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
              <span>{locales.route.addOrCreate.add.label}</span>
            </div>
            {childEventsToAdd.length > 0 ? (
              <List
                id="child-events-to-add-list"
                hideAfter={4}
                locales={locales.route.list}
              >
                {childEventsToAdd.map((event, index) => {
                  return (
                    <div key={event.id}>
                      <Form
                        id={`add-child-form-${event.id}`}
                        method="POST"
                        hidden
                        preventScrollReset
                      >
                        <input name={EVENT_ID} defaultValue={event.id} />
                      </Form>
                      <ListItemEvent
                        index={index}
                        to={`/event/${event.slug}/detail/about`}
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
                            stages: locales.stages,
                            ...loaderData.locales.route.list,
                          }}
                          participantCount={event._count.participants}
                          language={language}
                        ></ListItemEvent.Info>
                        <ListItemEvent.Headline>
                          {event.name}
                        </ListItemEvent.Headline>
                        {hasContent(event.subline) ||
                        hasContent(event.description) ? (
                          <ListItemEvent.Subline>
                            {hasContent(event.subline) ? (
                              event.subline
                            ) : (
                              <RichText html={event.description as string} />
                            )}
                          </ListItemEvent.Subline>
                        ) : null}
                        <ListItemEvent.Controls>
                          {event.published === true ? (
                            <>{locales.route.list.alreadyPublished}</>
                          ) : event.alreadyAdded === true ? (
                            <>{locales.route.list.alreadyAdded}</>
                          ) : event._count.childEvents > 0 ? (
                            <>{locales.route.list.hasChildEvents}</>
                          ) : event.parentEventId !== null ? (
                            <>{locales.route.list.hasDifferentParent}</>
                          ) : (
                            <Button
                              type="submit"
                              form={`add-child-form-${event.id}`}
                              name={INTENT_FIELD_NAME}
                              value={ADD_CHILD_EVENT_INTENT}
                              size="small"
                              fullSize
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M10 5C10.1658 5 10.3247 5.06585 10.4419 5.18306C10.5592 5.30027 10.625 5.45924 10.625 5.625V9.375H14.375C14.5408 9.375 14.6997 9.44085 14.8169 9.55806C14.9342 9.67527 15 9.83424 15 10C15 10.1658 14.9342 10.3247 14.8169 10.4419C14.6997 10.5592 14.5408 10.625 14.375 10.625H10.625V14.375C10.625 14.5408 10.5592 14.6997 10.4419 14.8169C10.3247 14.9342 10.1658 15 10 15C9.83424 15 9.67527 14.9342 9.55806 14.8169C9.44085 14.6997 9.375 14.5408 9.375 14.375V10.625H5.625C5.45924 10.625 5.30027 10.5592 5.18306 10.4419C5.06585 10.3247 5 10.1658 5 10C5 9.83424 5.06585 9.67527 5.18306 9.55806C5.30027 9.44085 5.45924 9.375 5.625 9.375H9.375V5.625C9.375 5.45924 9.44085 5.30027 9.55806 5.18306C9.67527 5.06585 9.83424 5 10 5Z"
                                  fill="#154194"
                                />
                              </svg>
                              <span>{locales.route.addOrCreate.add.cta}</span>
                            </Button>
                          )}
                        </ListItemEvent.Controls>
                        <ListItemEvent.Flag
                          canceled={event.canceled}
                          locales={locales.route.list}
                        />
                      </ListItemEvent>
                    </div>
                  );
                })}
              </List>
            ) : (
              <Hint>
                <Hint.InfoIcon />
                {locales.route.addOrCreate.blankStateHint}
              </Hint>
            )}
          </BasicStructure.Container>
        </>
      )}
    </>
  );
}

export default ChildEvents;
