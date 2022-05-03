import { Profile } from "@prisma/client";
import { array, InferType, object, string, ValidationError } from "yup";

/*
const ProfileFormFields = [
  "academicTitle",
  "position",
  "lastName",
  "email",
  "phone",
  "website",
  "avatar",
  "background",
  "job",
  "bio",
  "skills",
  "interests",
  "publicFields",
] as const;

type FormFields = typeof ProfileFormFields[number];
type ProfileForm = Pick<Profile, FormFields>;
*/

// TODO: object shape should be typed, see above
export const profileSchema = object({
  academicTitle: string(),
  position: string(),
  firstName: string().required(),
  lastName: string().required(),
  email: string().email(),
  phone: string(),
  bio: string(),
  interests: array(string().required()),
  skills: array(string().required()).required(),
  offerings: array(string().required()).required(),
  seekings: array(string().required()).required(),
  publicFields: array(string().required()),
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
