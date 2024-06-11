import { prismaClient } from "../cp-modules/prisma";
import { createClient } from "@supabase/supabase-js";
import type { Request } from "express";
import { getBaseURL } from "../cp-modules/utils";
import { getImageURL } from "../cp-modules/images.server";
import { decorate } from "../lib/matomoUrlDecorator";
import { filterOrganizationByVisibility } from "../cp-modules/next-public-fields-filtering.server";
import { getPublicURL } from "../cp-modules/storage.server";

type Organizations = Awaited<ReturnType<typeof getOrganizations>>;

async function getOrganizations(request: Request, skip: number, take: number) {
  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      background: true,
      bio: true,
      street: true,
      streetNumber: true,
      city: true,
      zipCode: true,
      supportedBy: true,
      areas: {
        select: {
          area: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
      types: {
        select: {
          organizationType: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      },
      focuses: {
        select: {
          focus: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      },
      organizationVisibility: {
        select: {
          id: true,
          slug: true,
          name: true,
          logo: true,
          background: true,
          bio: true,
          street: true,
          streetNumber: true,
          city: true,
          zipCode: true,
          supportedBy: true,
          areas: true,
          types: true,
          focuses: true,
        },
      },
    },
    skip,
    take,
  });

  let authClient: ReturnType<typeof createClient> | undefined;
  if (
    process.env.SUPABASE_URL !== undefined &&
    process.env.SERVICE_ROLE_KEY !== undefined
  ) {
    authClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  const enhancedOrganizations = await Promise.all(
    organizations.map(async (organization) => {
      const { slug, logo, background, ...rest } = organization;

      let publicLogo: string | null = null;
      let publicBackground: string | null = null;
      if (authClient !== undefined) {
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          if (publicURL !== null) {
            publicLogo = getImageURL(publicURL);
          }
        }
        if (background !== null) {
          const publicURL = getPublicURL(authClient, background);
          if (publicURL !== null) {
            publicBackground = getImageURL(publicURL);
          }
        }
      }

      const baseURL = getBaseURL(process.env.COMMUNITY_BASE_URL);

      const url =
        baseURL !== undefined
          ? decorate(request, `${baseURL}/organization/${slug}`)
          : null;

      const enhancedOrganization = {
        ...rest,
        logo: publicLogo,
        background: publicBackground,
      };

      const filteredOrganization =
        filterOrganizationByVisibility(enhancedOrganization);

      return {
        ...filteredOrganization,
        url: url,
      };
    })
  );

  return enhancedOrganizations;
}

export async function getAllOrganizations(
  request: Request,
  skip: number,
  take: number
): Promise<{ skip: number; take: number; result: Organizations }> {
  const publicOrganizations = await getOrganizations(request, skip, take);
  return { skip, take, result: publicOrganizations };
}
