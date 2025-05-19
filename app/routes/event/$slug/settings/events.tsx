import type { LoaderFunctionArgs } from "react-router";
import {
  Link,
  useFetcher,
  useLoaderData,
  useParams,
  useSearchParams,
  useSubmit,
  redirect,
} from "react-router";
import { utcToZonedTime } from "date-fns-tz";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import Autocomplete from "~/components/Autocomplete/Autocomplete";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { removeHtmlTags } from "~/lib/utils/transformHtml";
import { getDuration } from "~/lib/utils/time";
import { getPublicURL } from "~/storage.server";
import { deriveEventMode } from "../../utils.server";
import { getEventBySlug } from "./events.server";
import {
  type action as addChildAction,
  addChildSchema,
} from "./events/add-child";
import { type action as publishAction, publishSchema } from "./events/publish";
import {
  type action as removeChildAction,
  removeChildSchema,
} from "./events/remove-child";
import {
  type action as setParentAction,
  setParentSchema,
} from "./events/set-parent";
import {
  getChildEventSuggestions,
  getParentEventSuggestions,
} from "./utils.server";
import { detectLanguage } from "~/i18n.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import { languageModuleMap } from "~/locales/.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/settings/events"];
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const event = await getEventBySlug(slug);
  invariantResponse(event, locales.route.error.notFound, { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.route.error.notPrivileged, {
    status: 403,
  });

  const enhancedChildEvents = event.childEvents.map((childEvent) => {
    let background = childEvent.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL) {
        background = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Event.ListItemEventSettings.Background.width,
            height: ImageSizes.Event.ListItemEventSettings.Background.height,
          },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width:
              ImageSizes.Event.ListItemEventSettings.BlurredBackground.width,
            height:
              ImageSizes.Event.ListItemEventSettings.BlurredBackground.height,
          },
          blur: BlurFactor,
        });
      }
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return { ...childEvent, background, blurredBackground };
  });
  let enhancedParentEvent = null;
  if (event.parentEvent !== null) {
    let background = event.parentEvent.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL) {
        background = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Event.ListItem.BlurredBackground.width,
            height: ImageSizes.Event.ListItem.BlurredBackground.height,
          },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Event.ListItem.BlurredBackground.width,
            height: ImageSizes.Event.ListItem.BlurredBackground.height,
          },
          blur: BlurFactor,
        });
      }
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    enhancedParentEvent = {
      ...event.parentEvent,
      background,
      blurredBackground,
    };
  }

  const url = new URL(request.url);
  const parentSuggestionsQuery =
    url.searchParams.get("parent_autocomplete_query") || undefined;
  let parentEventSuggestions;
  if (parentSuggestionsQuery !== undefined && parentSuggestionsQuery !== "") {
    const query = parentSuggestionsQuery.split(" ");
    const alreadyParentId = event.parentEvent?.id || undefined;
    parentEventSuggestions = await getParentEventSuggestions(
      authClient,
      alreadyParentId,
      query,
      event.startTime,
      event.endTime,
      sessionUser.id
    );
  }
  const childSuggestionsQuery =
    url.searchParams.get("child_autocomplete_query") || undefined;
  let childEventSuggestions;
  if (childSuggestionsQuery !== undefined && childSuggestionsQuery !== "") {
    const query = childSuggestionsQuery.split(" ");
    const alreadyChildIds = event.childEvents.map((childEvent) => {
      return childEvent.id;
    });
    childEventSuggestions = await getChildEventSuggestions(
      authClient,
      alreadyChildIds,
      query,
      event.startTime,
      event.endTime,
      sessionUser.id
    );
  }

  return {
    parentEvent: enhancedParentEvent,
    parentEventSuggestions,
    childEvents: enhancedChildEvents,
    childEventSuggestions,
    published: event.published,
    locales,
    language,
  };
};

