import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
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
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/i18n.server";
import { getOrganizationSuggestionsForAutocomplete } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import { deriveEventMode } from "../../utils.server";
import { type action as publishAction, publishSchema } from "./events/publish";
import {
  getEventBySlug,
  getOwnOrganizationsSuggestions,
  getResponsibleOrganizationDataFromEvent,
} from "./organizations.server";
import {
  type action as addOrganizationAction,
  addOrganizationSchema,
} from "./organizations/add-organization";
import {
  type action as removeOrganizationAction,
  removeOrganizationSchema,
} from "./organizations/remove-organization";
import { languageModuleMap } from "~/locales/.server";

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
  const publishFetcher = useFetcher<typeof publishAction>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();

  return (
    <>
      <h1 className="mv-mb-8">{locales.route.content.headline}</h1>
      <p className="mv-mb-8">{locales.route.content.headline}</p>
      <h4 className="mv-mb-4 mv-mt-4 mv-font-semibold">
        {locales.route.content.add.headline}
      </h4>
      <p className="mv-mb-8">{locales.route.content.add.intro}</p>
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
                  <Field name="organizationId" className="mv-flex-auto">
                    {({ Errors }) => (
                      <>
                        <Errors />
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
      {addOrganizationFetcher.data !== undefined &&
      "message" in addOrganizationFetcher.data ? (
        <div className={`mv-p-4 mv-bg-green-200 mv-rounded-md mv-mt-4`}>
          {addOrganizationFetcher.data.message}
        </div>
      ) : null}
      {loaderData.ownOrganizationsSuggestions.length > 0 ? (
        <>
          <h4 className="mv-mb-4 mv-mt-16 mv-font-semibold">
            {locales.route.content.own.headline}
          </h4>
          <p className="mv-mb-8">{locales.route.content.own.intro}</p>
          <div className="mv-mb-4 @md:mv-max-h-[630px] mv-overflow-auto">
            <ul>
              {loaderData.ownOrganizationsSuggestions.map((organization) => {
                const initials = getInitialsOfName(organization.name);
                return (
                  <li
                    className="mv-w-full mv-flex mv-items-center mv-flex-row mv-flex-nowrap mv-border-b mv-border-neutral-400 mv-py-4 @md:mv-px-4"
                    key={organization.id}
                  >
                    <div className="mv-h-16 mv-w-16 mv-bg-primary mv-text-white mv-text-3xl mv-flex mv-items-center mv-justify-center mv-rounded-full mv-border mv-overflow-hidden mv-shrink-0">
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
                    <div className="mv-pl-4">
                      <Link to={`/organization/${organization.slug}`}>
                        <H3
                          like="h4"
                          className="mv-text-xl mv-mb-1 mv-no-underline hover:mv-underline"
                        >
                          {organization.name}
                        </H3>
                      </Link>
                      {organization.types.length !== 0 ? (
                        <p className="mv-font-bold mv-text-sm mv-cursor-default">
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
                    <RemixFormsForm
                      schema={addOrganizationSchema}
                      fetcher={addOrganizationFetcher}
                      action={`/event/${slug}/settings/organizations/add-organization`}
                      className="mv-ml-auto"
                    >
                      {(remixFormsProps) => {
                        const { Errors } = remixFormsProps;
                        return (
                          <>
                            <Errors />
                            <input
                              name="organizationId"
                              defaultValue={organization.id}
                              hidden
                            />
                            <button
                              className="mv-ml-auto mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-[.375rem] mv-px-6 mv-normal-case mv-leading-[1.125rem] mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-text-sm mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white"
                              title="Hinzufügen"
                              type="submit"
                            >
                              {locales.route.content.own.label}
                            </button>
                          </>
                        );
                      }}
                    </RemixFormsForm>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}

      <h4 className="mv-mb-4 mv-mt-16 mv-font-semibold">
        {locales.route.content.current.headline}
      </h4>
      <p className="mv-mb-8">{locales.route.content.current.intro}</p>
      <div className="mv-mb-4 @md:mv-max-h-[630px] mv-overflow-auto">
        <ul>
          {loaderData.responsibleOrganizations.map((organization) => {
            const initials = getInitialsOfName(organization.name);
            return (
              <li
                className="mv-w-full mv-flex mv-items-center mv-flex-row mv-flex-nowrap mv-border-b mv-border-neutral-400 mv-py-4 @md:mv-px-4"
                key={organization.id}
              >
                <div className="mv-h-16 mv-w-16 mv-bg-primary mv-text-white mv-text-3xl mv-flex mv-items-center mv-justify-center mv-rounded-full mv-border mv-overflow-hidden mv-shrink-0">
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
                  <Link to={`/organization/${organization.slug}`}>
                    <H3
                      like="h4"
                      className="mv-text-xl mv-mb-1 mv-no-underline hover:mv-underline"
                    >
                      {organization.name}
                    </H3>
                  </Link>
                  {organization.types.length !== 0 ? (
                    <p className="mv-font-bold mv-text-sm mv-cursor-default">
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
                <RemixFormsForm
                  schema={removeOrganizationSchema}
                  fetcher={removeOrganizationFetcher}
                  action={`/event/${slug}/settings/organizations/remove-organization`}
                  className="mv-ml-auto"
                >
                  {(remixFormsProps) => {
                    const { Button, Errors } = remixFormsProps;
                    return (
                      <>
                        <Errors />
                        <input
                          name="organizationId"
                          defaultValue={organization.id}
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
              </li>
            );
          })}
        </ul>
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
