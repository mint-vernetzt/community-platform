import { redirect } from "@remix-run/node";
import { getAlert, redirectWithAlert } from "~/alert.server";
import { prismaClient } from "~/prisma.server";

export async function getProfileById(id: string) {
  const profile = await prismaClient.profile.findUnique({
    where: { id },
    select: {
      firstName: true,
      lastName: true,
      username: true,
      termsAccepted: true,
    },
  });

  return profile;
}

export async function getProfileCount() {
  return await prismaClient.profile.count();
}

export async function getProfilesForCards(skip: number, take: number) {
  const profiles = await prismaClient.profile.findMany({
    select: {
      academicTitle: true,
      username: true,
      firstName: true,
      lastName: true,
      position: true,
      avatar: true,
      background: true,
      offers: { select: { offer: { select: { title: true } } } },
      areas: { select: { area: { select: { name: true } } } },
      memberOf: {
        select: {
          organization: {
            select: {
              slug: true,
              logo: true,
              name: true,
            },
          },
        },
        orderBy: {
          organization: {
            updatedAt: "asc",
          },
        },
      },
      _count: {
        select: {
          memberOf: true,
        },
      },
    },
    skip,
    take,
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
  });

  return profiles;
}

export async function getOrganizationCount() {
  return await prismaClient.organization.count();
}

export async function getOrganizationsForCards(skip: number, take: number) {
  const profiles = await prismaClient.organization.findMany({
    select: {
      slug: true,
      name: true,
      logo: true,
      background: true,
      focuses: { select: { focus: { select: { title: true } } } },
      areas: { select: { area: { select: { name: true } } } },
      types: { select: { organizationType: { select: { title: true } } } },
      teamMembers: {
        select: {
          profile: {
            select: {
              username: true,
              avatar: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          profile: {
            updatedAt: "asc",
          },
        },
      },
      _count: {
        select: {
          memberOf: true,
        },
      },
    },
    skip,
    take,
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
  });

  return profiles;
}

export async function enhancedRedirect(
  url: string,
  options: {
    request: Request;
    response?: ResponseInit;
  }
) {
  const { alert } = await getAlert(options.request);
  if (alert !== null) {
    return redirectWithAlert(
      url,
      alert,
      { scrollIntoView: false },
      options.response
    );
  }
  return redirect(url, options.response);
}
