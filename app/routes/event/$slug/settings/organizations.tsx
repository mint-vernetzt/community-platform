import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
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
import { H3 } from "~/components/Heading/Heading";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { detectLanguage } from "~/i18n.server";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { getOrganizationSuggestionsForAutocomplete } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import { deriveEventMode } from "../../utils.server";
import { publishSchema } from "./events/publish";
import {
  getEventBySlug,
  getOwnOrganizationsSuggestions,
  getResponsibleOrganizationDataFromEvent,
} from "./organizations.server";
import {
  type action as addOrganizationAction,
  addOrganizationSchema,
} from "./organizations/add-organization";
import { type action as removeOrganizationAction } from "./organizations/remove-organization";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/settings/organizations"];
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

  const organizations = getResponsibleOrganizationDataFromEvent(event);

  const enhancedOrganizations = organizations.map((organization) => {
    let logo = organization.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width:
              ImageSizes.Organization.ListItemEventAndOrganizationSettings.Logo
                .width,
            height:
              ImageSizes.Organization.ListItemEventAndOrganizationSettings.Logo
                .height,
          },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width:
              ImageSizes.Organization.ListItemEventAndOrganizationSettings
                .BlurredLogo.width,
            height:
              ImageSizes.Organization.ListItemEventAndOrganizationSettings
                .BlurredLogo.height,
          },
          blur: BlurFactor,
        });
      }
    }
    return { ...organization, logo, blurredLogo };
  });

  const alreadyResponsibleOrganizationSlugs = organizations.map(
    (organization) => {
      return organization.slug;
    }
  );

  const ownOrganizationsSuggestions = await getOwnOrganizationsSuggestions(
    sessionUser.id,
    alreadyResponsibleOrganizationSlugs
  );

  const enhancedOwnOrganizations = ownOrganizationsSuggestions.map(
    (organization) => {
      let logo = organization.logo;
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width:
                ImageSizes.Organization.ListItemEventAndOrganizationSettings
                  .Logo.width,
              height:
                ImageSizes.Organization.ListItemEventAndOrganizationSettings
                  .Logo.height,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width:
                ImageSizes.Organization.ListItemEventAndOrganizationSettings
                  .BlurredLogo.width,
              height:
                ImageSizes.Organization.ListItemEventAndOrganizationSettings
                  .BlurredLogo.height,
            },
            blur: BlurFactor,
          });
        }
      }
      return { ...organization, logo, blurredLogo };
    }
  );

  const url = new URL(request.url);
  const suggestionsQuery =
    url.searchParams.get("autocomplete_query") || undefined;
  let responsibleOrganizationSuggestions;
  if (suggestionsQuery !== undefined && suggestionsQuery !== "") {
    const query = suggestionsQuery.split(" ");

    responsibleOrganizationSuggestions =
      await getOrganizationSuggestionsForAutocomplete(
        authClient,
        alreadyResponsibleOrganizationSlugs,
        query
      );
  }

  return {
    published: event.published,
    responsibleOrganizations: enhancedOrganizations,
    responsibleOrganizationSuggestions,
    ownOrganizationsSuggestions: enhancedOwnOrganizations,
    locales,
    language,
  };
};

