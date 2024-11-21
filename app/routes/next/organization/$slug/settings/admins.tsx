import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { Input, Section, Button } from "@mint-vernetzt/components";
import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useLocation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/root.server";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import { BackButton } from "~/routes/project/$slug/settings/__components";
import { getToast } from "~/toast.server";
import {
  getOrganizationWithAdmins,
  getPendingAdminInvitesOfOrganization,
} from "./admins.server";
import { DeepSearchParam, SearchProfilesSearchParam } from "~/searchParams";
import { searchProfiles } from "~/routes/utils.server";
import { searchProfilesI18nNS, searchProfilesSchema } from "~/schemas";
import { deriveMode } from "~/utils.server";
import { getZodConstraint } from "@conform-to/zod-v1";
import { ListContainer, ListItem } from "~/routes/my/__components";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";

// TODO: Import namespaces from validation functions if neccessary (searchProfiles, inviteProfileToBeOrganizationAdmin, cancelAdminInvitation, removeAdminFromOrganization)
const i18nNS = [
  "routes/next/organization/settings/admins",
  ...searchProfilesI18nNS,
];
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const mode = deriveMode(sessionUser);

  const organization = await getOrganizationWithAdmins(slug, authClient);
  invariantResponse(organization !== null, t("error.invariant.notFound"), {
    status: 404,
  });

  const pendingAdminInvites = await getPendingAdminInvitesOfOrganization(
    organization.id,
    authClient
  );

  const pendingAndCurrentAdminIds = [
    ...organization.admins.map((relation) => relation.profile.id),
    ...pendingAdminInvites.map((invite) => invite.id),
  ];
  const { searchedProfiles, submission } = await searchProfiles({
    searchParams: new URL(request.url).searchParams,
    idsToExclude: pendingAndCurrentAdminIds,
    authClient,
    t,
    mode,
  });

  const { toast, headers: toastHeaders } = await getToast(request);

  return json(
    {
      organization,
      pendingAdminInvites,
      searchedProfiles,
      submission,
      toast,
    },
    {
      headers: toastHeaders || undefined,
    }
  );
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedOrganizationRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  await checkFeatureAbilitiesOrThrow(authClient, ["next-organization-create"]);

  let response;
  const formData = await request.formData();
  const intent = formData.get("intent");
  // TODO: Add all existing intents to the invariantResponse check
  invariantResponse(intent !== null, t("error.invariant.invalidRequest"), {
    status: 400,
  });

  // TODO: clean action

  // Switch intents and for each:

  // response = await inviteProfileToBeOrganizationAdmin(formData, slug);
  // response = await cancelAdminInvitation(formData, slug);
  // response = await removeAdminFromOrganization(formData, slug);

  return response;
};

function Admins() {
  const {
    // organization,
    // pendingAdminInvites,
    searchedProfiles,
    submission,
    // toast,
  } = useLoaderData<typeof loader>();

  const location = useLocation();
  const { t } = useTranslation(i18nNS);
  const submit = useSubmit();
  const [searchParams] = useSearchParams();

  const [searchForm, searchFields] = useForm({
    id: "search-profiles",
    lastResult: submission,
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    constraint: getZodConstraint(searchProfilesSchema(t)),
    defaultValue: {
      [SearchProfilesSearchParam]:
        searchParams.get(SearchProfilesSearchParam) || undefined,
    },
  });

  // TODO: conform forms for add cancel and remove
  // const [inviteAdminForm, inviteAdminFields] = useForm({...});
  // const [cancelAdminInviteForm, cancelAdminInviteFields] = useForm({...});
  // const [removeAdminForm, removeAdminFields] = useForm({...});

  return (
    <Section>
      <BackButton to={location.pathname}>{t("content.headline")}</BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{t("content.intro")}</p>

      {/* TODO: Remove Admin Form with conform */}
      <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
        {/* {toast !== null && toast.id === "remove-admin-toast" && (
          <div id={toast.id}>
            <Toast key={toast.key} level={toast.level}>
              {toast.message}
            </Toast>
          </div>
        )}
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {t("content.current.headline", {
              count: organization.admins.length,
            })}
          </h2>
          <Form method="post" preventScrollReset>
            <List>
              {organization.admins.map((admins) => {
                return (
                  <List.Item key={admins.profile.username}>
                    <Avatar {...admins.profile} />
                    <List.Item.Title>
                      {admins.profile.firstName} {admins.profile.lastName}
                    </List.Item.Title>
                    <List.Item.Subtitle>
                      {t("content.current.title")}
                    </List.Item.Subtitle>
                    {organization.admins.length > 1 && (
                      <List.Item.Controls>
                        <Button
                          name={conform.INTENT}
                          variant="outline"
                          value={`remove_${admins.profile.username}`}
                          type="submit"
                        >
                          {t("content.current.remove")}
                        </Button>
                      </List.Item.Controls>
                    )}
                  </List.Item>
                );
              })}
            </List>
          </Form>
        </div>
        {toast !== null && toast.id === "add-admin-toast" && (
          <div id={toast.id}>
            <Toast key={toast.key} level={toast.level}>
              {toast.message}
            </Toast>
          </div>
        )} */}
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {t("content.add.headline")}
          </h2>
          <Form
            method="get"
            onChange={(event) => {
              submit(event.currentTarget, { preventScrollReset: true });
            }}
            {...getFormProps(searchForm)}
          >
            <Input name={DeepSearchParam} defaultValue="true" type="hidden" />
            <Input
              {...getInputProps(searchFields[SearchProfilesSearchParam], {
                type: "search",
              })}
              key={searchFields[SearchProfilesSearchParam].id}
              standalone
            >
              <Input.Label htmlFor={searchFields[SearchProfilesSearchParam].id}>
                {t("content.add.search")}
              </Input.Label>
              <Input.SearchIcon />

              {typeof searchFields[SearchProfilesSearchParam].errors !==
                "undefined" &&
              searchFields[SearchProfilesSearchParam].errors.length > 0 ? (
                searchFields[SearchProfilesSearchParam].errors.map((error) => (
                  <Input.Error key={error}>{error}</Input.Error>
                ))
              ) : (
                <Input.HelperText>{t("content.add.criteria")}</Input.HelperText>
              )}
              <Input.Controls>
                <noscript>
                  <Button type="submit" variant="outline">
                    {t("content.add.submitSearch")}
                  </Button>
                </noscript>
              </Input.Controls>
            </Input>
          </Form>

          {/* TODO: Add Admin Form with conform */}
          {/* <Form method="post" preventScrollReset> */}
          {searchedProfiles.length > 0 ? (
            <ListContainer>
              {searchedProfiles.map((profile) => {
                return (
                  <ListItem
                    key={`profile-search-result-${profile.username}`}
                    entity={profile}
                  >
                    <Button
                      name="intent"
                      variant="outline"
                      value={`add-admin`}
                      type="submit"
                      fullSize
                    >
                      {t("content.add.submit")}
                    </Button>
                  </ListItem>
                );
              })}
            </ListContainer>
          ) : null}
          {/* </Form> */}
          {/* TODO: pending invites section */}
        </div>
      </div>
    </Section>
  );
}

export default Admins;
