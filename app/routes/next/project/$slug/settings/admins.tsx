import { conform, useForm } from "@conform-to/react";
import {
  Alert,
  Avatar,
  Button,
  Input,
  List,
  Section,
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
import { redirectWithToast } from "~/toast.server";
import { BackButton } from "./__components";
import {
  getRedirectPathOnProtectedProjectRoute,
  getSubmissionHash,
} from "./utils.server";

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

  // get project admins
  const project = await prismaClient.project.findFirst({
    where: {
      slug: params.slug,
    },
    include: {
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

  invariantResponse(project !== null, "Not found", {
    status: 404,
  });

  // enhance admins with avatar
  project.admins = project.admins.map((relation) => {
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
      const isTeamMember = project.admins.some((teamMember) => {
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

  return json(
    { project, searchResult },
    {
      headers: response.headers,
    }
  );
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
  const hash = getSubmissionHash({ action: action });
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

    return redirectWithToast(
      `/next/project/${params.slug}/settings/admins?deep`,
      {
        id: "settings-toast",
        key: hash,
        message: `${profile.firstName} ${profile.lastName} hinzugefügt.`,
      },
      { scrollIntoView: true },
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

    const adminCount = await prismaClient.adminOfProject.count({
      where: {
        projectId: project.id,
      },
    });

    if (adminCount <= 1) {
      return json(
        { success: false, action, profile: null },
        { headers: response.headers }
      );
    }

    await prismaClient.adminOfProject.delete({
      where: {
        profileId_projectId: {
          projectId: project.id,
          profileId: profile.id,
        },
      },
    });

    return redirectWithToast(
      `/next/project/${params.slug}/settings/admins?deep`,
      {
        id: "settings-toast",
        key: hash,
        message: `${profile.firstName} ${profile.lastName} entfernt.`,
      },
      { scrollIntoView: true },
      { headers: response.headers }
    );
  }

  return json(
    { success: false, action, profile: null },
    { headers: response.headers }
  );
};

function Admins() {
  const { project, searchResult } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const submit = useSubmit();

  const [searchForm, searchFields] = useForm({
    defaultValue: {
      search: searchParams.get("search") || "",
      deep: "true",
    },
  });

  return (
    <Section>
      <BackButton to={location.pathname}>Admin-Rollen verwalten</BackButton>
      <p className="mv-my-6 md:mv-mt-0">
        Füge Administrator:innen zu Deinem Projekt hinzu oder entferne sie.
      </p>
      {/* TODO: Is it nice to handle Alerts inside the settings route and use redirectWithAlert with scrollIntoView option? */}
      {typeof actionData !== "undefined" &&
        actionData !== null &&
        actionData.success === false && (
          <Alert level="negative" key={actionData.action}>
            {actionData.action.startsWith("remove_") &&
              "Beim Entfernen ist etwas schief gelaufen"}
            {actionData.action.startsWith("add_") &&
              "Beim Hinzufügen ist etwas schief gelaufen"}
          </Alert>
        )}
      <div className="mv-flex mv-flex-col mv-gap-6 md:mv-gap-4">
        <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            {project.admins.length <= 1
              ? "Administrator:in"
              : "Administrator:innen"}
          </h2>
          <Form method="post">
            <List>
              {project.admins.map((admins) => {
                return (
                  <List.Item key={admins.profile.username}>
                    <Avatar {...admins.profile} />
                    <List.Item.Title>
                      {admins.profile.firstName} {admins.profile.lastName}
                    </List.Item.Title>
                    <List.Item.Subtitle>Administrator:in</List.Item.Subtitle>
                    {project.admins.length > 1 && (
                      <List.Item.Controls>
                        <Button
                          name={conform.INTENT}
                          variant="outline"
                          value={`remove_${admins.profile.username}`}
                          type="submit"
                        >
                          Entfernen
                        </Button>
                      </List.Item.Controls>
                    )}
                  </List.Item>
                );
              })}
            </List>
          </Form>
        </div>
        <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            Administrator:in hinzufügen
          </h2>
          <Form
            method="get"
            onChange={(event) => {
              submit(event.currentTarget);
            }}
            {...searchForm.props}
          >
            <Input {...conform.input(searchFields.deep)} type="hidden" />
            <Input {...conform.input(searchFields.search)} standalone>
              <Input.Label htmlFor={searchFields.search.id}>Suche</Input.Label>
              <Input.SearchIcon />
              <Input.HelperText>Mindestens 3 Buchstaben.</Input.HelperText>
              {typeof searchFields.search.error !== "undefined" && (
                <Input.Error>{searchFields.search.error}</Input.Error>
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
            </List>
          </Form>
        </div>
      </div>
    </Section>
  );
}

export default Admins;
