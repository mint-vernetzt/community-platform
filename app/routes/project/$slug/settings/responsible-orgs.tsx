import { conform, useForm } from "@conform-to/react";
import {
  Avatar,
  Button,
  Input,
  List,
  Section,
  Toast,
} from "@mint-vernetzt/components";
import { type Organization, type Prisma } from "@prisma/client";
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
import { type User } from "@supabase/supabase-js";
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
  getSubmissionHash,
} from "./utils.server";
import { DeepSearchParam } from "~/form-helpers";

const i18nNS = ["routes-project-settings-responsible-orgs"] as const;
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

  invariantResponse(project !== null, t("error.notFound"), {
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

  invariantResponse(profile !== null, t("error.notFound"), {
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

  const { toast, headers: toastHeaders } = await getToast(request);

  return json(
    {
      project: enhancedProject,
      ownOrganizations: enhancedNotResponsibleOrganizations,
      searchResult,
      toast,
    },
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

    invariantResponse(
      project !== null && organization !== null,
      t("error.notFound"),
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
      message: t("content.added", { name: organization.name }),
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
      t("error.notFound"),
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
      message: `${organization.name} entfernt.`,
    });
  }

  return json({ success: false, action, organization: null });
};

function ResponsibleOrgs() {
  const { project, ownOrganizations, searchResult, toast } =
    useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const submit = useDebounceSubmit();
  const { t } = useTranslation(i18nNS);

  const [searchForm, fields] = useForm({
    defaultValue: {
      search: searchParams.get("search") || "",
      [DeepSearchParam]: "true",
    },
  });

  return (
    <Section>
      <BackButton to={location.pathname}>{t("content.back")}</BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{t("content.intro")}</p>
      <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
        {toast !== null && toast.id === "remove-organization-toast" && (
          <div id={toast.id}>
            <Toast key={toast.key} level={toast.level}>
              {toast.message}
            </Toast>
          </div>
        )}
        {project.responsibleOrganizations.length > 0 && (
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {t("content.current.headline")}
            </h2>
            <p>{t("content.current.intro")}</p>
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
        {toast !== null && toast.id === "add-organization-toast" && (
          <div id={toast.id}>
            <Toast key={toast.key} level={toast.level}>
              {toast.message}
            </Toast>
          </div>
        )}
        {ownOrganizations.length > 0 && (
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {t("content.add.headline")}
            </h2>
            <p>{t("content.add.intro")}</p>
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
                          {t("content.add.add")}
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
            {t("content.other.headline")}
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
            <Input {...conform.input(fields[DeepSearchParam])} type="hidden" />
            <Input {...conform.input(fields.search)} standalone>
              <Input.Label htmlFor={fields.search.id}>
                {t("content.other.search.label")}
              </Input.Label>
              <Input.SearchIcon />
              <Input.HelperText>
                {t("content.other.search.helper")}
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
                        {t("content.other.add")}
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
