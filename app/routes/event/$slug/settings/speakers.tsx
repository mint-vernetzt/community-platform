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
import Autocomplete from "~/components/legacy/Autocomplete/Autocomplete";
import { H3 } from "~/components/legacy/Heading/Heading";
import { RemixFormsForm } from "~/components/legacy/RemixFormsForm/RemixFormsForm";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import { getInitials } from "~/lib/profile/getInitials";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/i18n.server";
import { getProfileSuggestionsForAutocomplete } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import { deriveEventMode } from "../../utils.server";
import { publishSchema, type action as publishAction } from "./events/publish";
import {
  getEventBySlug,
  getSpeakerProfileDataFromEvent,
} from "./speakers.server";
import {
  addSpeakerSchema,
  type action as addSpeakerAction,
} from "./speakers/add-speaker";
import {
  removeSpeakerSchema,
  type action as removeSpeakerAction,
} from "./speakers/remove-speaker";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/settings/speakers"];
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = await getParamValueOrThrow(params, "slug");
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

  const speakers = getSpeakerProfileDataFromEvent(event);
  const enhancedSpeakers = speakers.map((speaker) => {
    let avatar = speaker.avatar;
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
    return { ...speaker, avatar, blurredAvatar };
  });

  const url = new URL(request.url);
  const suggestionsQuery =
    url.searchParams.get("autocomplete_query") || undefined;
  let speakerSuggestions;
  if (suggestionsQuery !== undefined && suggestionsQuery !== "") {
    const query = suggestionsQuery.split(" ");
    const alreadySpeakerIds = speakers.map((speaker) => {
      return speaker.id;
    });
    speakerSuggestions = await getProfileSuggestionsForAutocomplete(
      authClient,
      alreadySpeakerIds,
      query
    );
  }

  return {
    published: event.published,
    speakers: enhancedSpeakers,
    speakerSuggestions,
    locales,
    language,
  };
};

function Speakers() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language } = loaderData;

  const addSpeakerFetcher = useFetcher<typeof addSpeakerAction>();
  const removeSpeakerFetcher = useFetcher<typeof removeSpeakerAction>();
  const publishFetcher = useFetcher<typeof publishAction>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();

  return (
    <>
      <h1 className="mb-8">{locales.route.content.headline}</h1>
      <p className="mb-8">{locales.route.content.intro}</p>
      <h4 className="mb-4 mt-4 font-semibold">
        {locales.route.content.add.headline}
      </h4>
      <p className="mb-8">{locales.route.content.add.intro}</p>
      <RemixFormsForm
        schema={addSpeakerSchema}
        fetcher={addSpeakerFetcher}
        action={`/event/${slug}/settings/speakers/add-speaker`}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/event/${slug}/settings/speakers`,
          });
        }}
      >
        {({ Field, Errors, Button, register }) => {
          return (
            <>
              <Errors />
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
                          suggestions={loaderData.speakerSuggestions || []}
                          suggestionsLoaderPath={`/event/${slug}/settings/speakers`}
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
      {addSpeakerFetcher.data !== undefined &&
      "message" in addSpeakerFetcher.data ? (
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {addSpeakerFetcher.data.message}
        </div>
      ) : null}
      <h4 className="mb-4 mt-16 font-semibold">
        {locales.route.content.current.headline}
      </h4>
      <p className="mb-8">{locales.route.content.current.intro} </p>
      <div className="mb-4 @md:max-h-[630px] overflow-auto">
        {loaderData.speakers.map((profile) => {
          const initials = getInitials(profile);
          return (
            <div
              key={`team-member-${profile.id}`}
              className="w-full flex items-center flex-row flex-nowrap border-b border-neutral-400 py-4 @md:px-4"
            >
              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
                {profile.avatar !== null && profile.avatar !== "" ? (
                  <Avatar
                    size="full"
                    firstName={profile.firstName}
                    lastName={profile.lastName}
                    avatar={profile.avatar}
                    blurredAvatar={profile.blurredAvatar}
                  />
                ) : (
                  <>{initials}</>
                )}
              </div>
              <div className="pl-4">
                <Link to={`/profile/${profile.username}`} prefetch="intent">
                  <H3
                    like="h4"
                    className="text-xl mb-1 no-underline hover:underline"
                  >
                    {profile.firstName} {profile.lastName}
                  </H3>
                </Link>
                {profile.position ? (
                  <p className="font-bold text-sm cursor-default">
                    {profile.position}
                  </p>
                ) : null}
              </div>

              <RemixFormsForm
                schema={removeSpeakerSchema}
                fetcher={removeSpeakerFetcher}
                action={`/event/${slug}/settings/speakers/remove-speaker`}
                className="ml-auto"
              >
                {(remixFormsProps) => {
                  const { Button, Errors } = remixFormsProps;
                  return (
                    <>
                      <Errors />
                      <input
                        name="profileId"
                        defaultValue={profile.id}
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
          );
        })}
      </div>
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

export default Speakers;
