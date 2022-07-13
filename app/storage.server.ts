import { supabaseAdmin } from "./supabase";

export function getPublicURL(relativePath: string, bucket = "images") {
  const { publicURL } = supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
    .from(bucket)
    .getPublicUrl(relativePath);
  return publicURL;
}
