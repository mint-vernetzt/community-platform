import { prismaClient } from "~/prisma.server";

export async function getProfileCount() {
  return await prismaClient.profile.count();
}

export async function getOrganizationCount() {
  return await prismaClient.organization.count();
}

export async function getEventCount() {
  return await prismaClient.event.count();
}
