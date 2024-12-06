import { parseWithZod } from "@conform-to/zod-v1";
import { type SupabaseClient } from "@supabase/supabase-js";
import { type TFunction } from "i18next";
import {
  cancelOrganizationAdminInvitationSchema,
  inviteProfileToBeOrganizationAdminSchema,
  removeAdminFromOrganizationSchema,
} from "~/form-helpers";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";
import { invariantResponse } from "~/lib/utils/response";
import { getCompiledMailTemplate, mailer } from "~/mailer.server";
import { prismaClient } from "~/prisma.server";
import { getSubmissionHash } from "~/routes/project/$slug/settings/utils.server";
import { getPublicURL } from "~/storage.server";
import { type Toast } from "~/toast.server";

export async function getOrganizationWithAdmins(options: {
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
      admins: {
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

  // enhance admins with avatar
  const admins = organization.admins.map((relation) => {
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

  const enhancedOrganization = { ...organization, admins };

  return enhancedOrganization;
}

export async function getPendingAdminInvitesOfOrganization(
  organizationId: string,
  authClient: SupabaseClient
) {
  const profiles =
    await prismaClient.inviteForProfileToJoinOrganization.findMany({
      where: {
        organizationId,
        status: "pending",
        role: "admin",
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

export async function inviteProfileToBeOrganizationAdmin(options: {
  formData: FormData;
  slug: string;
  t: TFunction;
}) {
  const { formData, slug, t } = options;

  const submission = parseWithZod(formData, {
    schema: inviteProfileToBeOrganizationAdminSchema,
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
        role: "admin",
      },
    },
    create: {
      profileId: submission.value.profileId,
      organizationId: organization.id,
      role: "admin",
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
    "mail-templates/invites/profile-to-join-organization/as-admin-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/profile-to-join-organization/as-admin-html.hbs";
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
      "Error sending mail: Invite profile to be admin of organization",
      error
    );
  }

  const hash = getSubmissionHash(submission);
  const toast: Toast = {
    id: "invite-admin-toast",
    key: hash,
    message: t("content.profileAdded", {
      firstName: profile.firstName,
      lastName: profile.lastName,
    }),
  };

  return {
    submission: submission.reply(),
    toast,
  };
}

export async function cancelOrganizationAdminInvitation(options: {
  formData: FormData;
  slug: string;
  t: TFunction;
}) {
  const { formData, slug, t } = options;

  const submission = parseWithZod(formData, {
    schema: cancelOrganizationAdminInvitationSchema,
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
        role: "admin",
      },
    },
    data: {
      status: "canceled",
    },
  });

  const hash = getSubmissionHash(submission);
  const toast: Toast = {
    id: "cancel-invite-toast",
    level: "neutral",
    key: hash,
    message: t("content.inviteCancelled", {
      firstName: profile.firstName,
      lastName: profile.lastName,
    }),
  };

  return {
    submission: submission.reply(),
    toast,
  };
}

export async function removeAdminFromOrganization(options: {
  formData: FormData;
  slug: string;
  t: TFunction;
}) {
  const { formData, slug, t } = options;

  const submission = parseWithZod(formData, {
    schema: removeAdminFromOrganizationSchema,
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
          admins: true,
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
    organization._count.admins > 1,
    t("error.invariant.adminCount"),
    {
      status: 400,
    }
  );

  await prismaClient.adminOfOrganization.delete({
    where: {
      profileId_organizationId: {
        profileId: submission.value.profileId,
        organizationId: organization.id,
      },
    },
  });

  const hash = getSubmissionHash(submission);
  const toast: Toast = {
    id: "remove-admin-toast",
    key: hash,
    message: t("content.profileRemoved", {
      firstName: profile.firstName,
      lastName: profile.lastName,
    }),
  };

  return {
    submission: submission.reply(),
    toast,
  };
}
