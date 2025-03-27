import { parseWithZod } from "@conform-to/zod-v1";
import { type SupabaseClient } from "@supabase/supabase-js";
import {
  addAdminToProjectSchema,
  removeAdminFromProjectSchema,
} from "~/form-helpers";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export type ProjectAdminSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["project/$slug/settings/admins"];

export async function getProjectWithAdmins(options: {
  slug: string;
  authClient: SupabaseClient;
  locales: ProjectAdminSettingsLocales;
}) {
  const { slug, authClient, locales } = options;
  const project = await prismaClient.project.findFirst({
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

  invariantResponse(project !== null, locales.route.error.invariant.notFound, {
    status: 404,
  });

  // enhance admins with avatar
  const admins = project.admins.map((relation) => {
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

  const enhancedProject = { ...project, admins };

  return enhancedProject;
}

// TODO: Remove this function when implementing project admin invites
export async function addAdminToProject(options: {
  formData: FormData;
  slug: string;
  locales: ProjectAdminSettingsLocales;
}) {
  const { formData, slug, locales } = options;

  const submission = parseWithZod(formData, {
    schema: addAdminToProjectSchema,
  });
  if (submission.status !== "success") {
    return { submission: submission.reply() };
  }

  const project = await prismaClient.project.findFirst({
    where: { slug },
    select: {
      id: true,
      admins: {
        select: {
          profileId: true,
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
    project.admins.some((admin) => admin.profileId === profile.id) === false,
    locales.route.error.invariant.alreadyAdmin,
    {
      status: 400,
    }
  );

  await prismaClient.adminOfProject.create({
    data: {
      profileId: submission.value.profileId,
      projectId: project.id,
    },
  });

  return {
    submission: submission.reply(),
    toast: {
      id: "add-admin-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(locales.route.content.profileAdded, {
        firstName: profile.firstName,
        lastName: profile.lastName,
      }),
    },
  };
}

// TODO: Add these functions when implementing project admin invites
// export async function getPendingAdminInvitesOfProject(
//   projectId: string,
//   authClient: SupabaseClient
// ) {
//   const profiles = await prismaClient.inviteForProfileToJoinProject.findMany({
//     where: {
//       projectId,
//       status: "pending",
//       role: "admin",
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

// export async function inviteProfileToBeProjectAdmin(options: {
//   formData: FormData;
//   slug: string;
//   locales: ProjectAdminSettingsLocales;
// }) {
//   const { formData, slug, locales } = options;

//   const submission = parseWithZod(formData, {
//     schema: inviteProfileToBeProjectAdminSchema,
//   });
//   if (submission.status !== "success") {
//     return { submission: submission.reply() };
//   }

//   const project = await prismaClient.project.findFirst({
//     where: { slug },
//     select: {
//       id: true,
//       name: true,
// admins: {
//   select: {
//     profileId: true,
//   },
// },
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

// invariantResponse(
//   project.admins.some((admin) => admin.profileId === profile.id) === false,
//   locales.route.error.invariant.alreadyAdmin,
//   {
//     status: 400,
//   }
// );

//   await prismaClient.inviteForProfileToJoinProject.upsert({
//     where: {
//       profileId_projectId_role: {
//         profileId: submission.value.profileId,
//         projectId: project.id,
//         role: "admin",
//       },
//     },
//     create: {
//       profileId: submission.value.profileId,
//       projectId: project.id,
//       role: "admin",
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
//     "mail-templates/invites/profile-to-join-project/as-admin-text.hbs";
//   const htmlTemplatePath =
//     "mail-templates/invites/profile-to-join-project/as-admin-html.hbs";
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
//       "Error sending mail: Invite profile to be admin of project",
//       error
//     );
//   }

//   return {
//     submission: submission.reply(),
//     toast: {
//       id: "invite-admin-toast",
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

// export async function cancelProjectAdminInvitation(options: {
//   formData: FormData;
//   slug: string;
//   locales: ProjectAdminSettingsLocales;
// }) {
//   const { formData, slug, locales } = options;

//   const submission = parseWithZod(formData, {
//     schema: cancelProjectAdminInvitationSchema,
//   });
//   if (submission.status !== "success") {
//     return { submission: submission.reply() };
//   }

//   const project = await prismaClient.project.findFirst({
//     where: { slug },
//     select: {
//       id: true,
// admins: {
//   select: {
//     profileId: true,
//   },
// },
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
// invariantResponse(
//   project.admins.some((admin) => admin.profileId === profile.id) === false,
//   locales.route.error.invariant.alreadyAdmin,
//   {
//     status: 400,
//   }
// );

//   await prismaClient.inviteForProfileToJoinProject.update({
//     where: {
//       profileId_projectId_role: {
//         profileId: submission.value.profileId,
//         projectId: project.id,
//         role: "admin",
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

export async function removeAdminFromProject(options: {
  formData: FormData;
  slug: string;
  locales: ProjectAdminSettingsLocales;
}) {
  const { formData, slug, locales } = options;

  const submission = parseWithZod(formData, {
    schema: removeAdminFromProjectSchema,
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
    project !== null && profile !== null,
    locales.route.error.invariant.entitiesForRemovalNotFound,
    { status: 404 }
  );
  invariantResponse(
    project._count.admins > 1,
    locales.route.error.invariant.adminCount,
    {
      status: 400,
    }
  );

  await prismaClient.adminOfProject.delete({
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
      id: "remove-admin-toast",
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
