import { Profile } from "@prisma/client";
import {
  ActionFunction,
  Form,
  LoaderFunction,
  redirect,
  useLoaderData,
} from "remix";
import { deleteUserByUid } from "~/auth.server";
import InputText from "~/components/FormElements/InputText/InputText";
import { handleAuthorization } from "~/lib/auth/handleAuth";

import { getInitials } from "~/lib/profile/getInitials";
import { getProfileByUserId } from "~/profile.server";

import Header from "../Header";
import ProfileMenu from "../ProfileMenu";

const CONFIRMATION_TOKEN = "wirklich löschen";

export const loader: LoaderFunction = async ({ request, params }) => {
  const username = params.username ?? "";
  const currentUser = await handleAuthorization(request, username);

  const dbProfile = await getProfileByUserId(currentUser.id);

  const initials = getInitials(dbProfile);

  return {
    username,
    initials,
  };
};

export const action: ActionFunction = async ({ request, params }) => {
  const username = params.username ?? "";
  const currentUser = await handleAuthorization(request, username);

  const formData = await request.formData();
  const confirmedToken = formData.get("confirmedToken") as string;

  if (confirmedToken === "wirklich löschen") {
    await deleteUserByUid(currentUser.id);

    return redirect(`/profile/${username}/delete/goodbye`);
  }

  return null;
};

export default function Index() {
  const { initials, username } = useLoaderData();
  return (
    <>
      <Header username={username ?? ""} initials={initials} />

      <div className="container mx-auto px-4 relative z-10 pb-44">
        <div className="flex flex-col lg:flex-row -mx-4">
          <div className="md:flex md:flex-row px-4 pt-10 lg:pt-0">
            <div className="basis-4/12 px-4">
              <ProfileMenu username={username as string} />
            </div>
            <div className="basis-6/12 px-4">
              <h1 className="mb-8">Profil löschen</h1>

              <h4 className="mb-4 font-semibold">Allgemein</h4>

              <p className="mb-8">
                Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
                diam nonumy eirmod tempor invidunt ut labore et dolore magna
                aliquyam erat, sed diam voluptua.
              </p>

              <Form method="post">
                <InputText
                  id="confirmedToken"
                  label="Löschung bestätigen"
                  placeholder="wirklich löschen"
                  required
                />
                <hr className="border-neutral-400 my-10 lg:my-4" />
                <button type="submit" className="btn btn-primary ml-4">
                  Profil entgültig löschen
                </button>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
