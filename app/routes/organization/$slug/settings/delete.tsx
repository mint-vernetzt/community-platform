import { ActionFunction, LoaderFunction, redirect } from "@remix-run/node";
import { useParams } from "@remix-run/react";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { z } from "zod";
import Input from "~/components/FormElements/Input/Input";
import { deleteOrganizationBySlug } from "~/organization.server";
import { handleAuthorization } from "./utils.server";

const schema = z.object({
  slug: z.string(),
  confirmedToken: z
    .string()
    .regex(/wirklich löschen/, 'Bitte "wirklich löschen" eingeben.'),
});

export const loader: LoaderFunction = async (args) => {
  await handleAuthorization(args);

  return null;
};

const mutation = makeDomainFunction(schema)(async (values) => {
  try {
    await deleteOrganizationBySlug(values.slug);
  } catch {
    throw "Die Organisation konnte nicht gelöscht werden.";
  }
  return values;
});

export const action: ActionFunction = async (args) => {
  const { currentUser } = await handleAuthorization(args);
  const { request } = args;

  const result = await performMutation({
    request,
    schema,
    mutation,
  });

  if (result.success) {
    return redirect(`/profile/${currentUser.user_metadata.username}`);
  }

  return result;
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
