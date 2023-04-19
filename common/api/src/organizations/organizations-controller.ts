import { Controller, Get, Query, Route, Response, Security } from "tsoa";
import type { ValidateError } from "tsoa";
import { getAllOrganizations } from "./organizations-service";

type GetOrganizationsResult = ReturnType<typeof getAllOrganizations>;

@Route("organizations")
export class OrganizationsController extends Controller {
  @Response<ValidateError>(422, "Validation Failed")
  @Response<ValidateError>(401, "Authentication failed")
  @Response<Error>(500, "Internal Server Error")
  @Security("api_key")
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
