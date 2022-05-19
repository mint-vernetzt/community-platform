import { ProfileFormType } from "~/routes/profile/$username/edit/yupSchema";

type SocialMediaService = {
  id: keyof ProfileFormType;
  label: string;
  placeholder: string;
};

export const socialMediaServices: SocialMediaService[] = [
  {
    id: "facebook",
    label: "facebook",
    placeholder: "https://www.facebook.com/<Nutzername>/",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    placeholder: "https://www.linkedin.com/in/<Nutzername>/",
  },
  {
    id: "twitter",
    label: "Twitter",
    placeholder: "https://twitter.com/<Nutzername>",
  },
  {
    id: "xing",
    label: "Xing",
    placeholder: "https://www.xing.com/profile/<Nutzername>",
  },
];
