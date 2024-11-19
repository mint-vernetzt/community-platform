import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint } from "@conform-to/zod-v1";
import { Avatar, Input, List, Section } from "@mint-vernetzt/components";
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData, useLocation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import {
  NoJsSearchParam,
  i18nNS as searchI18nNS,
  searchResponseSchema,
  searchSchema,
  type loader as searchLoader,
} from "~/routes/profile/search";
import { BackButton } from "~/routes/project/$slug/settings/__components";
import { getPublicURL } from "~/storage.server";
import { getToast } from "~/toast.server";
import { getInvitedProfilesOfOrganization } from "./admins.server";
import { useHydrated } from "remix-utils/use-hydrated";

const i18nNS = ["routes/next/organization/settings/admins", ...searchI18nNS];
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(
    params.slug !== undefined,
    t("error.invariant.invalidRoute"),
    { status: 400 }
  );

  const redirectPath = await getRedirectPathOnProtectedOrganizationRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  // get organization admins
  const organization = await prismaClient.organization.findFirst({
    where: {
      slug: params.slug,
    },
    select: {
      id: true,
      admins: {
        select: {
          profile: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  invariantResponse(organization !== null, t("error.invariant.notFound"), {
    status: 404,
  });

  // enhance admins with avatar
  const admins = organization.admins.map((relation) => {
    let avatar = relation.profile.avatar;
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.ListItemProjectDetailAndSettings.Avatar,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.ListItemProjectDetailAndSettings
              .BlurredAvatar,
          },
          blur: BlurFactor,
        });
      }
    }
    return { profile: { ...relation.profile, avatar, blurredAvatar } };
  });

  const enhancedOrganization = { ...organization, admins };

  const invitedProfiles = await getInvitedProfilesOfOrganization(
    authClient,
    organization.id
  );

  const { toast, headers: toastHeaders } = await getToast(request);

  // no js handling for fetcher response of profile/search
  const url = new URL(request.url);
  const searchFetcherResponse = url.searchParams.get(NoJsSearchParam);
  let searchResult;
  if (searchFetcherResponse !== null) {
    const jsonSearchFetcherResponse = JSON.parse(
      decodeURIComponent(searchFetcherResponse)
    );
    const validationResult = searchResponseSchema.safeParse(
      jsonSearchFetcherResponse
    );
    if (validationResult.success) {
      searchResult = validationResult.data;
    }
  }

  return json(
    {
      organization: enhancedOrganization,
      invitedProfiles,
      toast,
      searchResult,
    },
    {
      headers: toastHeaders || undefined,
    }
  );
};

function Admins() {
  const { organization, invitedProfiles } = useLoaderData<typeof loader>();

  // const addAdminFetcher = useFetcher<typeof addAdminAction>();
  // const cancelInviteFetcher = useFetcher<typeof cancelInviteAction>();
  // const removeAdminFetcher = useFetcher<typeof removeAdminAction>();
  const location = useLocation();
  const isHydrated = useHydrated();
  const { t } = useTranslation(i18nNS);

  const searchFetcher = useFetcher<typeof searchLoader>();
  const [searchForm, searchFields] = useForm({
    id: "search-profiles",
    lastResult:
      searchFetcher.data !== undefined
        ? searchFetcher.data.submission
        : undefined,
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    constraint: getZodConstraint(searchSchema(t)),
  });
  const searchResult =
    searchFetcher.data !== undefined && "searchResult" in searchFetcher.data
      ? searchFetcher.data.searchResult
      : [];

  const filteredSearchResult = searchResult.filter((searchedProfile) => {
    const isAlreadyInvited = invitedProfiles.some((invitedProfile) => {
      return invitedProfile.username === searchedProfile.username;
    });
    const isAlreadyAdmin = organization.admins.some((admin) => {
      return admin.profile.username === searchedProfile.username;
    });
    return isAlreadyInvited === false && isAlreadyAdmin === false;
  });

  // const [removeAdminForm, removeAdminFields] = useForm({});

  return (
    <Section>
      <BackButton to={location.pathname}>{t("content.headline")}</BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{t("content.intro")}</p>

      {/* TODO: Remove Admin Form */}
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
          <searchFetcher.Form
            method="get"
            action="/profile/search"
            onChange={(event) => {
              searchFetcher.submit(event.currentTarget);
            }}
            {...getFormProps(searchForm)}
          >
            {isHydrated === false ? (
              <>
                <input hidden name="noJS" value="true" />
                <input
                  hidden
                  name="redirectToWithNoJS"
                  value={location.pathname}
                />
              </>
            ) : null}
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
          </searchFetcher.Form>

          {/* <Form method="post" preventScrollReset> */}
          {filteredSearchResult.length > 0 ? (
            <List>
              {filteredSearchResult.map((profile) => {
                return (
                  <List.Item key={profile.username}>
                    <Avatar {...profile} />
                    <List.Item.Title>
                      {profile.firstName} {profile.lastName}
                    </List.Item.Title>
                    {/* <List.Item.Controls>
                      <Button
                        name={conform.INTENT}
                        variant="outline"
                        value={`add_${profile.username}`}
                        type="submit"
                      >
                        {t("content.add.submit")}
                      </Button>
                    </List.Item.Controls> */}
                  </List.Item>
                );
              })}
            </List>
          ) : null}
          {/* </Form> */}
        </div>
      </div>
    </Section>
  );
}

export default Admins;
