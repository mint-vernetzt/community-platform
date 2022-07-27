import { Profile } from "@prisma/client";
import {
  ActionFunction,
  LoaderFunction,
  useLoaderData,
  useParams,
} from "remix";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, formAction } from "remix-forms";
import { forbidden } from "remix-utils";
import { z } from "zod";
import { deleteUserByUid } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { handleAuthorization } from "~/lib/auth/handleAuth";
import { getInitials } from "~/lib/profile/getInitials";
import {
  getOrganisationsOnProfileByUserId,
  getProfileByUserId,
} from "~/profile.server";
import Header from "../../Header";
import ProfileMenu from "../../ProfileMenu";

const schema = z.object({
  id: z.string().uuid(),
  confirmedToken: z
    .string()
    .regex(/wirklich löschen/, 'Bitte "wirklich löschen" eingeben.'),
});

type LoaderData = {
  profile: Pick<Profile, "firstName" | "lastName" | "id">;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const username = params.username ?? "";
  const currentUser = await handleAuthorization(request, username);

  const profile = await getProfileByUserId(currentUser.id, [
    "firstName",
    "lastName",
    "id",
  ]);

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
    successPath: `/profile/${username}/delete/goodbye`,
  });
  return formActionResult;
};

export default function Index() {
  const { profile } = useLoaderData<LoaderData>();
  const { username } = useParams();
  const initials = getInitials(profile);

  return (
    <>
      <Header username={username ?? ""} initials={initials} />

      <div className="container mx-auto px-4 relative z-10 pb-44">
        <div className="flex flex-col lg:flex-row -mx-4">
          <div className="md:flex md:flex-row px-4 pt-10 lg:pt-0">
            <div className="basis-4/12 px-4">
              <ProfileMenu username={username ?? ""} />
            </div>
            <div className="basis-6/12 px-4">
              <h1 className="mb-8">Profil löschen</h1>

              <h4 className="mb-4 font-semibold">Allgemein</h4>

              <p className="mb-8">
                Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
                diam nonumy eirmod tempor invidunt ut labore et dolore magna
                aliquyam erat, sed diam voluptua.
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
