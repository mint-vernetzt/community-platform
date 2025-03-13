import { parseWithZod } from "@conform-to/zod-v1";
import { type User, type SupabaseClient } from "@supabase/supabase-js";
import {
  addResponsibleOrganizationToProjectSchema,
  removeResponsibleOrganizationFromProjectSchema,
} from "~/form-helpers";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export type ProjectResponsibleOrganizationsSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["project/$slug/settings/responsible-orgs"];

export async function getProjectWithResponsibleOrganizations(options: {
  slug: string;
  authClient: SupabaseClient;
  locales: ProjectResponsibleOrganizationsSettingsLocales;
}) {
  const { slug, authClient, locales } = options;
  const project = await prismaClient.project.findFirst({
    where: {
      slug,
    },
    select: {
      id: true,
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              types: {
                select: {
                  organizationType: {
                    select: {
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  invariantResponse(project !== null, locales.route.error.invariant.notFound, {
    status: 404,
  });

  // enhance responsibleOrganizations with logo
  const responsibleOrganizations = project.responsibleOrganizations.map(
    (relation) => {
      let logo = relation.organization.logo;
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItem.Logo,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItem.BlurredLogo,
            },
            blur: BlurFactor,
          });
        }
      }
      return { organization: { ...relation.organization, logo, blurredLogo } };
    }
  );

  const enhancedProject = { ...project, responsibleOrganizations };

  return enhancedProject;
}

export async function getOwnOrganizationSuggestions(options: {
  sessionUser: User | null;
  pendingAndCurrentResponsibleOrganizationIds: string[];
}) {
  const { sessionUser, pendingAndCurrentResponsibleOrganizationIds } = options;

  if (sessionUser === null) {
    return [];
  }

  const profile = await prismaClient.profile.findFirst({
    where: {
      id: sessionUser.id,
    },
    select: {
      administeredOrganizations: {
        select: {
          organization: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              types: {
                select: {
                  organizationType: {
                    select: {
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      memberOf: {
        select: {
          organization: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              types: {
                select: {
                  organizationType: {
                    select: {
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  invariantResponse(profile !== null, "Profile not found", { status: 404 });

  const ownOrganizationSuggestions = await prismaClient.organization.findMany({
    where: {
      id: {
        in: [
          ...profile.administeredOrganizations.map(
            (relation) => relation.organization.id
          ),
          ...profile.memberOf.map((relation) => relation.organization.id),
        ],
        notIn: pendingAndCurrentResponsibleOrganizationIds,
      },
    },
    select: {
      id: true,
      slug: true,
      logo: true,
      name: true,
      types: {
        select: {
          organizationType: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  const enhancedOwnOrganizationSuggestions = ownOrganizationSuggestions.map(
    (organization) => {
      let logo = organization.logo;
      let blurredLogo;
      if (logo !== null) {
        logo = getImageURL(logo, {
          resize: {
            type: "fill",
            ...ImageSizes.Organization.ListItem.Logo,
          },
        });
        blurredLogo = getImageURL(logo, {
          resize: {
            type: "fill",
            ...ImageSizes.Organization.ListItem.BlurredLogo,
          },
          blur: BlurFactor,
        });
      }
      return { ...organization, logo, blurredLogo };
    }
  );

  return enhancedOwnOrganizationSuggestions;
}

// TODO: Remove this function when implementing project responsible organization invites
export async function addResponsibleOrganizationToProject(options: {
  formData: FormData;
  slug: string;
  locales: ProjectResponsibleOrganizationsSettingsLocales;
}) {
  const { formData, slug, locales } = options;

  const submission = parseWithZod(formData, {
    schema: addResponsibleOrganizationToProjectSchema,
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
  const organization = await prismaClient.organization.findFirst({
    where: { id: submission.value.organizationId },
    select: {
      id: true,
      name: true,
    },
  });
  invariantResponse(
    project !== null && organization !== null,
    locales.route.error.invariant.entitiesForRemovalNotFound,
    { status: 404 }
  );

  await prismaClient.responsibleOrganizationOfProject.create({
    data: {
      organizationId: submission.value.organizationId,
      projectId: project.id,
    },
  });

  return {
    submission: submission.reply(),
    toast: {
      id: "add-responsible-organization-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        locales.route.content.organizationAdded,
        {
          name: organization.name,
        }
      ),
    },
  };
}

// TODO: Add these functions when implementing project responsible organizations invites
// export async function getPendingResponsibleOrganizationInvitesOfProject(
//   projectId: string,
//   authClient: SupabaseClient
// ) {
//   const organizations =
//     await prismaClient.inviteForOrganizationToJoinProject.findMany({
//       where: {
//         projectId,
//         status: "pending",
//         role: "member",
//       },
//       select: {
//         organization: {
//           select: {
//             id: true,
//             slug: true,
//             logo: true,
//             name: true,
//             types: {
//               select: {
//                 organizationType: {
//                   select: {
//                     slug: true,
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//       orderBy: {
//         organization: {
//           name: "asc",
//         },
//       },
//     });

//   const enhancedOrganizations = organizations.map((relation) => {
//     let logo = relation.organization.logo;
//     let blurredLogo;
//     if (logo !== null) {
//       const publicURL = getPublicURL(authClient, logo);
//       if (publicURL !== null) {
//         logo = getImageURL(publicURL, {
//           resize: {
//             type: "fill",
//             ...ImageSizes.Organization.ListItem.Logo,
//           },
//         });
//         blurredLogo = getImageURL(publicURL, {
//           resize: {
//             type: "fill",
//             ...ImageSizes.Organization.ListItem.BlurredLogo,
//           },
//           blur: BlurFactor,
//         });
//       }
//     }
//     return { ...relation.organization, logo, blurredLogo };
//   });

//   return enhancedOrganizations;
// }

// export async function inviteOrganizationToBeResponsibleForProject(options: {
//   formData: FormData;
//   slug: string;
//   locales: ProjectResponsibleOrganizationsSettingsLocales;
// }) {
//   const { formData, slug, locales } = options;

//   const submission = parseWithZod(formData, {
//     schema: inviteOrganizationToBeResponsibleForProjectSchema,
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

//   const organization = await prismaClient.organization.findFirst({
//     where: { id: submission.value.organizationId },
//     select: {
//       id: true,
//       name: true,
//       // TODO: Do we need to contact all admins or just the email behind the organization?
//       email: true,
//     },
//   });

//   invariantResponse(
//     project !== null && organization !== null,
//     locales.route.error.invariant.entitiesForInviteNotFound,
//     {
//       status: 404,
//     }
//   );

//   await prismaClient.inviteForOrganizationToJoinProject.upsert({
//     where: {
//       organizationId_projectId_role: {
//         organizationId: submission.value.organizationId,
//         projectId: project.id,
//         role: "member",
//       },
//     },
//     create: {
//       organizationId: submission.value.organizationId,
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
//   const recipient = organization.email;
//   const textTemplatePath =
//     "mail-templates/invites/organization-to-join-project/text.hbs";
//   const htmlTemplatePath =
//     "mail-templates/invites/organization-to-join-project/html.hbs";
//   const content = {
//     name: organization.name,
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
//       "Error sending mail: Invite organization to be responsible for project",
//       error
//     );
//   }

//   return {
//     submission: submission.reply(),
//     toast: {
//       id: "invite-organization-toast",
//       key: `${new Date().getTime()}`,
//       message: insertParametersIntoLocale(
//         locales.route.content.organizationInvited,
//         {
//           name: organization.name,
//         }
//       ),
//     },
//   };
// }

// export async function cancelResponsibleOrganizationForProjectInvitation(options: {
//   formData: FormData;
//   slug: string;
//   locales: ProjectResponsibleOrganizationsSettingsLocales;
// }) {
//   const { formData, slug, locales } = options;

//   const submission = parseWithZod(formData, {
//     schema: cancelResponsibleOrganizationForProjectInvitationSchema,
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
//   const organization = await prismaClient.organization.findFirst({
//     where: { id: submission.value.organizationId },
//     select: {
//       id: true,
//       name: true,
//     },
//   });
//   invariantResponse(
//     project !== null && organization !== null,
//     locales.route.error.invariant.entitiesForInviteNotFound,
//     { status: 404 }
//   );

//   await prismaClient.inviteForOrganizationToJoinProject.update({
//     where: {
//       organizationId_projectId_role: {
//         organizationId: submission.value.organizationId,
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
//           name: organization.name,
//         }
//       ),
//     },
//   };
// }

export async function removeResponsibleOrganizationFromProject(options: {
  formData: FormData;
  slug: string;
  locales: ProjectResponsibleOrganizationsSettingsLocales;
}) {
  const { formData, slug, locales } = options;

  const submission = parseWithZod(formData, {
    schema: removeResponsibleOrganizationFromProjectSchema,
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
  const organization = await prismaClient.organization.findFirst({
    where: { id: submission.value.organizationId },
    select: {
      id: true,
      name: true,
    },
  });
  invariantResponse(
    project !== null && organization !== null,
    locales.route.error.invariant.entitiesForRemovalNotFound,
    { status: 404 }
  );

  await prismaClient.responsibleOrganizationOfProject.delete({
    where: {
      projectId_organizationId: {
        projectId: project.id,
        organizationId: submission.value.organizationId,
      },
    },
  });

  return {
    submission: submission.reply(),
    toast: {
      id: "remove-responsible-organization-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        locales.route.content.organizationRemoved,
        {
          name: organization.name,
        }
      ),
    },
  };
}
