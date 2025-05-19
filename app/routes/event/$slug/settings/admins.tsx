import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { redirect, type LoaderFunctionArgs } from "react-router";
import {
  Link,
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
import { H3 } from "~/components/Heading/Heading";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { detectLanguage } from "~/i18n.server";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import { getInitials } from "~/lib/profile/getInitials";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { getProfileSuggestionsForAutocomplete } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import { deriveEventMode } from "../../utils.server";
import { getEvent } from "./admins.server";
import {
  addAdminSchema,
  type action as addAdminAction,
} from "./admins/add-admin";
import {
  removeAdminSchema,
  type action as removeAdminAction,
} from "./admins/remove-admin";
import { publishSchema, type action as publishAction } from "./events/publish";
import { decideBetweenSingularOrPlural } from "~/lib/utils/i18n";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";

const i18nNS = ["routes-event-settings-admins"] as const;
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const { authClient } = createAuthClient(request);
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/settings/admins"];

  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const slug = getParamValueOrThrow(params, "slug");
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const event = await getEvent(slug);
  invariantResponse(event, locales.route.error.notFound, { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.route.error.notPrivileged, {
    status: 403,
  });

  const enhancedAdmins = event.admins.map((relation) => {
    let avatar = relation.profile.avatar;
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
    return { ...relation.profile, avatar, blurredAvatar };
  });

  const url = new URL(request.url);
  const suggestionsQuery =
    url.searchParams.get("autocomplete_query") || undefined;
  let adminSuggestions;
  if (suggestionsQuery !== undefined && suggestionsQuery !== "") {
    const query = suggestionsQuery.split(" ");
    const alreadyAdminIds = event.admins.map((relation) => {
      return relation.profile.id;
    });
    adminSuggestions = await getProfileSuggestionsForAutocomplete(
      authClient,
      alreadyAdminIds,
      query
    );
  }

  return {
    published: event.published,
    admins: enhancedAdmins,
    adminSuggestions,
    locales,
    language,
  };
};

function Admins() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const addAdminFetcher = useFetcher<typeof addAdminAction>();
  const removeAdminFetcher = useFetcher<typeof removeAdminAction>();
  const publishFetcher = useFetcher<typeof publishAction>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();

  return (
    <>
      <h1 className="mv-mb-8">{loaderData.locales.route.content.headline}</h1>
      <p className="mv-mb-2">{loaderData.locales.route.content.intro.who}</p>
      <p className="mv-mb-2">{loaderData.locales.route.content.intro.what}</p>
      <p className="mv-mb-8">{loaderData.locales.route.content.intro.whom}</p>
      <h4 className="mv-mb-4 mv-mt-4 mv-font-semibold">
        {loaderData.locales.route.content.add.headline}
      </h4>
      <p className="mv-mb-8">{loaderData.locales.route.content.add.intro}</p>
      <RemixFormsForm
        schema={addAdminSchema}
        fetcher={addAdminFetcher}
        action={`/event/${slug}/settings/admins/add-admin`}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/event/${slug}/settings/admins`,
          });
        }}
      >
        {({ Field, Errors, Button, register }) => {
          return (
            <>
              <Errors />
              <div className="mv-flex mv-flex-col mv-gap-2 mv-w-full">
                <div className="mv-flex mv-flex-row mv-items-center mv-mb-2">
                  <div className="mv-flex-auto">
                    <label
                      id="label-for-name"
                      htmlFor="Name"
                      className="mv-font-semibold"
                    >
                      {loaderData.locales.route.form.name.label}
                    </label>
                  </div>
                </div>

                <div className="mv-flex mv-flex-row">
                  <Field name="profileId" className="mv-flex-auto">
                    {({ Errors }) => (
                      <>
                        <Errors />
                        <Autocomplete
                          suggestions={loaderData.adminSuggestions || []}
                          suggestionsLoaderPath={`/event/${slug}/settings/admins`}
                          defaultValue={suggestionsQuery || ""}
                          {...register("profileId")}
                          searchParameter="autocomplete_query"
                          locales={loaderData.locales}
                          currentLanguage={loaderData.language}
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
      {addAdminFetcher.data !== undefined &&
      "message" in addAdminFetcher.data ? (
        <div className={`mv-p-4 mv-bg-green-200 mv-rounded-md mv-mt-4`}>
          {addAdminFetcher.data.message}
        </div>
      ) : null}
      <h4 className="mv-mb-4 mv-mt-16 mv-font-semibold">
        {decideBetweenSingularOrPlural(
          loaderData.locales.route.content.current.headline_one,
          loaderData.locales.route.content.current.headline_other,
          loaderData.admins.length
        )}
      </h4>
      <p className="mv-mb-8">
        {decideBetweenSingularOrPlural(
          loaderData.locales.route.content.current.intro_one,
          loaderData.locales.route.content.current.intro_other,
          loaderData.admins.length
        )}
      </p>
      <div className="mv-mb-4 @md:mv-max-h-[630px] mv-overflow-auto">
        {loaderData.admins.map((admin) => {
          const initials = getInitials(admin);
          return (
            <div
              key={`team-member-${admin.id}`}
              className="mv-w-full mv-flex mv-items-center mv-flex-row mv-flex-wrap @sm:mv-flex-nowrap mv-border-b mv-border-neutral-400 mv-py-4 @md:mv-px-4"
            >
              <div className="mv-h-16 mv-w-16 mv-bg-primary mv-text-white mv-text-3xl mv-flex mv-items-center mv-justify-center mv-rounded-full mv-border mv-overflow-hidden mv-shrink-0">
                {admin.avatar !== null && admin.avatar !== "" ? (
                  <Avatar
                    size="full"
                    firstName={admin.firstName}
                    lastName={admin.lastName}
                    avatar={admin.avatar}
                    blurredAvatar={admin.blurredAvatar}
                  />
                ) : (
                  <>{initials}</>
                )}
              </div>
              <div className="mv-pl-4">
                <Link to={`/profile/${admin.username}`}>
                  <H3
                    like="h4"
                    className="mv-text-xl mv-mb-1 mv-no-underline hover:mv-underline"
                  >
                    {admin.firstName} {admin.lastName}
                  </H3>
                </Link>
                {admin.position ? (
                  <p className="mv-font-bold mv-text-sm mv-cursor-default">
                    {admin.position}
                  </p>
                ) : null}
              </div>
              <div className="mv-flex-1 @sm:mv-flex-auto @sm:mv-ml-auto mv-flex mv-items-center mv-flex-row mv-pt-4 @sm:mv-pt-0 mv-justify-end">
                <RemixFormsForm
                  schema={removeAdminSchema}
                  fetcher={removeAdminFetcher}
                  action={`/event/${slug}/settings/admins/remove-admin`}
                >
                  {(remixFormsProps) => {
                    const { Button, Errors } = remixFormsProps;
                    return (
                      <>
                        <Errors />
                        <input
                          name="profileId"
                          defaultValue={admin.id}
                          hidden
                        />
                        {loaderData.admins.length > 1 ? (
                          <Button
                            className="mv-ml-auto mv-bg-transparent mv-w-10 mv-h-8 mv-flex mv-items-center mv-justify-center mv-rounded-md mv-border mv-border-transparent mv-text-neutral-600"
                            title={loaderData.locales.route.form.remove.label}
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
                        ) : null}
                      </>
                    );
                  }}
                </RemixFormsForm>
              </div>
            </div>
          );
        })}
      </div>
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
                        ? loaderData.locales.route.form.hide.label
                        : loaderData.locales.route.form.publish.label}
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

export default Admins;
