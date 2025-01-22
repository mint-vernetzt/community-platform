import { Avatar } from "@mint-vernetzt/components";
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
import { getInitials } from "~/lib/profile/getInitials";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/root.server";
import { getProfileSuggestionsForAutocomplete } from "~/routes/utils.server";
import { deriveOrganizationMode } from "../utils.server";
import {
  getInvitedProfilesOfOrganization,
  getMembersOfOrganization,
  getOrganizationBySlug,
} from "./team.server";
import {
  addMemberSchema,
  type action as addMemberAction,
} from "./team/add-member";
import {
  cancelInviteSchema,
  type action as cancelInviteAction,
} from "./team/cancel-invite";
import {
  removeMemberSchema,
  type action as removeMemberAction,
} from "./team/remove-member";

const i18nNS = ["routes/organization/settings/team"];
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/organization/settings/team",
  ]);

  const { authClient } = createAuthClient(request);

  const slug = getParamValueOrThrow(params, "slug");
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  const organization = await getOrganizationBySlug(slug);
  invariantResponse(organization, t("error.notFound"), { status: 404 });

  const members = await getMembersOfOrganization(authClient, organization.id);

  const invitedProfiles = await getInvitedProfilesOfOrganization(
    authClient,
    organization.id
  );

  const url = new URL(request.url);
  const suggestionsQuery =
    url.searchParams.get("autocomplete_query") || undefined;
  let memberSuggestions;
  if (suggestionsQuery !== undefined && suggestionsQuery !== "") {
    const query = suggestionsQuery.split(" ");
    const profileIdsToFilter = [...members, ...invitedProfiles].map(
      (profile) => {
        return profile.id;
      }
    );
    memberSuggestions = await getProfileSuggestionsForAutocomplete(
      authClient,
      profileIdsToFilter,
      query
    );
  }

  return json({
    members,
    invitedProfiles,
    memberSuggestions,
    organizationId: organization.id,
    slug: slug,
  });
};

function Index() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const addMemberFetcher = useFetcher<typeof addMemberAction>();
  const cancelInviteFetcher = useFetcher<typeof cancelInviteAction>();
  const removeMemberFetcher = useFetcher<typeof removeMemberAction>();
  const [searchParams] = useSearchParams();
  const suggestionsQuery = searchParams.get("autocomplete_query");
  const submit = useSubmit();
  const { t } = useTranslation(i18nNS);

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>
      <p className="mb-2">{t("content.intro1")}</p>
      <p className="mb-8">{t("content.intro2")}</p>
      <h4 className="mb-4 font-semibold">{t("content.add.headline")}</h4>
      <p className="mb-8">{t("content.add.intro")}</p>
      <RemixFormsForm
        schema={addMemberSchema}
        fetcher={addMemberFetcher}
        action={`/organization/${slug}/settings/team/add-member`}
        onSubmit={() => {
          submit({
            method: "get",
            action: `/organization/${slug}/settings/team`,
          });
        }}
      >
        {({ Field, Errors, Button, register }) => {
          return (
            <div className="form-control w-full">
              <Errors />
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
                        suggestions={loaderData.memberSuggestions || []}
                        suggestionsLoaderPath={`/organization/${slug}/settings/team`}
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
          );
        }}
      </RemixFormsForm>
      {addMemberFetcher.data !== undefined &&
      "message" in addMemberFetcher.data ? (
        <div
          className={`p-4 ${
            addMemberFetcher.data.status === "success"
              ? "bg-green-200"
              : "bg-red-200"
          } rounded-md mt-4`}
        >
          {addMemberFetcher.data.message}
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
                    action={`/organization/${slug}/settings/team/cancel-invite`}
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
        {t("content.current.headline")}
      </h4>
      <p className="mb-8">{t("content.current.intro")} </p>
      <div className="mb-4 @md:mv-max-h-[630px] overflow-auto">
        {loaderData.members.map((profile) => {
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
                  action={`/organization/${slug}/settings/team/remove-member`}
                  schema={removeMemberSchema}
                  hiddenFields={["profileId"]}
                  values={{
                    profileId: profile.id,
                  }}
                  fetcher={removeMemberFetcher}
                >
                  {({ Field, Button, Errors }) => {
                    return (
                      <>
                        {loaderData.members.length > 1 ? (
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
      </div>
    </>
  );
}

export default Index;
