import { Area, Offer, Profile } from "@prisma/client";
import {
  ActionFunction,
  Form,
  json,
  Link,
  LoaderFunction,
  redirect,
  unstable_parseMultipartFormData,
  UploadHandler,
  useActionData,
  useLoaderData,
} from "remix";
import { badRequest, forbidden, notFound, serverError } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { Chip } from "~/components/Chip/Chip";
import ExternalServiceIcon from "~/components/ExternalService/ExternalServiceIcon";
import InputImage from "~/components/FormElements/InputImage/InputImage";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import { ExternalService } from "~/components/types";
import { getFullName } from "~/lib/profile/getFullName";
import { getInitials } from "~/lib/profile/getInitials";
import { nl2br } from "~/lib/string/nl2br";
import { prismaClient } from "~/prisma";
import { getProfileByUserId, getProfileByUsername } from "~/profile.server";
import { supabaseAdmin } from "~/supabase";
import { createHashFromStream } from "~/utils.server";
import { ProfileFormType } from "./edit/yupSchema";

type ProfileRelations = { areas: { area: Area }[] } & {
  offers: { offer: Offer }[];
} & { seekings: { offer: Offer }[] };

type ProfileLoaderData = {
  currentUser?: Partial<Profile & ProfileRelations>;
  mode: Mode;
  data: Partial<Profile & ProfileRelations>;
};

type Mode = "anon" | "authenticated" | "owner";
export function deriveMode(
  profileUsername: string,
  sessionUsername: string
): Mode {
  if (sessionUsername === "" || sessionUsername === undefined) {
    return "anon";
  }

  return profileUsername === sessionUsername ? "owner" : "authenticated";
}

export const loader: LoaderFunction = async (
  args
): Promise<Response | ProfileLoaderData> => {
  const { request, params } = args;
  const { username } = params;

  if (typeof username !== "string" || username === "") {
    throw badRequest({ message: "Username must be provided" });
  }

  const profile = await getProfileByUsername(username);
  if (profile === null) {
    throw notFound({ message: "Not found" });
  }

  const sessionUser = await getUserByRequest(request);
  const mode: Mode = deriveMode(username, sessionUser?.user_metadata?.username);

  const currentUser = sessionUser?.id
    ? await getProfileByUserId(sessionUser.id, [
        "username",
        "firstName",
        "lastName",
        "website",
        "facebook",
        "linkedin",
        "twitter",
        "xing",
      ])
    : undefined;

  const publicFields = [
    "id",
    "username",
    "firstName",
    "lastName",
    "academicTitle",
    "areas",
    ...profile.publicFields,
  ];

  let data: Partial<ProfileFormType> = {};
  for (const key in profile) {
    if (mode !== "anon" || publicFields.includes(key)) {
      // @ts-ignore <-- Partials allow undefined, Profile not
      data[key] = profile[key];
    }
  }

  return json({ mode, data, currentUser });
};

