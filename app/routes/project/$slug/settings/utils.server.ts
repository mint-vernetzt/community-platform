import { type SupabaseClient, type User } from "@supabase/supabase-js";
import crypto from "crypto";
import { deriveProjectMode } from "~/routes/project/utils.server";

export async function getRedirectPathOnProtectedProjectRoute(args: {
  request: Request;
  slug: string;
  sessionUser: User | null;
  authClient?: SupabaseClient;
}) {
  const { request, slug, sessionUser } = args;
  // redirect to login if not logged in
  if (sessionUser === null) {
    // redirect to target after login
    // TODO: Maybe rename login_redirect to redirect_to everywhere?
    const url = new URL(request.url);
    return `/login?login_redirect=${url.pathname}`;
  }

  // check if admin of project and redirect to project details if not
  const mode = await deriveProjectMode(sessionUser, slug);
  if (mode !== "admin") {
    return `/project/${slug}`;
  }

  return null;
}

export function getSubmissionHash(submission: object) {
  const json = JSON.stringify(submission);
  const hash = crypto.createHash("sha256").update(json).digest("hex");
  return hash;
}
