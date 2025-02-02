import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Link,
  useFetcher,
  useLoaderData,
  useParams,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import Autocomplete from "~/components/Autocomplete/Autocomplete";
import { H3 } from "~/components/Heading/Heading";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import i18next from "~/i18next.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { getInitials } from "~/lib/profile/getInitials";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/root.server";
import { getProfileSuggestionsForAutocomplete } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import { deriveOrganizationMode } from "../utils.server";
import {
  getInvitedProfilesOfOrganization,
  getOrganization,
} from "./admins.server";
import {
  addAdminSchema,
  type action as addAdminAction,
} from "./admins/add-admin";
import {
  cancelInviteSchema,
  type action as cancelInviteAction,
} from "./admins/cancel-invite";
import {
  removeAdminSchema,
  type action as removeAdminAction,
} from "./admins/remove-admin";
import { Avatar } from "@mint-vernetzt/components";

const i18nNS = ["routes/organization/settings/admins"];
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);
  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const organization = await getOrganization(slug);
  invariantResponse(organization, t("error.notFound"), { status: 404 });
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  const enhancedAdmins = organization.admins.map((relation) => {
    let avatar = relation.profile.avatar;
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width:
              ImageSizes.Profile.ListItemEventAndOrganizationSettings.Avatar
                .width,
            height:
              ImageSizes.Profile.ListItemEventAndOrganizationSettings.Avatar
                .height,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width:
              ImageSizes.Profile.ListItemEventAndOrganizationSettings
                .BlurredAvatar.width,
            height:
              ImageSizes.Profile.ListItemEventAndOrganizationSettings
                .BlurredAvatar.height,
          },
          blur: BlurFactor,
        });
      }
    }
    return { ...relation.profile, avatar, blurredAvatar };
  });

  const invitedProfiles = await getInvitedProfilesOfOrganization(
    authClient,
    organization.id
  );

  const url = new URL(request.url);
  const suggestionsQuery =
    url.searchParams.get("autocomplete_query") || undefined;
  let adminSuggestions;
  if (suggestionsQuery !== undefined && suggestionsQuery !== "") {
    const query = suggestionsQuery.split(" ");
    const alreadyAdminIds = [...enhancedAdmins, ...invitedProfiles].map(
      (relation) => {
        return relation.id;
      }
    );
    adminSuggestions = await getProfileSuggestionsForAutocomplete(
      authClient,
      alreadyAdminIds,
      query
    );
  }

  return json({
    admins: enhancedAdmins,
    invitedProfiles,
    adminSuggestions,
  });
};

