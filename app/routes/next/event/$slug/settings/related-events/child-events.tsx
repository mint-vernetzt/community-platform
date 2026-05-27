import {
  type ActionFunctionArgs,
  Form,
  redirect,
  useLoaderData,
  type LoaderFunctionArgs,
  useSearchParams,
  useLocation,
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
  CONFIRM_REMOVE_MODAL_SEARCH_PARAM,
} from "./child-events.shared";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { RichText } from "~/components/legacy/Richtext/RichText";
import { hasContent } from "~/utils.shared";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { parseWithZod } from "@conform-to/zod";
import { captureException } from "@sentry/node";
import { redirectWithToast } from "~/toast.server";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { Modal } from "~/components-next/Modal";

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
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    searchParams.delete(
      `${CONFIRM_REMOVE_MODAL_SEARCH_PARAM}-${submission.value[EVENT_ID]}`
    );
    return redirectWithToast(`${url.pathname}?${searchParams.toString()}`, {
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

  const [searchParams] = useSearchParams();
  const location = useLocation();

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
                <ListItemEvent
                  index={index}
                  to={`/event/${event.slug}/detail/about`}
                  key={`child-event-${event.id}`}
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
                  <ListItemEvent.Headline>{event.name}</ListItemEvent.Headline>
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
                    <Form
                      id={`remove-child-form-${event.id}`}
                      method="POST"
                      hidden
                      preventScrollReset
                    >
                      <input name={EVENT_ID} defaultValue={event.id} />
                    </Form>
                    {event.published === false ? (
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
                    ) : (
                      <>
                        <Button
                          as="link"
                          to={`?${extendSearchParams(searchParams, { addOrReplace: { [`${CONFIRM_REMOVE_MODAL_SEARCH_PARAM}-${event.id}`]: "true" } }).toString()}`}
                          preventScrollReset
                          size="small"
                          variant="outline"
                          fullSize
                        >
                          {locales.route.current.cta}
                        </Button>
                        <Modal
                          searchParam={`${CONFIRM_REMOVE_MODAL_SEARCH_PARAM}-${event.id}`}
                        >
                          <Modal.Title>
                            {locales.route.current.removeConfirmation.title}
                          </Modal.Title>
                          <Modal.Section>
                            {
                              locales.route.current.removeConfirmation
                                .description
                            }
                          </Modal.Section>
                          <Modal.SubmitButton
                            form={`remove-child-form-${event.id}`}
                            name={INTENT_FIELD_NAME}
                            value={REMOVE_CHILD_EVENT_INTENT}
                          >
                            {locales.route.current.removeConfirmation.confirm}
                          </Modal.SubmitButton>
                          <Modal.CloseButton route={location.pathname}>
                            {locales.route.current.removeConfirmation.abort}
                          </Modal.CloseButton>
                        </Modal>
                      </>
                    )}
                  </ListItemEvent.Controls>
                  <ListItemEvent.Flag
                    canceled={event.canceled}
                    locales={locales.route.list}
                  />
                </ListItemEvent>
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
      ) : event.sentParentEventJoinRequests.length > 0 ? (
        <>
          <TitleSection>
            <TitleSection.Headline>
              {locales.route.addOrCreate.headline}
            </TitleSection.Headline>
          </TitleSection>
          <Hint>
            <Hint.InfoIcon />
            {locales.route.addOrCreate.hasPendingRequestHint}
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
                    <ListItemEvent
                      index={index}
                      to={`/event/${event.slug}/detail/about`}
                      key={`child-to-add-${event.id}`}
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
                        <Form
                          id={`add-child-form-${event.id}`}
                          method="POST"
                          hidden
                          preventScrollReset
                        >
                          <input name={EVENT_ID} defaultValue={event.id} />
                        </Form>
                        {event.published === true ? (
                          <div className="flex items-center justify-end font-semibold leading-5 text-sm w-full h-8 text-nowrap">
                            <span>{locales.route.list.alreadyPublished}</span>
                          </div>
                        ) : event.alreadyAdded === true ? (
                          <div className="flex items-center justify-end font-semibold leading-5 text-sm w-full h-8 text-nowrap">
                            <span>{locales.route.list.alreadyAdded}</span>
                          </div>
                        ) : event._count.childEvents > 0 ? (
                          <div className="flex items-center justify-end font-semibold leading-5 text-sm w-full h-8 text-nowrap">
                            <span>{locales.route.list.hasChildEvents}</span>
                          </div>
                        ) : event.parentEventId !== null ? (
                          <div className="flex items-center justify-end font-semibold leading-5 text-sm w-full h-8 text-nowrap">
                            <span>{locales.route.list.hasDifferentParent}</span>
                          </div>
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
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8 4C8.13261 4 8.25979 4.05268 8.35355 4.14645C8.44732 4.24021 8.5 4.36739 8.5 4.5V7.5H11.5C11.6326 7.5 11.7598 7.55268 11.8536 7.64645C11.9473 7.74021 12 7.86739 12 8C12 8.13261 11.9473 8.25979 11.8536 8.35355C11.7598 8.44732 11.6326 8.5 11.5 8.5H8.5V11.5C8.5 11.6326 8.44732 11.7598 8.35355 11.8536C8.25979 11.9473 8.13261 12 8 12C7.86739 12 7.74021 11.9473 7.64645 11.8536C7.55268 11.7598 7.5 11.6326 7.5 11.5V8.5H4.5C4.36739 8.5 4.24021 8.44732 4.14645 8.35355C4.05268 8.25979 4 8.13261 4 8C4 7.86739 4.05268 7.74021 4.14645 7.64645C4.24021 7.55268 4.36739 7.5 4.5 7.5H7.5V4.5C7.5 4.36739 7.55268 4.24021 7.64645 4.14645C7.74021 4.05268 7.86739 4 8 4V4Z"
                                fill="white"
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
