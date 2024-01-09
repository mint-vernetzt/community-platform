import { type Request } from "express";
import { prismaClient } from "../prisma";
import { createClient } from "@supabase/supabase-js";
import { getImageURL, getPublicURL } from "../images.server";
import imgproxy from "imgproxy/dist/types.js";
import { getBaseURL } from "../utils";
import { decorate } from "../lib/matomoUrlDecorator";
import { filterProfileByVisibility } from "../public-fields-filtering.server";

type Profiles = Awaited<ReturnType<typeof getProfiles>>;

async function getProfiles(request: Request, skip: number, take: number) {
  const profiles = await prismaClient.profile.findMany({
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      academicTitle: true,
      email: true,
      avatar: true,
      background: true,
      bio: true,
      areas: {
        select: {
          area: {
            select: {
              name: true,
            },
          },
        },
      },
      offers: {
        select: {
          offer: {
            select: {
              title: true,
            },
          },
        },
      },
      seekings: {
        select: {
          offer: {
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

  const enhancedProfiles = await Promise.all(
    profiles.map(async (profile) => {
      const { username, avatar, background, ...rest } = profile;
      let publicAvatar: string | null = null;
      let publicBackground: string | null = null;
      if (authClient !== undefined) {
        if (avatar !== null) {
          const publicURL = getPublicURL(authClient, avatar);
          if (publicURL !== null) {
            publicAvatar = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
              gravity: imgproxy.GravityType.center,
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
      let baseURL = getBaseURL(process.env.COMMUNITY_BASE_URL);

      const url =
        baseURL !== undefined
          ? decorate(request, `${baseURL}/profile/${username}`)
          : null;

      const enhancedProfile = {
        ...rest,
        avatar: publicAvatar,
        background: publicBackground,
      };

      const filteredProject = await filterProfileByVisibility(enhancedProfile);

      return {
        ...filteredProject,
        url: url,
      };
    })
  );
  return enhancedProfiles;
}

export async function getAllProfiles(
  request: Request,
  skip: number,
  take: number
): Promise<{ skip: number; take: number; result: Profiles }> {
  const publicProjects = await getProfiles(request, skip, take);
  return { skip, take, result: publicProjects };
}
