import { conform, useForm } from "@conform-to/react";
import {
  Avatar,
  Button,
  Input,
  List,
  Section,
} from "@mint-vernetzt/components";
import { type Organization, type Prisma } from "@prisma/client";
import { json, redirect, type DataFunctionArgs } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useLocation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { type User } from "@supabase/supabase-js";
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

  // get project
  const project = await prismaClient.project.findFirst({
    where: { slug: params.slug },
    include: {
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
      },
    },
  });

  invariantResponse(project !== null, "Not found", {
    status: 404,
  });

  // get own organizations
  const profile = await prismaClient.profile.findFirst({
    where: { id: (sessionUser as User).id },
    include: {
      memberOf: {
        select: {
          organization: {
            select: {
              slug: true,
              name: true,
              logo: true,
            },
          },
        },
      },
      administeredOrganizations: {
        select: {
          organization: {
            select: {
              slug: true,
              name: true,
              logo: true,
            },
          },
        },
      },
    },
  });

  // enhance organizations with logo
  project.responsibleOrganizations = project.responsibleOrganizations.map(
    (relation) => {
      let logo = relation.organization.logo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: { type: "fill", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      return { organization: { ...relation.organization, logo } };
    }
  );

  invariantResponse(profile !== null, "Not found", {
    status: 404,
  });

  // get organizations where user is member or admin that are not already responsible organizations
  const organizations = [
    ...profile.memberOf,
    ...profile.administeredOrganizations,
  ];

  let notResponsibleOrganizations = organizations.filter(
    (organization, index) => {
      // find index of first occurrence of organization
      const firstIndex = organizations.findIndex((org) => {
        return org.organization.slug === organization.organization.slug;
      });

      const isStillResponsible = project.responsibleOrganizations.some(
        (responsibleOrganization) => {
          return (
            responsibleOrganization.organization.slug ===
            organization.organization.slug
          );
        }
      );
      return !isStillResponsible && firstIndex === index; // only return first occurrence to avoid duplicates
    }
  );

  notResponsibleOrganizations = notResponsibleOrganizations.map((relation) => {
    let logo = relation.organization.logo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: { type: "fill", width: 64, height: 64 },
          gravity: GravityType.center,
        });
      }
    }
    return { organization: { ...relation.organization, logo } };
  });

  // get search query
  const url = new URL(request.url);
  const queryString = url.searchParams.get("search") || undefined;
  const query =
    typeof queryString !== "undefined" ? queryString.split(" ") : [];

  // get organizations that match search query
  let searchResult: { name: string; slug: string; logo: string | null }[] = [];

  if (
    query.length > 0 &&
    queryString !== undefined &&
    queryString.length >= 3
  ) {
    const whereQueries: {
      OR: {
        [K in Organization as string]: {
          contains: string;
          mode: Prisma.QueryMode;
        };
      }[];
    }[] = [];
    for (const word of query) {
      whereQueries.push({
        OR: [{ name: { contains: word, mode: "insensitive" } }],
      });
    }

    searchResult = await prismaClient.organization.findMany({
      where: {
        AND: [
          ...whereQueries,
          {
            NOT: {
              slug: {
                in: notResponsibleOrganizations.map(
                  (org) => org.organization.slug
                ),
              },
            },
          },
          {
            NOT: {
              slug: {
                in: project.responsibleOrganizations.map(
                  (org) => org.organization.slug
                ),
              },
            },
          },
        ],
      },
      select: {
        name: true,
        slug: true,
        logo: true,
      },
      take: 10,
    });
    searchResult = searchResult.map((relation) => {
      let logo = relation.logo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: { type: "fill", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      return { ...relation, logo };
    });
  }

  return json({
    project,
    ownOrganizations: notResponsibleOrganizations,
    searchResult,
  });
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
    const slug = action.startsWith("add_own_")
      ? action.replace("add_own_", "")
      : action.replace("add_", "");

    const project = await prismaClient.project.findFirst({
      where: { slug: args.params.slug },
      select: {
        id: true,
      },
    });

    const organization = await prismaClient.organization.findFirst({
      where: { slug },
      select: {
        id: true,
        name: true,
      },
    });

    invariantResponse(project !== null && organization !== null, "Not found", {
      status: 404,
    });

    await prismaClient.responsibleOrganizationOfProject.upsert({
      where: {
        projectId_organizationId: {
          projectId: project.id,
          organizationId: organization.id,
        },
      },
      update: {},
      create: {
        projectId: project.id,
        organizationId: organization.id,
      },
    });

    return redirectWithToast(
      `/next/project/${params.slug}/settings/responsible-orgs?deep`,
      {
        id: "settings-toast",
        key: hash,
        message: `${organization.name} hinzugefügt.`,
      },
      { scrollIntoView: true },
      { headers: response.headers }
    );
  } else if (action.startsWith("remove_")) {
    const slug = action.replace("remove_", "");

    const project = await prismaClient.project.findFirst({
      where: { slug: args.params.slug },
      select: {
        id: true,
      },
    });

    const organization = await prismaClient.organization.findFirst({
      where: { slug },
      select: {
        id: true,
        name: true,
      },
    });

    invariantResponse(project !== null && organization !== null, "Not found", {
      status: 404,
    });

    await prismaClient.responsibleOrganizationOfProject.delete({
      where: {
        projectId_organizationId: {
          projectId: project.id,
          organizationId: organization.id,
        },
      },
    });

    return redirectWithToast(
      `/next/project/${params.slug}/settings/responsible-orgs?deep`,
      {
        id: "settings-toast",
        key: hash,
        message: `${organization.name} entfernt.`,
      },
      { scrollIntoView: true },
      { headers: response.headers }
    );
  }

  return json(
    { success: false, action, organization: null },
    { headers: response.headers }
  );
};

