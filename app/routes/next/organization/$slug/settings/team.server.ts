import { parseWithZod } from "@conform-to/zod-v1";
import { type SupabaseClient } from "@supabase/supabase-js";
import { type TFunction } from "i18next";
import {
  cancelOrganizationTeamMemberInvitationSchema,
  inviteProfileToBeOrganizationTeamMemberSchema,
  removeTeamMemberFromOrganizationSchema,
} from "~/form-helpers";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";
import { invariantResponse } from "~/lib/utils/response";
import { getCompiledMailTemplate, mailer } from "~/mailer.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { type Toast } from "~/toast.server";

export async function getOrganizationWithTeamMembers(options: {
  slug: string;
  authClient: SupabaseClient;
  t: TFunction;
}) {
  const { slug, authClient, t } = options;
  const organization = await prismaClient.organization.findFirst({
    where: {
      slug,
    },
    select: {
      id: true,
      teamMembers: {
        select: {
          profile: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              academicTitle: true,
              position: true,
            },
          },
        },
      },
    },
  });

  invariantResponse(organization !== null, t("error.invariant.notFound"), {
    status: 404,
  });

  // enhance teamMembers with avatar
  const teamMembers = organization.teamMembers.map((relation) => {
    let avatar = relation.profile.avatar;
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.ListItem.Avatar,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.ListItem.BlurredAvatar,
          },
          blur: BlurFactor,
        });
      }
    }
    return { profile: { ...relation.profile, avatar, blurredAvatar } };
  });

  const enhancedOrganization = { ...organization, teamMembers };

  return enhancedOrganization;
}

export async function getPendingTeamMemberInvitesOfOrganization(
  organizationId: string,
  authClient: SupabaseClient
) {
  const profiles =
    await prismaClient.inviteForProfileToJoinOrganization.findMany({
      where: {
        organizationId,
        status: "pending",
        role: "member",
      },
      select: {
        profile: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            academicTitle: true,
            position: true,
          },
        },
      },
      orderBy: {
        profile: {
          firstName: "asc",
        },
      },
    });

  const enhancedProfiles = profiles.map((relation) => {
    let avatar = relation.profile.avatar;
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.ListItem.Avatar,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.ListItem.BlurredAvatar,
          },
          blur: BlurFactor,
        });
      }
    }
    return { ...relation.profile, avatar, blurredAvatar };
  });

  return enhancedProfiles;
}

export async function inviteProfileToBeOrganizationTeamMember(options: {
  formData: FormData;
  slug: string;
  t: TFunction;
}) {
  const { formData, slug, t } = options;

  const submission = parseWithZod(formData, {
    schema: inviteProfileToBeOrganizationTeamMemberSchema,
  });
  if (submission.status !== "success") {
    return { submission: submission.reply() };
  }

  const organization = await prismaClient.organization.findFirst({
    where: { slug },
    select: {
      id: true,
      name: true,
    },
  });

  const profile = await prismaClient.profile.findFirst({
    where: { id: submission.value.profileId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  invariantResponse(
    organization !== null && profile !== null,
    t("error.invariant.entitiesForInviteNotFound"),
    {
      status: 404,
    }
  );

  await prismaClient.inviteForProfileToJoinOrganization.upsert({
    where: {
      profileId_organizationId_role: {
        profileId: submission.value.profileId,
        organizationId: organization.id,
        role: "member",
      },
    },
    create: {
      profileId: submission.value.profileId,
      organizationId: organization.id,
      role: "member",
      status: "pending",
    },
    update: {
      status: "pending",
    },
  });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = t("email.subject");
  const recipient = profile.email;
  const textTemplatePath =
    "mail-templates/invites/profile-to-join-organization/text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/profile-to-join-organization/html.hbs";
  const content = {
    firstName: profile.firstName,
    organization: {
      name: organization.name,
    },
    button: {
      url: `${process.env.COMMUNITY_BASE_URL}/my/organizations`,
      text: t("email.button.text"),
    },
  };

  const text = getCompiledMailTemplate<typeof textTemplatePath>(
    textTemplatePath,
    content,
    "text"
  );
  const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
    htmlTemplatePath,
    content,
    "html"
  );

  try {
    await mailer(mailerOptions, sender, recipient, subject, text, html);
  } catch (error) {
    console.error(
      "Error sending mail: Invite profile to be team member of organization",
      error
    );
  }

  return {
    submission: submission.reply(),
    toast: {
      id: "invite-team-member-toast",
      key: `${new Date().getTime()}`,
      message: t("content.profileAdded", {
        firstName: profile.firstName,
        lastName: profile.lastName,
      }),
    },
  };
}

export async function cancelOrganizationTeamMemberInvitation(options: {
  formData: FormData;
  slug: string;
  t: TFunction;
}) {
  const { formData, slug, t } = options;

  const submission = parseWithZod(formData, {
    schema: cancelOrganizationTeamMemberInvitationSchema,
  });
  if (submission.status !== "success") {
    return { submission: submission.reply() };
  }

  const organization = await prismaClient.organization.findFirst({
    where: { slug },
    select: {
      id: true,
    },
  });
  const profile = await prismaClient.profile.findFirst({
    where: { id: submission.value.profileId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });
  invariantResponse(
    organization !== null && profile !== null,
    t("error.invariant.entitiesForInviteNotFound"),
    { status: 404 }
  );

  await prismaClient.inviteForProfileToJoinOrganization.update({
    where: {
      profileId_organizationId_role: {
        profileId: submission.value.profileId,
        organizationId: organization.id,
        role: "member",
      },
    },
    data: {
      status: "canceled",
    },
  });

  return {
    submission: submission.reply(),
    toast: {
      id: "cancel-invite-toast",
      key: `${new Date().getTime()}`,
      message: t("content.inviteCancelled", {
        firstName: profile.firstName,
        lastName: profile.lastName,
      }),
    },
  };
}

export async function removeTeamMemberFromOrganization(options: {
  formData: FormData;
  slug: string;
  t: TFunction;
}) {
  const { formData, slug, t } = options;

  const submission = parseWithZod(formData, {
    schema: removeTeamMemberFromOrganizationSchema,
  });
  if (submission.status !== "success") {
    return { submission: submission.reply() };
  }

  const organization = await prismaClient.organization.findFirst({
    where: { slug },
    select: {
      id: true,
      _count: {
        select: {
          teamMembers: true,
        },
      },
    },
  });
  const profile = await prismaClient.profile.findFirst({
    where: { id: submission.value.profileId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });
  invariantResponse(
    organization !== null && profile !== null,
    t("error.invariant.entitiesForRemovalNotFound"),
    { status: 404 }
  );
  invariantResponse(
    organization._count.teamMembers > 1,
    t("error.invariant.teamMemberCount"),
    {
      status: 400,
    }
  );

  await prismaClient.memberOfOrganization.delete({
    where: {
      profileId_organizationId: {
        profileId: submission.value.profileId,
        organizationId: organization.id,
      },
    },
  });

  return {
    submission: submission.reply(),
    toast: {
      id: "remove-team-member-toast",
      key: `${new Date().getTime()}`,
      message: t("content.profileRemoved", {
        firstName: profile.firstName,
        lastName: profile.lastName,
      }),
    },
  };
}
