import {
  Controller,
  Get,
  Query,
  Route,
  Response,
  Security,
  Res,
  Tags,
  Example,
  Request,
} from "tsoa";
import type { ValidateError, TsoaResponse } from "tsoa";

import { getAllProfiles } from "./profiles-service";
import type { Request as ExpressRequest } from "express";

type GetProfilesResult = ReturnType<typeof getAllProfiles>;

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
  @Example<Awaited<GetProfilesResult>>({
    result: [
      {
        id: "ffca2a3a-c0bf-4931-b65a-8d8ccf867096",
        firstName: "John",
        lastName: "Doe",
        academicTitle: "Dr.",
        email: "",
        url: null,
        avatar: "https://img.platform.org/public/url/of/profile/avatar",
        background: "https://img.platform.org/public/url/of/profile/background",
        bio: "I am a </strong>bio</strong>",
        areas: [
          {
            area: {
              name: "India",
            },
          },
          {
            area: {
              name: "Bavaria",
            },
          },
        ],
        offers: [
          {
            offer: {
              title: "Offer 1",
            },
          },
          {
            offer: {
              title: "Offer 2",
            },
          },
        ],
        seekings: [
          {
            offer: {
              title: "Offer 1",
            },
          },
          {
            offer: {
              title: "Offer 2",
            },
          },
        ],
      },
    ],
    skip: 0,
    take: 2,
  })
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
  ): GetProfilesResult {
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
