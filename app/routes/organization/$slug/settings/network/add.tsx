import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  useFetcher,
  useParams,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Autocomplete from "~/components/Autocomplete/Autocomplete";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import type { NetworkMemberSuggestions } from ".";
import { deriveOrganizationMode } from "../../utils.server";
import {
  connectOrganizationToNetwork,
  getOrganizationById,
  getOrganizationIdBySlug,
} from "../utils.server";
import { detectLanguage } from "~/i18n.server";
import { type Jsonify } from "@remix-run/server-runtime/dist/jsonify";
import { type AddOrganizationNetworkMemberLocales } from "./add.server";
import { languageModuleMap } from "~/locales/.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { defaultLanguage } from "~/i18n.shared";

const schema = z.object({
  organizationId: z.string(),
});

const environmentSchema = z.object({
  slug: z.string(),
});

const createMutation = (locales: AddOrganizationNetworkMemberLocales) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const { organizationId } = values;

    const network = await getOrganizationIdBySlug(environment.slug);
    if (network === null) {
      throw locales.route.error.notFound;
    }

    const organization = await getOrganizationById(organizationId);
    if (organization === null) {
      throw new InputError(
        locales.route.error.inputError.doesNotExist,
        "organizationId"
      );
    }

    const alreadyNetworkMember = organization.memberOf.some((entry) => {
      return entry.network.slug === environment.slug;
    });

    if (alreadyNetworkMember) {
      throw new InputError(
        locales.route.error.inputError.alreadyMember,
        "organizationId"
      );
    }

    const result = await connectOrganizationToNetwork(
      organization.id,
      network.id
    );
    if (result === null) {
      throw locales.route.error.serverError;
    }

    return { ...values, name: organization.name };
  });
};

export const loader = async () => {
  return redirect(".");
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/settings/network/add"];
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.route.error.notPrivileged, {
    status: 403,
  });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(locales),
    environment: { slug: slug },
  });
  if (result.success) {
    return {
      message: insertParametersIntoLocale(locales.route.feedback, {
        title: result.data.name,
      }),
      locales,
      language,
    };
  }

  return { result, locales, language };
};

type NetworkMemberProps = {
  networkMemberSuggestions: Jsonify<NetworkMemberSuggestions> | undefined;
};

function Add(props: NetworkMemberProps) {
  const { slug } = useParams();
  const fetcher = useFetcher<typeof action>();
  const locales = fetcher.data !== undefined ? fetcher.data.locales : undefined;
  const language =
    fetcher.data !== undefined ? fetcher.data.language : undefined;
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();

  return (
    <>
      <h4 className="mb-4 font-semibold">
        {locales !== undefined
          ? locales.route.content.headline
          : "Add network member"}
      </h4>
      <p className="mb-8">
        {locales !== undefined
          ? locales.route.content.intro
          : "Add an existing organization to your network here"}
      </p>

      <RemixFormsForm
        schema={schema}
        fetcher={fetcher}
        action={`/organization/${slug}/settings/network/add`}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/organization/${slug}/settings/network`,
          });
        }}
      >
        {({ Field, Errors, Button, register }) => {
          return (
            <div className="form-control w-full">
              <Errors />
              <div className="flex flex-row items-center mb-2">
                <div className="flex-auto">
                  <label id="label-for-name" htmlFor="name" className="label">
                    {locales !== undefined
                      ? locales.route.content.label
                      : "Name of the organization"}
                  </label>
                </div>
              </div>

              <div className="flex flex-row">
                <Field name="organizationId" className="flex-auto">
                  {({ Errors }) => (
                    <>
                      <Errors />
                      <Autocomplete
                        suggestions={props.networkMemberSuggestions || []}
                        suggestionsLoaderPath={`/organization/${slug}/settings/network`}
                        defaultValue={suggestionsQuery || ""}
                        {...register("organizationId")}
                        searchParameter="autocomplete_query"
                        locales={locales}
                        currentLanguage={language || defaultLanguage}
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
      {fetcher.data !== undefined && "message" in fetcher.data ? (
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {fetcher.data.message}
        </div>
      ) : null}
    </>
  );
}

export default Add;
