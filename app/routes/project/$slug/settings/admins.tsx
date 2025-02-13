import { conform, useForm } from "@conform-to/react";
import { type Prisma, type Profile } from "@prisma/client";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
  useSearchParams,
} from "react-router";
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
import { Alert } from "@mint-vernetzt/components/src/molecules/Alert";
import { List } from "@mint-vernetzt/components/src/organisms/List";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { languageModuleMap } from "~/locales/.server";
import {
  decideBetweenSingularOrPlural,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["project/$slug/settings/admins"];

  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(
    params.slug !== undefined,
    locales.error.invariant.invalidRoute,
    { status: 400 }
  );

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  // get project admins
  const project = await prismaClient.project.findFirst({
    where: {
      slug: params.slug,
    },
    select: {
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

  invariantResponse(project !== null, locales.error.invariant.notFound, {
    status: 404,
  });

  // enhance admins with avatar
  const admins = project.admins.map((relation) => {
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

  const enhancedProject = { ...project, admins };

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
      const isTeamMember = project.admins.some((teamMember) => {
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
  const locales = languageModuleMap[language]["project/$slug/settings/admins"];

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(
    params.slug !== undefined,
    locales.error.invariant.invalidRoute,
    { status: 400 }
  );

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
  const action = formData.get(conform.INTENT);
  const hash = getHash({ action: action });
  if (action !== null && typeof action === "string") {
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
        locales.error.invariant.notFound,
        { status: 404 }
      );

      await prismaClient.adminOfProject.upsert({
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
        id: "add-admin-toast",
        key: hash,
        message: insertParametersIntoLocale(locales.content.profileAdded, {
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
        locales.error.invariant.notFound,
        { status: 404 }
      );

      const adminCount = await prismaClient.adminOfProject.count({
        where: {
          projectId: project.id,
        },
      });

      if (adminCount <= 1) {
        return { success: false, action, profile: null };
      }

      await prismaClient.adminOfProject.delete({
        where: {
          profileId_projectId: {
            projectId: project.id,
            profileId: profile.id,
          },
        },
      });

      return redirectWithToast(request.url, {
        id: "remove-admin-toast",
        key: hash,
        message: insertParametersIntoLocale(locales.content.profileRemoved, {
          firstName: profile.firstName,
          lastName: profile.lastName,
        }),
      });
    }
  }

  return { success: false, action, profile: null };
};

function Admins() {
  const { project, searchResult, locales } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const submit = useDebounceSubmit();

  const [searchForm, searchFields] = useForm({
    defaultValue: {
      search: searchParams.get("search") || "",
      [Deep]: "true",
    },
  });

  return (
    <Section>
      <BackButton to={location.pathname}>{locales.content.headline}</BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{locales.content.intro}</p>
      {typeof actionData !== "undefined" &&
        actionData !== null &&
        actionData.action !== null &&
        typeof actionData.action === "string" &&
        actionData.success === false && (
          <Alert level="negative" key={actionData.action}>
            {actionData.action.startsWith("remove_") &&
              locales.content.ups.remove}
            {actionData.action.startsWith("add_") && locales.content.ups.add}
          </Alert>
        )}
      <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {decideBetweenSingularOrPlural(
              locales.content.current.headline_one,
              locales.content.current.headline_other,
              project.admins.length
            )}
          </h2>
          <Form method="post" preventScrollReset>
            <List>
              {project.admins.map((admins) => {
                return (
                  <List.Item key={admins.profile.username}>
                    <Avatar {...admins.profile} />
                    <List.Item.Title>
                      {admins.profile.firstName} {admins.profile.lastName}
                    </List.Item.Title>
                    <List.Item.Subtitle>
                      {locales.content.current.title}
                    </List.Item.Subtitle>
                    {project.admins.length > 1 && (
                      <List.Item.Controls>
                        <Button
                          name={conform.INTENT}
                          variant="outline"
                          value={`remove_${admins.profile.username}`}
                          type="submit"
                        >
                          {locales.content.current.remove}
                        </Button>
                      </List.Item.Controls>
                    )}
                  </List.Item>
                );
              })}
            </List>
          </Form>
        </div>
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
            <Input {...conform.input(searchFields[Deep])} type="hidden" />
            <Input {...conform.input(searchFields.search)} standalone>
              <Input.Label htmlFor={searchFields.search.id}>
                {locales.content.add.search}
              </Input.Label>
              <Input.SearchIcon />
              <Input.HelperText>
                {locales.content.add.criteria}
              </Input.HelperText>
              {typeof searchFields.search.error !== "undefined" && (
                <Input.Error>{searchFields.search.error}</Input.Error>
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
                        {locales.content.add.submit}
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

export default Admins;
