import { Profile } from "@prisma/client";
import { ActionFunction, LoaderFunction, useLoaderData } from "remix";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, formAction } from "remix-forms";
import { forbidden } from "remix-utils";
import { z } from "zod";
import { deleteUserByUid } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { handleAuthorization } from "~/lib/auth/handleAuth";
import {
  getOrganisationsOnProfileByUserId,
  getProfileByUserId,
} from "~/profile.server";

const schema = z.object({
  id: z.string().uuid(),
  confirmedToken: z
    .string()
    .regex(/wirklich löschen/, 'Bitte "wirklich löschen" eingeben.'),
});

type LoaderData = {
  profile: Pick<Profile, "id">;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const username = params.username ?? "";
  const currentUser = await handleAuthorization(request, username);

  const profile = await getProfileByUserId(currentUser.id, ["id"]);

  return { profile };
};

const mutation = makeDomainFunction(schema)(async (values) => {
  // TODO: is user a privileged member of any organisation?
  const profile = await getOrganisationsOnProfileByUserId(values.id);
  if (profile === null) {
    throw "Das Profil konnte nicht gefunden werden.";
  }
  profile.memberOf.some(({ organization, isPrivileged }) => {
    if (isPrivileged) {
      throw `Das Profil besitzt Administratorrechte in der Organisation "${organization.name}" und kann deshalb nicht gelöscht werden.`;
    }
    return false;
  });
  try {
    await deleteUserByUid(values.id);
  } catch {
    throw "Das Profil konnte nicht gelöscht werden.";
  }
  return values;
});

export const action: ActionFunction = async ({ request, params }) => {
  const username = params.username ?? "";
  const currentUser = await handleAuthorization(request, username);

  const requestClone = request.clone();
  const formData = await requestClone.formData();
  const formUserId = formData.get("id");
  if (formUserId !== currentUser.id) {
    throw forbidden({ message: "not allowed" });
  }

  const formActionResult = formAction({
    request,
    schema,
    mutation,
    successPath: `/goodbye`,
  });
  return formActionResult;
};

export default function Index() {
  const { profile } = useLoaderData<LoaderData>();

  return (
    <>
      <h1 className="mb-8">Profil löschen</h1>

      <h4 className="mb-4 font-semibold">Allgemein</h4>

      <p className="mb-8">
        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy
        eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
        voluptua.
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
            <Field name="id">
              {({ Errors }) => (
                <>
                  <input
                    type="hidden"
                    value={profile.id}
                    {...register("id")}
                  ></input>
                  <Errors />
                </>
              )}
            </Field>
            <button
              type="submit"
              className="btn btn-outline-primary ml-auto btn-small"
            >
              Profil entgültig löschen
            </button>
            <Errors />
          </>
        )}
      </RemixForm>
    </>
  );
}
