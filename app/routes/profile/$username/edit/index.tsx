import {
  ActionFunction,
  Form,
  json,
  LoaderFunction,
  useActionData,
  useLoaderData,
  useParams,
} from "remix";
import { badRequest, forbidden } from "remix-utils";
import {
  getProfileByUsername,
  updateProfileByUsername,
} from "../../../../profile.server";

import { getUser } from "../../../../auth.server";
import { Profile } from "@prisma/client";

export async function handleAuthorization(request: Request, username: string) {
  if (typeof username !== "string" || username === "") {
    throw badRequest({ message: "username must be provided" });
  }
  const currentUser = await getUser(request);

  if (currentUser?.user_metadata.username !== username) {
    throw forbidden({ message: "not allowed" });
  }
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const username = params.username ?? ""; //?

  await handleAuthorization(request, username);

  const profileData = await getProfileByUsername(username);

  return json(profileData);
};

export const action: ActionFunction = async ({ request, params }) => {
  const username = params.username ?? ""; //?
  await handleAuthorization(request, username);

  const formData = await request.formData();

  const profileData: Partial<Profile> = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    publicFields: formData.getAll("publicFields") as string[],
  };

  await updateProfileByUsername(username, profileData);

  return json({ errors: { lastName: "required" } });
};

export default function Index() {
  let { username } = useParams();
  let actionData = useActionData();
  let profile = useLoaderData<Profile>();

  return (
    <Form method="post">
      <div>
        <header className="shadow-md mb-8">
          <div className="md:container md:mx-auto relative z-10">
            <div className="px-4 pt-3 pb-3 flex flex-row items-center">
              <div className="">
                <HeaderLogo />
              </div>
              <div className="ml-auto">UserMenu</div>
            </div>
          </div>
        </header>

        <div className="md:container md:mx-auto relative z-10 pb-44">
          <div className="flex flex-row -mx-4">
            <div className="basis-4/12 px-4">
              <div className="p-4 lg:p-8 pb-15 md:pb-5 rounded-lg bg-neutral-200 shadow-lg relative">
                <h3 className="font-bold mb-7">Profil bearbeiten</h3>
                <ul>
                  <li>
                    <a href="" className="block text-3xl text-primary py-3">
                      Persönliche Daten
                    </a>
                  </li>
                  <li>
                    <a
                      href=""
                      className="block text-3xl text-neutral-500 hover:text-primary py-3"
                    >
                      Login und Sicherheit
                    </a>
                  </li>
                  <li>
                    <a
                      href=""
                      className="block text-3xl text-neutral-500 hover:text-primary py-3"
                    >
                      Website und Soziale Netzwerke
                    </a>
                  </li>
                </ul>

                <hr className="border-neutral-400 my-8" />

                <div className="">
                  <a
                    href=""
                    className="block text-3xl text-neutral-500 hover:text-primary py-3"
                  >
                    Profil löschen
                  </a>
                </div>
              </div>
            </div>
            <div className="basis-6/12 px-4">
              <h1 className="mb-8">Persönliche Daten</h1>

              <h4 className="mb-4 font-semibold">Allgemein</h4>

              <p className="mb-8">
                Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
                diam nonumy eirmod tempor invidunt ut labore et dolore magna
                aliquyam erat, sed diam voluptua.
              </p>

              <div className="flex flex-row -mx-4 mb-4">
                <div className="basis-6/12 px-4">
                  <SelectField
                    id="academicTitle"
                    label="Titel"
                    options={[
                      {
                        label: "Dr.",
                        value: "Dr.",
                      },
                      {
                        label: "Prof.",
                        value: "Prof.",
                      },
                      {
                        label: "Prof. Dr.",
                        value: "Prof. Dr.",
                      },
                    ]}
                  />
                </div>
                <div className="basis-6/12 px-4">
                  <InputText
                    id="position"
                    label="Position"
                    isHideable
                    isPublic={profile.publicFields.includes("position")}
                  />
                </div>
              </div>

              <div className="flex flex-row -mx-4 mb-4">
                <div className="basis-6/12 px-4">
                  <InputText
                    id="firstName"
                    label="Vorname"
                    isRequired
                    defaultValue={profile.firstName}
                    isPublic={profile.publicFields.includes("firstName")}
                  />
                </div>
                <div className="basis-6/12 px-4">
                  <InputText
                    id="lastName"
                    label="Nachname"
                    isRequired
                    defaultValue={profile.lastName}
                    f
                  />
                </div>
              </div>

              <div className="flex flex-row -mx-4 mb-4">
                <div className="basis-6/12 px-4">
                  <InputText
                    id="email"
                    label="E-Mail"
                    isHideable
                    defaultValue={profile.email}
                    isPublic={profile.publicFields.includes("email")}
                  />
                </div>
                <div className="basis-6/12 px-4">
                  <InputText
                    id="phone"
                    label="Telefon"
                    isHideable
                    defaultValue={profile.phone}
                  />
                </div>
              </div>

              <hr className="border-neutral-400 my-16" />

              <div className="flex flex-row items-center mb-4">
                <h4 className="font-semibold">Über mich</h4>
                <button className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-neutral-500 text-neutral-600 ml-auto">
                  <svg
                    className="block w-6 h-6"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 10C20 10 16.25 3.125 10 3.125C3.75 3.125 0 10 0 10C0 10 3.75 16.875 10 16.875C16.25 16.875 20 10 20 10ZM1.46625 10C2.07064 9.0814 2.7658 8.22586 3.54125 7.44625C5.15 5.835 7.35 4.375 10 4.375C12.65 4.375 14.8488 5.835 16.46 7.44625C17.2354 8.22586 17.9306 9.0814 18.535 10C18.4625 10.1087 18.3825 10.2287 18.2913 10.36C17.8725 10.96 17.2538 11.76 16.46 12.5538C14.8488 14.165 12.6488 15.625 10 15.625C7.35 15.625 5.15125 14.165 3.54 12.5538C2.76456 11.7741 2.0694 10.9186 1.465 10H1.46625Z"
                      fill="#454C5C"
                    />
                    <path
                      d="M10 6.875C9.1712 6.875 8.37634 7.20424 7.79029 7.79029C7.20424 8.37634 6.875 9.1712 6.875 10C6.875 10.8288 7.20424 11.6237 7.79029 12.2097C8.37634 12.7958 9.1712 13.125 10 13.125C10.8288 13.125 11.6237 12.7958 12.2097 12.2097C12.7958 11.6237 13.125 10.8288 13.125 10C13.125 9.1712 12.7958 8.37634 12.2097 7.79029C11.6237 7.20424 10.8288 6.875 10 6.875ZM5.625 10C5.625 8.83968 6.08594 7.72688 6.90641 6.90641C7.72688 6.08594 8.83968 5.625 10 5.625C11.1603 5.625 12.2731 6.08594 13.0936 6.90641C13.9141 7.72688 14.375 8.83968 14.375 10C14.375 11.1603 13.9141 12.2731 13.0936 13.0936C12.2731 13.9141 11.1603 14.375 10 14.375C8.83968 14.375 7.72688 13.9141 6.90641 13.0936C6.08594 12.2731 5.625 11.1603 5.625 10Z"
                      fill="#454C5C"
                    />
                  </svg>
                </button>
              </div>

              <p className="mb-8">
                Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
                diam nonumy eirmod tempor invidunt ut labore et dolore magna
                aliquyam erat, sed diam voluptua.
              </p>

              <div className="mb-4">
                <TextArea label="Kurzbeschreibung" isHideable />
              </div>

              <div className="mb-4">
                <InputAdd label="Aktivitätsgebiete" />
              </div>

              <div className="mb-4">
                <InputAdd label="Kompetenzen" />
              </div>

              <div className="mb-4">
                <InputAdd label="Interessen" />
              </div>

              <hr className="border-neutral-400 my-16" />

              <h4 className="mb-4 font-semibold">Ich biete</h4>

              <p className="mb-8">
                Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
                diam nonumy eirmod tempor invidunt ut labore et dolore magna
                aliquyam erat, sed diam voluptua.
              </p>

              <div className="mb-4">
                <InputAdd id="offering" />
              </div>

              <hr className="border-neutral-400 my-16" />

              <h4 className="mb-4 font-semibold">Ich suche</h4>

              <p className="mb-8">
                Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
                diam nonumy eirmod tempor invidunt ut labore et dolore magna
                aliquyam erat, sed diam voluptua.
              </p>

              <div className="mb-4">
                <InputAdd id="searching" />
              </div>

              <hr className="border-neutral-400 my-16" />

              <div className="flex flex-row items-center mb-4">
                <h4 className="font-semibold">Organisation hinzufügen</h4>
                <button
                  type="submit"
                  className="btn btn-outline-primary ml-auto btn-small"
                >
                  Organisation anlegen
                </button>
              </div>
              <p className="mb-8">
                Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
                diam nonumy eirmod tempor invidunt ut labore et dolore magna
                aliquyam erat, sed diam voluptua.
              </p>

              <div className="mb-4">
                <InputAdd id="organizations" label="Organisation hinzufügen" />
              </div>
            </div>
          </div>
        </div>

        <footer className="fixed z-10 bg-white border-t-2 border-primary w-full inset-x-0 bottom-0">
          <div className="md:container md:mx-auto ">
            <div className="px-4 py-8 flex flex-row items-center justify-end">
              <div className="">
                <button type="submit" className="btn btn-link">
                  Änderungen verwerfen
                </button>

                <button type="submit" className="btn btn-primary ml-4">
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Form>
  );
}
