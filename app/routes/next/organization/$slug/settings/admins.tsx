import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { Input, Section } from "@mint-vernetzt/components";
import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
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

// TODO: Import namespaces from validation functions if neccessary (searchProfiles, inviteProfileToBeOrganizationAdmin, cancelAdminInvitation, removeAdminFromOrganization)
const i18nNS = ["routes/next/organization/settings/admins"];
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
  const redirectPath = await getRedirectPathOnProtectedOrganizationRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  // TODO: Clean loader
  const organization = await getOrganizationWithAdmins(slug, authClient);
  invariantResponse(organization !== null, t("error.invariant.notFound"), {
    status: 404,
  });
  const pendingAdminInvites = await getPendingAdminInvitesOfOrganization(
    organization.id,
    authClient
  );
  // const {searchedProfiles, submission} = await searchProfiles(searchParams); -> How to implement which profiles are excluded (f.e. already admins or invited)?
  const { toast, headers: toastHeaders } = await getToast(request);

  return json(
    {
      organization,
      pendingAdminInvites,
      // searchedProfiles,
      // submission,
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
  // const {
  //   organization,
  //   pendingAdminInvites,
  //   searchedProfiles,
  //   submission,
  //   toast,
  // } = useLoaderData<typeof loader>();

  const location = useLocation();
  const { t } = useTranslation(i18nNS);
  const submit = useSubmit();
  const [searchParams] = useSearchParams();

  const [searchForm, searchFields] = useForm({
    id: "search-profiles",
    // lastResult: submission,
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    // TODO: Import search schema from module where searchProfiles is implemented
    // constraint: getZodConstraint(searchSchema(t)),
    defaultValue: {
      search: searchParams.get("search") || "",
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
          {/* TODO: Check if the form resets searchParam deep when i dont include it */}
          <Form
            method="get"
            onChange={(event) => {
              submit(event.currentTarget, { preventScrollReset: true });
            }}
            {...getFormProps(searchForm)}
          >
            <Input
              {...getInputProps(searchFields.search, { type: "search" })}
              key={searchFields.search.id}
              standalone
            >
              <Input.Label htmlFor={searchFields.search.id}>
                {t("content.add.search")}
              </Input.Label>
              <Input.SearchIcon />
              <Input.HelperText>{t("content.add.criteria")}</Input.HelperText>
              {typeof searchFields.search.errors !== "undefined" &&
                searchFields.search.errors.length > 0 &&
                searchFields.search.errors.map((error) => (
                  <Input.Error key={error}>{error}</Input.Error>
                ))}
            </Input>
            {/* TODO: no script submit button */}
          </Form>

          {/* TODO: Add Admin Form with conform */}
          {/* <Form method="post" preventScrollReset>
          {searchedProfiles.length > 0 ? (
            <List>
              {searchedProfiles.map((profile) => {
                return (
                  <List.Item key={profile.username}>
                    <Avatar {...profile} />
                    <List.Item.Title>
                      {profile.firstName} {profile.lastName}
                    </List.Item.Title>
                    <List.Item.Controls>
                      <Button
                        name={conform.INTENT}
                        variant="outline"
                        value={`add_${profile.username}`}
                        type="submit"
                      >
                        {t("content.add.submit")}
                      </Button>
                    </List.Item.Controls>
                  </List.Item>
                );
              })}
            </List>
          ) : null}
          </Form> */}
          {/* TODO: pending invites section */}
        </div>
      </div>
    </Section>
  );
}

export default Admins;
