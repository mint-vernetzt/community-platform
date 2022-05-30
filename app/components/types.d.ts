import { Profile } from "@prisma/client";

export interface Image {
  src: string;
  alt: string;
}

export type ExternalService = keyof Pick<
  Profile,
  "facebook" | "linkedin" | "twitter" | "xing" | "website"
>;
