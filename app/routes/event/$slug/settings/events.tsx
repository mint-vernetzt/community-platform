import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import { utcToZonedTime } from "date-fns-tz";
import type { LoaderFunctionArgs } from "react-router";
import {
  Link,
  redirect,
  useFetcher,
  useLoaderData,
  useParams,
  useSearchParams,
  useSubmit,
} from "react-router";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import Autocomplete from "~/components/Autocomplete/Autocomplete";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { detectLanguage } from "~/i18n.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getDuration } from "~/lib/utils/time";
import { removeHtmlTags } from "~/lib/utils/transformHtml";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { getPublicURL } from "~/storage.server";
import { deriveEventMode } from "../../utils.server";
import { getEventBySlug } from "./events.server";
import {
  type action as addChildAction,
  addChildSchema,
} from "./events/add-child";
import { publishSchema } from "./events/publish";
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
            width: ImageSizes.Event.ListItem.Background.width,
            height: ImageSizes.Event.ListItem.Background.height,
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
      <h1 className="mb-8">{locales.route.content.headline}</h1>
      <h4 className="mb-4 font-semibold">
        {locales.route.content.assign.headline}
      </h4>

      <p className="mb-4">{locales.route.content.assign.intro}</p>
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
            <div className="flex flex-col gap-2 w-full">
              <Errors />
              <div className="flex flex-row items-center mb-2">
                <div className="flex-auto">
                  <label
                    id="label-for-name"
                    htmlFor="Name"
                    className="font-semibold"
                  >
                    {locales.route.content.assign.name}
                  </label>
                </div>
              </div>

              <div className="flex flex-row">
                <Field name="parentEventId" className="flex-auto">
                  {() => (
                    <Autocomplete
                      suggestions={loaderData.parentEventSuggestions || []}
                      suggestionsLoaderPath={`/event/${slug}/settings/events`}
                      defaultValue={parentEventSuggestionsQuery || ""}
                      {...register("parentEventId")}
                      searchParameter="parent_autocomplete_query"
                      locales={locales}
                      currentLanguage={language}
                    />
                  )}
                </Field>
                <div className="ml-2">
                  <Button className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border-2 border-neutral-300 text-neutral-600 mt-0.5 hover:bg-neutral-100">
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
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {setParentFetcher.data.message}
        </div>
      ) : null}
      <h4 className="mb-4 mt-4 font-semibold">
        {locales.route.content.parent.headline}
      </h4>
      <p className="mb-8">
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
                const { Button, Errors } = remixFormsProps;
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
                  <div className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300 mb-2 flex items-stretch overflow-hidden">
                    <Link
                      className="flex"
                      to={`/event/${loaderData.parentEvent.slug}`}
                      prefetch="intent"
                    >
                      <div className="hidden @xl:block w-40 shrink-0">
                        <Image
                          alt={loaderData.parentEvent.name}
                          src={loaderData.parentEvent.background}
                          blurredSrc={loaderData.parentEvent.blurredBackground}
                        />
                      </div>
                      <div className="px-4 py-6">
                        <p className="text-xs mb-1">
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
                        <h4 className="font-bold text-base m-0 @md:line-clamp-1">
                          {loaderData.parentEvent.name}
                        </h4>
                        {loaderData.parentEvent.subline !== null ? (
                          <p className="text-xs mt-1 @md:line-clamp-2">
                            {loaderData.parentEvent.subline}
                          </p>
                        ) : (
                          <p className="text-xs mt-1 @md:line-clamp-2">
                            {removeHtmlTags(
                              loaderData.parentEvent.description ?? ""
                            )}
                          </p>
                        )}
                      </div>
                    </Link>
                    <input name="parentEventId" hidden />
                    <Button
                      className="ml-auto bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-transparent text-neutral-600"
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
                    <Errors />
                  </div>
                );
              } else {
                return null;
              }
            }}
          </RemixFormsForm>
        </div>
      ) : null}
      <hr className="border-t border-neutral-400 my-4 @lg:my-8" />
      <h4 className="mb-4 font-semibold">
        {locales.route.content.related.headline}
      </h4>

      <p className="mb-4">{locales.route.content.related.intro}</p>
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
            <div className="flex flex-col gap-2 w-full">
              <Errors />
              <div className="flex flex-row items-center mb-2">
                <div className="flex-auto">
                  <label
                    id="label-for-name"
                    htmlFor="Name"
                    className="font-semibold"
                  >
                    {locales.route.content.related.name}
                  </label>
                </div>
              </div>

              <div className="flex flex-row">
                <Field name="childEventId" className="flex-auto">
                  {() => (
                    <Autocomplete
                      suggestions={loaderData.childEventSuggestions || []}
                      suggestionsLoaderPath={`/event/${slug}/settings/events`}
                      defaultValue={childEventSuggestionsQuery || ""}
                      {...register("childEventId")}
                      searchParameter="child_autocomplete_query"
                      locales={locales}
                      currentLanguage={language}
                    />
                  )}
                </Field>
                <div className="ml-2">
                  <Button className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border-2 border-neutral-300 text-neutral-600 mt-0.5 hover:bg-neutral-100">
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
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {addChildFetcher.data.message}
        </div>
      ) : null}
      <h4 className="mb-4 mt-4 font-semibold">
        {locales.route.content.current.headline}
      </h4>
      <p className="mb-8">
        {locales.route.content.current.intro}
        <br></br>
        {loaderData.childEvents.length === 0
          ? locales.route.content.current.empty
          : ""}
      </p>
      {loaderData.childEvents.length > 0 ? (
        <div className="mt-6">
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
                      <div className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300 mb-2 flex items-stretch overflow-hidden">
                        <Link
                          className="flex"
                          to={`/event/${childEvent.slug}`}
                          prefetch="intent"
                        >
                          <div className="hidden @xl:block w-40 shrink-0">
                            <Image
                              alt={childEvent.name}
                              src={childEvent.background}
                              blurredSrc={childEvent.blurredBackground}
                            />
                          </div>
                          <div className="px-4 py-6">
                            <p className="text-xs mb-1">
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
                            <h4 className="font-bold text-base m-0 @md:line-clamp-1">
                              {childEvent.name}
                            </h4>
                            {childEvent.subline !== null ? (
                              <p className="text-xs mt-1 @md:line-clamp-2">
                                {childEvent.subline}
                              </p>
                            ) : (
                              <p className="text-xs mt-1 @md:line-clamp-2">
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
                          type="submit"
                          className="ml-auto bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-transparent text-neutral-600"
                          title={locales.route.form.remove.label}
                          onClick={() => {
                            if (removeChildFetcher.state === "idle") {
                              removeChildFetcher.submit(
                                { childEventId: childEvent.id },
                                {
                                  method: "post",
                                  action: `/event/${slug}/settings/events/remove-child`,
                                }
                              );
                            }
                          }}
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
      <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0">
        <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl">
          <div className="flex flex-row flex-nowrap items-center justify-end my-4">
            <RemixFormsForm
              schema={publishSchema}
              method="post"
              action={`/event/${slug}/settings/events/publish`}
            >
              {(remixFormsProps) => {
                const { Button, Field } = remixFormsProps;
                return (
                  <>
                    <div className="hidden">
                      <Field name="publish" value={!loaderData.published} />
                    </div>
                    <Button className="border border-primary bg-white text-primary h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer selct-none flex-wrap items-center justify-center rounded-lg text-center font-semibold gap-2 hover:bg-primary hover:text-white">
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
