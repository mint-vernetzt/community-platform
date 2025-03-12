import { parseWithZod } from "@conform-to/zod-v1";
import { type SupabaseClient } from "@supabase/supabase-js";
import {
  addTeamMeberToProjectSchema,
  removeTeamMemberFromProjectSchema,
} from "~/form-helpers";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export type ProjectTeamSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["project/$slug/settings/team"];

export async function getProjectWithTeamMembers(options: {
  slug: string;
  authClient: SupabaseClient;
  locales: ProjectTeamSettingsLocales;
}) {
  const { slug, authClient, locales } = options;
  const project = await prismaClient.project.findFirst({
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

  invariantResponse(project !== null, locales.route.error.invariant.notFound, {
    status: 404,
  });

  // enhance teamMembers with avatar
  const teamMembers = project.teamMembers.map((relation) => {
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

  const enhancedProject = { ...project, teamMembers };

  return enhancedProject;
}

// TODO: Remove this function when implementing project admin invites
export async function addTeamMemberToProject(options: {
  formData: FormData;
  slug: string;
  locales: ProjectTeamSettingsLocales;
}) {
  const { formData, slug, locales } = options;

  const submission = parseWithZod(formData, {
    schema: addTeamMeberToProjectSchema,
  });
  if (submission.status !== "success") {
    return { submission: submission.reply() };
  }

  const project = await prismaClient.project.findFirst({
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
    project !== null && profile !== null,
    locales.route.error.invariant.entitiesForRemovalNotFound,
    { status: 404 }
  );

  await prismaClient.teamMemberOfProject.create({
    data: {
      profileId: submission.value.profileId,
      projectId: project.id,
    },
  });

  return {
    submission: submission.reply(),
    toast: {
      id: "add-team-member-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(locales.route.content.profileAdded, {
        firstName: profile.firstName,
        lastName: profile.lastName,
      }),
    },
  };
}

// TODO: Add these functions when implementing project team member invites
// export async function getPendingTeamMemberInvitesOfProject(
//   projectId: string,
//   authClient: SupabaseClient
// ) {
//   const profiles = await prismaClient.inviteForProfileToJoinProject.findMany({
//     where: {
//       projectId,
//       status: "pending",
//       role: "member",
//     },
//     select: {
//       profile: {
//         select: {
//           id: true,
//           username: true,
//           firstName: true,
//           lastName: true,
//           avatar: true,
//           academicTitle: true,
//           position: true,
//         },
//       },
//     },
//     orderBy: {
//       profile: {
//         firstName: "asc",
//       },
//     },
//   });

//   const enhancedProfiles = profiles.map((relation) => {
//     let avatar = relation.profile.avatar;
//     let blurredAvatar;
//     if (avatar !== null) {
//       const publicURL = getPublicURL(authClient, avatar);
//       if (publicURL !== null) {
//         avatar = getImageURL(publicURL, {
//           resize: {
//             type: "fill",
//             ...ImageSizes.Profile.ListItem.Avatar,
//           },
//         });
//         blurredAvatar = getImageURL(publicURL, {
//           resize: {
//             type: "fill",
//             ...ImageSizes.Profile.ListItem.BlurredAvatar,
//           },
//           blur: BlurFactor,
//         });
//       }
//     }
//     return { ...relation.profile, avatar, blurredAvatar };
//   });

//   return enhancedProfiles;
// }

// export async function inviteProfileToBeProjectTeamMember(options: {
//   formData: FormData;
//   slug: string;
//   locales: ProjectTeamSettingsLocales;
// }) {
//   const { formData, slug, locales } = options;

//   const submission = parseWithZod(formData, {
//     schema: inviteProfileToBeProjectTeamMemberSchema,
//   });
//   if (submission.status !== "success") {
//     return { submission: submission.reply() };
//   }

//   const project = await prismaClient.project.findFirst({
//     where: { slug },
//     select: {
//       id: true,
//       name: true,
//     },
//   });

//   const profile = await prismaClient.profile.findFirst({
//     where: { id: submission.value.profileId },
//     select: {
//       id: true,
//       firstName: true,
//       lastName: true,
//       email: true,
//     },
//   });

//   invariantResponse(
//     project !== null && profile !== null,
//     locales.route.error.invariant.entitiesForInviteNotFound,
//     {
//       status: 404,
//     }
//   );

//   await prismaClient.inviteForProfileToJoinProject.upsert({
//     where: {
//       profileId_projectId_role: {
//         profileId: submission.value.profileId,
//         projectId: project.id,
//         role: "member",
//       },
//     },
//     create: {
//       profileId: submission.value.profileId,
//       projectId: project.id,
//       role: "member",
//       status: "pending",
//     },
//     update: {
//       status: "pending",
//     },
//   });

//   const sender = process.env.SYSTEM_MAIL_SENDER;
//   const subject = locales.route.email.subject;
//   const recipient = profile.email;
//   const textTemplatePath =
//     "mail-templates/invites/profile-to-join-project/text.hbs";
//   const htmlTemplatePath =
//     "mail-templates/invites/profile-to-join-project/html.hbs";
//   const content = {
//     firstName: profile.firstName,
//     project: {
//       name: project.name,
//     },
//     button: {
//       url: `${process.env.COMMUNITY_BASE_URL}/my/projects`,
//       text: locales.route.email.button.text,
//     },
//   };

//   const text = getCompiledMailTemplate<typeof textTemplatePath>(
//     textTemplatePath,
//     content,
//     "text"
//   );
//   const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
//     htmlTemplatePath,
//     content,
//     "html"
//   );

//   try {
//     await mailer(mailerOptions, sender, recipient, subject, text, html);
//   } catch (error) {
//     console.error(
//       "Error sending mail: Invite profile to be team member of project",
//       error
//     );
//   }

//   return {
//     submission: submission.reply(),
//     toast: {
//       id: "invite-team-member-toast",
//       key: `${new Date().getTime()}`,
//       message: insertParametersIntoLocale(
//         locales.route.content.profileInvited,
//         {
//           firstName: profile.firstName,
//           lastName: profile.lastName,
//         }
//       ),
//     },
//   };
// }

// export async function cancelProjectTeamMemberInvitation(options: {
//   formData: FormData;
//   slug: string;
//   locales: ProjectTeamSettingsLocales;
// }) {
//   const { formData, slug, locales } = options;

//   const submission = parseWithZod(formData, {
//     schema: cancelProjectTeamMemberInvitationSchema,
//   });
//   if (submission.status !== "success") {
//     return { submission: submission.reply() };
//   }

//   const project = await prismaClient.project.findFirst({
//     where: { slug },
//     select: {
//       id: true,
//     },
//   });
//   const profile = await prismaClient.profile.findFirst({
//     where: { id: submission.value.profileId },
//     select: {
//       id: true,
//       firstName: true,
//       lastName: true,
//     },
//   });
//   invariantResponse(
//     project !== null && profile !== null,
//     locales.route.error.invariant.entitiesForInviteNotFound,
//     { status: 404 }
//   );

//   await prismaClient.inviteForProfileToJoinProject.update({
//     where: {
//       profileId_projectId_role: {
//         profileId: submission.value.profileId,
//         projectId: project.id,
//         role: "member",
//       },
//     },
//     data: {
//       status: "canceled",
//     },
//   });

//   return {
//     submission: submission.reply(),
//     toast: {
//       id: "cancel-invite-toast",
//       key: `${new Date().getTime()}`,
//       message: insertParametersIntoLocale(
//         locales.route.content.inviteCancelled,
//         {
//           firstName: profile.firstName,
//           lastName: profile.lastName,
//         }
//       ),
//     },
//   };
// }

export async function removeTeamMemberFromProject(options: {
  formData: FormData;
  slug: string;
  locales: ProjectTeamSettingsLocales;
}) {
  const { formData, slug, locales } = options;

  const submission = parseWithZod(formData, {
    schema: removeTeamMemberFromProjectSchema,
  });
  if (submission.status !== "success") {
    return { submission: submission.reply() };
  }

  const project = await prismaClient.project.findFirst({
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
    project !== null && profile !== null,
    locales.route.error.invariant.entitiesForRemovalNotFound,
    { status: 404 }
  );
  invariantResponse(
    project._count.teamMembers > 1,
    locales.route.error.invariant.teamMemberCount,
    {
      status: 400,
    }
  );

  await prismaClient.teamMemberOfProject.delete({
    where: {
      profileId_projectId: {
        profileId: submission.value.profileId,
        projectId: project.id,
      },
    },
  });

  return {
    submission: submission.reply(),
    toast: {
      id: "remove-team-member-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        locales.route.content.profileRemoved,
        {
          firstName: profile.firstName,
          lastName: profile.lastName,
        }
      ),
    },
  };
}
