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
      <h1 className="mb-8">{locales.route.content.headline}</h1>
      <p className="mb-8">{locales.route.content.intro}</p>
      <h4 className="mb-4 font-semibold">
        {locales.route.content.add.headline}
      </h4>
      <p className="mb-8">{locales.route.content.add.intro}</p>
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
              <div className="flex flex-col gap-2 w-full">
                <div className="flex flex-row items-center mb-2">
                  <div className="flex-auto">
                    <label
                      id="label-for-name"
                      htmlFor="Name"
                      className="font-semibold"
                    >
                      {locales.route.content.add.label}
                    </label>
                  </div>
                </div>

                <div className="flex flex-row">
                  <Field name="profileId" className="flex-auto">
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
                  <div className="ml-2">
                    <Button className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border-2 border-neutral-300 text-neutral-600 mt-0.5 hover:bg-neutral-100">
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
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {addToWaitingListFetcher.data.message}
        </div>
      ) : null}
      {loaderData.waitingList.length > 0 ? (
        <>
          <h4 className="mb-4 mt-16 font-semibold">
            {locales.route.content.current.headline}
          </h4>
          <p className="mb-4">{locales.route.content.current.intro}</p>
        </>
      ) : null}
      {loaderData.waitingList.length > 0 ? (
        <p className="mb-4">
          <Link
            className="mt-4 mb-4 h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer outline-primary shrink-0 flex-wrap items-center justify-center rounded-lg text-center border-primary text-sm font-semibold border bg-primary text-white"
            to="../csv-download?type=waitingList&amp;depth=single"
            reloadDocument
          >
            {locales.route.content.current.download1}
          </Link>
        </p>
      ) : null}
      {loaderData.hasFullDepthWaitingList ? (
        <p className="mb-4">
          <Link
            className="mt-4 mb-4 h-auto min-h-0 whitespace-nowrap py-2 px-6 normal-case leading-6 inline-flex cursor-pointer outline-primary shrink-0 flex-wrap items-center justify-center rounded-lg text-center border-primary text-sm font-semibold border bg-primary text-white"
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
        <div className="mb-4 mt-8 @md:max-h-[630px] overflow-auto">
          {loaderData.waitingList.map((waitingParticipant) => {
            const initials = getInitials(waitingParticipant);
            return (
              <div
                key={waitingParticipant.id}
                className="w-full flex items-center flex-row flex-wrap @sm:flex-nowrap border-b border-neutral-400 py-4 @md:px-4"
              >
                <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
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
                <div className="pl-4">
                  <Link
                    to={`/profile/${waitingParticipant.username}`}
                    prefetch="intent"
                  >
                    <H3
                      like="h4"
                      className="text-xl mb-1 no-underline hover:underline"
                    >
                      {waitingParticipant.firstName}{" "}
                      {waitingParticipant.lastName}
                    </H3>
                  </Link>
                  {waitingParticipant.position ? (
                    <p className="font-bold text-sm cursor-default">
                      {waitingParticipant.position}
                    </p>
                  ) : null}
                </div>
                <div className="flex-1 @sm:flex-auto @sm:ml-auto flex items-center flex-row pt-4 @sm:pt-0 justify-end">
                  <RemixFormsForm
                    schema={moveToParticipantsSchema}
                    fetcher={moveToParticipantsFetcher}
                    action={`/event/${slug}/settings/waiting-list/move-to-participants`}
                    className="ml-auto"
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
                          <Button className="ml-auto border border-primary bg-white text-primary h-auto min-h-0 whitespace-nowrap py-[.375rem] px-6 normal-case leading-[1.125rem] inline-flex cursor-pointer selct-none flex-wrap items-center justify-center rounded-lg text-center text-sm font-semibold gap-2 hover:bg-primary hover:text-white">
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
                            className="ml-auto bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-transparent text-neutral-600"
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
      <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0">
        <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl">
          <div className="flex flex-row flex-nowrap items-center justify-end my-4">
            <RemixFormsForm
              schema={publishSchema}
              fetcher={publishFetcher}
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
