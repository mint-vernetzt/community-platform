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
        },
        {
          profileJoinInvites: {
            none: {
              profileId: profileId,
              status: "pending",
            },
          },
        },
        {
          profileJoinRequests: {
            none: {
              profileId: profileId,
              status: "pending",
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
    return { error: new Error("addOrganization.errors.alreadyInRelation") };
  }

  const result = await prismaClient.requestToOrganizationToAddProfile.upsert({
    create: {
      organizationId: organizationId,
      profileId: profileId,
      status: "pending",
    },
    update: {
      status: "pending",
    },
    where: {
      profileId_organizationId: {
        organizationId,
        profileId,
      },
    },
    select: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      organization: {
        select: {
          name: true,
          admins: {
            select: {
              profile: {
                select: {
                  email: true,
                  firstName: true,
                },
              },
            },
          },
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

  return { ...result };
}

export async function cancelRequestToOrganization(
  organizationId: string,
  profileId: string
) {
  const result = await prismaClient.requestToOrganizationToAddProfile.update({
    where: {
      profileId_organizationId: {
        organizationId,
        profileId,
      },
    },
    data: {
      status: "canceled",
    },
    select: {
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
  return result;
}

export async function rejectRequestFromProfile(
  organizationId: string,
  profileId: string
) {
  const result = await prismaClient.requestToOrganizationToAddProfile.update({
    select: {
      profile: {
        select: {
          academicTitle: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      organization: {
        select: {
          name: true,
        },
      },
    },
    where: {
      profileId_organizationId: {
        organizationId,
        profileId,
      },
      status: "pending",
    },
    data: {
      status: "rejected",
    },
  });

  return result;
}

export async function acceptRequestFromProfile(
  organizationId: string,
  profileId: string
) {
  const [result] = await prismaClient.$transaction([
    prismaClient.requestToOrganizationToAddProfile.update({
      select: {
        profile: {
          select: {
            academicTitle: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        organization: {
          select: {
            name: true,
          },
        },
      },
      where: {
        profileId_organizationId: {
          organizationId,
          profileId,
        },
        status: "pending",
      },
      data: {
        status: "accepted",
      },
    }),
    prismaClient.organization.update({
      select: {
        id: true,
      },
      where: {
        id: organizationId,
        teamMembers: {
          none: {
            profileId,
          },
        },
      },
      data: {
        teamMembers: {
          create: {
            profileId,
          },
        },
      },
    }),
  ]);

  return result;
}
