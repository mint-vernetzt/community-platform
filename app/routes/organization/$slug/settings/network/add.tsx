import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
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
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import type { NetworkMemberSuggestions } from ".";
import { deriveOrganizationMode } from "../../utils.server";
import {
  connectOrganizationToNetwork,
  getOrganizationById,
  getOrganizationIdBySlug,
} from "../utils.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";

const schema = z.object({
  organizationId: z.string(),
});

const environmentSchema = z.object({
  slug: z.string(),
});

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  const { organizationId } = values;

  const network = await getOrganizationIdBySlug(environment.slug);
  if (network === null) {
    throw "Eure Organisation konnte nicht gefunden werden.";
  }

  const organization = await getOrganizationById(organizationId);
  if (organization === null) {
    throw new InputError(
      "Es existiert noch keine Organisation unter diesem Namen.",
      "organizationId"
    );
  }

  const alreadyNetworkMember = organization.memberOf.some((entry) => {
    return entry.network.slug === environment.slug;
  });

  if (alreadyNetworkMember) {
    throw new InputError(
      "Die angegebene Organisation ist bereits Teil Eures Netzwerks.",
      "organizationId"
    );
  }

  const result = await connectOrganizationToNetwork(
    organization.id,
    network.id
  );
  if (result === null) {
    throw "Die Organisation konnte leider nicht Eurem Netzwerk hinzugefügt werden.";
  }

  return { ...values, name: organization.name };
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();

  createAuthClient(request, response);
  return redirect(".", { headers: response.headers });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { slug: slug },
  });
  if (result.success) {
    return json(
      {
        message: `Die Organisation "${result.data.name}" ist jetzt Teil Eures Netzwerks.`,
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

  return (
    <>
      <h4 className="mb-4 font-semibold">Netzwerkmitglied hinzufügen</h4>
      <p className="mb-8">
        Füge hier Eurem Netzwerk eine bereits bestehende Organisation hinzu.
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
                    Name der Organisation
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
