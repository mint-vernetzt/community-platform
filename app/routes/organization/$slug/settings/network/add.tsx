import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useFetcher, useParams } from "@remix-run/react";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { InputError, makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { Form, performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import {
  connectOrganizationToNetwork,
  getOrganizationByName,
  getOrganizationIdBySlug,
  handleAuthorization,
} from "../utils.server";

const schema = z.object({
  name: z.string(),
  slug: z.string(),
});

const mutation = makeDomainFunction(schema)(async (values) => {
  const { name, slug } = values;

  const network = await getOrganizationIdBySlug(slug);
  if (network === null) {
    throw "Eure Organisation konnte nicht gefunden werden.";
  }

  const organization = await getOrganizationByName(name);
  if (organization === null) {
    throw new InputError(
      "Es existiert noch keine Organisation unter diesem Namen.",
      "name"
    );
  }

  if (network.id === organization.id) {
    throw new InputError(
      "Eure Organisation ist bereits Teil Eures Netzwerks.",
      "name"
    );
  }

  const stillMember = organization.memberOf.some((entry) => {
    return entry.network.slug === slug;
  });

  if (stillMember) {
    throw new InputError(
      "Die angegebene Organisation ist bereits Teil Eures Netzwerks.",
      "name"
    );
  }

  const result = await connectOrganizationToNetwork(
    organization.id,
    network.id
  );
  if (result === null) {
    throw "Die Organisation konnte leider nicht Eurem Netzwerk hinzugefügt werden.";
  }

  return values;
});

export const loader: LoaderFunction = async ({ request }) => {
  const response = new Response();

  createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    request,
    response,
  });
  return redirect(".", { headers: response.headers });
};

type SuccessActionData = {
  message: string;
};

type FailureActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema>
>;
export const action: ActionFunction = async (args) => {
  const { request, params } = args;
  const response = new Response();

  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      request,
      response,
    }
  );

  // TODO: Investigate: checkIdentityOrThrow is missing here but present in other actions

  const slug = getParamValueOrThrow(params, "slug");

  await handleAuthorization(supabaseClient, slug);

  const result = await performMutation({ request, schema, mutation });
  if (result.success) {
    return json<SuccessActionData>(
      {
        message: `Die Organisation "${result.data.name}" ist jetzt Teil Eures Netzwerks.`,
      },
      { headers: response.headers }
    );
  }

  return json<FailureActionData>(result, { headers: response.headers });
};

function Add() {
  const { slug } = useParams();
  const fetcher = useFetcher<SuccessActionData | FailureActionData>();

  return (
    <>
      <h4 className="mb-4 font-semibold">Netzwerkmitglied hinzufügen</h4>
      <p className="mb-8">
        Füge hier Eurem Netzwerk eine bereits bestehende Organisation hinzu.
      </p>
      <Form
        schema={schema}
        fetcher={fetcher}
        action={`/organization/${slug}/settings/network/add`}
        hiddenFields={["slug"]}
        values={{ slug }}
        onTransition={({ reset, formState }) => {
          if (formState.isSubmitSuccessful) {
            reset();
          }
        }}
      >
        {({ Field, Errors, Button }) => {
          return (
            <div className="form-control w-full">
              <div className="flex flex-row items-center mb-2">
                <div className="flex-auto">
                  <label id="label-for-name" htmlFor="name" className="label">
                    Name der Organisation
                  </label>
                </div>
              </div>

              <div className="flex flex-row">
                <Field name="name" className="flex-auto">
                  {({ Errors }) => (
                    <>
                      <input
                        id="name"
                        name="name"
                        className="input input-bordered w-full"
                      />
                      <Errors />
                    </>
                  )}
                </Field>
                <div className="ml-2">
                  <Button className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-neutral-500 text-neutral-600 mt-0.5">
                    +
                  </Button>
                </div>
              </div>
              <Field name="slug" />
            </div>
          );
        }}
      </Form>
      {fetcher.data !== undefined && "message" in fetcher.data && (
        <div className="p-4 bg-green-200 rounded-md mt-4">
          {fetcher.data.message}
        </div>
      )}
    </>
  );
}

export default Add;
