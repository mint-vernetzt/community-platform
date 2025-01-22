import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
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
import { useTranslation } from "react-i18next";
import i18next from "~/i18next.server";
import { type TFunction } from "i18next";
import { detectLanguage } from "~/root.server";
import { type Jsonify } from "@remix-run/server-runtime/dist/jsonify";

const i18nNS = [
  "routes/organization/settings/network/index",
  "routes/organization/settings/network/add",
  "datasets/organizationTypes",
];
export const handle = {
  i18n: i18nNS,
};

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

export const loader = async () => {
  return redirect(".");
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
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
    return json({
      message: t("feedback", { title: result.data.name }),
    });
  }

  return json(result);
};

type NetworkMemberProps = {
  networkMemberSuggestions: Jsonify<NetworkMemberSuggestions> | undefined;
};

function Add(props: NetworkMemberProps) {
  const { slug } = useParams();
  const fetcher = useFetcher<typeof action>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();
  const { t } = useTranslation(i18nNS);

  return (
    <>
      <h4 className="mb-4 font-semibold">{t("content.headline")}</h4>
      <p className="mb-8">{t("content.intro")}</p>
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
                    {t("content.label", {
                      ns: "routes/organization/settings/network/add",
                    })}
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
