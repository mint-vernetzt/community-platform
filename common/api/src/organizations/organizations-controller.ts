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
import { getAllOrganizations } from "./organizations-service";

type GetOrganizationsResult = ReturnType<typeof getAllOrganizations>;

const MAX_TAKE = 50;
@Route("organizations")
@Tags("Organizations")
export class OrganizationsController extends Controller {
  /**
   * Retrieves all organizations of the community including their public information.
   * They do not include private (Community-only) fields.
   * @param skip The number of items to skip before starting to collect the result set
   * @param take The number of items to return (A take parameter larger than 50 is not allowed)
   * @param badRequestResponse A take parameter larger than 50 is not allowed
   * @summary Retrieve all organizations.
   */
  @Example<Awaited<GetOrganizationsResult>>({
    result: [
      {
        id: "52907745-7672-470e-a803-a2f8feb52944",
        name: "Some Organization AG",
      },
      {
        id: "87e17b22-4846-4234-9d88-01958ab61960",
        name: "Another Organization GmbH",
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
  public async getAllOrganizations(
    @Query("skip") skip: number,
    @Query("take") take: number,
    @Res()
    badRequestResponse: TsoaResponse<
      400,
      { status: number; message: string; fields: FieldErrors }
    >
  ): GetOrganizationsResult {
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
    return getAllOrganizations(skip, take);
  }
}
