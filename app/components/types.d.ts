import { type Organization, type Profile } from "@prisma/client";

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
      | "mastodon"
      | "tiktok"
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
      | "mastodon"
      | "tiktok"
    >;
