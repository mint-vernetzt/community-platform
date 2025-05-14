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
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import Autocomplete from "~/components/Autocomplete/Autocomplete";
import { H3 } from "~/components/Heading/Heading";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { getInitials } from "~/lib/profile/getInitials";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/i18n.server";
import { getProfileSuggestionsForAutocomplete } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import { deriveEventMode } from "../../utils.server";
import { getFullDepthProfiles } from "../utils.server";
import { publishSchema, type action as publishAction } from "./events/publish";
import {
  getEventBySlug,
  getParticipantsDataFromEvent,
} from "./waiting-list.server";
import {
  addToWaitingListSchema,
  type action as addToWaitingListAction,
} from "./waiting-list/add-to-waiting-list";
import {
  moveToParticipantsSchema,
  type action as moveToParticipantsAction,
} from "./waiting-list/move-to-participants";
import {
  removeFromWaitingListSchema,
  type action as removeFromWaitingListAction,
} from "./waiting-list/remove-from-waiting-list";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/settings/waiting-list"];
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

  const participants = getParticipantsDataFromEvent(event);
  const enhancedWaitingParticipants = participants.waitingList.map(
    (waitingParticipant) => {
      let avatar = waitingParticipant.avatar;
      let blurredAvatar;
      if (avatar !== null) {
        const publicURL = getPublicURL(authClient, avatar);
        if (publicURL !== null) {
          avatar = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width:
                ImageSizes.Profile.ListItemEventAndOrganizationSettings.Avatar
                  .width,
              height:
                ImageSizes.Profile.ListItemEventAndOrganizationSettings.Avatar
                  .height,
            },
          });
          blurredAvatar = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width:
                ImageSizes.Profile.ListItemEventAndOrganizationSettings
                  .BlurredAvatar.width,
              height:
                ImageSizes.Profile.ListItemEventAndOrganizationSettings
                  .BlurredAvatar.height,
            },
            blur: BlurFactor,
          });
        }
      }
      return { ...waitingParticipant, avatar, blurredAvatar };
    }
  );

  const url = new URL(request.url);
  const suggestionsQuery =
    url.searchParams.get("autocomplete_query") || undefined;
  let waitingParticipantSuggestions;
  if (suggestionsQuery !== undefined && suggestionsQuery !== "") {
    const query = suggestionsQuery.split(" ");
    const alreadyParticipantIds = participants.participants.map(
      (participant) => {
        return participant.id;
      }
    );
    const alreadyWaitingParticipantIds = participants.waitingList.map(
      (waitingParticipant) => {
        return waitingParticipant.id;
      }
    );
    const alreadyParticipatingIds = [
      ...alreadyParticipantIds,
      ...alreadyWaitingParticipantIds,
    ];
    waitingParticipantSuggestions = await getProfileSuggestionsForAutocomplete(
      authClient,
      alreadyParticipatingIds,
      query
    );
  }

  const fullDepthWaitingList = await getFullDepthProfiles(
    event.id,
    "waitingList"
  );

  return {
    published: event.published,
    waitingList: enhancedWaitingParticipants,
    waitingParticipantSuggestions,
    hasFullDepthWaitingList:
      fullDepthWaitingList !== null &&
      fullDepthWaitingList.length > 0 &&
      event._count.childEvents !== 0,
    locales,
    language,
  };
};

