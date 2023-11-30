import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  useFetcher,
  useLoaderData,
  useParams,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { Form } from "remix-forms";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Autocomplete from "~/components/Autocomplete/Autocomplete";
import { H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getOrganizationSuggestionsForAutocomplete } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import { deriveProjectMode } from "../../utils.server";
import {
  getOwnOrganizationsSuggestions,
  getProjectBySlug,
  getResponsibleOrganizationDataFromProject,
} from "./organizations.server";
import {
  type action as addOrganizationAction,
  addOrganizationSchema,
} from "./organizations/add-organization";
import {
  type action as removeOrganizationAction,
  removeOrganizationSchema,
} from "./organizations/remove-organization";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";

export const handle = {
  i18n: ["routes/project/settings/organizations"],
};

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, [
    "routes/project/settings/organizations",
  ]);

  const authClient = createAuthClient(request, response);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);

  const project = await getProjectBySlug(slug);
  invariantResponse(project, t("error.notFound"), { status: 404 });
  const mode = await deriveProjectMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  await checkFeatureAbilitiesOrThrow(authClient, "projects");

  const organizations = getResponsibleOrganizationDataFromProject(project);
  const enhancedOrganizations = organizations.map((organization) => {
    if (organization.logo !== null) {
      const publicURL = getPublicURL(authClient, organization.logo);
      if (publicURL !== null) {
        organization.logo = getImageURL(publicURL, {
          resize: { type: "fill", width: 64, height: 64 },
          gravity: GravityType.center,
        });
      }
    }
    return organization;
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
      if (organization.logo !== null) {
        const publicURL = getPublicURL(authClient, organization.logo);
        if (publicURL !== null) {
          organization.logo = getImageURL(publicURL, {
            resize: { type: "fill", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      return organization;
    }
  );

  const url = new URL(request.url);
  const suggestionsQuery =
    url.searchParams.get("autocomplete_query") || undefined;
  let responsibleOrganizationSuggestions;
  if (suggestionsQuery !== undefined && suggestionsQuery !== "") {
    const query = suggestionsQuery.split(" ");
    const alreadyResponsibleOrganizationSlugs = organizations.map(
      (organization) => {
        return organization.slug;
      }
    );
    responsibleOrganizationSuggestions =
      await getOrganizationSuggestionsForAutocomplete(
        authClient,
        alreadyResponsibleOrganizationSlugs,
        query
      );
  }

  return json(
    {
      responsibleOrganizations: enhancedOrganizations,
      responsibleOrganizationSuggestions,
      ownOrganizationsSuggestions: enhancedOwnOrganizations,
    },
    { headers: response.headers }
  );
};

function Organizations() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const addOrganizationFetcher = useFetcher<typeof addOrganizationAction>();
  const removeOrganizationFetcher =
    useFetcher<typeof removeOrganizationAction>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();
  const { t } = useTranslation(["routes/project/settings/organizations"]);

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>
      <p className="mb-8">{t("content.intro")}</p>
      <h4 className="mb-4 mt-4 font-semibold">{t("content.add.headline")}</h4>
      <p className="mb-8">{t("content.add.intro")}</p>
      <Form
        schema={addOrganizationSchema}
        fetcher={addOrganizationFetcher}
        action={`/project/${slug}/settings/organizations/add-organization`}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/organization/${slug}/settings/network`,
          });
        }}
      >
        {({ Field, Errors, Button, register }) => {
          return (
            <>
              <Errors />
              <div className="form-control w-full">
                <div className="flex flex-row items-center mb-2">
                  <div className="flex-auto">
                    <label id="label-for-name" htmlFor="Name" className="label">
                      {t("content.add.label")}
                    </label>
                  </div>
                </div>

                <div className="flex flex-row">
                  <Field name="organizationId" className="flex-auto">
                    {({ Errors }) => (
                      <>
                        <Errors />
                        <Autocomplete
                          suggestions={
                            loaderData.responsibleOrganizationSuggestions || []
                          }
                          suggestionsLoaderPath={`/project/${slug}/settings/organizations`}
                          defaultValue={suggestionsQuery || ""}
                          {...register("organizationId")}
                          searchParameter="autocomplete_query"
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
            </>
          );
        }}
      </Form>
      {addOrganizationFetcher.data !== undefined &&
      "message" in addOrganizationFetcher.data ? (
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {addOrganizationFetcher.data.message}
        </div>
      ) : null}
      {loaderData.ownOrganizationsSuggestions.length > 0 ? (
        <>
          <h4 className="mb-4 mt-16 font-semibold">
            {t("content.own.headline")}
          </h4>
          <p className="mb-8">{t("content.own.intro")}</p>
          <div className="mb-4 md:max-h-[630px] overflow-auto">
            <ul>
              {loaderData.ownOrganizationsSuggestions.map((organization) => {
                const initials = getInitialsOfName(organization.name);
                return (
                  <li
                    className="w-full flex items-center flex-row flex-nowrap border-b border-neutral-400 py-4 md:px-4"
                    key={organization.id}
                  >
                    <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
                      {organization.logo !== null &&
                      organization.logo !== "" ? (
                        <img src={organization.logo} alt={organization.name} />
                      ) : (
                        <>{initials}</>
                      )}
                    </div>
                    <div className="pl-4">
                      <Link to={`/organization/${organization.slug}`}>
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
                              return relation.organizationType.title;
                            })
                            .join(" / ")}
                        </p>
                      ) : null}
                    </div>
                    <Form
                      schema={addOrganizationSchema}
                      fetcher={addOrganizationFetcher}
                      action={`/project/${slug}/settings/organizations/add-organization`}
                      hiddenFields={["organizationId"]}
                      values={{
                        organizationId: organization.id,
                      }}
                      className="ml-auto"
                    >
                      {(props) => {
                        const { Field, Errors } = props;
                        return (
                          <>
                            <Errors />
                            <Field name="organizationId" />
                            <button
                              className="btn btn-outline-primary ml-auto btn-small"
                              title="Hinzufügen"
                              type="submit"
                            >
                              {t("content.own.label")}
                            </button>
                          </>
                        );
                      }}
                    </Form>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}
      <h4 className="mb-4 mt-16 font-semibold">
        {t("content.current.headline")}
      </h4>
      <p className="mb-8">{t("content.current.intro")} </p>
      <div className="mb-4 md:max-h-[630px] overflow-auto">
        <ul>
          {loaderData.responsibleOrganizations.map((organization) => {
            const initials = getInitialsOfName(organization.name);
            return (
              <li
                className="w-full flex items-center flex-row flex-wrap sm:flex-nowrap border-b border-neutral-400 py-4 md:px-4"
                key={organization.id}
              >
                <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
                  {organization.logo !== null && organization.logo !== "" ? (
                    <img src={organization.logo} alt={organization.name} />
                  ) : (
                    <>{initials}</>
                  )}
                </div>
                <div className="pl-4">
                  <Link to={`/organization/${organization.slug}`}>
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
                          return relation.organizationType.title;
                        })
                        .join(" / ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex-100 sm:flex-auto sm:ml-auto flex items-center flex-row pt-4 sm:pt-0 justify-end">
                  <Form
                    schema={removeOrganizationSchema}
                    fetcher={removeOrganizationFetcher}
                    action={`/project/${slug}/settings/organizations/remove-organization`}
                    hiddenFields={["organizationId"]}
                    values={{
                      organizationId: organization.id,
                    }}
                  >
                    {(props) => {
                      const { Field, Button, Errors } = props;
                      return (
                        <>
                          <Errors />
                          <Field name="organizationId" />
                          <Button
                            className="ml-auto btn-none"
                            title={t("content.current.remove")}
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
                  </Form>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export default Organizations;
