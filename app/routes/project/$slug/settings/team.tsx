import { conform, useForm } from "@conform-to/react";
import { type Prisma, type Profile } from "@prisma/client";
import {
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
import { useDebounceSubmit } from "remix-utils/use-debounce-submit";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/i18n.server";
import { getPublicURL } from "~/storage.server";
import { redirectWithToast } from "~/toast.server";
import { BackButton } from "~/components-next/BackButton";
import {
  getRedirectPathOnProtectedProjectRoute,
  getHash,
} from "./utils.server";
import { Deep } from "~/lib/utils/searchParams";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import { List } from "@mint-vernetzt/components/src/organisms/List";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { languageModuleMap } from "~/locales/.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["project/$slug/settings/team"];

  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, locales.error.invalidRoute, {
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

  invariantResponse(project !== null, locales.error.notFound, {
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

  return { project: enhancedProject, searchResult, locales };
};

export const action = async (args: ActionFunctionArgs) => {
  // get action type
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["project/$slug/settings/team"];

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, locales.error.invalidRoute, {
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
      locales.error.notFound,
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
      message: insertParametersIntoLocale(locales.content.added, {
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
      locales.error.notFound,
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
      message: insertParametersIntoLocale(locales.content.removed, {
        firstName: profile.firstName,
        lastName: profile.lastName,
      }),
    });
  }

  return { success: false, action, profile: null };
};

function Team() {
  const { project, searchResult, locales } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const submit = useDebounceSubmit();

  const [searchForm, fields] = useForm({
    defaultValue: {
      search: searchParams.get("search") || "",
      [Deep]: "true",
    },
  });

  return (
    <Section>
      <BackButton to={location.pathname}>{locales.content.back}</BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{locales.content.intro}</p>
      <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
        {project.teamMembers.length > 0 && (
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.content.current.headline}
            </h2>
            <p>{locales.content.current.intro}</p>
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
                          ? locales.content.current.member.admin
                          : locales.content.current.member.team}
                      </List.Item.Subtitle>
                      <List.Item.Controls>
                        <Button
                          name={conform.INTENT}
                          variant="outline"
                          value={`remove_${teamMember.profile.username}`}
                          type="submit"
                        >
                          {locales.content.current.remove}
                        </Button>
                      </List.Item.Controls>
                    </List.Item>
                  );
                })}
              </List>
            </Form>
          </div>
        )}
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {locales.content.add.headline}
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
                {locales.content.add.search}
              </Input.Label>
              <Input.SearchIcon />
              <Input.HelperText>
                {locales.content.add.requirements}
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
                        {locales.content.add.add}
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
