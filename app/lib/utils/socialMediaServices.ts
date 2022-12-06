import type { Organization, Profile } from "@prisma/client";

type SocialMediaService = {
  id:
    | keyof Pick<
        Organization,
        "facebook" | "linkedin" | "twitter" | "youtube" | "instagram" | "xing"
      >
    | keyof Pick<
        Profile,
        "facebook" | "linkedin" | "twitter" | "youtube" | "instagram" | "xing"
      >;
  label: string;
  placeholder: string;
  organizationPlaceholder: string;
};

export const socialMediaServices: SocialMediaService[] = [
  {
    id: "facebook",
    label: "facebook",
    placeholder: "facebook.com/<Nutzername>",
    organizationPlaceholder: "facebook.com/<Organisationsname>",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    placeholder: "linkedin.com/in/<Nutzername>",
    organizationPlaceholder: "linkedin.com/company/<Organisationsname>",
  },
  {
    id: "twitter",
    label: "Twitter",
    placeholder: "twitter.com/<Nutzername>",
    organizationPlaceholder: "twitter.com/<Organisationsname>",
  },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "youtube.com/<Nutzername>",
    organizationPlaceholder: "youtube.com/<Organisationsname>",
  },
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "instagram.com/<Nutzername>",
    organizationPlaceholder: "instagram.com/<Organisationsname>",
  },
  {
    id: "xing",
    label: "Xing",
    placeholder: "xing.com/profile/<Nutzername>",
    organizationPlaceholder: "xing.com/pages/<Organisationsname>",
  },
];
