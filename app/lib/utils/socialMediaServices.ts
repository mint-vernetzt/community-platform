import type { Organization, Profile } from "@prisma/client";
import { TFunction } from "i18next";

type SocialMediaIdType =
  | keyof Pick<
      Organization,
      "facebook" | "linkedin" | "twitter" | "youtube" | "instagram" | "xing"
    >
  | keyof Pick<
      Profile,
      "facebook" | "linkedin" | "twitter" | "youtube" | "instagram" | "xing"
    >;

type SocialMediaService = {
  id: SocialMediaIdType;
  label: string;
  placeholder: string;
  organizationPlaceholder: string;
};

const socialMediaServiceIds: SocialMediaIdType[] = [
  "facebook",
  "linkedin",
  "twitter",
  "youtube",
  "instagram",
  "xing",
];

export const createSocialMediaServices = (
  t: TFunction
): SocialMediaService[] => {
  return socialMediaServiceIds.map(
    (id: SocialMediaIdType): SocialMediaService => {
      return {
        id: id,
        label: t(`${id}.label`, { ns: "utils/social-media-services" }),
        placeholder: t(`${id}.placeholder`, {
          ns: "utils/social-media-services",
        }),
        organizationPlaceholder: t(`${id}.organizationPlaceholder`, {
          ns: "utils/social-media-services",
        }),
      };
    }
  );
};
