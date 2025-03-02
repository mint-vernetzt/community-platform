import { conform, useForm } from "@conform-to/react";
import { type Organization, type Prisma } from "@prisma/client";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useLoaderData,
  useLocation,
  useSearchParams,
} from "react-router";
import { type User } from "@supabase/supabase-js";
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
  const locales =
    languageModuleMap[language]["project/$slug/settings/responsible-orgs"];

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

  invariantResponse(project !== null, locales.error.notFound, {
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

  invariantResponse(profile !== null, locales.error.notFound, {
    status: 404,
  });

  // enhance organizations with logo
  const responsibleOrganizations = project.responsibleOrganizations.map(
    (relation) => {
      let logo = relation.organization.logo;
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItemProjectDetailAndSettings.Logo,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItemProjectDetailAndSettings
                .BlurredLogo,
            },
            blur: BlurFactor,
          });
        }
      }
      return { organization: { ...relation.organization, logo, blurredLogo } };
    }
  );

  const enhancedProject = {
    ...project,
    responsibleOrganizations,
  };

  // get organizations where user is member or admin that are not already responsible organizations
  const organizations = [
    ...profile.memberOf,
    ...profile.administeredOrganizations,
  ];

  const notResponsibleOrganizations = organizations.filter(
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

  const enhancedNotResponsibleOrganizations = notResponsibleOrganizations.map(
    (relation) => {
      let logo = relation.organization.logo;
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItemProjectDetailAndSettings.Logo,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItemProjectDetailAndSettings
                .BlurredLogo,
            },
            blur: BlurFactor,
          });
        }
      }
      return { organization: { ...relation.organization, logo, blurredLogo } };
    }
  );

  // get search query
  const url = new URL(request.url);
  const queryString = url.searchParams.get("search") || undefined;
  const query =
    typeof queryString !== "undefined" ? queryString.split(" ") : [];

  // get organizations that match search query
  let searchResult: {
    name: string;
    slug: string;
    logo: string | null;
    blurredLogo?: string;
  }[] = [];

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
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItemProjectDetailAndSettings.Logo,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItemProjectDetailAndSettings
                .BlurredLogo,
            },
            blur: BlurFactor,
          });
        }
      }
      return { ...relation, logo, blurredLogo };
    });
  }

  return {
    project: enhancedProject,
    ownOrganizations: enhancedNotResponsibleOrganizations,
    searchResult,
    locales,
  };
};

export const action = async (args: ActionFunctionArgs) => {
  // get action type
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/responsible-orgs"];

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

    invariantResponse(
      project !== null && organization !== null,
      locales.error.notFound,
      {
        status: 404,
      }
    );

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

    return redirectWithToast(request.url, {
      id: "add-organization-toast",
      key: hash,
      message: insertParametersIntoLocale(locales.content.added, {
        name: organization.name,
      }),
    });
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

    invariantResponse(
      project !== null && organization !== null,
      locales.error.notFound,
      {
        status: 404,
      }
    );

    await prismaClient.responsibleOrganizationOfProject.delete({
      where: {
        projectId_organizationId: {
          projectId: project.id,
          organizationId: organization.id,
        },
      },
    });

    return redirectWithToast(request.url, {
      id: "remove-organization-toast",
      key: hash,
      message: insertParametersIntoLocale(locales.content.removed, {
        name: organization.name,
      }),
    });
  }

  return { success: false, action, organization: null };
};

function ResponsibleOrgs() {
  const { project, ownOrganizations, searchResult, locales } =
    useLoaderData<typeof loader>();
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
        {project.responsibleOrganizations.length > 0 && (
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.content.current.headline}
            </h2>
            <p>{locales.content.current.intro}</p>
            <Form method="post" preventScrollReset>
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
        {ownOrganizations.length > 0 && (
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.content.add.headline}
            </h2>
            <p>{locales.content.add.intro}</p>
            <Form method="post" preventScrollReset>
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
                          {locales.content.add.add}
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
            {locales.content.other.headline}
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
                {locales.content.other.search.label}
              </Input.Label>
              <Input.SearchIcon />
              <Input.HelperText>
                {locales.content.other.search.helper}
              </Input.HelperText>
              {typeof fields.search.error !== "undefined" && (
                <Input.Error>{fields.search.error}</Input.Error>
              )}
            </Input>
          </Form>
          <Form method="post" preventScrollReset>
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
                        {locales.content.other.add}
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
