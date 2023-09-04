import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useParams } from "@remix-run/react";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveOrganizationMode } from "../utils.server";
import { deleteOrganizationBySlug, getProfileByUserId } from "./delete.server";

const schema = z.object({
  slug: z.string(),
  confirmedToken: z
    .string()
    .regex(/wirklich löschen/, 'Bitte "wirklich löschen" eingeben.'),
});

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });

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

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  // TODO: Investigate: checkIdentityOrThrow is missing here but present in other actions

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });

  const profile = await getProfileByUserId(sessionUser.id);
  invariantResponse(profile, "Profile not found", { status: 404 });

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

  return json(result, { headers: response.headers });
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
