import { type Organization, type Profile } from "@prisma/client";

export type ExternalService =
  | "facebook"
  | "linkedin"
  | "twitter"
  | "youtube"
  | "instagram"
  | "xing"
  | "website"
  | "mastodon"
  | "tiktok";
