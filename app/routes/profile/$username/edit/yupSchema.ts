import { Profile } from "@prisma/client";
import { array, InferType, object, string } from "yup";

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
  firstName: string(),
  lastName: string(),
  email: string().email(),
  phone: string(),
  website: string(),
  avatar: string(),
  background: string(),
  job: string(),
  bio: string(),
  interests: array(string().required()),
  skills: array(string().required()).required(),
  publicFields: array(string().required()),
});

export type ProfileFormType = InferType<typeof profileSchema>;
export const ProfileFormFields = Object.keys(
  profileSchema.fields
) as (keyof Profile)[];
