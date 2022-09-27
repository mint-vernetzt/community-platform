import { serverError } from "remix-utils";
import { supabaseAdmin } from "./supabase";

export function getPublicURL(relativePath: string, bucket = "images") {
  const { publicURL } = supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
    .from(bucket)
    .getPublicUrl(relativePath);
  return publicURL;
}

export async function download(relativePath: string, bucket = "documents") {
  const { data, error } = await supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
    .from(bucket)
    .download(relativePath);

  if (data === null || error !== null) {
    throw serverError({
      message: "Dokument konnte nicht heruntergeladen werden.",
    });
  }
  return data;
}
