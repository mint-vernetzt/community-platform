import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { getFeatureAbilities } from "~/lib/utils/application";
import { deriveProjectMode } from "~/routes/next/utils.server";
import crypto from "crypto";

export async function getRedirectPathOnProtectedProjectRoute(args: {
  request: Request;
  slug: string;
  sessionUser: User | null;
  authClient?: SupabaseClient;
}) {
  const { request, slug, sessionUser, authClient } = args;
  // redirect to login if not logged in
  if (sessionUser === null) {
    // redirect to target after login
    // TODO: Maybe rename login_redirect to redirect_to everywhere?
    const url = new URL(request.url);
    return `/login?login_redirect=${url.pathname}`;
  }

  // check feature flag abilities and redirect to legacy if hasn't access
  if (authClient !== undefined) {
    const featureAbilities = await getFeatureAbilities(
      authClient,
      "next_projects"
    );
    if (featureAbilities.next_projects.hasAccess === false) {
      return `/project/${slug}`;
    }
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
