import type { SupabaseClient, User } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import { deriveMode, type Mode } from "~/utils.server";

export type OrganizationMode = Mode | "admin";

export async function deriveOrganizationMode(
  sessionUser: User | null,
  slug?: string,
  id?: string
) {
  if (slug === undefined && id === undefined) {
    throw new Error("Either slug or id must be defined.");
  }

  const mode = deriveMode(sessionUser);
  const organization = await prismaClient.organization.findFirst({
    where:
      id !== undefined
        ? {
            id,
            admins: {
              some: {
                profileId: sessionUser?.id || "",
              },
            },
          }
        : {
            slug,
            admins: {
              some: {
                profileId: sessionUser?.id || "",
              },
            },
          },
    select: {
      id: true,
    },
  });
  if (organization !== null) {
    return "admin";
  }
  return mode;
}

export async function getRedirectPathOnProtectedOrganizationRoute(args: {
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
  const mode = await deriveOrganizationMode(sessionUser, slug);
  if (mode !== "admin") {
    return `/organization/${slug}`;
  }

  return null;
}
