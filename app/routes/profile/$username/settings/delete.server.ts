import { prismaClient } from "~/prisma.server";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

export type DeleteProfileLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["profile/$username/settings/delete"];

export async function getProfileByUsername(username: string) {
  const profile = await prismaClient.profile.findUnique({
    where: { username },
    select: {
      id: true,
    },
  });
  return profile;
}

export async function getProfileWithAdministrations(profileId: string) {
  return await prismaClient.profile.findUnique({
    where: {
      id: profileId,
    },
    select: {
      id: true,
      administeredEvents: {
        select: {
          event: {
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  admins: true,
                },
              },
            },
          },
        },
      },
      administeredOrganizations: {
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  admins: true,
                },
              },
            },
          },
        },
      },
      administeredProjects: {
        select: {
          project: {
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  admins: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function validateLastAdmin(
  profileId: string,
  locales: DeleteProfileLocales
) {
  const profile = await getProfileWithAdministrations(profileId);
  if (profile === null) {
    return {
      error: locales.error.notFound,
    };
  }
  const lastAdminOrganizations: string[] = [];
  profile.administeredOrganizations.map((relation) => {
    if (relation.organization._count.admins === 1) {
      lastAdminOrganizations.push(relation.organization.name);
    }
    return null;
  });
  const lastAdminEvents: string[] = [];
  profile.administeredEvents.map((relation) => {
    if (relation.event._count.admins === 1) {
      lastAdminEvents.push(relation.event.name);
    }
    return null;
  });
  const lastAdminProjects: string[] = [];
  profile.administeredProjects.map((relation) => {
    if (relation.project._count.admins === 1) {
      lastAdminProjects.push(relation.project.name);
    }
    return null;
  });

  if (
    lastAdminOrganizations.length > 0 ||
    lastAdminEvents.length > 0 ||
    lastAdminProjects.length > 0
  ) {
    const errors: string[] = [];
    if (lastAdminOrganizations.length > 0) {
      errors.push(
        insertParametersIntoLocale(locales.error.lastAdmin.organizations, {
          organizations: lastAdminOrganizations.join(", "),
        })
      );
    }
    if (lastAdminEvents.length > 0) {
      errors.push(
        insertParametersIntoLocale(locales.error.lastAdmin.events, {
          events: lastAdminEvents.join(", "),
        })
      );
    }
    if (lastAdminProjects.length > 0) {
      errors.push(
        insertParametersIntoLocale(locales.error.lastAdmin.projects, {
          projects: lastAdminProjects.join(", "),
        })
      );
    }

    return {
      error: `${locales.error.lastAdmin.intro} ${errors.join(", ")} ${
        locales.error.lastAdmin.outro
      }`,
    };
  }

  return {
    error: null,
  };
}