function Admins() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const addAdminFetcher = useFetcher<typeof addAdminAction>();
  const cancelInviteFetcher = useFetcher<typeof cancelInviteAction>();
  const removeAdminFetcher = useFetcher<typeof removeAdminAction>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();
  const { t } = useTranslation(i18nNS);

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>
      <p className="mb-2">{t("content.intro1")}</p>
      <p className="mb-2">{t("content.intro2")}</p>
      <p className="mb-8">{t("content.intro3")}</p>
      <h4 className="mb-4 mt-4 font-semibold">{t("content.add.headline")}</h4>
      <p className="mb-8">{t("content.add.intro")}</p>
      <RemixFormsForm
        schema={addAdminSchema}
        fetcher={addAdminFetcher}
        action={`/organization/${slug}/settings/admins/add-admin`}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/organization/${slug}/settings/admins`,
          });
        }}
      >
        {({ Field, Errors, Button, register }) => {
          return (
            <>
              <Errors />
              <div className="form-control w-full">
                <div className="flex flex-row items-center mb-2">
                  <div className="flex-auto">
                    <label id="label-for-name" htmlFor="Name" className="label">
                      {t("content.add.label")}
                    </label>
                  </div>
                </div>

                <div className="flex flex-row">
                  <Field name="profileId" className="flex-auto">
                    {({ Errors }) => (
                      <>
                        <Errors />
                        <Autocomplete
                          suggestions={loaderData.adminSuggestions || []}
                          suggestionsLoaderPath={`/organization/${slug}/settings/admins`}
                          defaultValue={suggestionsQuery || ""}
                          {...register("profileId")}
                          searchParameter="autocomplete_query"
                        />
                      </>
                    )}
                  </Field>
                  <div className="ml-2">
                    <Button className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-neutral-500 text-neutral-600 mt-0.5">
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </>
          );
        }}
      </RemixFormsForm>
      {addAdminFetcher.data !== undefined &&
      "message" in addAdminFetcher.data ? (
        <div className={`p-4 bg-green-200 rounded-md mt-4`}>
          {addAdminFetcher.data.message}
        </div>
      ) : null}
      {loaderData.invitedProfiles.length > 0 ? (
        <>
          <h4 className="mb-4 mt-16 font-semibold">
            {t("content.invites.headline")}
          </h4>
          <p className="mb-8">{t("content.invites.intro")} </p>
          {loaderData.invitedProfiles.map((profile) => {
            const initials = getInitials(profile);
            return (
              <div
                key={`team-member-${profile.id}`}
                className="w-full flex items-center flex-row flex-wrap @sm:mv-flex-nowrap border-b border-neutral-400 py-4 @md:mv-px-4"
              >
                <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
                  {profile.avatar !== null && profile.avatar !== "" ? (
                    <Avatar
                      size="full"
                      firstName={profile.firstName}
                      lastName={profile.lastName}
                      avatar={profile.avatar}
                      blurredAvatar={profile.blurredAvatar}
                    />
                  ) : (
                    <>{initials}</>
                  )}
                </div>
                <div className="pl-4">
                  <Link to={`/profile/${profile.username}`}>
                    <H3
                      like="h4"
                      className="text-xl mb-1 no-underline hover:underline"
                    >
                      {profile.firstName} {profile.lastName}
                    </H3>
                  </Link>
                  {profile.position ? (
                    <p className="font-bold text-sm cursor-default">
                      {profile.position}
                    </p>
                  ) : null}
                </div>
                <div className="flex-100 @sm:mv-flex-auto @sm:mv-ml-auto flex items-center flex-row pt-4 @sm:mv-pt-0 justify-end">
                  <RemixFormsForm
                    method="post"
                    action={`/organization/${slug}/settings/admins/cancel-invite`}
                    schema={cancelInviteSchema}
                    hiddenFields={["profileId"]}
                    values={{
                      profileId: profile.id,
                    }}
                    fetcher={cancelInviteFetcher}
                  >
                    {({ Field, Button, Errors }) => {
                      return (
                        <>
                          <Button
                            className="ml-auto btn-none"
                            title={t("content.invites.cancel")}
                          >
                            <svg
                              viewBox="0 0 10 10"
                              width="10px"
                              height="10px"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M.808.808a.625.625 0 0 1 .885 0L5 4.116 8.308.808a.626.626 0 0 1 .885.885L5.883 5l3.31 3.308a.626.626 0 1 1-.885.885L5 5.883l-3.307 3.31a.626.626 0 1 1-.885-.885L4.116 5 .808 1.693a.625.625 0 0 1 0-.885Z"
                                fill="currentColor"
                              />
                            </svg>
                          </Button>
                          <Field name="profileId" />
                          <Errors />
                        </>
                      );
                    }}
                  </RemixFormsForm>
                </div>
              </div>
            );
          })}
        </>
      ) : null}
      <h4 className="mb-4 mt-16 font-semibold">
        {t("content.current.headline", { count: loaderData.admins.length })}
      </h4>
      <p className="mb-8">
        {t("content.current.intro", { count: loaderData.admins.length })}{" "}
      </p>
      <div className="mb-4 @md:mv-max-h-[630px] overflow-auto">
        {loaderData.admins.map((admin) => {
          const initials = getInitials(admin);
          return (
            <div
              key={`team-member-${admin.id}`}
              className="w-full flex items-center flex-row flex-wrap @sm:mv-flex-nowrap border-b border-neutral-400 py-4 @md:mv-px-4"
            >
              <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
                {admin.avatar !== null && admin.avatar !== "" ? (
                  <Avatar
                    size="full"
                    firstName={admin.firstName}
                    lastName={admin.lastName}
                    avatar={admin.avatar}
                    blurredAvatar={admin.blurredAvatar}
                  />
                ) : (
                  <>{initials}</>
                )}
              </div>
              <div className="pl-4">
                <Link to={`/profile/${admin.username}`}>
                  <H3
                    like="h4"
                    className="text-xl mb-1 no-underline hover:underline"
                  >
                    {admin.firstName} {admin.lastName}
                  </H3>
                </Link>
                {admin.position ? (
                  <p className="font-bold text-sm cursor-default">
                    {admin.position}
                  </p>
                ) : null}
              </div>
              <div className="flex-100 @sm:mv-flex-auto @sm:mv-ml-auto flex items-center flex-row pt-4 @sm:mv-pt-0 justify-end">
                <RemixFormsForm
                  schema={removeAdminSchema}
                  fetcher={removeAdminFetcher}
                  action={`/organization/${slug}/settings/admins/remove-admin`}
                  hiddenFields={["profileId"]}
                  values={{
                    profileId: admin.id,
                  }}
                >
                  {(props) => {
                    const { Field, Button, Errors } = props;
                    return (
                      <>
                        <Errors />
                        <Field name="profileId" />
                        {loaderData.admins.length > 1 ? (
                          <Button
                            className="ml-auto btn-none"
                            title={t("content.current.remove")}
                          >
                            <svg
                              viewBox="0 0 10 10"
                              width="10px"
                              height="10px"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M.808.808a.625.625 0 0 1 .885 0L5 4.116 8.308.808a.626.626 0 0 1 .885.885L5.883 5l3.31 3.308a.626.626 0 1 1-.885.885L5 5.883l-3.307 3.31a.626.626 0 1 1-.885-.885L4.116 5 .808 1.693a.625.625 0 0 1 0-.885Z"
                                fill="currentColor"
                              />
                            </svg>
                          </Button>
                        ) : null}
                      </>
                    );
                  }}
                </RemixFormsForm>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default Admins;
