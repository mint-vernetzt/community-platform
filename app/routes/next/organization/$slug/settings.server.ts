import { SupabaseClient, User } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import { deriveMode } from "~/utils.server";

export async function getRedirectPathOnProtectedOrganizationRoute(args: {
  request: Request;
  slug: string;
  sessionUser: User | null;
  authClient?: SupabaseClient;
}) {
  const { request, slug, sessionUser } = args;
  if (sessionUser === null) {
    const url = new URL(request.url);
    return `/login?login_redirect=${url.pathname}`;
  }

  const mode = await deriveOrganizationMode(sessionUser, slug);
  if (mode !== "admin") {
    return `/organization/${slug}`;
  }

  return null;
}

async function deriveOrganizationMode(sessionUser: User | null, slug: string) {
  const mode = deriveMode(sessionUser);
  const project = await prismaClient.organization.findFirst({
    where: {
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
  if (project !== null) {
    return "admin";
  }
  return mode;
}
