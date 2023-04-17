import { Controller, Get, Query, Route } from "tsoa";
import { getAllPublicOrganizations } from "./organizations-service";
@Route("organizations")
export class OrganizationsController extends Controller {
  @Get()
  public async getAllOrganizations(
    @Query() skip: number,
    @Query() take: number
  ): Promise<ReturnType<typeof getAllPublicOrganizations>> {
    return getAllPublicOrganizations(skip, take);
  }
}

// limit take -> max 50
