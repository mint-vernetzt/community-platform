import { type SupabaseClient } from "@supabase/supabase-js";
import { getImageURL } from "~/images.server";
import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";
import { mailer } from "~/mailer.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getPendingRequestsToOrganizations(
  profileId: string,
  authClient: SupabaseClient
) {
  const requests = (
    await prismaClient.requestToOrganizationToAddProfile.findMany({
      where: {
        profileId,
        status: "pending",
      },
      select: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            types: {
              select: {
                organizationType: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  ).map((relation) => {
    return relation.organization;
  });

  const enhancedRequests = requests.map((request) => {
    let logo = request.logo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: { type: "fill", width: 144, height: 144 },
        });
      }
    }
    return {
      ...request,
      logo,
    };
  });

  return enhancedRequests;
}

export async function createRequestToOrganization(
  organizationId: string,
  profileId: string
) {
  const organization = await prismaClient.organization.findFirst({
    where: {
      id: organizationId,
      AND: [
        {
          teamMembers: {
            none: {
              profileId: profileId,
            },
          },
          admins: {
            none: {
              profileId: profileId,
            },
          },
        },
        {
          profileJoinInvites: {
            none: {
              profileId: profileId,
            },
          },
        },
        {
          profileJoinRequests: {
            none: {
              profileId: profileId,
            },
          },
        },
      ],
    },
    select: {
      name: true,
      admins: {
        select: {
          profile: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  });

  if (organization === null) {
    return new Error("addOrganization.errors.alreadyInRelation");
  }

  const result = await prismaClient.requestToOrganizationToAddProfile.create({
    data: {
      organizationId: organizationId as string,
      profileId: profileId,
      status: "pending",
    },
    select: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = `${result.profile.firstName} ${result.profile.lastName} send request to join organization`;
  const recipient = organization.admins.map((admin) => {
    return admin.profile.email;
  });

  const text = `Hi admins of ${organization.name}, ${result.profile.firstName} ${result.profile.lastName} has requested to join your organization. You can contact ${result.profile.firstName} ${result.profile.lastName} at ${result.profile.email}.`;
  const html = text;

  await mailer(mailerOptions, sender, recipient, subject, text, html);

  return null;
}

export async function cancelRequestToOrganization(
  organizationId: string,
  profileId: string
) {
  await prismaClient.requestToOrganizationToAddProfile.update({
    where: {
      profileId_organizationId: {
        organizationId,
        profileId,
      },
    },
    data: {
      status: "canceled",
    },
  });
}
