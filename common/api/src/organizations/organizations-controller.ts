import {
  Controller,
  Get,
  Query,
  Route,
  Response,
  Security,
  Request,
  Res,
  Tags,
  Example,
} from "tsoa";
import type { TsoaResponse, ValidateError } from "tsoa";
import { getAllOrganizations } from "./organizations-service";
import type { Request as ExpressRequest } from "express";

type GetOrganizationsResult = ReturnType<typeof getAllOrganizations>;

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
        name: "Association For Love And Harmony",
        url: "https://community.platform.org/url/to/organization",
        logo: "https://img.platform.org/public/url/of/organization/logo",
        background:
          "https://img.platform.org/public/url/of/organization/background",
        bio: "I am a <strong>bio</strong>",
        street: "Freedom Road",
        streetNumber: "22",
        city: "City of Relief",
        zipCode: "12345",
        supportedBy: [
          "Aung San Suu Kyi",
          "Rigoberta Menchú",
          "Nelson Mandela",
          "Jody Williams",
        ],
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
          {
            area: {
              name: "New York City",
            },
          },
        ],
        types: [
          {
            organizationType: {
              title: "Association",
            },
          },
          {
            organizationType: {
              title: "Company",
            },
          },
          {
            organizationType: {
              title: "Initiative",
            },
          },
        ],
      },
      {
        id: "87e17b22-4846-4234-9d88-01958ab61960",
        name: "Smallest Organization",
        url: null,
        logo: null,
        background: null,
        bio: null,
        street: null,
        streetNumber: null,
        city: null,
        zipCode: null,
        supportedBy: [],
        areas: [],
        types: [],
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
  public async getAllOrganizations(
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
  ): GetOrganizationsResult {
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
    return getAllOrganizations(request, skip, take);
  }
}
