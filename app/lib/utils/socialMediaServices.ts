import type { Organization, Profile } from "@prisma/client";
import { type GeneralProfileSettingsLocales } from "~/routes/profile/$username/settings/general.server";

type SocialMediaIdType =
  | keyof Pick<
      Organization,
      | "facebook"
      | "linkedin"
      | "twitter"
      | "youtube"
      | "instagram"
      | "xing"
      | "mastodon"
      | "tiktok"
    >
  | keyof Pick<
      Profile,
      | "facebook"
      | "linkedin"
      | "twitter"
      | "youtube"
      | "instagram"
      | "xing"
      | "mastodon"
      | "tiktok"
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
  "mastodon",
  "tiktok",
];

export const createSocialMediaServices = (
  locales: GeneralProfileSettingsLocales
): SocialMediaService[] => {
  return socialMediaServiceIds.map(
    (id: SocialMediaIdType): SocialMediaService => {
      let label;
      let placeholder;
      let organizationPlaceholder;
      if (id in locales.socialMediaServices) {
        type LocaleKey = keyof typeof locales.socialMediaServices;
        label = locales.socialMediaServices[id as LocaleKey].label;
        placeholder = locales.socialMediaServices[id as LocaleKey].placeholder;
        organizationPlaceholder =
          locales.socialMediaServices[id as LocaleKey].organizationPlaceholder;
      } else {
        console.error(`Social Media label ${id} not found in locales`);
        label = id;
        placeholder = id;
        organizationPlaceholder = id;
      }
      return {
        id: id,
        label: label,
        placeholder: placeholder,
        organizationPlaceholder: organizationPlaceholder,
      };
    }
  );
};
