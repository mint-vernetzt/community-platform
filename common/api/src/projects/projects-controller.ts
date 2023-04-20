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
import { getAllProjects } from "./projects-service";

type GetProjectsResult = ReturnType<typeof getAllProjects>;

const MAX_TAKE = 50;
@Route("projects")
@Tags("Projects")
export class ProjectsController extends Controller {
  /**
   * Retrieves all projects of the community including their public information.
   * They do not include private (Community-only) fields.
   * @param skip The number of items to skip before starting to collect the result set
   * @param take The number of items to return (A take parameter larger than 50 is not allowed)
   * @param badRequestResponse A take parameter larger than 50 is not allowed
   * @summary Retrieve all projects.
   */
  @Example<Awaited<GetProjectsResult>>({
    result: [
      {
        id: "d2bae762-e419-4a57-b12f-fdc01beb22d2",
        name: "Some Project",
        url: "https://community.platform.org/url/to/project",
        logo: "https://img.platform.org/public/url/of/project/logo",
        background: "https://img.platform.org/public/url/of/project/background",
        headline:
          "Using Different Learning Strategies In The Context Of Computer Science",
        excerpt:
          "Find new learning strategies that fit for individuals with different learning styles and ...",
        description:
          "Welcome to our project where we present and discuss multiple learning strategies in the context of computer science. In multiple workshops and keynote speeches we will explore strategies to ...",
        email: "learning@strategies.org",
        phone: "(+49) 176 / 123456789",
        street: "Learning Avenue",
        streetNumber: "181",
        city: "Educationtown",
        zipCode: "12345",
        website: "https://learning.strategies.org/",
        facebook: "https://facebook.com/learningStrategies",
        linkedin: "https://linkedin.com/company/learningStrategies",
        twitter: "https://twitter.com/learningStrategies",
        youtube: "https://youtube.com/learningStrategies",
        instagram: "https://instagram.com/learningStrategies",
        xing: "https://xing.com/pages/learningStrategies",
        disciplines: [
          {
            discipline: {
              title: "Math",
            },
          },
          {
            discipline: {
              title: "Computer Science",
            },
          },
        ],
        targetGroups: [
          {
            targetGroup: {
              title: "Elementary School",
            },
          },
          {
            targetGroup: {
              title: "Early Childhood Education",
            },
          },
          {
            targetGroup: {
              title: "Teachers",
            },
          },
        ],
      },
      {
        id: "1916da3c-b401-49f3-91e6-173f01c6ddd8",
        name: "Smallest Project",
        url: null,
        logo: null,
        background: null,
        headline: null,
        excerpt: null,
        description: null,
        email: null,
        phone: null,
        street: null,
        streetNumber: null,
        city: null,
        zipCode: null,
        website: null,
        facebook: null,
        linkedin: null,
        twitter: null,
        youtube: null,
        instagram: null,
        xing: null,
        disciplines: [],
        targetGroups: [],
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
  public async getAllProjects(
    @Query("skip") skip: number,
    @Query("take") take: number,
    @Res()
    badRequestResponse: TsoaResponse<
      400,
      { status: number; message: string; fields: FieldErrors }
    >
  ): GetProjectsResult {
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
    return getAllProjects(skip, take);
  }
}