function ResponsibleOrgs() {
  const { project, ownOrganizations, searchResult } =
    useLoaderData<typeof loader>();
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
      <BackButton to={location.pathname}>
        Verantwortliche Organisationen
      </BackButton>
      <p className="mv-my-6 md:mv-mt-0">
        Welche Organisationen stecken hinter dem Projekt? Verwalte hier die
        verantwortlichen Organisationen.
      </p>
      <div className="mv-flex mv-flex-col mv-gap-6 md:mv-gap-4">
        {project.responsibleOrganizations.length > 0 && (
          <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              Aktuell hinzugefügte Organsiation(en)
            </h2>
            <p>
              Hier siehst Du Organisationen, die aktuelle als verantwortliche
              Organisation hinterlegt wurden.
            </p>
            <Form method="post">
              <List>
                {project.responsibleOrganizations.map((relation) => {
                  return (
                    <List.Item key={relation.organization.slug}>
                      <Avatar {...relation.organization} />
                      <List.Item.Title>
                        {relation.organization.name}
                      </List.Item.Title>
                      <List.Item.Controls>
                        <Button
                          name={conform.INTENT}
                          variant="outline"
                          value={`remove_${relation.organization.slug}`}
                          type="submit"
                        >
                          Entfernen
                        </Button>
                      </List.Item.Controls>
                    </List.Item>
                  );
                })}
              </List>
            </Form>
          </div>
        )}
        {ownOrganizations.length > 0 && (
          <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              Eigene Organisation(en) hinzufügen
            </h2>
            <p>
              Hier werden Dir Deine eigenen Organisationen aufgelistet, so dass
              Du sie mit einen Klick als verantwortliche Organisationen
              hinzuzufügen kannst.
            </p>
            <Form method="post">
              <List>
                {ownOrganizations.map((relation) => {
                  return (
                    <List.Item key={relation.organization.slug}>
                      <Avatar {...relation.organization} />
                      <List.Item.Title>
                        {relation.organization.name}
                      </List.Item.Title>
                      <List.Item.Controls>
                        <Button
                          name={conform.INTENT}
                          variant="outline"
                          value={`add_own_${relation.organization.slug}`}
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
        )}
        <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
          <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
            Andere Organisation(en) hinzufügen
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
              {searchResult.map((organization) => {
                return (
                  <List.Item key={organization.slug}>
                    <Avatar {...organization} />
                    <List.Item.Title>{organization.name}</List.Item.Title>
                    <List.Item.Controls>
                      <Button
                        name={conform.INTENT}
                        variant="outline"
                        value={`add_${organization.slug}`}
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

export default ResponsibleOrgs;
