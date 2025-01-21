import { type Organization } from "@prisma/client";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type OrganizationWebAndSocialLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["next/organization/$slug/settings/web-social"];

export async function getOrganizationWebSocial(options: {
  slug: string;
  locales: OrganizationWebAndSocialLocales;
}) {
  const { slug, locales } = options;

  const organization = await prismaClient.organization.findUnique({
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
      organizationVisibility: {
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
      },
    },
    where: {
      slug,
    },
  });
  invariantResponse(
    organization !== null && organization.organizationVisibility !== null,
    locales.route.error.organizationNotFound,
    {
      status: 404,
    }
  );

  const correctlyTypedOrganization = {
    ...organization,
    organizationVisibility: organization.organizationVisibility,
  };

  return correctlyTypedOrganization;
}

export async function updateOrganizationWebSocial(options: {
  slug: string;
  data: Pick<
    Organization,
    | "website"
    | "facebook"
    | "linkedin"
    | "xing"
    | "twitter"
    | "mastodon"
    | "tiktok"
    | "instagram"
    | "youtube"
  > & {
    visibilities: Record<
      keyof Pick<
        Organization,
        | "website"
        | "facebook"
        | "linkedin"
        | "xing"
        | "twitter"
        | "mastodon"
        | "tiktok"
        | "instagram"
        | "youtube"
      >,
      boolean
    >;
  };
}) {
  const { data, slug } = options;
  const { visibilities, ...organizationData } = data;

  let organization;
  let organizationVisibility;
  try {
    organization = await prismaClient.organization.update({
      select: {
        id: true,
      },
      where: {
        slug,
      },
      data: {
        ...organizationData,
      },
    });
    organizationVisibility = await prismaClient.organizationVisibility.update({
      where: {
        organizationId: organization.id,
      },
      data: visibilities,
    });
  } catch (error) {
    console.error(error);
    return { organization: null, organizationVisibility: null, error };
  }
  return { organization, organizationVisibility, error: null };
}
