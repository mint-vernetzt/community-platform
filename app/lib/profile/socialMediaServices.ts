import { OrganizationFormType } from "~/routes/organization/$slug/settings/general";
import { ProfileFormType } from "~/routes/profile/$username/settings/general";

type SocialMediaService = {
  id: keyof Pick<
    OrganizationFormType,
    "facebook" | "linkedin" | "twitter" | "youtube" | "instagram" | "xing"
  > /*| keyof Pick<ProfileFormType, "facebook" | "linkedin" | "twitter" | "youtube" | "instagram" | "xing">*/;
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
    label: "youtube",
    placeholder: "youtube.com/channel/<Nutzername>",
    organizationPlaceholder: "youtube.com/channel/<Organisationsname>",
  },
  {
    id: "instagram",
    label: "instagram",
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
