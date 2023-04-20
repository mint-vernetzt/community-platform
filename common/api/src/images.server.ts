import type { ResizingType } from "imgproxy/dist/types";
import { GravityType } from "imgproxy/dist/types";
import { builder } from "./imgproxy";
import type { SupabaseClient } from "@supabase/auth-helpers-remix";
import { serverError } from "remix-utils";

type GetImageURLArguments = {
  resize?: {
    type?: ResizingType;
    width?: number;
    height?: number;
    enlarge?: boolean;
  };
  gravity?: GravityType;
  dpr?: string | number;
};

export function getImageURL(url: string, args?: GetImageURLArguments) {
  const { resize = {}, gravity = GravityType.center, dpr = 2 } = args ?? {};

  const imageURL = builder
    .resize(resize.type, resize.width, resize.height, resize.enlarge)
    .gravity(gravity)
    .dpr(dpr)
    .generateUrl(url);

  return imageURL;
}

export function getPublicURL(
  authClient: SupabaseClient,
  relativePath: string,
  bucket = "images"
) {
  const {
    data: { publicUrl },
  } = authClient.storage.from(bucket).getPublicUrl(relativePath);

  if (publicUrl === "") {
    throw serverError({
      message: "Die öffentliche URL der Datei konnte nicht erzeugt werden.",
    });
  }

  if (
    bucket === "images" &&
    process.env.SUPABASE_IMG_URL !== undefined &&
    process.env.SUPABASE_URL !== undefined
  ) {
    return publicUrl.replace(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_IMG_URL
    );
  }

  return publicUrl;
}
