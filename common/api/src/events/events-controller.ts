import {
  Controller,
  Get,
  Route,
  Response,
  Security,
  Tags,
  Example,
  Request,
  Query,
  Res,
} from "tsoa";
import type { ValidateError, TsoaResponse } from "tsoa";

import { getAllEvents } from "./events-service";
import type { Request as ExpressRequest } from "express";

const exampleResponse = {
  result: [
    {
      id: "a24004fa-aee8-40e2-aeb8-c6a40a1a2ee4",
      name: "Consensus in heterogeneous groups",
      slug: "event-slug",
      url: "https://community.platform.org/url/to/event",
      background: "https://img.platform.org/public/url/of/event/background",
      description:
        "Welcome to our event where we present and discuss multiple ways to find consensus in heterogeneous groups. In <strong>multiple workshops</strong> and keynote speeches we will explore strategies to ...",
      subline: "Discussing different approaches to find consensus",
      startTime: new Date("Sat, 17 Jun 2017 10:00:00 GMT"),
      endTime: new Date("Sun, 18 Jun 2017 18:00:00 GMT"),
      participationFrom: new Date("Mon, 12 Jun 2017 00:00:00 GMT"),
      participationUntil: new Date("Fri, 16 Jun 2017 00:00:00 GMT"),
      participantLimit: 20,
      venueName: "Meetingpalace",
      venueStreet: "Gatheringstreet",
      venueStreetNumber: "12",
      venueCity: "City of Happenings",
      venueZipCode: "12345",
      canceled: false,
      parentEventId: "some-parent-event-id",
      areas: [
        {
          area: {
            name: "India",
            slug: "india",
          },
        },
        {
          area: {
            name: "Bavaria",
            slug: "bavaria",
          },
        },
        {
          area: {
            name: "New York City",
            slug: "new_york_city",
          },
        },
      ],
      types: [
        {
          eventType: {
            title: "Exchange",
            slug: "exchange",
          },
        },
        {
          eventType: {
            title: "Keynote",
            slug: "keynote",
          },
        },
        {
          eventType: {
            title: "Workshop",
            slug: "workshop",
          },
        },
      ],
      focuses: [
        {
          focus: {
            title: "Social Media Management",
            slug: "social_media_management",
          },
        },
        {
          focus: {
            title: "Politics",
            slug: "politics",
          },
        },
        {
          focus: {
            title: "Science",
            slug: "science",
          },
        },
        {
          focus: {
            title: "Career Orientation",
            slug: "career_orientation",
          },
        },
      ],
      tags: [
        {
          tag: {
            title: "Didactics",
            slug: "didactics",
          },
        },
        {
          tag: {
            title: "Gender",
            slug: "gender",
          },
        },
        {
          tag: {
            title: "Innovation",
            slug: "innovation",
          },
        },
        {
          tag: {
            title: "Networking",
            slug: "networking",
          },
        },
      ],
      eventTargetGroups: [
        {
          eventTargetGroup: {
            title: "Elementary School",
            slug: "elementary_school",
          },
        },
        {
          eventTargetGroup: {
            title: "Early Childhood Education",
            slug: "early_childhood_education",
          },
        },
        {
          eventTargetGroup: {
            title: "Teachers",
            slug: "teachers",
          },
        },
      ],
      experienceLevel: {
        title: "Beginner",
        slug: "beginner",
      },
      stage: {
        title: "Hybrid",
        slug: "hybrid",
      },
      _count: {
        participants: 20,
        waitingList: 3,
        childEvents: 2,
      },
      responsibleOrganizations: [
        {
          organization: {
            name: "Platform",
            slug: "platform",
            logo: "https://img.platform.org/public/url/of/logo",
            url: "https://community.platform.org/url/to/organization",
          },
        },
      ],
    },
    {
      id: "ffca2a3a-c0bf-4931-b65a-8d8ccf867096",
      name: "Smallest Event",
      slug: "smallest-event",
      url: null,
      background: null,
      description: null,
      subline: null,
      startTime: new Date("Sat, 17 Jun 2017 10:00:00 GMT"),
      endTime: new Date("Sun, 18 Jun 2017 18:00:00 GMT"),
      participationFrom: new Date("Mon, 12 Jun 2017 00:00:00 GMT"),
      participationUntil: new Date("Fri, 16 Jun 2017 00:00:00 GMT"),
      participantLimit: null,
      venueName: null,
      venueStreet: null,
      venueStreetNumber: null,
      venueCity: null,
      venueZipCode: null,
      canceled: true,
      parentEventId: null,
      areas: [],
      types: [],
      focuses: [],
      tags: [],
      eventTargetGroups: [],
      experienceLevel: null,
      stage: null,
      _count: {
        participants: 0,
        waitingList: 0,
        childEvents: 0,
      },
      responsibleOrganizations: [],
    },
  ],
  skip: 0,
  take: 2,
};

@Route("events")
@Tags("Events")
export class EventsController extends Controller {
  /**
   * Retrieves all events of the community including their public information.
   * They do not include private (Community-only) fields.
   * @param skip The number of items to skip before starting to collect the result set
   * @param take The number of items to return (A take parameter larger than 50 is not allowed)
   * @param badRequestResponse A take parameter larger than 50 is not allowed
   * @summary Retrieve all events.
   */
  @Example<typeof exampleResponse>(exampleResponse)
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
  @Response<Pick<ValidateError, "status" | "message" | "fields">>(
    422,
    "Validation Failed",
    {
      status: 422,
      message: "Validation failed",
      fields: {
        skip: {
          message: "'skip' is required",
        },
        take: {
          message: "'take' is required",
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
  @Security("api_key")
  @Get()
  public async getAllEvents(
    @Query("skip") skip: number,
    @Query("take") take: number,
    @Request() request: ExpressRequest,
    @Res()
    badRequestResponse: TsoaResponse<
      400,
      {
        fields: {
          take: {
            message: "A take parameter larger than 50 is not allowed";
          };
        };
        message: "Parameter out of range";
        status: 400;
      }
    >
  ) {
    if (take > 50) {
      return badRequestResponse(400, {
        status: 400,
        message: "Parameter out of range",
        fields: {
          take: {
            message: "A take parameter larger than 50 is not allowed",
          },
        },
      });
    }
    return getAllEvents(request, skip, take);
  }
}
