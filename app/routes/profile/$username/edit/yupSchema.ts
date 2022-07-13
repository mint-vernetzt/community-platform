import { Profile } from "@prisma/client";
import { array, InferType, object, string, ValidationError } from "yup";

export const profileSchema = object({
  academicTitle: string(),
  position: string(),
  firstName: string().required(),
  lastName: string().required(),
  email: string().email(),
  phone: string().matches(
    /^$|^(\+?[0-9\s-\(\)]+\/?[0-9\s-\(\)]+)$/,
    "Deine Eingabe entspricht nicht dem Format einer Telefonnummer (Erlaubte Zeichen: Leerzeichen, +, -, (, ))."
  ),
  bio: string(),
  areas: array(string().required()).required(),
  skills: array(string().required()).required(),
  offers: array(string().required()).required(),
  interests: array(string().required()),
  seekings: array(string().required()).required(),
  publicFields: array(string().required()),
  website: string().matches(
    /(https?:\/\/)?(www\.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$|^$/,
    "Deine Eingabe entspricht nicht dem Format einer Website URL."
  ),
  facebook: string().matches(
    /(https?:\/\/)?(.*\.)?facebook.com\/.+\/?$|^$/,
    "Deine Eingabe entspricht nicht dem Format eines facebook Profils (facebook.com/<Nutzername>)."
  ),
  linkedin: string().matches(
    /(https?:\/\/)?(.*\.)?linkedin.com\/in\/.+\/?$|^$/,
    "Deine Eingabe entspricht nicht dem Format eines LinkedIn Profils (https://www.linkedin.com/in/<Nutzername>)."
  ),
  twitter: string().matches(
    /(https?:\/\/)?(.*\.)?twitter.com\/.+\/?$|^$/,
    "Deine Eingabe entspricht nicht dem Format eines Twitter Profils (twitter.com/<Nutzername>)."
  ),
  xing: string().matches(
    /(https?:\/\/)?(.*\.)?xing.com\/profile\/.+\/?$|^$/,
    "Deine Eingabe entspricht nicht dem Format eines Xing Profils (xing.com/profile/<Nutzername>)."
  ),
});

export type ProfileFormType = InferType<typeof profileSchema>;
export const ProfileFormFields = Object.keys(
  profileSchema.fields
) as (keyof Profile)[];

export type Error = {
  type: string;
  message: string;
};

export type ProfileError = {
  [key: string]: {
    message: string;
    errors?: Error[];
  };
};

export async function validateProfile(profile: ProfileFormType) {
  let errors: ProfileError = {};

  try {
    await profileSchema.validate(profile, { abortEarly: false });
  } catch (validationError) {
    if (validationError instanceof ValidationError) {
      validationError.inner.forEach((validationError) => {
        if (validationError.path) {
          if (!errors[validationError.path]) {
            errors[validationError.path] = {
              message: validationError.message,
              errors: [],
            };
          } else {
            errors[
              validationError.path
            ].message += `, ${validationError.message}`;
          }

          errors[validationError.path].errors?.push({
            type: (validationError.type as string) ?? "",
            message: validationError.message,
          });
        }
      });
    }
  }

  return Object.keys(errors).length === 0 ? false : errors;
}

/**
 * {errors.fieldname?.message}
 *
 * {
 *     fieldname: {
 *         message: "too short. not an email",
 *         errors: [
 *          {type: "min", message: "too short"}
 *          {type: "email", message: "not an email"}
 *        ]
 *     }
 * }
 */
