import { parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { captureException } from "@sentry/node";
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  redirect,
  useLoaderData,
  useLocation,
  useSearchParams,
} from "react-router";
import {
  createAuthClient,
  getSessionUser,
  getSessionUserOrThrow,
} from "~/auth.server";
import { Modal } from "~/components-next/Modal";
import { RichText } from "~/components/legacy/Richtext/RichText";
import BasicStructure from "~/components/next/BasicStructure";
import Hint from "~/components/next/Hint";
import List from "~/components/next/List";
import ListItemEvent from "~/components/next/ListItemEvent";
import TitleSection from "~/components/next/TitleSection";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { invariantResponse } from "~/lib/utils/response";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import { hasContent } from "~/utils.shared";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import {
  addParentEvent,
  cancelParentEventJoinRequest,
  getEventBySlug,
  getParentEventsToAdd,
  removeParentEvent,
  requestToJoinParentEvent,
} from "./parent-event.server";
import {
  ADD_PARENT_EVENT_INTENT,
  CANCEL_PARENT_EVENT_JOIN_REQUEST_INTENT,
  CONFIRM_ADD_MODAL_SEARCH_PARAM,
  CONFIRM_REMOVE_MODAL_SEARCH_PARAM,
  createAddParentEventSchema,
  createCancelParentEventJoinRequestSchema,
  createRequestParentEventSchema,
  PARENT_EVENT_ID,
  REMOVE_PARENT_EVENT_INTENT,
  REQUEST_TO_JOIN_PARENT_EVENT_INTENT,
} from "./parent-event.shared";

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
    sessionUser,
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
    intent === ADD_PARENT_EVENT_INTENT ||
      intent === REMOVE_PARENT_EVENT_INTENT ||
      intent === REQUEST_TO_JOIN_PARENT_EVENT_INTENT ||
      intent === CANCEL_PARENT_EVENT_JOIN_REQUEST_INTENT,
    "unknown intent",
    {
      status: 400,
    }
  );

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
        slug,
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
  } else if (intent === REQUEST_TO_JOIN_PARENT_EVENT_INTENT) {
    const submission = await parseWithZod(formData, {
      schema: createRequestParentEventSchema(),
    });
    if (submission.status !== "success") {
      return submission.reply();
    }
    try {
      await requestToJoinParentEvent({
        slug,
        parentEventId: submission.value[PARENT_EVENT_ID],
        locales: {
          mail: {
            buttonText: locales.route.mail.request.buttonText,
            subject: locales.route.mail.request.subject,
          },
        },
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "request-parent-event-error",
        key: `request-parent-event-error-${Date.now()}`,
        message: locales.route.errors.requestToJoinParentEvent,
        level: "negative",
      });
    }
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    searchParams.delete(
      `${CONFIRM_ADD_MODAL_SEARCH_PARAM}-${submission.value[PARENT_EVENT_ID]}`
    );
    return redirectWithToast(`${url.pathname}?${searchParams.toString()}`, {
      id: "request-parent-event-success",
      key: `request-parent-event-success-${Date.now()}`,
      message: locales.route.success.requestToJoinParentEvent,
      level: "positive",
    });
  } else if (intent === CANCEL_PARENT_EVENT_JOIN_REQUEST_INTENT) {
    const submission = await parseWithZod(formData, {
      schema: createCancelParentEventJoinRequestSchema(),
    });
    if (submission.status !== "success") {
      return submission.reply();
    }
    try {
      await cancelParentEventJoinRequest({
        slug,
        parentEventId: submission.value[PARENT_EVENT_ID],
        locales: {
          mail: {
            buttonText: locales.route.mail.cancel.buttonText,
            subject: locales.route.mail.cancel.subject,
          },
        },
      });
    } catch (error) {
      captureException(error);
      return redirectWithToast(request.url, {
        id: "cancel-parent-event-join-request-error",
        key: `cancel-parent-event-join-request-error-${Date.now()}`,
        message: locales.route.errors.cancelParentEventJoinRequest,
        level: "negative",
      });
    }
    return redirectWithToast(request.url, {
      id: "cancel-parent-event-join-request-success",
      key: `cancel-parent-event-join-request-success-${Date.now()}`,
      message: locales.route.success.cancelParentEventJoinRequest,
      level: "positive",
    });
  } else if (intent === REMOVE_PARENT_EVENT_INTENT) {
    try {
      await removeParentEvent({
        userId: sessionUser.id,
        slug,
        locales: {
          mail: {
            subject: locales.route.mail.remove.subject,
          },
        },
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
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    searchParams.delete(CONFIRM_REMOVE_MODAL_SEARCH_PARAM);
    return redirectWithToast(`${url.pathname}?${searchParams.toString()}`, {
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

  const [searchParams] = useSearchParams();
  const location = useLocation();

  return event._count.childEvents > 0 ? (
    <>
      <TitleSection>
        <TitleSection.Headline>
          {locales.route.addOrRequest.headline}
        </TitleSection.Headline>
      </TitleSection>
      <Hint>
        <Hint.InfoIcon />
        {locales.route.addOrRequest.hasChildEventsHint}
      </Hint>
    </>
  ) : event.sentParentEventJoinRequests.length > 0 ? (
    <>
      <TitleSection>
        <TitleSection.Headline>
          {locales.route.pending.headline}
        </TitleSection.Headline>
        <TitleSection.Subline>
          {locales.route.pending.subline}
        </TitleSection.Subline>
      </TitleSection>
      <List
        id="pending-parent-requests-list"
        hideAfter={4}
        locales={locales.route.list}
      >
        {event.sentParentEventJoinRequests.map((request, index) => {
          return (
            <ListItemEvent
              index={index}
              to={`/event/${request.parentEvent.slug}/detail/about`}
              key={`pending-parent-request-${request.parentEvent.id}`}
            >
              <ListItemEvent.Image
                alt={request.parentEvent.name}
                src={request.parentEvent.background}
                blurredSrc={request.parentEvent.blurredBackground}
              />
              <ListItemEvent.Info
                {...request.parentEvent}
                stage={request.parentEvent.stage}
                locales={{
                  stages: locales.stages,
                  ...loaderData.locales.route.list,
                }}
                participantCount={request.parentEvent._count.participants}
                language={language}
              ></ListItemEvent.Info>
              <ListItemEvent.Headline>
                {request.parentEvent.name}
              </ListItemEvent.Headline>
              {hasContent(request.parentEvent.subline) ||
              hasContent(request.parentEvent.description) ? (
                <ListItemEvent.Subline>
                  {hasContent(request.parentEvent.subline) ? (
                    request.parentEvent.subline
                  ) : (
                    <RichText
                      html={request.parentEvent.description as string}
                    />
                  )}
                </ListItemEvent.Subline>
              ) : null}
              <ListItemEvent.Controls>
                <Form
                  id={`cancel-parent-request-form-${request.parentEvent.id}`}
                  method="POST"
                  hidden
                  preventScrollReset
                >
                  <input
                    name={PARENT_EVENT_ID}
                    defaultValue={request.parentEvent.id}
                  />
                </Form>
                <Button
                  type="submit"
                  form={`cancel-parent-request-form-${request.parentEvent.id}`}
                  name={INTENT_FIELD_NAME}
                  value={CANCEL_PARENT_EVENT_JOIN_REQUEST_INTENT}
                  size="small"
                  variant="outline"
                  fullSize
                >
                  {locales.route.pending.cta}
                </Button>
              </ListItemEvent.Controls>
            </ListItemEvent>
          );
        })}
      </List>
      <Hint>
        <Hint.InfoIcon />
        {locales.route.pending.pendingRequestHint}
      </Hint>
      <Hint>
        <Hint.InfoIcon />
        {locales.route.pending.notificationHint}
      </Hint>
    </>
  ) : event.parentEvent !== null ? (
    <>
      <TitleSection>
        <TitleSection.Headline>
          {locales.route.current.headline}
        </TitleSection.Headline>
      </TitleSection>
      <Form id="remove-parent-form" method="POST" hidden preventScrollReset />
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
          <ListItemEvent.Controls>
            {event.published === false ? (
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
            ) : (
              <>
                <Button
                  as="link"
                  to={`?${extendSearchParams(searchParams, { addOrReplace: { [CONFIRM_REMOVE_MODAL_SEARCH_PARAM]: "true" } }).toString()}`}
                  preventScrollReset
                  size="small"
                  variant="outline"
                  fullSize
                >
                  {locales.route.current.cta}
                </Button>
                <Modal searchParam={CONFIRM_REMOVE_MODAL_SEARCH_PARAM}>
                  <Modal.Title>
                    {locales.route.current.removeConfirmation.title}
                  </Modal.Title>
                  <Modal.Section>
                    {locales.route.current.removeConfirmation.description}
                  </Modal.Section>
                  <Modal.SubmitButton
                    form="remove-parent-form"
                    name={INTENT_FIELD_NAME}
                    value={REMOVE_PARENT_EVENT_INTENT}
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
          {event.parentEvent !== null && event.parentEvent.isAdmin
            ? locales.route.current.hint.publishedSameAdmin
            : locales.route.current.hint.publishedDifferentAdmin}
        </Hint>
      )}
    </>
  ) : event.published ? (
    <Hint>
      <Hint.InfoIcon />
      {locales.route.addOrRequest.publishedHint}
    </Hint>
  ) : (
    <>
      {/* parentEvent === null */}
      <TitleSection>
        <TitleSection.Headline>
          {locales.route.addOrRequest.headline}
        </TitleSection.Headline>
        <TitleSection.Subline>
          {locales.route.addOrRequest.subline}
        </TitleSection.Subline>
      </TitleSection>
      {parentEventsToAdd.length > 0 ? (
        <Hint>
          <Hint.InfoIcon />
          {locales.route.addOrRequest.timePeriodHint}
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
          <span>{locales.route.addOrRequest.label}</span>
        </div>
        {parentEventsToAdd.length > 0 ? (
          <List
            id="parent-events-to-add-list"
            hideAfter={4}
            locales={locales.route.list}
          >
            {parentEventsToAdd.map((parentEvent, index) => {
              return (
                <ListItemEvent
                  index={index}
                  to={`/event/${parentEvent.slug}/detail/about`}
                  key={`parent-to-request-or-add-${parentEvent.id}`}
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
                    <Form
                      id={`add-or-request-parent-form-${parentEvent.id}`}
                      method="POST"
                      hidden
                      preventScrollReset
                    >
                      <input
                        name={PARENT_EVENT_ID}
                        defaultValue={parentEvent.id}
                      />
                    </Form>
                    {parentEvent.parentEventId !== null ||
                    parentEvent.sentParentEventJoinRequests.some(
                      (request) => request.status === "pending"
                    ) ? (
                      <div className="flex items-center justify-end font-semibold leading-5 text-sm w-full h-8 text-nowrap">
                        <span>{locales.route.list.hasParentEvent}</span>
                      </div>
                    ) : parentEvent.isAdmin ? (
                      <Button
                        type="submit"
                        form={`add-or-request-parent-form-${parentEvent.id}`}
                        name={INTENT_FIELD_NAME}
                        value={ADD_PARENT_EVENT_INTENT}
                        size="small"
                        fullSize
                      >
                        {locales.route.addOrRequest.cta.add}
                      </Button>
                    ) : (
                      <>
                        <Button
                          as="link"
                          to={`?${extendSearchParams(searchParams, { addOrReplace: { [`${CONFIRM_ADD_MODAL_SEARCH_PARAM}-${parentEvent.id}`]: "true" } }).toString()}`}
                          preventScrollReset
                          size="small"
                          variant="outline"
                          fullSize
                        >
                          {locales.route.addOrRequest.cta.request}
                        </Button>

                        <Modal
                          searchParam={`${CONFIRM_ADD_MODAL_SEARCH_PARAM}-${parentEvent.id}`}
                        >
                          <Modal.Title>
                            {
                              locales.route.addOrRequest.requestConfirmation
                                .title
                            }
                          </Modal.Title>
                          <Modal.Section>
                            {
                              locales.route.addOrRequest.requestConfirmation
                                .description
                            }
                          </Modal.Section>
                          <Modal.SubmitButton
                            form={`add-or-request-parent-form-${parentEvent.id}`}
                            name={INTENT_FIELD_NAME}
                            value={REQUEST_TO_JOIN_PARENT_EVENT_INTENT}
                          >
                            {
                              locales.route.addOrRequest.requestConfirmation
                                .confirm
                            }
                          </Modal.SubmitButton>
                          <Modal.CloseButton route={location.pathname}>
                            {
                              locales.route.addOrRequest.requestConfirmation
                                .abort
                            }
                          </Modal.CloseButton>
                        </Modal>
                      </>
                    )}
                  </ListItemEvent.Controls>
                </ListItemEvent>
              );
            })}
          </List>
        ) : (
          <Hint>
            <Hint.InfoIcon />
            {locales.route.addOrRequest.blankStateHint}
          </Hint>
        )}
      </BasicStructure.Container>
    </>
  );
}

export default ParentEvent;
