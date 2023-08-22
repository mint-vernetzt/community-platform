import { createClient } from "@supabase/supabase-js";
import type { Request } from "express";
import { GravityType } from "imgproxy/dist/types";
import { filterProjectByVisibility } from "../public-fields-filtering.server";
import { getBaseURL } from "../../src/utils";
import { getImageURL, getPublicURL } from "../images.server";
import { decorate } from "../lib/matomoUrlDecorator";
import { prismaClient } from "../prisma";

type Projects = Awaited<ReturnType<typeof getProjects>>;

async function getProjects(request: Request, skip: number, take: number) {
  const projects = await prismaClient.project.findMany({
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
            },
          },
        },
      },
      targetGroups: {
        select: {
          targetGroup: {
            select: {
              title: true,
            },
          },
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
            publicLogo = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
        }
        if (background !== null) {
          const publicURL = getPublicURL(authClient, background);
          if (publicURL !== null) {
            publicBackground = getImageURL(publicURL, {
              resize: { type: "fill", width: 1488, height: 480, enlarge: true },
            });
          }
        }
      }

      let baseURL = getBaseURL(process.env.COMMUNITY_BASE_URL);

      const url =
        baseURL !== undefined
          ? decorate(request, `${baseURL}/project/${slug}`)
          : null;

      const enhancedProject = {
        ...rest,
        logo: publicLogo,
        background: publicBackground,
      };

      const filteredProject = await filterProjectByVisibility(enhancedProject);

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