function Organizations() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const { locales, language } = loaderData;
  const addOrganizationFetcher = useFetcher<typeof addOrganizationAction>();
  const removeOrganizationFetcher =
    useFetcher<typeof removeOrganizationAction>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();

  return (
    <>
      <h1 className="mb-8">{locales.route.content.headline}</h1>
      <p className="mb-8">{locales.route.content.headline}</p>
      <h4 className="mb-4 mt-4 font-semibold">
        {locales.route.content.add.headline}
      </h4>
      <p className="mb-8">{locales.route.content.add.intro}</p>
      <RemixFormsForm
        schema={addOrganizationSchema}
        fetcher={addOrganizationFetcher}
        action={`/event/${slug}/settings/organizations/add-organization`}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/event/${slug}/settings/organizations`,
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
                  <Field name="organizationId" className="flex-auto">
                    {() => (
                      <Autocomplete
                        suggestions={
                          loaderData.responsibleOrganizationSuggestions || []
                        }
                        suggestionsLoaderPath={`/event/${slug}/settings/organizations`}
                        defaultValue={suggestionsQuery || ""}
                        {...register("organizationId")}
                        searchParameter="autocomplete_query"
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
            </>
          );
        }}
      </RemixFormsForm>
      {addOrganizationFetcher.data !== undefined &&
      "message" in addOrganizationFetcher.data ? (
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {addOrganizationFetcher.data.message}
        </div>
      ) : null}
      {loaderData.ownOrganizationsSuggestions.length > 0 ? (
        <>
          <h4 className="mb-4 mt-16 font-semibold">
            {locales.route.content.own.headline}
          </h4>
          <p className="mb-8">{locales.route.content.own.intro}</p>
          <div className="mb-4 @md:max-h-[630px] overflow-auto">
            <ul>
              {loaderData.ownOrganizationsSuggestions.map((organization) => {
                const initials = getInitialsOfName(organization.name);
                return (
                  <li
                    className="w-full flex items-center flex-row flex-nowrap border-b border-neutral-400 py-4 @md:px-4"
                    key={organization.id}
                  >
                    <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
                      {organization.logo !== null &&
                      organization.logo !== "" ? (
                        <Avatar
                          size="full"
                          name={organization.name}
                          logo={organization.logo}
                          blurredLogo={organization.blurredLogo}
                        />
                      ) : (
                        <>{initials}</>
                      )}
                    </div>
                    <div className="pl-4">
                      <Link
                        to={`/organization/${organization.slug}/detail/about`}
                        prefetch="intent"
                      >
                        <H3
                          like="h4"
                          className="text-xl mb-1 no-underline hover:underline"
                        >
                          {organization.name}
                        </H3>
                      </Link>
                      {organization.types.length !== 0 ? (
                        <p className="font-bold text-sm cursor-default">
                          {organization.types
                            .map((relation) => {
                              let title;
                              if (
                                relation.organizationType.slug in
                                locales.organizationTypes
                              ) {
                                type LocaleKey =
                                  keyof typeof locales.organizationTypes;
                                title =
                                  locales.organizationTypes[
                                    relation.organizationType.slug as LocaleKey
                                  ].title;
                              } else {
                                console.error(
                                  `Organization type ${relation.organizationType.slug} not found in locales`
                                );
                                title = relation.organizationType.slug;
                              }
                              return title;
                            })
                            .join(" / ")}
                        </p>
                      ) : null}
                    </div>
                    <addOrganizationFetcher.Form
                      method="post"
                      action={`/event/${slug}/settings/organizations/add-organization`}
                      className="ml-auto"
                    >
                      <input
                        name="organizationId"
                        defaultValue={organization.id}
                        hidden
                      />
                      <button
                        className="ml-auto border border-primary bg-white text-primary h-auto min-h-0 whitespace-nowrap py-[.375rem] px-6 normal-case leading-[1.125rem] inline-flex cursor-pointer selct-none flex-wrap items-center justify-center rounded-lg text-center text-sm font-semibold gap-2 hover:bg-primary hover:text-white"
                        title="Hinzufügen"
                        type="submit"
                      >
                        {locales.route.content.own.label}
                      </button>
                      {typeof addOrganizationFetcher.data !== "undefined" &&
                      addOrganizationFetcher.data !== null &&
                      "success" in addOrganizationFetcher.data &&
                      addOrganizationFetcher.data.success === false ? (
                        <div className={`p-4 bg-red-200 rounded-md mt-4`}>
                          {addOrganizationFetcher.data.errors._global?.join(
                            ", "
                          )}
                          {addOrganizationFetcher.data.errors.organizationId?.join(
                            ", "
                          )}
                        </div>
                      ) : null}
                    </addOrganizationFetcher.Form>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}

      <h4 className="mb-4 mt-16 font-semibold">
        {locales.route.content.current.headline}
      </h4>
      <p className="mb-8">{locales.route.content.current.intro}</p>
      <div className="mb-4 @md:max-h-[630px] overflow-auto">
        <ul>
          {loaderData.responsibleOrganizations.map((organization) => {
            const initials = getInitialsOfName(organization.name);
            return (
              <li
                className="w-full flex items-center flex-row flex-nowrap border-b border-neutral-400 py-4 @md:px-4"
                key={organization.id}
              >
                <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
                  {organization.logo !== null && organization.logo !== "" ? (
                    <Avatar
                      size="full"
                      name={organization.name}
                      logo={organization.logo}
                      blurredLogo={organization.blurredLogo}
                    />
                  ) : (
                    <>{initials}</>
                  )}
                </div>
                <div className="pl-4">
                  <Link
                    to={`/organization/${organization.slug}/detail/about`}
                    prefetch="intent"
                  >
                    <H3
                      like="h4"
                      className="text-xl mb-1 no-underline hover:underline"
                    >
                      {organization.name}
                    </H3>
                  </Link>
                  {organization.types.length !== 0 ? (
                    <p className="font-bold text-sm cursor-default">
                      {organization.types
                        .map((relation) => {
                          let title;
                          if (
                            relation.organizationType.slug in
                            locales.organizationTypes
                          ) {
                            type LocaleKey =
                              keyof typeof locales.organizationTypes;
                            title =
                              locales.organizationTypes[
                                relation.organizationType.slug as LocaleKey
                              ].title;
                          } else {
                            console.error(
                              `Organization type ${relation.organizationType.slug} not found in locales`
                            );
                            title = relation.organizationType.slug;
                          }
                          return title;
                        })
                        .join(" / ")}
                    </p>
                  ) : null}
                </div>
                <removeOrganizationFetcher.Form
                  method="post"
                  action={`/event/${slug}/settings/organizations/remove-organization`}
                  className="ml-auto"
                >
                  <input
                    name="organizationId"
                    defaultValue={organization.id}
                    hidden
                  />
                  <button
                    type="submit"
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
                  </button>
                  {typeof removeOrganizationFetcher.data !== "undefined" &&
                  removeOrganizationFetcher.data !== null &&
                  removeOrganizationFetcher.data.success === false ? (
                    <div className={`p-4 bg-red-200 rounded-md mt-4`}>
                      {removeOrganizationFetcher.data.errors._global?.join(
                        ", "
                      )}
                      {removeOrganizationFetcher.data.errors.organizationId?.join(
                        ", "
                      )}
                    </div>
                  ) : null}
                </removeOrganizationFetcher.Form>
              </li>
            );
          })}
        </ul>
      </div>
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

export default Organizations;
