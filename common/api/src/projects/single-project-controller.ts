import { createClient } from "@supabase/supabase-js";
import type { Request as ExpressRequest } from "express";
import {
  Controller,
  Get,
  Path,
  Request,
  Response,
  Route,
  Security,
  Tags,
  type ValidateError,
} from "tsoa";
import { getImageURL } from "../images.server";
import { decorate } from "../lib/matomoUrlDecorator";
import { prismaClient } from "../prisma";
import { filterProjectByVisibility } from "../public-fields-filtering.server";
import { getPublicURL } from "../storage.server";
import { getBaseURL } from "../utils";

@Route("project")
@Tags("Project")
export class ProjectController extends Controller {
  /**
   * Retrieve a project by slug of the community including their public information.
   * @param slug
   * @summary Retrieve project by slug.
   */
  @Security("api_key")
  @Get("{slug}")
  @Response<Pick<ValidateError, "status" | "message" | "fields">>(
    401,
    "Authentication failed",
    {
      status: 401,
      message: "Authentication failed",
      fields: {
        access_token: {
          message: "Invalid access token",
        },
      },
    }
  )
  @Response<Pick<Error, "message"> & { status: number }>(
    500,
    "Internal Server Error",
    {
      status: 500,
      message: "Internal Server Error",
    }
  )
  public async getProject(
    // @ts-ignore
    @Request() request: ExpressRequest,
    // @ts-ignore
    @Path() slug: string
  ) {
    const project = await prismaClient.project.findFirst({
      where: { slug, published: true },
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
      },
    });
    if (!project) {
      throw new Error("Project not found");
    }

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

    const { logo, background, slug: projectSlug, ...rest } = project;
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

    const filteredProject = await filterProjectByVisibility(enhancedProject);
    return {
      ...filteredProject,
      url,
    };
  }
}
