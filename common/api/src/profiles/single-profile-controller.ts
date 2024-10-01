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
import { getImageURL } from "../cp-modules/images.server";
import { decorate } from "../lib/matomoUrlDecorator";
import { prismaClient } from "../cp-modules/prisma";
import { filterProfileByVisibility } from "../cp-modules/next-public-fields-filtering.server";
import { getPublicURL } from "../cp-modules/storage.server";
import { getBaseURL } from "../cp-modules/utils";

@Route("profile")
@Tags("Profile")
export class ProfileController extends Controller {
  /**
   * Retrieve a profile by username of the community including their public information.
   * @param username
   * @summary Retrieve profile by username.
   */
  @Security("api_key")
  @Get("{username}")
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
  public async getProfile(
    // @ts-ignore
    @Request() request: ExpressRequest,
    // @ts-ignore
    @Path() username: string
  ) {
    const profile = await prismaClient.profile.findFirst({
      where: { username },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        academicTitle: true,
        email: true,
        email2: true,
        avatar: true,
        background: true,
        bio: true,
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
        offers: {
          select: {
            offer: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
        seekings: {
          select: {
            offer: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
        profileVisibility: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            academicTitle: true,
            email: true,
            avatar: true,
            background: true,
            bio: true,
            areas: true,
            offers: true,
            seekings: true,
          },
        },
      },
    });
    if (!profile) {
      throw new Error("Profile not found");
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

    const { avatar, background, username: profileUsername, ...rest } = profile;
    let publicAvatar: string | null = null;
    let publicBackground: string | null = null;
    if (authClient !== undefined) {
      if (avatar !== null) {
        const publicURL = getPublicURL(authClient, avatar);
        if (publicURL !== null) {
          publicAvatar = getImageURL(publicURL);
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
        ? decorate(request, `${baseURL}/profile/${username}`)
        : null;

    const enhancedProfile = {
      ...rest,
      avatar: publicAvatar,
      background: publicBackground,
    };

    const filteredProfile = filterProfileByVisibility(enhancedProfile);
    return {
      ...filteredProfile,
      url,
    };
  }
}
