import { GravityType } from "imgproxy/dist/types";
import {
  ActionFunction,
  Form,
  json,
  Link,
  LoaderFunction,
  unstable_parseMultipartFormData,
  UploadHandler,
  useActionData,
  useLoaderData,
} from "remix";
import { badRequest, forbidden, notFound, serverError } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import ExternalServiceIcon from "~/components/ExternalService/ExternalServiceIcon";
import InputImage from "~/components/FormElements/InputImage/InputImage";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import { H3 } from "~/components/Heading/Heading";
import { ExternalService } from "~/components/types";
import { builder } from "~/imgproxy";
import { getOrganizationInitials } from "~/lib/organization/getOrganizationInitials";
import { getFullName } from "~/lib/profile/getFullName";
import { getInitials } from "~/lib/profile/getInitials";
import { nl2br } from "~/lib/string/nl2br";
import {
  getOrganizationBySlug,
  getOrganizationMembersBySlug,
  OrganizationWithRelations,
} from "~/organization.server";
import { prismaClient } from "~/prisma";
import { getProfileByUserId, ProfileWithRelations } from "~/profile.server";
import { supabaseAdmin } from "~/supabase";
import { createHashFromString } from "~/utils.server";

type LoaderData = {
  organization: Partial<OrganizationWithRelations>;
  loggedInUserProfile?: Pick<
    ProfileWithRelations,
    "firstName" | "lastName" | "avatar" | "username"
  >;
  userIsPrivileged: boolean;
  images: {
    logo?: string;
    background?: string;
    avatarOfLoggedInUser?: string;
  };
};

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;
  const { slug } = params;
  if (slug === undefined || slug === "") {
    throw badRequest({ message: "organization slug must be provided" });
  }
  const loggedInUser = await getUserByRequest(request);
  let loggedInUserProfile;
  const unfilteredOrganization = await getOrganizationBySlug(slug);
  if (unfilteredOrganization === null) {
    throw notFound({ message: "Not found" });
  }
  let organization: Partial<OrganizationWithRelations> = {};
  let userIsPrivileged;

  let images: {
    logo?: string;
    background?: string;
    avatarOfLoggedInUser?: string;
  } = {};
  if (unfilteredOrganization.logo) {
    const { publicURL } = supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
      .from("images")
      .getPublicUrl(unfilteredOrganization.logo);
    if (publicURL) {
      images.logo = builder
        .resize("fit", 480, 144)
        .dpr(2)
        .generateUrl(publicURL);
    }
  }
  if (unfilteredOrganization.background) {
    const { publicURL } = supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
      .from("images")
      .getPublicUrl(unfilteredOrganization.background);
    if (publicURL) {
      images.background = builder
        .resize("fill", 1488, 480)
        .gravity(GravityType.north_east)
        .dpr(2)
        .generateUrl(publicURL);
    }
  }
  unfilteredOrganization.memberOf.map(({ network }) => {
    if (network.logo !== null) {
      const { publicURL } = supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
        .from("images")
        .getPublicUrl(network.logo);
      if (publicURL !== null) {
        const logo = builder
          .resize("fit", 64, 64)
          .gravity(GravityType.center)
          .dpr(2)
          .generateUrl(publicURL);
        network.logo = logo;
      }
    }
  });

  unfilteredOrganization.networkMembers.map(({ networkMember }) => {
    if (networkMember.logo !== null) {
      const { publicURL } = supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
        .from("images")
        .getPublicUrl(networkMember.logo);
      if (publicURL !== null) {
        const logo = builder
          .resize("fit", 64, 64)
          .gravity(GravityType.center)
          .dpr(2)
          .generateUrl(publicURL);
        networkMember.logo = logo;
      }
    }
  });

  unfilteredOrganization.teamMembers.map(({ profile }) => {
    if (profile.avatar !== null) {
      const { publicURL } = supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
        .from("images")
        .getPublicUrl(profile.avatar);
      if (publicURL !== null) {
        const avatar = builder
          .resize("fill", 64, 64)
          .gravity(GravityType.center)
          .dpr(2)
          .generateUrl(publicURL);
        profile.avatar = avatar;
      }
    }
  });

  if (loggedInUser === null) {
    let key: keyof Partial<OrganizationWithRelations>;
    const publicFields = [
      "name",
      "slug",
      "street",
      "streetNumber",
      "zipCode",
      "city",
      "logo",
      "background",
      "types",
      "supportedBy",
      "publicFields",
      "teamMembers",
      "memberOf",
      "networkMembers",
      "createdAt",
      "areas",
      ...unfilteredOrganization.publicFields,
    ];
    for (key in unfilteredOrganization) {
      if (publicFields.includes(key)) {
        // @ts-ignore
        organization[key] = unfilteredOrganization[key];
      }
    }
    userIsPrivileged = false;
  } else {
    organization = unfilteredOrganization;
    loggedInUserProfile = await getProfileByUserId(loggedInUser.id, [
      "username",
      "firstName",
      "lastName",
      "avatar",
    ]);
    if (loggedInUserProfile && loggedInUserProfile.avatar) {
      const { publicURL } = supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
        .from("images")
        .getPublicUrl(loggedInUserProfile.avatar);
      if (publicURL) {
        images.avatarOfLoggedInUser = builder
          .resize("fit", 64, 64)
          .dpr(2)
          .generateUrl(publicURL);
      }
    }
    userIsPrivileged = unfilteredOrganization.teamMembers.some(
      (member) => member.profileId === loggedInUser.id && member.isPrivileged
    );
  }

  return {
    organization,
    loggedInUserProfile,
    userIsPrivileged,
    images,
  };
};

