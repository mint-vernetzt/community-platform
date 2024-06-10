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
import { filterOrganizationByVisibility } from "../public-fields-filtering.server";
import { getPublicURL } from "../storage.server";
import { getBaseURL } from "../utils";

@Route("organization")
@Tags("Organization")
export class OrganizationController extends Controller {
  /**
   * Retrieve a organization by slug of the community including their public information.
   * @param slug
   * @summary Retrieve organization by slug.
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
  public async getOrganization(
    // @ts-ignore
    @Request() request: ExpressRequest,
    // @ts-ignore
    @Path() slug: string
  ) {
    const organization = await prismaClient.organization.findFirst({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        logo: true,
        background: true,
        bio: true,
        street: true,
        streetNumber: true,
        city: true,
        zipCode: true,
        supportedBy: true,
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
        types: {
          select: {
            organizationType: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
        focuses: {
          select: {
            focus: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    });
    if (!organization) {
      throw new Error("Organization not found");
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

    const { logo, background, slug: organizationSlug, ...rest } = organization;
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
        ? decorate(request, `${baseURL}/organization/${slug}`)
        : null;

    const enhancedOrganization = {
      ...rest,
      logo: publicLogo,
      background: publicBackground,
    };

    const filteredOrganization = await filterOrganizationByVisibility(
      enhancedOrganization
    );
    return {
      ...filteredOrganization,
      url,
    };
  }
}
