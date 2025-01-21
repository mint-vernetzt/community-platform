import { type SupabaseClient } from "@supabase/supabase-js";
import { invariantResponse } from "./response";

export function getPublicURL(
  authClient: SupabaseClient,
  relativePath: string,
  bucket = "images"
) {
  const {
    data: { publicUrl },
  } = authClient.storage.from(bucket).getPublicUrl(relativePath);

  if (publicUrl === "") {
    console.error("Requested public url is an empty string.");
    invariantResponse(false, "Server Error", { status: 500 });
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
