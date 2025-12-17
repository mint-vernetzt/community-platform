import { array, type InferType, object, string } from "yup";
import {
  multiline,
  nullOrString,
  phone,
  social,
  website,
} from "~/lib/utils/yup";
import { type GeneralProfileSettingsLocales } from "./general.server";

export const BIO_MAX_LENGTH = 500;

export const createProfileSchema = (locales: GeneralProfileSettingsLocales) => {
  return object({
    academicTitle: nullOrString(string().trim()),
    position: nullOrString(string().trim()),
    firstName: string()
      .trim()
      .required(locales.route.validation.firstName.required),
    lastName: string()
      .trim()
      .required(locales.route.validation.lastName.required),
    email: string().email().trim().required(),
    email2: nullOrString(string().email().trim()),
    phone: nullOrString(phone()),
    bio: nullOrString(multiline(BIO_MAX_LENGTH)),
    bioRTEState: nullOrString(
      string()
        .trim()
        .transform((value: string | null | undefined) => {
          if (typeof value === "undefined" || value === "") {
            return null;
          }
          return value;
        })
    ),
    areas: array(string().trim().uuid()).required(),
    skills: array(string().trim().required()).required(),
    offers: array(string().trim().uuid()).required(),
    interests: array(string().trim().required()).required(),
    seekings: array(string().trim().uuid()).required(),
    privateFields: array(string().trim().required()).required(),
    website: nullOrString(website()),
    facebook: nullOrString(social("facebook")),
    linkedin: nullOrString(social("linkedin")),
    twitter: nullOrString(social("twitter")),
    youtube: nullOrString(social("youtube")),
    instagram: nullOrString(social("instagram")),
    xing: nullOrString(social("xing")),
    mastodon: nullOrString(social("mastodon")),
    tiktok: nullOrString(social("tiktok")),
  });
};

export type ProfileSchemaType = ReturnType<typeof createProfileSchema>;
export type ProfileFormType = InferType<ProfileSchemaType>;
