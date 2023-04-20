import { Controller, Get, Query, Route, Response, Security, Res } from "tsoa";
import type { TsoaResponse } from "tsoa";
import type { ValidateError } from "tsoa";
import { getAllOrganizations } from "./organizations-service";

type GetOrganizationsResult = ReturnType<typeof getAllOrganizations>;
@Route("organizations")
export class OrganizationsController extends Controller {
  /**
   * @param badRequestResponse A take parameter larger than 50 is not allowed
   */
  @Response<ValidateError>(422, "Validation Failed")
  @Response<ValidateError>(401, "Authentication failed")
  @Response<Error>(500, "Internal Server Error")
  @Security("api_key")
  @Get()
  public async getAllOrganizations(
    @Query("skip") skip: number,
    @Query("take") take: number,
    @Res() badRequestResponse: TsoaResponse<400, { message: string }>
  ): GetOrganizationsResult {
    const maxTake = 50;
    if (take > maxTake) {
      return badRequestResponse(400, {
        message: `A take parameter larger than ${maxTake} is not allowed`,
      });
    }
    return getAllOrganizations(skip, take);
  }
}
