import * as React from "react";

import {
  ActionFunction,
  Form,
  json,
  Link,
  LoaderFunction,
  useActionData,
  useLoaderData,
  useParams,
  useTransition,
} from "remix";
import { badRequest, forbidden } from "remix-utils";

import {
  AreasWithState,
  getAllOffers,
  getAreas,
  getProfileByUserId,
  updateProfileByUserId,
} from "~/profile.server";
import { getUser } from "~/auth.server";
import InputText from "~/components/FormElements/InputText/InputText";
import SelectField from "~/components/FormElements/SelectField/SelectField";
import TextArea from "~/components/FormElements/TextArea/TextArea";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import {
  ProfileError,
  ProfileFormFields,
  ProfileFormType,
  validateProfile,
} from "../edit/yupSchema";
import { Offer } from "@prisma/client";
import { createProfileFromFormData } from "~/lib/profile/form";
import { FormProvider, useForm } from "react-hook-form";
import { getInitials } from "~/lib/profile/getInitials";

export async function handleAuthorization(request: Request, username: string) {
  if (typeof username !== "string" || username === "") {
    throw badRequest({ message: "username must be provided" });
  }
  const currentUser = await getUser(request);

  if (currentUser?.user_metadata.username !== username) {
    throw forbidden({ message: "not allowed" });
  }

  return currentUser;
}

type LoaderData = {
  profile: ProfileFormType;
  areas: AreasWithState;
  offers: Offer[];
};

function makeFormProfileFromDbProfile(
  dbProfile: Awaited<ReturnType<typeof getProfileByUserId>>
) {
  return {
    ...dbProfile,
    areas: dbProfile?.areas.map((area) => area.areaId) ?? [],
    offers: dbProfile?.offers.map((offer) => offer.offerId) ?? [],
    seekings: dbProfile?.seekings.map((seeking) => seeking.offerId) ?? [],
  };
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const username = params.username ?? "";
  const currentUser = await handleAuthorization(request, username);

  let dbProfile = await getProfileByUserId(currentUser.id, ProfileFormFields);
  let profile = makeFormProfileFromDbProfile(dbProfile);

  const areas = await getAreas();
  const offers = await getAllOffers();

  return json({ profile, areas, offers });
};

export default function Index() {
  const { username } = useParams();
  const transition = useTransition();
  const { profile } = useLoaderData<LoaderData>();

  console.log("username: ", username);
  console.log("transition: ", transition);
  console.log("profile: ", profile);

  const initials = getInitials(profile);

  return (
    <>
      <header className="shadow-md mb-8">
        <div className="container mx-auto px-4 relative z-11">
          <div className="basis-full md:basis-6/12 px-4 pt-3 pb-3 flex flex-row items-center">
            <div>
              <Link to="/explore">
                <HeaderLogo />
              </Link>
            </div>

            <div className="ml-auto">
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-primary w-10 h-10">
                  {initials}
                </label>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                >
                  <li>
                    <Link to={`/profile/${username}`}>Profil anzeigen</Link>
                  </li>
                  <li>
                    <Link to={`/profile/${username}/edit`}>
                      Profil bearbeiten
                    </Link>
                  </li>
                  <li>
                    <Form action="/logout?index" method="post">
                      <button type="submit" className="w-full text-left">
                        Logout
                      </button>
                    </Form>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </header>
      <fieldset disabled={transition.state === "submitting"}>
        <div className="container mx-auto px-4 relative z-10 pb-44">
          <div className="flex flex-col lg:flex-row -mx-4">
            {/* refactor menu */}
            <div className="md:flex md:flex-row px-4 pt-10 lg:pt-0">
              <div className="basis-4/12 px-4">
                <div className="px-4 py-8 lg:p-8 pb-15 rounded-lg bg-neutral-200 shadow-lg relative mb-8">
                  <h3 className="font-bold mb-7">Profil bearbeiten</h3>
                  {/*TODO: add missing pages*/}
                  <ul>
                    <li>
                      <a
                        href={`/profile/${username}/edit`}
                        className="block text-3xl  text-neutral-500 hover:text-primary py-3"
                      >
                        Persönliche Daten
                      </a>
                    </li>
                    <li>
                      <a
                        href={`/profile/${username}/safety`}
                        className="block text-3xl text-primary py-3"
                      >
                        Login und Sicherheit
                      </a>
                    </li>
                  </ul>

                  <hr className="border-neutral-400 my-4 lg:my-8" />

                  <div className="">
                    {/* <a
                          href="/#"
                          className="block text-3xl text-neutral-500 hover:text-primary py-3"
                        > */}
                    <span className="block text-3xl text-neutral-500  py-3">
                      Profil löschen
                    </span>
                    {/* </a> */}
                  </div>
                </div>
              </div>
              <div className="basis-6/12 px-4">
                <h1 className="mb-8">Login und Sicherheit</h1>

                <h4 className="mb-4 font-semibold">Passwort ändern</h4>

                <p className="mb-8">
                  Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
                  diam nonumy eirmod tempor invidunt ut labore et dolore magna
                  aliquyam erat, sed diam voluptua.
                </p>

                <h4 className="mb-4 font-semibold">E-Mail ändern</h4>

                <p className="mb-8">
                  Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
                  diam nonumy eirmod tempor invidunt ut labore et dolore magna
                  aliquyam erat, sed diam voluptua.
                </p>
              </div>
            </div>
          </div>

          <footer className="fixed z-10 bg-white border-t-2 border-primary w-full inset-x-0 bottom-0">
            <div className="md:container md:mx-auto ">
              <div className="px-4 py-8 flex flex-row items-center justify-end"></div>
            </div>
          </footer>
        </div>
      </fieldset>
    </>
  );
}
