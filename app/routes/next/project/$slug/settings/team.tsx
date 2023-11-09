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
import { json, redirect, type DataFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { getImageURL } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { BackButton } from "./__components";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath, { headers: response.headers });
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

  invariantResponse(project !== null, "Not found", {
    status: 404,
  });

  // enhance team members with avatar
  project.teamMembers = project.teamMembers.map((relation) => {
    let avatar = relation.profile.avatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: { type: "fill", width: 64, height: 64 },
          gravity: GravityType.center,
        });
      }
    }
    return { profile: { ...relation.profile, avatar } };
  });

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
      const isTeamMember = project.teamMembers.some((teamMember) => {
        return teamMember.profile.username === relation.username;
      });
      return !isTeamMember;
    });
    searchResult = searchResult.map((relation) => {
      let avatar = relation.avatar;
      if (avatar !== null) {
        const publicURL = getPublicURL(authClient, avatar);
        if (publicURL !== null) {
          avatar = getImageURL(publicURL, {
            resize: { type: "fill", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      return { ...relation, avatar };
    });
  }

  return json({ project, searchResult }, { headers: response.headers });
};

export const action = async (args: DataFunctionArgs) => {
  // get action type
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath, { headers: response.headers });
  }

  const formData = await request.formData();
  const action = formData.get(conform.INTENT) as string;
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

    invariantResponse(project !== null && profile !== null, "Not found", {
      status: 404,
    });

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

    return json(
      { success: true, action, profile },
      { headers: response.headers }
    );
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

    invariantResponse(project !== null && profile !== null, "Not found", {
      status: 404,
    });

    await prismaClient.teamMemberOfProject.delete({
      where: {
        profileId_projectId: {
          projectId: project.id,
          profileId: profile.id,
        },
      },
    });

    return json(
      { success: true, action, profile },
      { headers: response.headers }
    );
  }

  return json(
    { success: false, action, profile: null },
    { headers: response.headers }
  );
};

function Team() {
  const { project, searchResult } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const submit = useSubmit();

  const [searchForm, fields] = useForm({
    defaultValue: {
      search: searchParams.get("search") || "",
      deep: "true",
    },
  });

  return (
    <Section>
      <BackButton to={location.pathname}>Team verwalten</BackButton>
      <p className="mv-my-6 md:mv-mt-0">
        Füge Teammitglieder zu Deinem Projekt hinzu oder entferne sie.
      </p>
      <div className="mv-flex mv-flex-col mv-gap-6 md:mv-gap-4">
        <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            Aktuelle Teammitglieder
          </h2>
          <p>Teammitglieder und Rollen sind hier aufgelistet.</p>
          <Form method="post">
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
                          admin.profile.username === teamMember.profile.username
                        );
                      })
                        ? "Administrator:in"
                        : "Teammitglied"}
                    </List.Item.Subtitle>
                    <List.Item.Controls>
                      <Button
                        name={conform.INTENT}
                        variant="outline"
                        value={`remove_${teamMember.profile.username}`}
                        type="submit"
                      >
                        Entfernen
                      </Button>
                    </List.Item.Controls>
                  </List.Item>
                );
              })}
              {typeof actionData !== "undefined" &&
                actionData !== null &&
                actionData.success === true &&
                actionData.profile !== null &&
                actionData.action.startsWith("remove_") && (
                  <Toast key={actionData.action}>
                    {actionData.profile.firstName} {actionData.profile.lastName}{" "}
                    entfernt.
                  </Toast>
                )}
            </List>
          </Form>
        </div>
        <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            Teammitglied hinzufügen
          </h2>
          <Form
            method="get"
            onChange={(event) => {
              submit(event.currentTarget);
            }}
            {...searchForm.props}
          >
            <Input {...conform.input(fields.deep)} type="hidden" />
            <Input {...conform.input(fields.search)} standalone>
              <Input.Label htmlFor={fields.search.id}>Suche</Input.Label>
              <Input.SearchIcon />
              <Input.HelperText>Mindestens 3 Buchstaben.</Input.HelperText>
              {typeof fields.search.error !== "undefined" && (
                <Input.Error>{fields.search.error}</Input.Error>
              )}
            </Input>
          </Form>
          <Form method="post">
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
                        Hinzufügen
                      </Button>
                    </List.Item.Controls>
                  </List.Item>
                );
              })}
              {typeof actionData !== "undefined" &&
                actionData !== null &&
                actionData.success === true &&
                actionData.profile !== null &&
                actionData.action.startsWith("add_") && (
                  <Toast key={actionData.action}>
                    {actionData.profile.firstName} {actionData.profile.lastName}{" "}
                    hinzugefügt.
                  </Toast>
                )}
            </List>
          </Form>
        </div>
      </div>
    </Section>
  );
}

export default Team;
