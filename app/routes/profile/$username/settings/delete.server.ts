import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type DeleteProfileLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
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
