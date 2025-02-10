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
import type { Request as ExpressRequest } from "express";
import { getAllProfiles } from "./profiles-service";

const exampleResponse = {
  result: [
    {
      id: "ffca2a3a-c0bf-4931-b65a-8d8ccf867096",
      firstName: "John",
      lastName: "Doe",
      academicTitle: "Dr.",
      email: "john@doe.org",
      email2: "john2@doe.org",
      url: "https://community.platform.org/url/to/profile",
      avatar: "https://img.platform.org/public/url/of/profile/avatar",
      background: "https://img.platform.org/public/url/of/profile/background",
      bio: "I am a </strong>bio</strong>",
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
      ],
      offers: [
        {
          offer: {
            title: "Digital skills",
            slug: "digital-skills",
          },
        },
        {
          offer: {
            title: "Contact with companies",
            slug: "contact-with-companies",
          },
        },
      ],
      seekings: [
        {
          offer: {
            title: "Contact with trainees",
            slug: "contact-with-trainees",
          },
        },
        {
          offer: {
            title: "Networking",
            slug: "networking",
          },
        },
      ],
    },
    {
      id: "37878ae0-cc7b-42d3-8e7c-a9ddf8810797",
      firstName: "Jane",
      lastName: "Doe",
      academicTitle: null,
      email: "",
      email2: null,
      url: null,
      avatar: null,
      background: null,
      bio: null,
      areas: [],
      offers: [],
      seekings: [],
    },
  ],
  skip: 0,
  take: 2,
};

@Route("profiles")
@Tags("Profiles")
export class ProfilesController extends Controller {
  /**
   * Retrieves all profiles of the community including their public information.
   * They do not include private (Community-only) fields.
   * @param skip The number of items to skip before starting to collect the result set
   * @param take The number of items to return (A take parameter larger than 50 is not allowed)
   * @param badRequestResponse A take parameter larger than 50 is not allowed
   * @summary Retrieve all profiles.
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
    return getAllProfiles(request, skip, take);
  }
}
