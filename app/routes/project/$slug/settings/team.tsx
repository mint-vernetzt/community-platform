import { conform, useForm } from "@conform-to/react";
import {
  Avatar,
  Button,
  Input,
  List,
  Section,
  Toast,
} from "@mint-vernetzt/components";
import { type Prisma, type Profile } from "@prisma/client";
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
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useDebounceSubmit } from "remix-utils/use-debounce-submit";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { getPublicURL } from "~/storage.server";
import { getToast, redirectWithToast } from "~/toast.server";
import { BackButton } from "./__components";
import {
  getRedirectPathOnProtectedProjectRoute,
  getHash,
} from "./utils.server";
import { Deep } from "~/lib/utils/searchParams";

const i18nNS = ["routes-project-settings-team"] as const;
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
  invariantResponse(params.slug !== undefined, t("error.invalidRoute"), {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  // get project team members and admins
  const project = await prismaClient.project.findFirst({
    where: { slug: params.slug },
    include: {
      teamMembers: {
        select: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
            },
          },
        },
      },
      admins: {
        select: {
          profile: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  });

  invariantResponse(project !== null, t("error.notFound"), {
    status: 404,
  });

  // enhance team members with avatar
  const teamMembers = project.teamMembers.map((relation) => {
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

  const enhancedProject = { ...project, teamMembers };

  // get search query
  const url = new URL(request.url);
  const queryString = url.searchParams.get("search") || undefined;
  const query =
    typeof queryString !== "undefined" ? queryString.split(" ") : [];

  // get profiles via search query
  let searchResult: {
    firstName: string;
    lastName: string;
    username: string;
    avatar: string | null;
    blurredAvatar?: string;
  }[] = [];
  if (
    query.length > 0 &&
    queryString !== undefined &&
    queryString.length >= 3
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
      const isTeamMember = project.teamMembers.some((teamMember) => {
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

  const { toast, headers: toastHeaders } = await getToast(request);

  return json(
    { project: enhancedProject, searchResult, toast },
    { headers: toastHeaders || undefined }
  );
};

export const action = async (args: ActionFunctionArgs) => {
  // get action type
  const { request, params } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, t("error.invalidRoute"), {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const formData = await request.formData();
  const action = formData.get(conform.INTENT) as string;
  const hash = getHash({ action: action });
  if (action.startsWith("add_")) {
    const username = action.replace("add_", "");

    const project = await prismaClient.project.findFirst({
      where: { slug: args.params.slug },
      select: {
        id: true,
      },
    });

    const profile = await prismaClient.profile.findFirst({
      where: { username },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    invariantResponse(
      project !== null && profile !== null,
      t("error.notFound"),
      {
        status: 404,
      }
    );

    await prismaClient.teamMemberOfProject.upsert({
      where: {
        profileId_projectId: {
          projectId: project.id,
          profileId: profile.id,
        },
      },
      update: {},
      create: {
        projectId: project.id,
        profileId: profile.id,
      },
    });

    return redirectWithToast(request.url, {
      id: "add-member-toast",
      key: hash,
      message: t("content.added", {
        firstName: profile.firstName,
        lastName: profile.lastName,
      }),
    });
  } else if (action.startsWith("remove_")) {
    const username = action.replace("remove_", "");

    const project = await prismaClient.project.findFirst({
      where: { slug: args.params.slug },
      select: {
        id: true,
      },
    });

    const profile = await prismaClient.profile.findFirst({
      where: { username },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    invariantResponse(
      project !== null && profile !== null,
      t("error.notFound"),
      {
        status: 404,
      }
    );

    await prismaClient.teamMemberOfProject.delete({
      where: {
        profileId_projectId: {
          projectId: project.id,
          profileId: profile.id,
        },
      },
    });

    return redirectWithToast(request.url, {
      id: "remove-member-toast",
      key: hash,
      message: t("content.removed", {
        firstName: profile.firstName,
        lastName: profile.lastName,
      }),
    });
  }

  return json({ success: false, action, profile: null });
};

function Team() {
  const { project, searchResult, toast } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const submit = useDebounceSubmit();

  const [searchForm, fields] = useForm({
    defaultValue: {
      search: searchParams.get("search") || "",
      [Deep]: "true",
    },
  });
  const { t } = useTranslation(i18nNS);

  return (
    <Section>
      <BackButton to={location.pathname}>{t("content.back")}</BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{t("content.intro")}</p>
      <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
        {toast !== null && toast.id === "remove-member-toast" && (
          <div id={toast.id}>
            <Toast key={toast.key} level={toast.level}>
              {toast.message}
            </Toast>
          </div>
        )}
        {project.teamMembers.length > 0 && (
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {t("content.current.headline")}
            </h2>
            <p>{t("content.current.intro")}</p>
            <Form method="post" preventScrollReset>
              <List>
                {project.teamMembers.map((teamMember) => {
                  return (
                    <List.Item key={teamMember.profile.username}>
                      <Avatar {...teamMember.profile} />
                      <List.Item.Title>
                        {teamMember.profile.firstName}{" "}
                        {teamMember.profile.lastName}
                      </List.Item.Title>
                      <List.Item.Subtitle>
                        {project.admins.some((admin) => {
                          return (
                            admin.profile.username ===
                            teamMember.profile.username
                          );
                        })
                          ? t("content.current.member.admin")
                          : t("content.current.member.team")}
                      </List.Item.Subtitle>
                      <List.Item.Controls>
                        <Button
                          name={conform.INTENT}
                          variant="outline"
                          value={`remove_${teamMember.profile.username}`}
                          type="submit"
                        >
                          {t("content.current.remove")}
                        </Button>
                      </List.Item.Controls>
                    </List.Item>
                  );
                })}
              </List>
            </Form>
          </div>
        )}
        {toast !== null && toast.id === "add-member-toast" && (
          <div id={toast.id}>
            <Toast key={toast.key} level={toast.level}>
              {toast.message}
            </Toast>
          </div>
        )}
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {t("content.add.headline")}
          </h2>
          <Form
            method="get"
            onChange={(event) => {
              submit(event.currentTarget, {
                debounceTimeout: 250,
                preventScrollReset: true,
              });
            }}
            {...searchForm.props}
          >
            <Input {...conform.input(fields[Deep])} type="hidden" />
            <Input {...conform.input(fields.search)} standalone>
              <Input.Label htmlFor={fields.search.id}>
                {t("content.add.search")}
              </Input.Label>
              <Input.SearchIcon />
              <Input.HelperText>
                {t("content.add.requirements")}
              </Input.HelperText>
              {typeof fields.search.error !== "undefined" && (
                <Input.Error>{fields.search.error}</Input.Error>
              )}
            </Input>
          </Form>
          <Form method="post" preventScrollReset>
            <List>
              {searchResult.map((profile) => {
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
                        {t("content.add.add")}
                      </Button>
                    </List.Item.Controls>
                  </List.Item>
                );
              })}
            </List>
          </Form>
        </div>
      </div>
    </Section>
  );
}

export default Team;
