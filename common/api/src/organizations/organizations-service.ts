import type { Organization } from "@prisma/client";

export type PublicOrganization = Pick<Organization, "id" | "name">;

export class OrganizationsService {
  public getAll(
    skip: number,
    take: number
  ): { skip: number; take: number; result: PublicOrganization[] } {
    // TODO: get all public organizations from prisma based on skip and take params

    console.log(skip, take);

    const publicOrganizations = [
      {
        id: "some-id",

        name: "Jane Doe",
      },
      {
        id: "another-id",

        name: "John Doe",
      },
    ];
    return { skip, take, result: publicOrganizations };
  }
}
