import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";
import { mailer } from "~/mailer.server";
import { prismaClient } from "~/prisma.server";

export async function getProfileById(id: string) {
  return await prismaClient.profile.findUnique({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      administeredOrganizations: {
        select: {
          organization: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
    where: {
      id,
    },
  });
}

export async function getOrganizationBySlug(slug: string) {
  return await prismaClient.organization.findUnique({
    select: {
      id: true,
    },
    where: {
      slug,
    },
  });
}

export async function inviteProfileToJoinOrganization(
  organizationId: string,
  profileId: string
) {
  const profile = await prismaClient.profile.findFirst({
    where: {
      id: profileId,
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  const organization = await prismaClient.organization.findFirst({
    where: {
      id: organizationId,
    },
    select: {
      name: true,
    },
  });

  if (profile === null || organization === null) {
    return new Error("Profile or organization not found");
  }

  await prismaClient.inviteForProfileToJoinOrganization.upsert({
    where: {
      profileId_organizationId_role: {
        profileId,
        organizationId,
        role: "admin",
      },
    },
    create: {
      profileId,
      organizationId,
      role: "admin",
      status: "pending",
    },
    update: {
      status: "pending",
    },
  });

  const subject = "Invite to join organization as admin";
  const sender = process.env.SYSTEM_MAIL_SENDER;
  const recipient = profile.email;
  const text = `Hi ${profile.firstName} ${profile.lastName}, you have been invited to join the organization ${organization.name} as admin.`;
  const html = text;

  await mailer(mailerOptions, sender, recipient, subject, text, html);

  return null;
}

export async function addAdminToOrganization(
  organizationId: string,
  profileId: string
) {
  await prismaClient.adminOfOrganization.create({
    data: {
      profileId,
      organizationId,
    },
  });
}
