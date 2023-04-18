import { Controller, Get, Query, Route, Response } from "tsoa";
import { getAllOrganizations } from "./organizations-service";
// import type { Organizations } from "./organizations-service";

interface InternalServerErrorJSON {
  message: "Internal Server Error";
}

interface ValidateErrorJSON {
  message: "Validation failed";
  details: {
    skip?: {
      message: string;
    };
    take?: {
      message: string;
    };
  };
}

type GetOrganizationsResult = ReturnType<typeof getAllOrganizations>;

@Route("organizations")
export class OrganizationsController extends Controller {
  @Response<ValidateErrorJSON>(422, "Validation Failed")
  @Response<InternalServerErrorJSON>(500, "Internal Server Error")
  @Get()
  public async getAllOrganizations(
    @Query("skip") skip: number,
    @Query("take") take: number
  ): GetOrganizationsResult {
    if (take > 50) {
      take = 50;
    }
    return getAllOrganizations(skip, take);
  }
}
