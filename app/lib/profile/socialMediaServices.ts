import { ProfileFormType } from "~/routes/profile/$username/edit/yupSchema";

type SocialMediaService = {
  id: keyof ProfileFormType;
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
    id: "xing",
    label: "Xing",
    placeholder: "xing.com/profile/<Nutzername>",
    organizationPlaceholder: "xing.com/pages/<Organisationsname>",
  },
];
