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
import { filterEventByVisibility } from "../public-fields-filtering.server";
import { getPublicURL } from "../storage.server";
import { getBaseURL } from "../utils";

@Route("event")
@Tags("Event")
export class EventController extends Controller {
  /**
   * Retrieve a event by slug of the community including their public information.
   * @param slug
   * @summary Retrieve event by slug.
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
  public async getEvent(
    // @ts-ignore
    @Request() request: ExpressRequest,
    // @ts-ignore
    @Path() slug: string
  ) {
    const event = await prismaClient.event.findFirst({
      where: { slug, published: true },
      select: {
        id: true,
        name: true,
        slug: true,
        background: true,
        description: true,
        subline: true,
        startTime: true,
        endTime: true,
        participationFrom: true,
        participationUntil: true,
        participantLimit: true,
        venueName: true,
        venueStreet: true,
        venueStreetNumber: true,
        venueCity: true,
        venueZipCode: true,
        canceled: true,
        parentEventId: true,
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
            eventType: {
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
        tags: {
          select: {
            tag: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
        eventTargetGroups: {
          select: {
            eventTargetGroup: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
        experienceLevel: {
          select: {
            title: true,
            slug: true,
          },
        },
        stage: {
          select: {
            title: true,
            slug: true,
          },
        },
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
        _count: {
          select: {
            participants: true,
            waitingList: true,
            childEvents: true,
          },
        },
      },
    });
    if (!event) {
      throw new Error("Event not found");
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

    const { background, slug: projectSlug, ...rest } = event;
    let publicBackground: string | null = null;
    if (authClient !== undefined) {
      if (background !== null) {
        const publicURL = getPublicURL(authClient, background);
        if (publicURL !== null) {
          publicBackground = getImageURL(publicURL);
        }
      }
    }
    let baseURL = getBaseURL(process.env.COMMUNITY_BASE_URL);

    const url =
      baseURL !== undefined
        ? decorate(request, `${baseURL}/event/${slug}`)
        : null;

    const enhancedEvent = {
      ...rest,
      background: publicBackground,
    };

    const filteredEvent = await filterEventByVisibility(enhancedEvent);
    return {
      ...filteredEvent,
      url,
    };
  }
}
