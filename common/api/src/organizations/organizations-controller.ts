import { Controller, Get, Query, Route } from "tsoa";
import { OrganizationsService } from "./organizations-service";

@Route("organizations")
export class OrganizationsController extends Controller {
  @Get()
  public async getAllOrganizations(
    @Query() skip: number,
    @Query() take: number
  ): Promise<ReturnType<OrganizationsService["getAll"]>> {
    return new OrganizationsService().getAll(skip, take);
  }
}