function Events() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language } = loaderData;
  const setParentFetcher = useFetcher<typeof setParentAction>();
  const addChildFetcher = useFetcher<typeof addChildAction>();
  const removeChildFetcher = useFetcher<typeof removeChildAction>();
  const publishFetcher = useFetcher<typeof publishAction>();
  let parentEventStartTime: ReturnType<typeof utcToZonedTime> | undefined;
  let parentEventEndTime: ReturnType<typeof utcToZonedTime> | undefined;
  if (loaderData.parentEvent !== null) {
    parentEventStartTime = utcToZonedTime(
      loaderData.parentEvent.startTime,
      "Europe/Berlin"
    );
    parentEventEndTime = utcToZonedTime(
      loaderData.parentEvent.endTime,
      "Europe/Berlin"
    );
  }
  const [searchParams] = useSearchParams();
  const parentEventSuggestionsQuery = searchParams.get(
    "parent_autocomplete_query"
  );
  const childEventSuggestionsQuery = searchParams.get(
    "child_autocomplete_query"
  );
  const submit = useSubmit();

  return (
    <>
      <h1 className="mv-mb-8">{locales.route.content.headline}</h1>
      <h4 className="mv-mb-4 mv-font-semibold">
        {locales.route.content.assign.headline}
      </h4>

      <p className="mv-mb-4">{locales.route.content.assign.intro}</p>
      <RemixFormsForm
        schema={setParentSchema}
        fetcher={setParentFetcher}
        action={`/event/${slug}/settings/events/set-parent`}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/event/${slug}/settings/events`,
          });
        }}
      >
        {(remixFormsProps) => {
          const { Button, Field, Errors, register } = remixFormsProps;

          return (
            <div className="mv-flex mv-flex-col mv-gap-2 mv-w-full">
              <Errors />
              <div className="mv-flex mv-flex-row mv-items-center mv-mb-2">
                <div className="mv-flex-auto">
                  <label
                    id="label-for-name"
                    htmlFor="Name"
                    className="mv-font-semibold"
                  >
                    {locales.route.content.assign.name}
                  </label>
                </div>
              </div>

              <div className="mv-flex mv-flex-row">
                <Field name="parentEventId" className="mv-flex-auto">
                  {({ Errors }) => (
                    <>
                      <Errors />
                      <Autocomplete
                        suggestions={loaderData.parentEventSuggestions || []}
                        suggestionsLoaderPath={`/event/${slug}/settings/events`}
                        defaultValue={parentEventSuggestionsQuery || ""}
                        {...register("parentEventId")}
                        searchParameter="parent_autocomplete_query"
                        locales={locales}
                        currentLanguage={language}
                      />
                    </>
                  )}
                </Field>
                <div className="mv-ml-2">
                  <Button className="mv-bg-transparent mv-w-10 mv-h-8 mv-flex mv-items-center mv-justify-center mv-rounded-md mv-border-2 mv-border-neutral-300 mv-text-neutral-600 mv-mt-0.5 hover:mv-bg-neutral-100">
                    +
                  </Button>
                </div>
              </div>
            </div>
          );
        }}
      </RemixFormsForm>
      {setParentFetcher.data !== undefined &&
      "message" in setParentFetcher.data ? (
        <div className={`mv-p-4 mv-bg-green-200 mv-rounded-md mv-mt-4`}>
          {setParentFetcher.data.message}
        </div>
      ) : null}
      <h4 className="mv-mb-4 mv-mt-4 mv-font-semibold">
        {locales.route.content.parent.headline}
      </h4>
      <p className="mv-mb-8">
        {locales.route.content.parent.intro}
        <br></br>
        {loaderData.parentEvent === null
          ? locales.route.content.parent.empty
          : ""}
      </p>
      {loaderData.parentEvent !== null ? (
        <div>
          <RemixFormsForm
            schema={setParentSchema}
            fetcher={setParentFetcher}
            action={`/event/${slug}/settings/events/set-parent`}
          >
            {(remixFormsProps) => {
              if (
                loaderData.parentEvent !== null &&
                parentEventStartTime !== undefined &&
                parentEventEndTime !== undefined
              ) {
                const { Button } = remixFormsProps;
                let stageTitle;
                if (loaderData.parentEvent.stage === null) {
                  stageTitle = null;
                } else if (
                  loaderData.parentEvent.stage.slug in locales.stages
                ) {
                  type LocaleKey = keyof typeof locales.stages;
                  stageTitle =
                    locales.stages[
                      loaderData.parentEvent.stage.slug as LocaleKey
                    ].title;
                } else {
                  console.error(
                    `No locale found for event stage ${loaderData.parentEvent.stage.slug}`
                  );
                  stageTitle = loaderData.parentEvent.stage.slug;
                }
                return (
                  <div className="mv-rounded-lg mv-bg-white mv-shadow-xl mv-border-t mv-border-r mv-border-neutral-300 mv-mb-2 mv-flex mv-items-stretch mv-overflow-hidden">
                    <Link
                      className="mv-flex"
                      to={`/event/${loaderData.parentEvent.slug}`}
                    >
                      <div className="mv-hidden @xl:mv-block mv-w-40 mv-shrink-0">
                        <Image
                          alt={loaderData.parentEvent.name}
                          src={loaderData.parentEvent.background}
                          blurredSrc={loaderData.parentEvent.blurredBackground}
                        />
                      </div>
                      <div className="mv-px-4 mv-py-6">
                        <p className="mv-text-xs mv-mb-1">
                          {/* TODO: Display icons (see figma) */}
                          {stageTitle !== null ? stageTitle + " | " : ""}
                          {getDuration(
                            parentEventStartTime,
                            parentEventEndTime,
                            language
                          )}
                          {loaderData.parentEvent._count.childEvents === 0 ? (
                            <>
                              {loaderData.parentEvent.participantLimit === null
                                ? locales.route.content.parent.seats.unlimited
                                : insertParametersIntoLocale(
                                    locales.route.content.parent.seats.exact,
                                    {
                                      number:
                                        loaderData.parentEvent
                                          .participantLimit -
                                        loaderData.parentEvent._count
                                          .participants,
                                      total:
                                        loaderData.parentEvent.participantLimit,
                                    }
                                  )}
                            </>
                          ) : (
                            ""
                          )}
                          {loaderData.parentEvent.participantLimit !== null &&
                          loaderData.parentEvent._count.participants >=
                            loaderData.parentEvent.participantLimit ? (
                            <>
                              {" "}
                              |{" "}
                              <span>
                                {insertParametersIntoLocale(
                                  locales.route.content.parent.seats.waiting,
                                  {
                                    number:
                                      loaderData.parentEvent._count.waitingList,
                                  }
                                )}
                              </span>
                            </>
                          ) : (
                            ""
                          )}
                        </p>
                        <h4 className="mv-font-bold mv-text-base mv-m-0 @md:mv-line-clamp-1">
                          {loaderData.parentEvent.name}
                        </h4>
                        {loaderData.parentEvent.subline !== null ? (
                          <p className="mv-hidden mv-text-xs mv-mt-1 @md:mv-line-clamp-2">
                            {loaderData.parentEvent.subline}
                          </p>
                        ) : (
                          <p className="mv-hidden mv-text-xs mv-mt-1 @md:mv-line-clamp-2">
                            {removeHtmlTags(
                              loaderData.parentEvent.description ?? ""
                            )}
                          </p>
                        )}
                      </div>
                    </Link>
                    <input name="parentEventId" hidden />
                    <Button
                      className="mv-ml-auto mv-bg-transparent mv-w-10 mv-h-8 mv-flex mv-items-center mv-justify-center mv-rounded-md mv-border mv-border-transparent mv-text-neutral-600"
                      title="entfernen"
                    >
                      <svg
                        viewBox="0 0 10 10"
                        width="10px"
                        height="10px"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M.808.808a.625.625 0 0 1 .885 0L5 4.116 8.308.808a.626.626 0 0 1 .885.885L5.883 5l3.31 3.308a.626.626 0 1 1-.885.885L5 5.883l-3.307 3.31a.626.626 0 1 1-.885-.885L4.116 5 .808 1.693a.625.625 0 0 1 0-.885Z"
                          fill="currentColor"
                        />
                      </svg>
                    </Button>
                  </div>
                );
              } else {
                return null;
              }
            }}
          </RemixFormsForm>
        </div>
      ) : null}
      <hr className="mv-border-neutral-400 mv-my-4 @lg:mv-my-8" />
      <h4 className="mv-mb-4 mv-font-semibold">
        {locales.route.content.related.headline}
      </h4>

      <p className="mv-mb-4">{locales.route.content.related.intro}</p>
      <RemixFormsForm
        schema={addChildSchema}
        fetcher={addChildFetcher}
        action={`/event/${slug}/settings/events/add-child`}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/event/${slug}/settings/events`,
          });
        }}
      >
        {(remixFormsProps) => {
          const { Button, Field, Errors, register } = remixFormsProps;

          return (
            <div className="mv-flex mv-flex-col mv-gap-2 mv-w-full">
              <Errors />
              <div className="mv-flex mv-flex-row mv-items-center mv-mb-2">
                <div className="mv-flex-auto">
                  <label
                    id="label-for-name"
                    htmlFor="Name"
                    className="mv-font-semibold"
                  >
                    {locales.route.content.related.name}
                  </label>
                </div>
              </div>

              <div className="mv-flex mv-flex-row">
                <Field name="childEventId" className="mv-flex-auto">
                  {({ Errors }) => (
                    <>
                      <Autocomplete
                        suggestions={loaderData.childEventSuggestions || []}
                        suggestionsLoaderPath={`/event/${slug}/settings/events`}
                        defaultValue={childEventSuggestionsQuery || ""}
                        {...register("childEventId")}
                        searchParameter="child_autocomplete_query"
                        locales={locales}
                        currentLanguage={language}
                      />
                      <Errors />
                    </>
                  )}
                </Field>
                <div className="mv-ml-2">
                  <Button className="mv-bg-transparent mv-w-10 mv-h-8 mv-flex mv-items-center mv-justify-center mv-rounded-md mv-border-2 mv-border-neutral-300 mv-text-neutral-600 mv-mt-0.5 hover:mv-bg-neutral-100">
                    +
                  </Button>
                </div>
              </div>
            </div>
          );
        }}
      </RemixFormsForm>
      {addChildFetcher.data !== undefined &&
      "message" in addChildFetcher.data ? (
        <div className={`mv-p-4 mv-bg-green-200 mv-rounded-md mv-mt-4`}>
          {addChildFetcher.data.message}
        </div>
      ) : null}
      <h4 className="mv-mb-4 mv-mt-4 mv-font-semibold">
        {locales.route.content.current.headline}
      </h4>
      <p className="mv-mb-8">
        {locales.route.content.current.intro}
        <br></br>
        {loaderData.childEvents.length === 0
          ? locales.route.content.current.empty
          : ""}
      </p>
      {loaderData.childEvents.length > 0 ? (
        <div className="mv-mt-6">
          <ul>
            {loaderData.childEvents.map((childEvent) => {
              const eventStartTime = utcToZonedTime(
                childEvent.startTime,
                "Europe/Berlin"
              );
              const eventEndTime = utcToZonedTime(
                childEvent.endTime,
                "Europe/Berlin"
              );
              let stageTitle;
              if (childEvent.stage === null) {
                stageTitle = null;
              } else if (childEvent.stage.slug in locales.stages) {
                type LocaleKey = keyof typeof locales.stages;
                stageTitle =
                  locales.stages[childEvent.stage.slug as LocaleKey].title;
              } else {
                console.error(
                  `No locale found for event stage ${childEvent.stage.slug}`
                );
                stageTitle = childEvent.stage.slug;
              }
              return (
                <RemixFormsForm
                  key={`remove-child-${childEvent.id}`}
                  schema={removeChildSchema}
                  fetcher={removeChildFetcher}
                  action={`/event/${slug}/settings/events/remove-child`}
                >
                  {(remixFormsProps) => {
                    const { Button } = remixFormsProps;
                    return (
                      <div className="mv-rounded-lg mv-bg-white mv-shadow-xl mv-border-t mv-border-r mv-border-neutral-300 mv-mb-2 mv-flex mv-items-stretch mv-overflow-hidden">
                        <Link
                          className="mv-flex"
                          to={`/event/${childEvent.slug}`}
                        >
                          <div className="mv-hidden @xl:mv-block mv-w-40 mv-shrink-0">
                            <Image
                              alt={childEvent.name}
                              src={childEvent.background}
                              blurredSrc={childEvent.blurredBackground}
                            />
                          </div>
                          <div className="mv-px-4 mv-py-6">
                            <p className="mv-text-xs mv-mb-1">
                              {/* TODO: Display icons (see figma) */}
                              {stageTitle !== null ? stageTitle + " | " : ""}
                              {getDuration(
                                eventStartTime,
                                eventEndTime,
                                language
                              )}
                              {childEvent._count.childEvents === 0 ? (
                                <>
                                  {childEvent.participantLimit === null
                                    ? locales.route.content.current.seats
                                        .unlimited
                                    : insertParametersIntoLocale(
                                        locales.route.content.current.seats
                                          .exact,
                                        {
                                          number:
                                            childEvent.participantLimit -
                                            childEvent._count.participants,
                                          total: childEvent.participantLimit,
                                        }
                                      )}
                                </>
                              ) : (
                                ""
                              )}
                              {childEvent.participantLimit !== null &&
                              childEvent._count.participants >=
                                childEvent.participantLimit ? (
                                <>
                                  {" "}
                                  |{" "}
                                  <span>
                                    {insertParametersIntoLocale(
                                      locales.route.content.current.seats
                                        .waiting,
                                      {
                                        number: childEvent._count.waitingList,
                                      }
                                    )}
                                  </span>
                                </>
                              ) : (
                                ""
                              )}
                            </p>
                            <h4 className="mv-font-bold mv-text-base mv-m-0 @md:mv-line-clamp-1">
                              {childEvent.name}
                            </h4>
                            {childEvent.subline !== null ? (
                              <p className="mv-hidden mv-text-xs mv-mt-1 @md:mv-line-clamp-2">
                                {childEvent.subline}
                              </p>
                            ) : (
                              <p className="mv-hidden mv-text-xs mv-mt-1 @md:mv-line-clamp-2">
                                {removeHtmlTags(childEvent.description ?? "")}
                              </p>
                            )}
                          </div>
                        </Link>
                        <input
                          name="childEventId"
                          defaultValue={childEvent.id}
                          hidden
                        />
                        <Button
                          className="mv-ml-auto mv-bg-transparent mv-w-10 mv-h-8 mv-flex mv-items-center mv-justify-center mv-rounded-md mv-border mv-border-transparent mv-text-neutral-600"
                          title={locales.route.form.remove.label}
                        >
                          <svg
                            viewBox="0 0 10 10"
                            width="10px"
                            height="10px"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M.808.808a.625.625 0 0 1 .885 0L5 4.116 8.308.808a.626.626 0 0 1 .885.885L5.883 5l3.31 3.308a.626.626 0 1 1-.885.885L5 5.883l-3.307 3.31a.626.626 0 1 1-.885-.885L4.116 5 .808 1.693a.625.625 0 0 1 0-.885Z"
                              fill="currentColor"
                            />
                          </svg>
                        </Button>
                      </div>
                    );
                  }}
                </RemixFormsForm>
              );
            })}
          </ul>
        </div>
      ) : null}
      <footer className="mv-fixed mv-bg-white mv-border-t-2 mv-border-primary mv-w-full mv-inset-x-0 mv-bottom-0">
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
          <div className="mv-flex mv-flex-row mv-flex-nowrap mv-items-center mv-justify-end mv-my-4">
            <RemixFormsForm
              schema={publishSchema}
              fetcher={publishFetcher}
              action={`/event/${slug}/settings/events/publish`}
            >
              {(remixFormsProps) => {
                const { Button, Field } = remixFormsProps;
                return (
                  <>
                    <div className="mv-hidden">
                      <Field name="publish" value={!loaderData.published} />
                    </div>
                    <Button className="mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white">
                      {loaderData.published
                        ? locales.route.form.hide.label
                        : locales.route.form.publish.label}
                    </Button>
                  </>
                );
              }}
            </RemixFormsForm>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Events;
