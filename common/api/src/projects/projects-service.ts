import { createClient } from "@supabase/supabase-js";
import type { Request } from "express";
import { getBaseURL } from "../cp-modules/utils";
import { getImageURL } from "../cp-modules/images.server";
import { decorate } from "../lib/matomoUrlDecorator";
import { prismaClient } from "../cp-modules/prisma";
import { filterProjectByVisibility } from "../cp-modules/next-public-fields-filtering.server";
import { getPublicURL } from "../cp-modules/storage.server";

type Projects = Awaited<ReturnType<typeof getProjects>>;

async function getProjects(request: Request, skip: number, take: number) {
  const projects = await prismaClient.project.findMany({
    where: {
      published: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      background: true,
      headline: true,
      excerpt: true,
      description: true,
      email: true,
      phone: true,
      street: true,
      streetNumber: true,
      city: true,
      zipCode: true,
      website: true,
      facebook: true,
      linkedin: true,
      twitter: true,
      youtube: true,
      instagram: true,
      xing: true,
      disciplines: {
        select: {
          discipline: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      },
      additionalDisciplines: {
        select: {
          additionalDiscipline: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      },
      projectTargetGroups: {
        select: {
          projectTargetGroup: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      },
      specialTargetGroups: {
        select: {
          specialTargetGroup: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      },
      formats: {
        select: {
          format: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      },
      financings: {
        select: {
          financing: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      },
      areas: {
        select: {
          area: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
      projectVisibility: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          background: true,
          headline: true,
          excerpt: true,
          description: true,
          email: true,
          phone: true,
          street: true,
          streetNumber: true,
          city: true,
          zipCode: true,
          website: true,
          facebook: true,
          linkedin: true,
          twitter: true,
          youtube: true,
          instagram: true,
          xing: true,
          disciplines: true,
          additionalDisciplines: true,
          projectTargetGroups: true,
          specialTargetGroups: true,
          formats: true,
          financings: true,
          areas: true,
        },
      },
    },
    skip,
    take,
  });

  let authClient: ReturnType<typeof createClient> | undefined;
  if (
    process.env.SUPABASE_URL !== undefined &&
    process.env.SERVICE_ROLE_KEY !== undefined
  ) {
    authClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  const enhancedProjects = await Promise.all(
    projects.map(async (project) => {
      const { slug, logo, background, ...rest } = project;

      let publicLogo: string | null = null;
      let publicBackground: string | null = null;
      if (authClient !== undefined) {
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          if (publicURL !== null) {
            publicLogo = getImageURL(publicURL);
          }
        }
        if (background !== null) {
          const publicURL = getPublicURL(authClient, background);
          if (publicURL !== null) {
            publicBackground = getImageURL(publicURL);
          }
        }
      }

      const baseURL = getBaseURL(process.env.COMMUNITY_BASE_URL);

      const url =
        baseURL !== undefined
          ? decorate(request, `${baseURL}/project/${slug}`)
          : null;

      const enhancedProject = {
        ...rest,
        logo: publicLogo,
        background: publicBackground,
      };

      const filteredProject = filterProjectByVisibility(enhancedProject);

      return {
        ...filteredProject,
        url: url,
      };
    })
  );

  return enhancedProjects;
}

export async function getAllProjects(
  request: Request,
  skip: number,
  take: number
): Promise<{ skip: number; take: number; result: Projects }> {
  const publicProjects = await getProjects(request, skip, take);
  return { skip, take, result: publicProjects };
}