function Participants() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language } = loaderData;
  const addToWaitingListFetcher = useFetcher<typeof addToWaitingListAction>();
  const removeFromWaitingListFetcher =
    useFetcher<typeof removeFromWaitingListAction>();
  const moveToParticipantsFetcher =
    useFetcher<typeof moveToParticipantsAction>();
  const publishFetcher = useFetcher<typeof publishAction>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();

  return (
    <>
      <h1 className="mv-mb-8">{locales.route.content.headline}</h1>
      <p className="mv-mb-8">{locales.route.content.intro}</p>
      <h4 className="mv-mb-4 mv-font-semibold">
        {locales.route.content.add.headline}
      </h4>
      <p className="mv-mb-8">{locales.route.content.add.intro}</p>
      <RemixFormsForm
        schema={addToWaitingListSchema}
        fetcher={addToWaitingListFetcher}
        action={`/event/${slug}/settings/waiting-list/add-to-waiting-list`}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/event/${slug}/settings/waiting-list`,
          });
        }}
      >
        {({ Field, Button, register }) => {
          return (
            <>
              <div className="mv-flex mv-flex-col mv-gap-2 mv-w-full">
                <div className="mv-flex mv-flex-row mv-items-center mv-mb-2">
                  <div className="mv-flex-auto">
                    <label
                      id="label-for-name"
                      htmlFor="Name"
                      className="mv-font-semibold"
                    >
                      {locales.route.content.add.label}
                    </label>
                  </div>
                </div>

                <div className="mv-flex mv-flex-row">
                  <Field name="profileId" className="mv-flex-auto">
                    {({ Errors }) => (
                      <>
                        <Errors />
                        <Autocomplete
                          suggestions={
                            loaderData.waitingParticipantSuggestions || []
                          }
                          suggestionsLoaderPath={`/event/${slug}/settings/waiting-list`}
                          defaultValue={suggestionsQuery || ""}
                          {...register("profileId")}
                          searchParameter="autocomplete_query"
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
            </>
          );
        }}
      </RemixFormsForm>
      {addToWaitingListFetcher.data !== undefined &&
      "message" in addToWaitingListFetcher.data ? (
        <div className={`mv-p-4 mv-bg-green-200 mv-rounded-md mv-mt-4`}>
          {addToWaitingListFetcher.data.message}
        </div>
      ) : null}
      {loaderData.waitingList.length > 0 ? (
        <>
          <h4 className="mv-mb-4 mv-mt-16 mv-font-semibold">
            {locales.route.content.current.headline}
          </h4>
          <p className="mv-mb-4">{locales.route.content.current.intro}</p>
        </>
      ) : null}
      {loaderData.waitingList.length > 0 ? (
        <p className="mv-mb-4">
          <Link
            className="mv-mt-4 mv-mb-4 mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
            to="../csv-download?type=waitingList&amp;depth=single"
            reloadDocument
          >
            {locales.route.content.current.download1}
          </Link>
        </p>
      ) : null}
      {loaderData.hasFullDepthWaitingList ? (
        <p className="mv-mb-4">
          <Link
            className="mv-mt-4 mv-mb-4 mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
            to="../csv-download?type=waitingList&amp;depth=full"
            reloadDocument
          >
            {locales.route.content.current.download2}
          </Link>
        </p>
      ) : null}

      {moveToParticipantsFetcher.data !== undefined &&
        "success" in moveToParticipantsFetcher.data &&
        moveToParticipantsFetcher.data.success === true && (
          <div>{locales.route.content.current.feedback}</div>
        )}
      {loaderData.waitingList.length > 0 ? (
        <div className="mv-mb-4 mv-mt-8 @md:mv-max-h-[630px] mv-overflow-auto">
          {loaderData.waitingList.map((waitingParticipant) => {
            const initials = getInitials(waitingParticipant);
            return (
              <div
                key={waitingParticipant.id}
                className="mv-w-full mv-flex mv-items-center mv-flex-row mv-flex-wrap @sm:mv-flex-nowrap mv-border-b mv-border-neutral-400 mv-py-4 @md:mv-px-4"
              >
                <div className="mv-h-16 mv-w-16 mv-bg-primary mv-text-white mv-text-3xl mv-flex mv-items-center mv-justify-center mv-rounded-full mv-border mv-overflow-hidden mv-shrink-0">
                  {waitingParticipant.avatar !== null &&
                  waitingParticipant.avatar !== "" ? (
                    <Avatar
                      size="full"
                      firstName={waitingParticipant.firstName}
                      lastName={waitingParticipant.lastName}
                      avatar={waitingParticipant.avatar}
                      blurredAvatar={waitingParticipant.blurredAvatar}
                    />
                  ) : (
                    <>{initials}</>
                  )}
                </div>
                <div className="mv-pl-4">
                  <Link to={`/profile/${waitingParticipant.username}`}>
                    <H3
                      like="h4"
                      className="mv-text-xl mv-mb-1 mv-no-underline hover:mv-underline"
                    >
                      {waitingParticipant.firstName}{" "}
                      {waitingParticipant.lastName}
                    </H3>
                  </Link>
                  {waitingParticipant.position ? (
                    <p className="mv-font-bold mv-text-sm mv-cursor-default">
                      {waitingParticipant.position}
                    </p>
                  ) : null}
                </div>
                <div className="mv-flex-1 @sm:mv-flex-auto @sm:mv-ml-auto mv-flex mv-items-center mv-flex-row mv-pt-4 @sm:mv-pt-0 mv-justify-end">
                  <RemixFormsForm
                    schema={moveToParticipantsSchema}
                    fetcher={moveToParticipantsFetcher}
                    action={`/event/${slug}/settings/waiting-list/move-to-participants`}
                    className="mv-ml-auto"
                  >
                    {(remixFormsProps) => {
                      const { Button, Errors } = remixFormsProps;
                      return (
                        <>
                          <Errors />
                          <input
                            name="profileId"
                            defaultValue={waitingParticipant.id}
                            hidden
                          />
                          <Button className="mv-ml-auto mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-[.375rem] mv-px-6 mv-normal-case mv-leading-[1.125rem] mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-text-sm mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white">
                            {locales.route.content.current.action}
                          </Button>
                        </>
                      );
                    }}
                  </RemixFormsForm>
                  <RemixFormsForm
                    schema={removeFromWaitingListSchema}
                    fetcher={removeFromWaitingListFetcher}
                    action={`/event/${slug}/settings/waiting-list/remove-from-waiting-list`}
                  >
                    {(remixFormsProps) => {
                      const { Button, Errors } = remixFormsProps;
                      return (
                        <>
                          <Errors />
                          <input
                            name="profileId"
                            defaultValue={waitingParticipant.id}
                            hidden
                          />
                          <Button
                            className="mv-ml-auto mv-bg-transparent mv-w-10 mv-h-8 mv-flex mv-items-center mv-justify-center mv-rounded-md mv-border mv-border-transparent mv-text-neutral-600"
                            title={locales.route.content.current.remove}
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
                        </>
                      );
                    }}
                  </RemixFormsForm>
                </div>
              </div>
            );
          })}
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
                        ? locales.route.content.hide
                        : locales.route.content.publish}
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

export default Participants;
