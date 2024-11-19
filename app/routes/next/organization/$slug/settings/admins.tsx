import {
  Avatar,
  Button,
  Input,
  List,
  Section,
  Toast,
} from "@mint-vernetzt/components";
import { type Prisma, type Profile } from "@prisma/client";
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  useFetcher,
  useLoaderData,
  useLocation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useDebounceSubmit } from "remix-utils/use-debounce-submit";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import { getSubmissionHash } from "~/routes/project/$slug/settings/utils.server";
import { getPublicURL } from "~/storage.server";
import { getToast, redirectWithToast } from "~/toast.server";
import { getInvitedProfilesOfOrganization } from "./admins.server";
import { BackButton } from "~/routes/project/$slug/settings/__components";
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
import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { z } from "zod";
import { type TFunction } from "i18next";

const i18nNS = ["routes/next/organization/settings/admins"];
export const handle = {
  i18n: i18nNS,
};

const searchSchema = (t: TFunction) => {
  return z.object({
    search: z
      .string()
      .min(3, { message: t("content.add.criteria") })
      .optional(),
    deep: z.string().optional(),
  });
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

  // get profiles via search query
  let searchResult: {
    firstName: string;
    lastName: string;
    username: string;
    avatar: string | null;
  }[] = [];
  const searchParams = new URL(request.url).searchParams;
  const submission = parseWithZod(searchParams, { schema: searchSchema(t) });
  if (submission.status !== "success") {
    return json(
      {
        organization: enhancedOrganization,
        invitedProfiles,
        searchResult,
        submission: submission.reply(),
        toast,
      },
      {
        headers: toastHeaders || undefined,
      }
    );
  }
  const query =
    typeof submission.value.search !== "undefined"
      ? submission.value.search.split(" ")
      : [];

  if (
    query.length > 0 &&
    submission.value.search !== undefined &&
    submission.value.search.length >= 3
  ) {
    const whereQueries: {
      OR: {
        [K in Profile as string]: { contains: string; mode: Prisma.QueryMode };
      }[];
    }[] = [];
    for (const word of query) {
      whereQueries.push({
        OR: [
          { firstName: { contains: word, mode: "insensitive" } },
          { lastName: { contains: word, mode: "insensitive" } },
          { username: { contains: word, mode: "insensitive" } },
          { email: { contains: word, mode: "insensitive" } },
        ],
      });
    }
    searchResult = await prismaClient.profile.findMany({
      where: {
        AND: whereQueries,
      },
      select: {
        firstName: true,
        lastName: true,
        username: true,
        avatar: true,
      },
      take: 10,
    });
    searchResult = searchResult.filter((relation) => {
      const isTeamMember = organization.admins.some((teamMember) => {
        return teamMember.profile.username === relation.username;
      });
      return !isTeamMember;
    });
    searchResult = searchResult.map((relation) => {
      let avatar = relation.avatar;
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
      return { ...relation, avatar, blurredAvatar };
    });
  }

  return json(
    {
      organization: enhancedOrganization,
      invitedProfiles,
      searchResult,
      submission,
      toast,
    },
    {
      headers: toastHeaders || undefined,
    }
  );
};

function Admins() {
  const loaderData = useLoaderData<typeof loader>();
  const { organization, invitedProfiles, searchResult, submission, toast } =
    loaderData;
  // const addAdminFetcher = useFetcher<typeof addAdminAction>();
  // const cancelInviteFetcher = useFetcher<typeof cancelInviteAction>();
  // const removeAdminFetcher = useFetcher<typeof removeAdminAction>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const submit = useSubmit();
  const { t } = useTranslation(i18nNS);

  const [searchForm, searchFields] = useForm({
    id: "search",
    lastResult: loaderData.submission,
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    constraint: getZodConstraint(searchSchema(t)),
    defaultValue: {
      search: searchParams.get("search") || "",
      deep: "true",
    },
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
          <Form
            method="get"
            onChange={(event) => {
              submit(event.currentTarget, {
                preventScrollReset: true,
              });
            }}
            {...getFormProps(searchForm)}
          >
            <Input
              {...getInputProps(searchFields.deep, { type: "hidden" })}
              key={searchFields.deep.id}
            />
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
          </Form>
          {/* <Form method="post" preventScrollReset> */}
          {searchResult.length > 0 ? (
            <List>
              {searchResult.map((profile) => {
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
