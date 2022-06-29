import {
  AreasOnOrganizations,
  MemberOfNetwork,
  MemberOfOrganization,
  Organization,
  OrganizationTypesOnOrganizations,
} from ".prisma/client";
import { prismaClient } from "./prisma";

export type OrganizationWithRelations = Organization & {
  types: OrganizationTypesOnOrganizations[];
  teamMembers: MemberOfOrganization[];
  memberOf: MemberOfNetwork[];
  networkMembers: MemberOfNetwork[];
  areas: AreasOnOrganizations[];
};

export async function getOrganisationBySlug(slug: string) {
  const organization = await prismaClient.organization.findUnique({
    where: { slug },
    include: {
      types: true,
      teamMembers: true,
      memberOf: true,
      networkMembers: true,
      areas: true,
    },
  });

  return organization as OrganizationWithRelations | null;
}
