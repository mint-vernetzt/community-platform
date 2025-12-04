import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    select: {
      id: true,
      name: true,
      slug: true,
      published: true,
      _count: {
        select: {
          admins: true,
          teamMembers: true,
          speakers: true,
          participants: true,
          responsibleOrganizations: true,
          documents: true,
          childEvents: true,
        },
      },
    },
    where: { slug },
  });
  return event;
}

export async function isAdminOfEvent(sessionUser: User | null, slug: string) {
  if (sessionUser === null) {
    return false;
  }

  const event = await prismaClient.event.findFirst({
    where: {
      slug,
      admins: {
        some: {
          profileId: sessionUser.id,
        },
      },
    },
    select: {
      id: true,
    },
  });

  return event !== null;
}

export async function getRedirectPathOnProtectedEventRoute(options: {
  request: Request;
  slug: string;
  sessionUser: User | null;
  authClient?: SupabaseClient;
}) {
  const { request, slug, sessionUser } = options;
  // redirect to login if not logged in
  if (sessionUser === null) {
    // redirect to target after login
    // TODO: Maybe rename login_redirect to redirect_to everywhere?
    const url = new URL(request.url);
    return `/login?login_redirect=${url.pathname}`;
  }

  // check if admin of project and redirect to project details if not
  const isAdmin = await isAdminOfEvent(sessionUser, slug);
  if (isAdmin === false) {
    return `/organization/${slug}/detail/about`;
  }

  return null;
}