export const action: ActionFunction = async (args) => {
  const { request, params } = args;

  const { username } = params;
  const sessionUser = await getUserByRequest(request);

  if (
    sessionUser === null ||
    username !== sessionUser?.user_metadata?.username
  ) {
    throw forbidden({ message: "Not allowed" });
  }

  const uploadHandler: UploadHandler = async (params) => {
    const { name, stream, filename } = params;

    // Don't process stream
    if (name !== "avatarFile") {
      stream.resume();
      return;
    }

    // Buffer stuff
    const chunks = [];
    for await (let chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const hash = await createHashFromStream("md5", stream, "hex");
    const extension = filename.split(".")[filename.split(".").length - 1];
    const path = `${hash.substring(0, 2)}/${hash.substring(
      2
    )}/avatar.${extension}`;

    const { data, error } = await supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
      .from("images")
      .upload(path, buffer, {
        upsert: true,
      });

    if (error || data === null) {
      console.error(error);
      throw serverError({ message: "Upload failed!" });
    }

    await prismaClient.profile.update({
      where: {
        id: sessionUser.id,
      },
      data: {
        avatar: path,
      },
    });

    const { publicURL } = supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
      .from("images")
      .getPublicUrl(path);

    if (publicURL === null) {
      throw serverError({ message: "Can't access public url of image!" });
    }

    return publicURL;
  };

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  const publicURL = formData.get("avatarFile");

  return json({ publicURL });
};

function hasContactInformations(data: Partial<Profile>) {
  const hasEmail = typeof data.email === "string" && data.email !== "";
  const hasPhone = typeof data.phone === "string" && data.phone !== "";
  return hasEmail || hasPhone;
}

function notEmptyData(key: keyof Profile, data: Partial<Profile>) {
  if (typeof data[key] === "string") {
    return data[key] !== "";
  }
  return false;
}

const ExternalServices: ExternalService[] = [
  "website",
  "linkedin",
  "facebook",
  "twitter",
  "xing",
];
function hasWebsiteOrSocialService(
  data: Partial<Profile>,
  externalServices: ExternalService[]
) {
  return externalServices.some((item) => notEmptyData(item, data));
}

export default function Index() {
  const loaderData = useLoaderData<ProfileLoaderData>();
  let initialsOfCurrentUser = "";
  if (loaderData.currentUser !== undefined) {
    initialsOfCurrentUser = getInitials(loaderData.currentUser);
  }
  const initials = getInitials(loaderData.data);
  const fullName = getFullName(loaderData.data);

  const actionData = useActionData();

  return (
    <>
      <header className="shadow-md mb-8">
        <div className="container relative z-10">
          <div className="py-3 flex flex-row items-center">
            <div>
              <Link to="/explore">
                <HeaderLogo />
              </Link>
            </div>
            {/* TODO: link to login on anon*/}
            {loaderData.mode !== "anon" &&
            loaderData.currentUser !== undefined ? (
              <div className="ml-auto">
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn btn-primary w-10 h-10">
                    {initialsOfCurrentUser}
                  </label>
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                  >
                    <li>
                      <Link to={`/profile/${loaderData.currentUser.username}`}>
                        Profil anzeigen
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={`/profile/${loaderData.currentUser.username}/edit`}
                      >
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
            ) : (
              <div className="ml-auto">
                <Link
                  to="/login"
                  className="text-primary font-bold hover:underline"
                >
                  Anmelden
                </Link>{" "}
                /{" "}
                <Link
                  to="/register"
                  className="text-primary font-bold hover:underline"
                >
                  Registrieren
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <section className="hidden md:block container mt-8 md:mt-10 lg:mt-20">
        <div className="hero hero-news flex items-end rounded-3xl relative overflow-hidden bg-yellow-500 h-60 lg:h-120">
          {loaderData.mode === "owner" && (
            <div className="absolute bottom-6 right-6">
              <button className="btn btn-primary" disabled>
                Hintergrund ändern
              </button>
            </div>
          )}
        </div>
      </section>
      <div className="container relative pb-44">
        <div className="flex flex-col md:flex-row -mx-4">
          <div className="md:flex-1/2 lg:flex-5/12 px-4 pt-10 lg:pt-0">
            <div className="px-4 py-8 lg:p-8 pb-15 md:pb-5 rounded-3xl border border-neutral-400 bg-neutral-200 shadow-lg relative lg:ml-14 lg:-mt-64">
              <div className="flex items-center flex-col">
                <div className="h-36 w-36 bg-primary text-white text-6xl flex items-center justify-center rounded-md">
                  {actionData !== undefined && actionData.publicURL !== null ? (
                    <a href={actionData.publicURL}>{initials}</a>
                  ) : (
                    initials
                  )}
                  {/* {initials} */}
                </div>
                {loaderData.mode === "owner" && (
                  <Form method="post" encType="multipart/form-data">
                    <label htmlFor="avatarFile">Avatar</label>
                    <InputImage
                      id="avatarFile"
                      name="avatarFile"
                      maxSize={2 * 1024 * 1024} // 2 MB
                      maxWidth={500} // 500 px
                      maxHeight={500} // 500 px
                    />
                    <button className="btn btn-primary">Upload</button>
                  </Form>
                )}
                <h3 className="mt-6 text-5xl mb-1">{fullName}</h3>
                {typeof loaderData.data.position === "string" && (
                  <p className="font-bold text-sm">
                    {loaderData.data.position}
                  </p>
                )}
              </div>
              {hasContactInformations(loaderData.data) && (
                <>
                  <h5 className="font-semibold mb-6 mt-8">Kontakt</h5>
                  {typeof loaderData.data.email === "string" &&
                    loaderData.data.email !== "" && (
                      <p className="text-mb mb-2">
                        <a
                          href={`mailto:${loaderData.data.email}`}
                          className="flex items-center px-4 py-3 bg-neutral-300 rounded-lg text-neutral-600"
                        >
                          <span className="icon w-6 mr-4">
                            <svg
                              width="24"
                              height="19"
                              viewBox="0 0 24 19"
                              className="fill-current"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M0 3.6a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-12Zm3-1.5a1.5 1.5 0 0 0-1.5 1.5v.325l10.5 6.3 10.5-6.3V3.6A1.5 1.5 0 0 0 21 2.1H3Zm19.5 3.574-7.062 4.238 7.062 4.345V5.675Zm-.051 10.314-8.46-5.206L12 11.975l-1.989-1.193-8.46 5.205A1.5 1.5 0 0 0 3 17.1h18a1.5 1.5 0 0 0 1.449-1.112ZM1.5 14.258l7.062-4.346L1.5 5.674v8.584Z" />
                            </svg>
                          </span>
                          <span>{loaderData.data.email}</span>
                        </a>
                      </p>
                    )}
                  {typeof loaderData.data.phone === "string" &&
                    loaderData.data.phone !== "" && (
                      <p className="text-md text-neutral-600 mb-2">
                        <a
                          href={`tel:${loaderData.data.phone}`}
                          className="flex items-center px-4 py-3 bg-neutral-300 rounded-lg text-neutral-600"
                        >
                          <span className="icon w-6 mr-4">
                            <svg
                              width="22"
                              height="22"
                              viewBox="0 0 22 22"
                              className="fill-current"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M5.134 1.993a.915.915 0 0 0-1.37-.085L2.367 3.305c-.653.654-.893 1.578-.608 2.39a23.717 23.717 0 0 0 5.627 8.92 23.717 23.717 0 0 0 8.92 5.627c.812.285 1.736.045 2.39-.608l1.396-1.395a.916.916 0 0 0-.086-1.37l-3.114-2.422a.916.916 0 0 0-.783-.165l-2.956.738a2.356 2.356 0 0 1-2.237-.62L7.6 11.085a2.355 2.355 0 0 1-.62-2.237l.74-2.956a.915.915 0 0 0-.166-.783L5.134 1.993ZM2.744.89a2.356 2.356 0 0 1 3.526.22l2.422 3.113c.444.571.6 1.315.425 2.017L8.38 9.197a.915.915 0 0 0 .24.868l3.317 3.317a.915.915 0 0 0 .87.24l2.954-.739a2.354 2.354 0 0 1 2.017.426l3.113 2.421a2.355 2.355 0 0 1 .22 3.525l-1.395 1.396c-1 .999-2.493 1.438-3.884.948a25.156 25.156 0 0 1-9.464-5.967A25.156 25.156 0 0 1 .401 6.17c-.49-1.39-.05-2.885.949-3.884L2.745.89Z" />
                            </svg>
                          </span>
                          <span>{loaderData.data.phone}</span>
                        </a>
                      </p>
                    )}

                  {/* --- WEBSITE & SOCIAL --- */}
                  {hasWebsiteOrSocialService(
                    loaderData.data,
                    ExternalServices
                  ) && (
                    <ul className="list-none flex flex-wrap -mx-1">
                      {ExternalServices.map((service) => {
                        if (
                          typeof loaderData.data[service] === "string" &&
                          loaderData.data[service] !== ""
                        ) {
                          return (
                            <li key={service} className="flex-auto px-1">
                              <ExternalServiceIcon
                                service={service}
                                url={loaderData.data[service] as string}
                              />
                            </li>
                          );
                        }

                        return false;
                      })}
                    </ul>
                  )}

                  <hr className="divide-y divide-neutral-400 mt-8 mb-6" />

                  {loaderData.data.createdAt !== undefined && (
                    <p className="text-xs mb-4 text-center">
                      Profil besteht seit dem{" "}
                      {new Date(loaderData.data.createdAt).toLocaleDateString(
                        "de-De",
                        { day: "numeric", month: "long", year: "numeric" }
                      )}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="md:flex-1/2 lg:flex-7/12 px-4 pt-10 lg:pt-20">
            <div className="flex flex-col-reverse lg:flex-row flex-nowrap">
              <div className="flex-auto pr-4 mb-6">
                <h1 className="mb-0">Hi, ich bin {fullName}</h1>
              </div>
              {loaderData.mode === "owner" &&
                loaderData.currentUser !== undefined && (
                  <div className="flex-initial lg:pl-4 pt-3 mb-6">
                    <Link
                      className="btn btn-outline btn-primary whitespace-nowrap"
                      to={`/profile/${loaderData.currentUser.username}/edit`}
                    >
                      {/* TODO: nowrap should be default on buttons, right?*/}
                      Profil bearbeiten
                    </Link>
                  </div>
                )}
            </div>
            {typeof loaderData.data.bio === "string" && (
              <p
                className="mb-6"
                dangerouslySetInnerHTML={{
                  __html: nl2br(loaderData.data.bio, true),
                }}
              />
            )}
            {loaderData.data.areas !== undefined &&
              loaderData.data.areas.length > 0 && (
                <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                    Aktivitätsgebiete
                  </div>
                  <div className="lg:flex-auto">
                    {loaderData.data.areas
                      .map(({ area }) => area.name)
                      .join(" / ")}
                  </div>
                </div>
              )}
            {loaderData.data.skills !== undefined &&
              loaderData.data.skills.length > 0 && (
                <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                    Kompetenzen
                  </div>

                  <div className="flex-auto">
                    {loaderData.data.skills.join(" / ")}
                  </div>
                </div>
              )}

            {loaderData.data.interests !== undefined &&
              loaderData.data.interests.length > 0 && (
                <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                    Interessen
                  </div>
                  <div className="flex-auto">
                    {loaderData.data.interests.join(" / ")}
                  </div>
                </div>
              )}
            {loaderData.data.offers !== undefined &&
              loaderData.data.offers.length > 0 && (
                <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                    Ich biete
                  </div>
                  <div className="flex-auto">
                    {loaderData.data.offers?.map(({ offer }) => (
                      <Chip
                        key={`offer_${offer.title}`}
                        title={offer.title}
                        slug=""
                        isEnabled
                      />
                    ))}
                  </div>
                </div>
              )}
            {loaderData.data.seekings !== undefined &&
              loaderData.data.seekings.length > 0 && (
                <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                    Ich suche
                  </div>
                  <div className="flex-auto">
                    {loaderData.data.seekings?.map(({ offer }) => (
                      <Chip
                        key={`seeking_${offer.title}`}
                        title={offer.title}
                        slug=""
                        isEnabled
                      />
                    ))}
                  </div>
                </div>
              )}
            {/* TODO: implement organizations */}
            {/* <div className="flex flex-row flex-nowrap mb-6 mt-14 items-center">
              <div className="flex-auto pr-4">
                <h3 className="mb-0 font-bold">Assoziert mit</h3>
              </div>

              <div className="flex-initial pl-4">
                <button className="btn btn-outline btn-primary">
                  Organisation anlegen
                </button>
              </div>
            </div>
            <div className="flex mb-6 text-sm flex-wrap -m-3 flex-col lg:flex-row">
              <div className="lg:flex-1/2 p-3">
                <div className="flex p-4 rounded-lg border border-neutral-500">
                  <div className="mr-4">Logo</div>
                  <div>
                    <p className="font-bold">MINTvernetzt</p>
                    <p>gemeinnützige Organisation, Verein</p>
                  </div>
                </div>
              </div>

              <div className="lg:flex-1/2 p-3">
                <div className="flex p-4 rounded-lg border border-neutral-500">
                  <div className="mr-4">Logo</div>
                  <div>
                    <p className="font-bold">MINTvernetzt</p>
                    <p>gemeinnützige Organisation, Verein</p>
                  </div>
                </div>
              </div>

              <div className="lg:flex-1/2 p-3">
                <div className="flex p-4 rounded-lg border border-neutral-500">
                  <div className="mr-4">Logo</div>
                  <div>
                    <p className="font-bold">MINTvernetzt</p>
                    <p>gemeinnützige Organisation, Verein</p>
                  </div>
                </div>
              </div>

              <div className="lg:flex-1/2 p-3">
                <div className="flex p-4 rounded-lg border border-neutral-500">
                  <div className="mr-4">Logo</div>
                  <div>
                    <p className="font-bold">Zukunft durch Innovation</p>
                    <p>
                      gemeinnützige Organisation, Verein, gemeinnützige
                      Organisation, Verein
                    </p>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
}
