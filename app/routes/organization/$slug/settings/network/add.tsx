import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  useFetcher,
  useParams,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { InputError, makeDomainFunction } from "remix-domains";
import { Form, performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Autocomplete from "~/components/Autocomplete/Autocomplete";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import type { NetworkMemberSuggestions } from ".";
import { deriveOrganizationMode } from "../../utils.server";
import {
  connectOrganizationToNetwork,
  getOrganizationById,
  getOrganizationIdBySlug,
} from "../utils.server";
import { useTranslation } from "react-i18next";
import i18next from "~/i18next.server";
import { TFunction } from "i18next";

const schema = z.object({
  organizationId: z.string(),
});

const environmentSchema = z.object({
  slug: z.string(),
});

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const { organizationId } = values;

    const network = await getOrganizationIdBySlug(environment.slug);
    if (network === null) {
      throw t("error.notFound");
    }

    const organization = await getOrganizationById(organizationId);
    if (organization === null) {
      throw new InputError(
        t("error.inputError.doesNotExist"),
        "organizationId"
      );
    }

    const alreadyNetworkMember = organization.memberOf.some((entry) => {
      return entry.network.slug === environment.slug;
    });

    if (alreadyNetworkMember) {
      throw new InputError(
        t("error.inputError.alreadyMember"),
        "organizationId"
      );
    }

    const result = await connectOrganizationToNetwork(
      organization.id,
      network.id
    );
    if (result === null) {
      throw t("error.serverError");
    }

    return { ...values, name: organization.name };
  });
};

export const loader = async ({ request }: DataFunctionArgs) => {
  const response = new Response();

  createAuthClient(request, response);
  return redirect(".", { headers: response.headers });
};

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, [
    "routes/organization/settings/network/add",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { slug: slug },
  });
  if (result.success) {
    return json(
      {
        message: t("feedback", { title: result.data.name }),
      },
      { headers: response.headers }
    );
  }

  return json(result, { headers: response.headers });
};

type NetworkMemberProps = {
  networkMemberSuggestions: NetworkMemberSuggestions;
};

function Add(props: NetworkMemberProps) {
  const { slug } = useParams();
  const fetcher = useFetcher<typeof action>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();
  const { t } = useTranslation(["routes/organization/settings/network/add"]);

  return (
    <>
      <h4 className="mb-4 font-semibold">{t("content.headline")}</h4>
      <p className="mb-8">{t("content.intro")}</p>
      <Form
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
                    {t("content.label")}
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
      </Form>
      {fetcher.data !== undefined && "message" in fetcher.data ? (
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {fetcher.data.message}
        </div>
      ) : null}
    </>
  );
}

export default Add;
