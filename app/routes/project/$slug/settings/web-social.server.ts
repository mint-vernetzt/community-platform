import { type Project } from "@prisma/client";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type ProjectWebAndSocialLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["project/$slug/settings/web-social"];

export async function getProjectWebSocial(options: {
  slug: string;
  locales: ProjectWebAndSocialLocales;
}) {
  const { slug, locales } = options;

  const project = await prismaClient.project.findUnique({
    select: {
      website: true,
      facebook: true,
      linkedin: true,
      xing: true,
      twitter: true,
      mastodon: true,
      tiktok: true,
      instagram: true,
      youtube: true,
    },
    where: {
      slug,
    },
  });
  invariantResponse(project !== null, locales.route.error.projectNotFound, {
    status: 404,
  });

  return project;
}

export async function updateProjectWebSocial(options: {
  slug: string;
  data: Pick<
    Project,
    | "website"
    | "facebook"
    | "linkedin"
    | "xing"
    | "twitter"
    | "mastodon"
    | "tiktok"
    | "instagram"
    | "youtube"
  >;
}) {
  const { data, slug } = options;

  let project;
  try {
    project = await prismaClient.project.update({
      select: {
        id: true,
      },
      where: {
        slug,
      },
      data: {
        ...data,
      },
    });
  } catch (error) {
    console.error(error);
    return { project: null, error };
  }
  return { project, error: null };
}
