import {
  Controller,
  Get,
  Query,
  Route,
  Response,
  Security,
  Res,
  Tags,
} from "tsoa";
import type { TsoaResponse } from "tsoa";
import type { ValidateError } from "tsoa";
import { getAllOrganizations } from "./organizations-service";

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
