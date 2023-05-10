import { prismaClient } from "./../prisma";
import { getImageURL, getPublicURL } from "./../images.server";
import { createClient } from "@supabase/supabase-js";
import { GravityType } from "imgproxy/dist/types";
import type { Request } from "express";
import { decorate } from "../lib/matomoUrlDecorator";

type Organizations = Awaited<ReturnType<typeof getOrganizations>>;

async function getOrganizations(request: Request, skip: number, take: number) {
  const publicOrganizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      background: true,
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
            },
          },
        },
      },
      types: {
        select: {
          organizationType: {
            select: {
              title: true,
            },
          },
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

  const enhancedOrganizations = publicOrganizations.map((organization) => {
    const { slug, logo, background, ...rest } = organization;

    let publicLogo: string | null = null;
    let publicBackground: string | null = null;
    if (authClient !== undefined) {
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          publicLogo = getImageURL(publicURL, {
            resize: { type: "fill", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      if (background !== null) {
        const publicURL = getPublicURL(authClient, background);
        if (publicURL !== null) {
          publicBackground = getImageURL(publicURL, {
            resize: { type: "fill", width: 1488, height: 480, enlarge: true },
          });
        }
      }
    }

    const url =
      process.env.COMMUNITY_BASE_URL !== undefined
        ? decorate(
            request,
            `${process.env.COMMUNITY_BASE_URL}organization/${slug}`
          )
        : null;

    return {
      ...rest,
      url: url,
      logo: publicLogo,
      background: publicBackground,
    };
  });

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
