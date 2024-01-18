import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveOrganizationMode } from "../utils.server";
import { deleteOrganizationBySlug, getProfileByUserId } from "./delete.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";

const schema = z.object({
  confirmedToken: z
    .string()
    .regex(/wirklich löschen/, 'Bitte "wirklich löschen" eingeben.'),
});

const environmentSchema = z.object({
  slug: z.string(),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });

  return null;
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  try {
    await deleteOrganizationBySlug(environment.slug);
  } catch {
    throw "Die Organisation konnte nicht gelöscht werden.";
  }
  return values;
});

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not privileged", { status: 403 });
  const profile = await getProfileByUserId(sessionUser.id);
  invariantResponse(profile, "Profile not found", { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: {
      slug: slug,
    },
  });

  if (result.success) {
    return redirect(`/profile/${profile.username}`);
  }

  return json(result);
};

export default function Delete() {
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

      <RemixFormsForm method="post" schema={schema}>
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
            <button
              type="submit"
              className="btn btn-outline-primary ml-auto btn-small"
            >
              Organisation endgültig löschen
            </button>
            <Errors />
          </>
        )}
      </RemixFormsForm>
    </>
  );
}
