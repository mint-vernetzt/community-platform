import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Link,
  useFetcher,
  useLoaderData,
  useParams,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import Autocomplete from "~/components/Autocomplete/Autocomplete";
import {
  BlurFactor,
  DefaultImages,
  getImageURL,
  ImageSizes,
} from "~/images.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { removeHtmlTags } from "~/lib/utils/sanitizeUserHtml";
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
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";

const i18nNS = ["routes-event-settings-events", "datasets-stages"] as const;
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const locale = await detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const event = await getEventBySlug(slug);
  invariantResponse(event, t("error.notFound"), { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
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

  return json({
    parentEvent: enhancedParentEvent,
    parentEventSuggestions,
    childEvents: enhancedChildEvents,
    childEventSuggestions,
    published: event.published,
  });
};

function Events() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
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
  const { t, i18n } = useTranslation(i18nNS);

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>
      <h4 className="mb-4 font-semibold">{t("content.assign.headline")}</h4>

      <p className="mb-4">{t("content.assign.intro")}</p>
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
        {(props) => {
          const { Button, Field, Errors, register } = props;

          return (
            <div className="form-control w-full">
              <Errors />
              <div className="flex flex-row items-center mb-2">
                <div className="flex-auto">
                  <label id="label-for-name" htmlFor="Name" className="label">
                    {t("content.assign.name")}
                  </label>
                </div>
              </div>

              <div className="flex flex-row">
                <Field name="parentEventId" className="flex-auto">
                  {({ Errors }) => (
                    <>
                      <Errors />
                      <Autocomplete
                        suggestions={loaderData.parentEventSuggestions || []}
                        suggestionsLoaderPath={`/event/${slug}/settings/events`}
                        defaultValue={parentEventSuggestionsQuery || ""}
                        {...register("parentEventId")}
                        searchParameter="parent_autocomplete_query"
                      />
                    </>
                  )}
                </Field>
                <div className="ml-2">
                  <Button className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-neutral-500 text-neutral-600 mt-0.5">
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
        {t("content.parent.headline")}
      </h4>
      <p className="mb-8">
        {t("content.parent.intro")}
        <br></br>
        {loaderData.parentEvent === null ? t("content.parent.empty") : ""}
      </p>
      {loaderData.parentEvent !== null ? (
        <div>
          <RemixFormsForm
            schema={setParentSchema}
            fetcher={setParentFetcher}
            action={`/event/${slug}/settings/events/set-parent`}
            hiddenFields={["parentEventId"]}
            values={{
              parentEventId: undefined,
            }}
          >
            {(props) => {
              if (
                loaderData.parentEvent !== null &&
                parentEventStartTime !== undefined &&
                parentEventEndTime !== undefined
              ) {
                const { Field, Button } = props;
                return (
                  <div className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300  mb-2 flex items-stretch overflow-hidden">
                    <Link
                      className="flex"
                      to={`/event/${loaderData.parentEvent.slug}`}
                    >
                      <div className="hidden @xl:mv-block w-40 shrink-0">
                        <Image
                          alt={loaderData.parentEvent.name}
                          src={loaderData.parentEvent.background}
                          blurredSrc={loaderData.parentEvent.blurredBackground}
                        />
                      </div>
                      <div className="px-4 py-6">
                        <p className="text-xs mb-1">
                          {/* TODO: Display icons (see figma) */}
                          {loaderData.parentEvent.stage !== null
                            ? t(`${loaderData.parentEvent.stage.slug}.title`, {
                                ns: "datasets-stages",
                              }) + " | "
                            : ""}
                          {getDuration(
                            parentEventStartTime,
                            parentEventEndTime,
                            i18n.language
                          )}
                          {loaderData.parentEvent._count.childEvents === 0 ? (
                            <>
                              {loaderData.parentEvent.participantLimit === null
                                ? t("content.parent.seats.unlimited")
                                : t("content.parent.seats.exact", {
                                    number:
                                      loaderData.parentEvent.participantLimit -
                                      loaderData.parentEvent._count
                                        .participants,
                                    total:
                                      loaderData.parentEvent.participantLimit,
                                  })}
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
                                {t("content.parent.seats.waiting", {
                                  number:
                                    loaderData.parentEvent._count.waitingList,
                                })}
                              </span>
                            </>
                          ) : (
                            ""
                          )}
                        </p>
                        <h4 className="font-bold text-base m-0 @md:mv-line-clamp-1">
                          {loaderData.parentEvent.name}
                        </h4>
                        {loaderData.parentEvent.subline !== null ? (
                          <p className="mv-hidden text-xs mt-1 @md:mv-line-clamp-2">
                            {loaderData.parentEvent.subline}
                          </p>
                        ) : (
                          <p className="mv-hidden text-xs mt-1 @md:mv-line-clamp-2">
                            {removeHtmlTags(
                              loaderData.parentEvent.description ?? ""
                            )}
                          </p>
                        )}
                      </div>
                    </Link>
                    <Field name="parentEventId" />
                    <Button className="ml-auto btn-none" title="entfernen">
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
      <hr className="border-neutral-400 my-4 @lg:mv-my-8" />
      <h4 className="mb-4 font-semibold">{t("content.related.headline")}</h4>

      <p className="mb-4">{t("content.related.intro")}</p>
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
        {(props) => {
          const { Button, Field, Errors, register } = props;

          return (
            <div className="form-control w-full">
              <Errors />
              <div className="flex flex-row items-center mb-2">
                <div className="flex-auto">
                  <label id="label-for-name" htmlFor="Name" className="label">
                    {t("content.related.name")}
                  </label>
                </div>
              </div>

              <div className="flex flex-row">
                <Field name="childEventId" className="flex-auto">
                  {({ Errors }) => (
                    <>
                      <Autocomplete
                        suggestions={loaderData.childEventSuggestions || []}
                        suggestionsLoaderPath={`/event/${slug}/settings/events`}
                        defaultValue={childEventSuggestionsQuery || ""}
                        {...register("childEventId")}
                        searchParameter="child_autocomplete_query"
                      />
                      <Errors />
                    </>
                  )}
                </Field>
                <div className="ml-2">
                  <Button className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-neutral-500 text-neutral-600 mt-0.5">
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
        {t("content.current.headline")}
      </h4>
      <p className="mb-8">
        {t("content.current.intro")}
        <br></br>
        {loaderData.childEvents.length === 0 ? t("content.current.empty") : ""}
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
              return (
                <RemixFormsForm
                  key={`remove-child-${childEvent.id}`}
                  schema={removeChildSchema}
                  fetcher={removeChildFetcher}
                  action={`/event/${slug}/settings/events/remove-child`}
                  hiddenFields={["childEventId"]}
                  values={{
                    childEventId: childEvent.id,
                  }}
                >
                  {(props) => {
                    const { Field, Button } = props;
                    return (
                      <div className="rounded-lg bg-white shadow-xl border-t border-r border-neutral-300  mb-2 flex items-stretch overflow-hidden">
                        <Link className="flex" to={`/event/${childEvent.slug}`}>
                          <div className="hidden @xl:mv-block w-40 shrink-0">
                            <Image
                              alt={childEvent.name}
                              src={childEvent.background}
                              blurredSrc={childEvent.blurredBackground}
                            />
                          </div>
                          <div className="px-4 py-6">
                            <p className="text-xs mb-1">
                              {/* TODO: Display icons (see figma) */}
                              {childEvent.stage !== null
                                ? t(`${childEvent.stage.slug}.title`, {
                                    ns: "datasets-stages",
                                  }) + " | "
                                : ""}
                              {getDuration(
                                eventStartTime,
                                eventEndTime,
                                i18n.language
                              )}
                              {childEvent._count.childEvents === 0 ? (
                                <>
                                  {childEvent.participantLimit === null
                                    ? t("content.current.seats.unlimited")
                                    : t("content.current.seats.exact", {
                                        number:
                                          childEvent.participantLimit -
                                          childEvent._count.participants,
                                        total: childEvent.participantLimit,
                                      })}
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
                                    {t("content.current.seats.waiting", {
                                      number: childEvent._count.waitingList,
                                    })}
                                  </span>
                                </>
                              ) : (
                                ""
                              )}
                            </p>
                            <h4 className="font-bold text-base m-0 @md:mv-line-clamp-1">
                              {childEvent.name}
                            </h4>
                            {childEvent.subline !== null ? (
                              <p className="mv-hidden text-xs mt-1 @md:mv-line-clamp-2">
                                {childEvent.subline}
                              </p>
                            ) : (
                              <p className="mv-hidden text-xs mt-1 @md:mv-line-clamp-2">
                                {removeHtmlTags(childEvent.description ?? "")}
                              </p>
                            )}
                          </div>
                        </Link>
                        <Field name="childEventId" />
                        <Button
                          className="ml-auto btn-none"
                          title={t("form.remove.label")}
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
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
          <div className="flex flex-row flex-nowrap items-center justify-end my-4">
            <RemixFormsForm
              schema={publishSchema}
              fetcher={publishFetcher}
              action={`/event/${slug}/settings/events/publish`}
              hiddenFields={["publish"]}
              values={{
                publish: !loaderData.published,
              }}
            >
              {(props) => {
                const { Button, Field } = props;
                return (
                  <>
                    <Field name="publish"></Field>
                    <Button className="btn btn-outline-primary">
                      {loaderData.published
                        ? t("form.hide.label")
                        : t("form.publish.label")}
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
