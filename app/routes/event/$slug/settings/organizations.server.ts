import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type EventOrganizationsSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["event/$slug/settings/organizations"];

export async function getOwnOrganizationsSuggestions(
  id: string,
  alreadyResponsibleOrganizationSlugs: string[]
) {
  const ownOrganizationSuggestions = await prismaClient.organization.findMany({
    select: {
      id: true,
      logo: true,
      name: true,
      slug: true,
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
    where: {
      AND: [
        {
          slug: {
            notIn: alreadyResponsibleOrganizationSlugs,
          },
        },
        {
          teamMembers: {
            some: {
              profileId: id,
            },
          },
        },
      ],
    },
  });
  return ownOrganizationSuggestions;
}

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      published: true,
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
        orderBy: {
          organization: {
            name: "asc",
          },
        },
      },
    },
    where: {
      slug,
    },
  });
}

export function getResponsibleOrganizationDataFromEvent(
  event: NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>
) {
  const organizationData = event.responsibleOrganizations.map((item) => {
    return item.organization;
  });
  return organizationData;
}
