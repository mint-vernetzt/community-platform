import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useParams } from "@remix-run/react";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { Form as RemixForm, performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import Input from "~/components/FormElements/Input/Input";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deleteOrganizationBySlug } from "~/organization.server";
import { getProfileByUserId } from "~/profile.server";
import { handleAuthorization } from "./utils.server";

const schema = z.object({
  slug: z.string(),
  confirmedToken: z
    .string()
    .regex(/wirklich löschen/, 'Bitte "wirklich löschen" eingeben.'),
});

export const loader: LoaderFunction = async (args) => {
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

  const slug = getParamValueOrThrow(params, "slug");

  await handleAuthorization(supabaseClient, slug);

  return response;
};

const mutation = makeDomainFunction(schema)(async (values) => {
  try {
    await deleteOrganizationBySlug(values.slug);
  } catch {
    throw "Die Organisation konnte nicht gelöscht werden.";
  }
  return values;
});

type ActionData = PerformMutation<z.infer<Schema>, z.infer<typeof schema>>;

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

  const { sessionUser } = await handleAuthorization(supabaseClient, slug);

  const profile = await getProfileByUserId(sessionUser.id, ["username"]);

  const result = await performMutation({
    request,
    schema,
    mutation,
  });

  if (result.success) {
    return redirect(`/profile/${profile.username}`, {
      headers: response.headers,
    });
  }

  return json<ActionData>(result, { headers: response.headers });
};

export default function Delete() {
  const { slug } = useParams();
  return (
    <>
      <h1 className="mb-8">Organisation löschen</h1>

      <p className="mb-4 font-semibold">
        Schade, dass Du Eure Organisation löschen willst.
      </p>

      <p className="mb-8">
        Bitte gib "wirklich löschen" ein, um das Löschen zu bestätigen. Wenn Du
        danach auf Organisation endgültig löschen” klickst, wird Eure
        Organisation ohne erneute Abfrage gelöscht.
      </p>

      <RemixForm method="post" schema={schema}>
        {({ Field, Button, Errors, register }) => (
          <>
            <Field name="confirmedToken" className="mb-4">
              {({ Errors }) => (
                <>
                  <Input
                    id="confirmedToken"
                    label="Löschung bestätigen"
                    placeholder="wirklich löschen"
                    {...register("confirmedToken")}
                  />
                  <Errors />
                </>
              )}
            </Field>
            <Field name="slug">
              {({ Errors }) => (
                <>
                  <input
                    type="hidden"
                    value={slug || ""}
                    {...register("slug")}
                  ></input>
                  <Errors />
                </>
              )}
            </Field>
            <button
              type="submit"
              className="btn btn-outline-primary ml-auto btn-small"
            >
              Organisation endgültig löschen
            </button>
            <Errors />
          </>
        )}
      </RemixForm>
    </>
  );
}
