import { Organization, Profile } from "@prisma/client";

export interface Image {
  src: string;
  alt: string;
}

export type ExternalService =
  | keyof Pick<
      Profile,
      | "facebook"
      | "linkedin"
      | "twitter"
      | "youtube"
      | "instagram"
      | "xing"
      | "website"
    >
  | keyof Pick<
      Organization,
      | "facebook"
      | "linkedin"
      | "twitter"
      | "youtube"
      | "instagram"
      | "xing"
      | "website"
    >;
