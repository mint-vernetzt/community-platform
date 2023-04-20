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
} from "tsoa";
import type { FieldErrors } from "tsoa";
import type { TsoaResponse } from "tsoa";
import type { ValidateError } from "tsoa";
import { getAllEvents } from "./events-service";

type GetEventsResult = ReturnType<typeof getAllEvents>;

const MAX_TAKE = 50;
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
  @Example<Awaited<GetEventsResult>>({
    result: [
      {
        id: "a24004fa-aee8-40e2-aeb8-c6a40a1a2ee4",
        name: "Some Event",
      },
      {
        id: "ffca2a3a-c0bf-4931-b65a-8d8ccf867096",
        name: "Another Event",
      },
    ],
    skip: 0,
    take: 2,
  })
  // @Response<Pick<ValidateError, "status" | "message" | "fields">>(
  //   400,
  //   "Parameter out of range",
  //   {
  //     status: 400,
  //     message: "Parameter out of range",
  //     fields: {
  //       take: {
  //         message: `A take parameter larger than ${MAX_TAKE} is not allowed`,
  //       },
  //     },
  //   }
  // )
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
    @Res()
    badRequestResponse: TsoaResponse<
      400,
      { status: number; message: string; fields: FieldErrors }
    >
  ): GetEventsResult {
    if (take > MAX_TAKE) {
      return badRequestResponse(400, {
        status: 400,
        message: "Parameter out of range",
        fields: {
          take: {
            message: `A take parameter larger than ${MAX_TAKE} is not allowed`,
          },
        },
      });
    }
    return getAllEvents(skip, take);
  }
}