type ActionData = {
  images: { logo?: string; background?: string };
};

export const action: ActionFunction = async (args) => {
  const { request, params } = args;

  const { slug } = params;
  if (slug === undefined || slug === "") {
    throw badRequest({ message: "organization slug must be provided" });
  }
  const loggedInUser = await getUserByRequest(request);
  if (loggedInUser === null) {
    throw forbidden({ message: "Not allowed" });
  }
  const organization = await getOrganizationMembersBySlug(slug);
  if (organization === null) {
    throw notFound({ message: "Not found" });
  }
  if (
    !organization.teamMembers.some(
      (member) => member.profileId === loggedInUser.id && member.isPrivileged
    )
  ) {
    throw forbidden({ message: "Not allowed" });
  }

  const uploadHandler: UploadHandler = async (params) => {
    const { name, stream, filename } = params;

    // Don't process stream
    if (name !== "logo" && name !== "background") {
      stream.resume();
      return;
    }

    // Buffer stuff
    const chunks = [];
    for await (let chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const hash = await createHashFromString(buffer.toString());
    const extension = filename.split(".")[filename.split(".").length - 1];
    const path = `${hash.substring(0, 2)}/${hash.substring(
      2
    )}/${name}.${extension}`;

    const { data, error } = await supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
      .from("images")
      .upload(path, buffer, {
        upsert: true,
      });

    if (error || data === null) {
      console.error(error);
      throw serverError({ message: "Upload failed!" });
    }

    await prismaClient.organization.update({
      where: {
        slug: slug,
      },
      data: {
        [name]: path,
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

  let images: { logo?: string; background?: string } = {};

  const logoPublicURL = formData.get("logo");
  if (logoPublicURL && typeof logoPublicURL === "string") {
    images.logo = builder
      .resize("fit", 480, 144)
      .dpr(2)
      .generateUrl(logoPublicURL);
  }
  const backgroundPublicURL = formData.get("background");
  if (backgroundPublicURL && typeof backgroundPublicURL === "string") {
    images.background = builder
      .resize("fit", 1488, 480)
      .dpr(2)
      .generateUrl(backgroundPublicURL);
  }

  return json({ images });
};

function hasContactInformations(
  organization: Partial<OrganizationWithRelations>
) {
  const hasEmail =
    typeof organization.email === "string" && organization.email !== "";
  const hasPhone =
    typeof organization.phone === "string" && organization.phone !== "";
  return hasEmail || hasPhone;
}

function notEmptyData(
  key: keyof OrganizationWithRelations,
  organization: Partial<OrganizationWithRelations>
) {
  if (typeof organization[key] === "string") {
    return organization[key] !== "";
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
  organization: Partial<OrganizationWithRelations>,
  externalServices: ExternalService[]
) {
  return externalServices.some((item) => notEmptyData(item, organization));
}

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
  let initialsOfLoggedInUser = "";
  if (loaderData.loggedInUserProfile) {
    initialsOfLoggedInUser = getInitials(loaderData.loggedInUserProfile);
  }
  const avatarOfLoggedInUser = loaderData.images.avatarOfLoggedInUser;
  let initialsOfOrganization = "";
  if (loaderData.organization.name) {
    initialsOfOrganization = getOrganizationInitials(
      loaderData.organization.name
    );
  }

  const actionData = useActionData<ActionData>();

  let logo;
  if (actionData && actionData.images.logo) {
    logo = actionData.images.logo;
  } else if (loaderData.images.logo) {
    logo = loaderData.images.logo;
  }

  let background;
  if (actionData && actionData.images.background) {
    background = actionData.images.background;
  } else if (loaderData.images.background) {
    background = loaderData.images.background;
  }

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
            {loaderData.loggedInUserProfile ? (
              <div className="ml-auto">
                <div className="dropdown dropdown-end">
                  {avatarOfLoggedInUser === undefined ? (
                    <label tabIndex={0} className="btn btn-primary w-10 h-10">
                      {initialsOfLoggedInUser}
                    </label>
                  ) : (
                    <label tabIndex={0} className="w-10 h-10 rounded-md">
                      <img
                        src={avatarOfLoggedInUser}
                        alt={initialsOfLoggedInUser}
                        className="w-10 h-10 rounded-md"
                      />
                    </label>
                  )}
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                  >
                    <li>
                      <Link
                        to={`/profile/${loaderData.loggedInUserProfile.username}`}
                      >
                        Profil anzeigen
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={`/profile/${loaderData.loggedInUserProfile.username}/edit`}
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
          {background && (
            <img src={background} alt="" className="object-cover h-full" />
          )}
          {loaderData.userIsPrivileged && (
            <div className="absolute bottom-6 right-6">
              <Form method="post" encType="multipart/form-data">
                <label htmlFor="background">Hintergrund</label>
                <InputImage
                  id="background"
                  name="background"
                  maxSize={5 * 1024 * 1024} // 5 MB
                  minWidth={1488} // 1488 px
                  minHeight={480} // 480 px
                  maxWidth={1920} // 1920 px
                  maxHeight={1080} // 1080 px
                />
                <button className="btn btn-primary btn-small">Upload</button>
              </Form>
            </div>
          )}
        </div>
      </section>
      <div className="container relative pb-44">
        <div className="flex flex-col md:flex-row -mx-4">
          <div className="md:flex-1/2 lg:flex-5/12 px-4 pt-10 lg:pt-0">
            <div className="px-4 py-8 lg:p-8 pb-15 md:pb-5 rounded-3xl border border-neutral-400 bg-neutral-200 shadow-lg relative lg:ml-14 lg:-mt-64">
              <div className="flex items-center flex-col">
                {logo ? (
                  <div className="h-36 w-100 flex items-center justify-center">
                    <img
                      src={logo}
                      alt={loaderData.organization.name || ""}
                      className="max-w-full w-auto max-h-36 h-auto"
                    />
                  </div>
                ) : (
                  <div className="h-36 w-36 bg-primary text-white text-6xl flex items-center justify-center rounded-md overflow-hidden">
                    {initialsOfOrganization}
                  </div>
                )}
                {loaderData.userIsPrivileged && (
                  <Form method="post" encType="multipart/form-data">
                    <label htmlFor="logo">Logo</label>
                    <InputImage
                      id="logo"
                      name="logo"
                      maxSize={2 * 1024 * 1024} // 2 MB
                      minWidth={144} // 144 px
                      minHeight={144} // 144 px
                      maxWidth={500} // 500 px
                      maxHeight={500} // 500 px
                    />
                    <button className="btn btn-primary btn-small">
                      Upload
                    </button>
                  </Form>
                )}
                <h3 className="mt-6 text-5xl mb-1">
                  {loaderData.organization.name || ""}
                </h3>
                {loaderData.organization.types &&
                  loaderData.organization.types.length > 0 && (
                    <p className="font-bold text-sm">
                      {loaderData.organization.types
                        .map(({ organizationType }) => organizationType.title)
                        .join(", ")}
                    </p>
                  )}
              </div>
              {hasContactInformations(loaderData.organization) ||
                (hasWebsiteOrSocialService(
                  loaderData.organization,
                  ExternalServices
                ) && <h5 className="font-semibold mb-6 mt-8">Kontakt</h5>)}
              {hasContactInformations(loaderData.organization) && (
                <>
                  {typeof loaderData.organization.email === "string" &&
                    loaderData.organization.email !== "" && (
                      <p className="text-mb mb-2">
                        <a
                          href={`mailto:${loaderData.organization.email}`}
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
                          <span>{loaderData.organization.email}</span>
                        </a>
                      </p>
                    )}
                  {typeof loaderData.organization.phone === "string" &&
                    loaderData.organization.phone !== "" && (
                      <p className="text-md text-neutral-600 mb-2">
                        <a
                          href={`tel:${loaderData.organization.phone}`}
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
                          <span>{loaderData.organization.phone}</span>
                        </a>
                      </p>
                    )}
                </>
              )}

              {/* --- WEBSITE & SOCIAL --- */}
              {hasWebsiteOrSocialService(
                loaderData.organization,
                ExternalServices
              ) && (
                <ul className="list-none flex flex-wrap -mx-1 mb-2">
                  {ExternalServices.map((service) => {
                    if (
                      typeof loaderData.organization[service] === "string" &&
                      loaderData.organization[service] !== ""
                    ) {
                      return (
                        <li key={service} className="flex-auto px-1">
                          <ExternalServiceIcon
                            service={service}
                            url={loaderData.organization[service] as string}
                          />
                        </li>
                      );
                    }

                    return false;
                  })}
                </ul>
              )}

              {typeof loaderData.organization.street === "string" &&
                loaderData.organization.street !== "" && (
                  <>
                    <h5 className="font-semibold mb-6 mt-8">Anschrift</h5>
                    <p className="text-md text-neutral-600 mb-2 flex nowrap flex-row items-center px-4 py-3 bg-neutral-300 rounded-lg text-neutral-600">
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
                      <span>
                        {loaderData.organization.street}{" "}
                        {loaderData.organization.streetNumber}
                        <br />
                        {loaderData.organization.zipCode}{" "}
                        {loaderData.organization.city}
                      </span>
                    </p>
                  </>
                )}
              <hr className="divide-y divide-neutral-400 mt-8 mb-6" />

              {loaderData.organization.createdAt && (
                <p className="text-xs mb-4 text-center">
                  Profil besteht seit dem{" "}
                  {new Date(
                    loaderData.organization.createdAt
                  ).toLocaleDateString("de-De", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
            {/** TODO: Styling of quote section */}
            {typeof loaderData.organization.quote === "string" &&
              loaderData.organization.quote !== "" && (
                <div className="py-8 px-4 pb-15 md:pb-5 relative lg:ml-14">
                  <div className="mb-0 text-[72px] leading-none">“</div>
                  <div className="mb-4">"{loaderData.organization.quote}"</div>
                  <div className="text-primary font-bold">
                    {loaderData.organization.quoteAuthor || ""}
                  </div>
                  <div>
                    {loaderData.organization.quoteAuthorInformation || ""}
                  </div>
                </div>
              )}
          </div>

          <div className="md:flex-1/2 lg:flex-7/12 px-4 pt-10 lg:pt-20">
            <div className="flex flex-col-reverse lg:flex-row flex-nowrap">
              <div className="flex-auto pr-4 mb-6">
                <h1 className="mb-0">{loaderData.organization.name || ""}</h1>
              </div>
              {loaderData.userIsPrivileged && loaderData.organization.slug && (
                <div className="flex-initial lg:pl-4 pt-3 mb-6">
                  <Link
                    className="btn btn-outline btn-primary"
                    to={`/organization/${loaderData.organization.slug}/settings`}
                  >
                    Organisation bearbeiten
                  </Link>
                </div>
              )}
            </div>
            {typeof loaderData.organization.bio === "string" &&
              loaderData.organization.bio !== "" && (
                <p
                  className="mb-6"
                  dangerouslySetInnerHTML={{
                    __html: nl2br(loaderData.organization.bio, true),
                  }}
                />
              )}
            {loaderData.organization.areas &&
              loaderData.organization.areas.length > 0 && (
                <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                    Aktivitätsgebiete
                  </div>
                  <div className="lg:flex-auto">
                    {loaderData.organization.areas
                      .map(({ area }) => area.name)
                      .join(" / ")}
                  </div>
                </div>
              )}
            {/* TODO: Add "MINT-Schwerpunkte*/}
            {loaderData.organization.focuses &&
              loaderData.organization.focuses.length > 0 && (
                <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                    MINT-Schwerpunkte
                  </div>

                  <div className="flex-auto">
                    {loaderData.organization.focuses
                      .map(({ focus }) => focus.title)
                      .join(" / ")}
                  </div>
                </div>
              )}
            {loaderData.organization.supportedBy &&
              loaderData.organization.supportedBy.length > 0 && (
                <div className="flex mb-6 font-semibold flex-col lg:flex-row">
                  <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                    Unterstützt und gefördert von
                  </div>

                  <div className="flex-auto">
                    {loaderData.organization.supportedBy.join(" / ")}
                  </div>
                </div>
              )}
            {loaderData.organization.memberOf &&
              loaderData.organization.memberOf.length > 0 && (
                <>
                  <h3 className="mb-6 mt-14 font-bold">Teil des Netzwerks</h3>
                  <div className="flex flex-wrap -mx-3 items-stretch">
                    {loaderData.organization.memberOf &&
                      loaderData.organization.memberOf.length > 0 &&
                      loaderData.organization.memberOf.map(
                        ({ network }, index) => (
                          <div
                            key={`profile-${index}`}
                            data-testid="gridcell"
                            className="flex-100 md:flex-1/2 px-3 mb-4"
                          >
                            <Link
                              to={`/organization/${network.slug}`}
                              className="flex flex-wrap content-start items-start p-4 rounded-2xl hover:bg-neutral-200 border border-neutral-500"
                            >
                              <div className="w-full flex items-center flex-row">
                                {network.logo !== "" &&
                                network.logo !== null ? (
                                  <div className="h-16 w-16 flex items-center justify-center relative">
                                    <img
                                      className="max-w-full w-auto max-h-16 h-auto"
                                      src={network.logo}
                                      alt={network.name}
                                    />
                                  </div>
                                ) : (
                                  <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-md overflow-hidden">
                                    {getOrganizationInitials(network.name)}
                                  </div>
                                )}
                                <div className="pl-4">
                                  <H3 like="h4" className="text-xl mb-1">
                                    {network.name}
                                  </H3>
                                  {network.types &&
                                    network.types.length > 0 && (
                                      <p className="font-bold text-sm">
                                        {network.types
                                          .map(
                                            ({ organizationType }) =>
                                              organizationType.title
                                          )
                                          .join(", ")}
                                      </p>
                                    )}
                                </div>
                              </div>
                            </Link>
                          </div>
                        )
                      )}
                  </div>
                </>
              )}
            {loaderData.organization.networkMembers &&
              loaderData.organization.networkMembers.length > 0 && (
                <>
                  <h3 className="mb-6 mt-14 font-bold">
                    Mitgliedsorganisationen
                  </h3>
                  <div className="flex flex-wrap -mx-3 items-stretch">
                    {loaderData.organization.networkMembers &&
                      loaderData.organization.networkMembers.length > 0 &&
                      loaderData.organization.networkMembers.map(
                        ({ networkMember }, index) => (
                          <div
                            key={`profile-${index}`}
                            data-testid="gridcell"
                            className="flex-100 md:flex-1/2 px-3 mb-4"
                          >
                            <Link
                              to={`/organization/${networkMember.slug}`}
                              className="flex flex-wrap content-start items-start p-4 rounded-2xl hover:bg-neutral-200 border border-neutral-500"
                            >
                              <div className="w-full flex items-center flex-row">
                                {networkMember.logo !== "" &&
                                networkMember.logo !== null ? (
                                  <div className="h-16 w-16 flex items-center justify-center relative">
                                    <img
                                      className="max-w-full w-auto max-h-16 h-auto"
                                      src={networkMember.logo}
                                      alt={networkMember.name}
                                    />
                                  </div>
                                ) : (
                                  <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-md overflow-hidden">
                                    {getOrganizationInitials(
                                      networkMember.name
                                    )}
                                  </div>
                                )}
                                <div className="pl-4">
                                  <H3 like="h4" className="text-xl mb-1">
                                    {networkMember.name}
                                  </H3>
                                  {networkMember.types &&
                                    networkMember.types.length > 0 && (
                                      <p className="font-bold text-sm">
                                        {networkMember.types
                                          .map(
                                            ({ organizationType }) =>
                                              organizationType.title
                                          )
                                          .join(", ")}
                                      </p>
                                    )}
                                </div>
                              </div>
                            </Link>
                          </div>
                        )
                      )}
                  </div>
                </>
              )}
            {loaderData.organization.teamMembers &&
              loaderData.organization.teamMembers.length > 0 && (
                <>
                  <h3 className="mb-6 mt-14 font-bold">Das Team</h3>
                  <div className="flex flex-wrap -mx-3 items-stretch">
                    {loaderData.organization.teamMembers.map(
                      ({ profile }, index) => (
                        <div
                          key={`profile-${index}`}
                          data-testid="gridcell"
                          className="flex-100 md:flex-1/2 px-3 mb-4"
                        >
                          <Link
                            to={`/profile/${profile.username}`}
                            className="flex flex-wrap content-start items-start p-4 rounded-2xl hover:bg-neutral-200 border border-neutral-500"
                          >
                            <div className="w-full flex items-center flex-row">
                              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-md overflow-hidden">
                                {profile.avatar !== null &&
                                profile.avatar !== "" ? (
                                  <img
                                    src={profile.avatar}
                                    alt={getFullName(profile)}
                                  />
                                ) : (
                                  getInitials(profile)
                                )}
                              </div>
                              <div className="pl-4">
                                <H3 like="h4" className="text-xl mb-1">
                                  {getFullName(profile)}
                                </H3>
                                {profile.position && (
                                  <p className="font-bold text-sm">
                                    {profile.position}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Link>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}
          </div>
        </div>
      </div>
    </>
  );
}
